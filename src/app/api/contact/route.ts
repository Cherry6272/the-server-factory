import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  sendEnquiryAdminNotification,
  sendEnquiryCustomerAcknowledgement,
  isEmailConfigured,
} from '@/lib/email';

// Strict schema rejecting unexpected/unauthorized fields
const phoneRegex = /^[+]?[0-9\s\-().]{7,20}$/;

const contactSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || phoneRegex.test(val),
        'Please enter a valid phone number (7-20 digits)'
      ),
    subject: z
      .string()
      .trim()
      .min(2, 'Subject must be at least 2 characters')
      .max(200, 'Subject must be less than 200 characters'),
    message: z
      .string()
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(5000, 'Message is too long (max 5000 characters)'),
    productId: z.string().trim().max(100).optional(),
    productSlug: z.string().trim().max(150).optional(),
    productName: z.string().trim().max(200).optional(),
    configuration: z.record(z.unknown()).optional(),
    idempotencyKey: z.string().trim().max(128).optional(),
  })
  .strict();

// Simple in-memory rate limiter per IP: max 10 enquiries per 10 minutes
const ipRateLimits = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRateLimits.get(ip);

  if (!record || record.expiresAt < now) {
    ipRateLimits.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
    return true;
  }

  if (record.count >= 10) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(req: Request) {
  // 1. Request size limit check
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 100 * 1024) {
    return NextResponse.json(
      { error: 'Payload too large (max 100KB).' },
      { status: 413 }
    );
  }

  // 2. IP rate limiting
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'local';
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes before submitting another enquiry.' },
      { status: 429 }
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body.' },
        { status: 400 }
      );
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? 'Invalid form submission.' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 3. Idempotency / Duplicate Detection
    // Check if an identical submission exists recently
    const recentDuplicate = await prisma.enquiry.findFirst({
      where: {
        OR: [
          data.idempotencyKey ? { idempotencyKey: data.idempotencyKey } : undefined,
          {
            email: data.email,
            subject: data.subject,
            message: data.message,
            createdAt: { gte: new Date(Date.now() - 3 * 60 * 1000) }, // 3 minutes window
          },
        ].filter(Boolean) as any,
      },
      select: { id: true, emailSent: true, createdAt: true },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        {
          ok: true,
          enquiryId: recentDuplicate.id,
          duplicate: true,
          message: 'Your enquiry was already received and is being processed.',
        },
        { status: 200 }
      );
    }

    // 4. Reliable Database Persistence
    const enquiry = await prisma.enquiry.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        productId: data.productId || null,
        productSlug: data.productSlug || null,
        productName: data.productName || null,
        configuration: data.configuration ? (data.configuration as any) : undefined,
        idempotencyKey: data.idempotencyKey || null,
      },
    });

    // 5. Email Notification Handling
    let emailSent = false;
    let emailError: string | undefined;

    if (isEmailConfigured()) {
      const emailPayload = {
        id: enquiry.id,
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        subject: enquiry.subject,
        message: enquiry.message,
        productName: enquiry.productName,
        productSlug: enquiry.productSlug,
        configuration: data.configuration,
        createdAt: enquiry.createdAt,
      };

      const adminEmailResult = await sendEnquiryAdminNotification(emailPayload);
      if (adminEmailResult.success) {
        emailSent = true;
        // Send customer receipt acknowledgement
        await sendEnquiryCustomerAcknowledgement(emailPayload).catch(() => {});
      } else {
        emailError = adminEmailResult.error;
      }

      // Update delivery record in database
      await prisma.enquiry.update({
        where: { id: enquiry.id },
        data: {
          emailSent,
          emailError: emailError || null,
        },
      });
    }

    // Return honest response to user
    if (isEmailConfigured() && !emailSent) {
      return NextResponse.json(
        {
          ok: true,
          enquiryId: enquiry.id,
          emailSent: false,
          message:
            'Your enquiry was recorded in our database, but notification delivery encountered an issue. Our team monitors the system and will review your request promptly.',
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        enquiryId: enquiry.id,
        emailSent,
        message:
          'Thank you! Your enquiry has been received. Our engineering team will review it and get back to you shortly.',
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Never leak database stack traces or credentials to clients
    console.error('[ENQUIRY ERROR]', {
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error:
          'A database error occurred while saving your enquiry. Please try again or contact us directly at +91 99160 48404.',
      },
      { status: 500 }
    );
  }
}
