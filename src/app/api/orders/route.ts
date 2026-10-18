import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils';
import {
  sendOrderCustomerConfirmation,
  sendOrderAdminNotification,
  isEmailConfigured,
} from '@/lib/email';

const phoneRegex = /^[+]?[0-9\s\-().]{7,20}$/;

const itemSchema = z
  .object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity must be 99 or less'),
    tier: z
      .object({
        name: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']),
        label: z.string().min(1),
      })
      .optional(),
    options: z.array(
      z.object({
        groupName: z.string().min(1),
        groupLabel: z.string().optional(),
        valueId: z.string().min(1),
        valueLabel: z.string().optional(),
        priceDelta: z.number().optional(), // Accepted from client for UI parity, but RECOMPUTED from DB
      })
    ),
  })
  .strict();

const billingSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().trim().toLowerCase().email('Valid billing email is required'),
    phone: z.string().trim().refine((val) => phoneRegex.test(val), 'Valid phone number is required (7-20 digits)'),
    company: z.string().trim().max(150).optional().or(z.literal('')),
    gstNumber: z.string().trim().max(25).optional().or(z.literal('')),
    addressLine1: z.string().trim().min(3, 'Address line 1 must be at least 3 characters').max(200),
    addressLine2: z.string().trim().max(200).optional().or(z.literal('')),
    city: z.string().trim().min(1, 'City is required').max(100),
    state: z.string().trim().min(1, 'State is required').max(100),
    postalCode: z.string().trim().min(3, 'Postal code is required').max(20),
    country: z.string().trim().min(2, 'Country is required').max(100),
    notes: z.string().trim().max(1000).optional().or(z.literal('')),
  })
  .strict();

const orderRequestSchema = z
  .object({
    items: z.array(itemSchema).min(1, 'Your cart is empty.'),
    billing: billingSchema,
    idempotencyKey: z.string().trim().max(128).optional(),
    discountCode: z.string().trim().max(50).optional(),
  })
  .strict();

// Simple in-memory rate limiting: max 15 order creation attempts per 5 minutes per user
const userOrderLimits = new Map<string, { count: number; expiresAt: number }>();

function checkOrderRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = userOrderLimits.get(userId);

  if (!record || record.expiresAt < now) {
    userOrderLimits.set(userId, { count: 1, expiresAt: now + 5 * 60 * 1000 });
    return true;
  }

  if (record.count >= 15) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(req: Request) {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Please sign in to place an order.' }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. Request payload size check
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 200 * 1024) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
  }

  // 3. User rate limiting
  if (!checkOrderRateLimit(userId)) {
    return NextResponse.json(
      { error: 'Too many order requests. Please wait a few moments before trying again.' },
      { status: 429 }
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    }

    const parsed = orderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid order data.' }, { status: 400 });
    }

    const { items, billing, idempotencyKey, discountCode } = parsed.data;

    // 4. Idempotency Check — Prevent duplicate orders from network retries or double submits
    if (idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey },
        select: { id: true, orderNumber: true },
      });
      if (existingOrder) {
        return NextResponse.json(
          { orderId: existingOrder.id, orderNumber: existingOrder.orderNumber, duplicate: true },
          { status: 200 }
        );
      }
    }

    // 5. Strict Server-Side Validation & Price Computation
    // Fetch all referenced products with their full option groups, values, and active tiers
    const uniqueProductIds = Array.from(new Set(items.map((i) => i.productId)));
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds }, isActive: true },
      include: {
        optionGroups: {
          include: { values: true },
        },
        tiers: {
          where: { isActive: true },
          include: { selections: true },
        },
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedSubtotal = 0;
    const validatedOrderItemsData: {
      productId: string;
      productName: string;
      productSku: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      tierName: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | null;
      tierLabel: string | null;
      options: {
        create: {
          optionValueId: string;
          groupName: string;
          valueLabel: string;
          priceDelta: number;
        }[];
      };
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product (${item.productId}) is currently unavailable or inactive.` },
          { status: 400 }
        );
      }

      // Check stock if product tracks inventory
      if (product.stock > 0 && item.quantity > product.stock) {
        return NextResponse.json(
          { error: `Requested quantity for "${product.name}" exceeds available stock (${product.stock}).` },
          { status: 400 }
        );
      }

      // Create lookup maps for this product's groups and values
      const groupMap = new Map(product.optionGroups.map((g) => [g.name, g]));
      const allProductValueMap = new Map(
        product.optionGroups.flatMap((g) => g.values.map((v) => [v.id, { ...v, groupName: g.name, groupRequired: g.required }]))
      );

      // Validate selected options
      const selectedGroupNames = new Set<string>();
      const optionSnapshots: {
        optionValueId: string;
        groupName: string;
        valueLabel: string;
        priceDelta: number;
      }[] = [];

      let optionsPriceDeltaSum = 0;

      for (const opt of item.options) {
        const dbVal = allProductValueMap.get(opt.valueId);
        if (!dbVal) {
          return NextResponse.json(
            { error: `Option ID "${opt.valueId}" is invalid or does not belong to product "${product.name}".` },
            { status: 400 }
          );
        }

        // Verify groupName matches
        if (dbVal.groupName !== opt.groupName) {
          return NextResponse.json(
            { error: `Option "${dbVal.label}" does not belong to group "${opt.groupName}".` },
            { status: 400 }
          );
        }

        // Check for duplicate selections within the same option group
        if (selectedGroupNames.has(dbVal.groupName)) {
          return NextResponse.json(
            { error: `Multiple options selected for configuration group "${dbVal.groupName}".` },
            { status: 400 }
          );
        }

        selectedGroupNames.add(dbVal.groupName);
        const priceDeltaNum = Number(dbVal.priceDelta);
        optionsPriceDeltaSum += priceDeltaNum;

        optionSnapshots.push({
          optionValueId: dbVal.id,
          groupName: dbVal.groupName,
          valueLabel: dbVal.label,
          priceDelta: priceDeltaNum,
        });
      }

      // Check that all required option groups for this product have been completed
      for (const group of product.optionGroups) {
        if (group.required && group.values.length > 0 && !selectedGroupNames.has(group.name)) {
          return NextResponse.json(
            { error: `Configuration group "${group.label}" is required for product "${product.name}".` },
            { status: 400 }
          );
        }
      }

      // Calculate unit price from trusted database values
      let calculatedUnitPrice = Number(product.basePrice) + optionsPriceDeltaSum;

      // Handle Tier logic securely if a tier was selected
      let appliedTierName: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | null = null;
      let appliedTierLabel: string | null = null;

      if (item.tier) {
        const matchedTier = product.tiers.find((t) => t.name === item.tier?.name);
        if (matchedTier) {
          appliedTierName = matchedTier.name;
          appliedTierLabel = matchedTier.label || matchedTier.name;

          // If the tier has a price override and selections match the tier definition, apply override
          if (matchedTier.priceOverride !== null) {
            const tierSelectionIds = new Set(matchedTier.selections.map((s) => s.optionValueId));
            const itemOptionIds = new Set(item.options.map((o) => o.valueId));

            const matchesTier =
              tierSelectionIds.size === itemOptionIds.size &&
              [...tierSelectionIds].every((id) => itemOptionIds.has(id));

            if (matchesTier) {
              calculatedUnitPrice = Number(matchedTier.priceOverride);
            }
          }
        }
      }

      // Ensure unit price is not negative
      calculatedUnitPrice = Math.max(0, calculatedUnitPrice);
      const lineTotal = calculatedUnitPrice * item.quantity;
      calculatedSubtotal += lineTotal;

      validatedOrderItemsData.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice: calculatedUnitPrice,
        lineTotal,
        tierName: appliedTierName,
        tierLabel: appliedTierLabel,
        options: { create: optionSnapshots },
      });
    }

    // 6. Discount calculation
    let calculatedDiscount = 0;
    let appliedDiscountId: string | null = null;

    if (discountCode) {
      const dbDiscount = await prisma.discountCode.findUnique({
        where: { code: discountCode.toUpperCase().trim() },
      });

      if (
        dbDiscount &&
        dbDiscount.isActive &&
        (!dbDiscount.expiresAt || dbDiscount.expiresAt > new Date()) &&
        (dbDiscount.maxUses === null || dbDiscount.usedCount < dbDiscount.maxUses) &&
        (dbDiscount.minSubtotal === null || calculatedSubtotal >= Number(dbDiscount.minSubtotal))
      ) {
        appliedDiscountId = dbDiscount.id;
        if (dbDiscount.type === 'PERCENT') {
          calculatedDiscount = Math.round(calculatedSubtotal * (Number(dbDiscount.value) / 100) * 100) / 100;
        } else {
          calculatedDiscount = Math.min(calculatedSubtotal, Number(dbDiscount.value));
        }
      }
    }

    // 7. Taxes and Total Calculation
    const discountedSubtotal = Math.max(0, calculatedSubtotal - calculatedDiscount);
    // GST 18% standard on IT enterprise hardware in India
    const calculatedTax = Math.round(discountedSubtotal * 0.18 * 100) / 100;
    const calculatedTotal = Math.round((discountedSubtotal + calculatedTax) * 100) / 100;

    const billingAddressText = [
      billing.addressLine1,
      billing.addressLine2,
      `${billing.city}, ${billing.state} ${billing.postalCode}`,
      billing.country,
    ]
      .filter(Boolean)
      .join('\n');

    // 8. Atomic Database Transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order with all its items and options atomically
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: 'PENDING',
          subtotal: calculatedSubtotal,
          discount: calculatedDiscount,
          tax: calculatedTax,
          total: calculatedTotal,
          currency: 'INR',
          billingName: billing.name,
          billingEmail: billing.email,
          billingPhone: billing.phone || null,
          billingAddress: billingAddressText,
          notes: billing.notes || null,
          idempotencyKey: idempotencyKey || null,
          items: {
            create: validatedOrderItemsData,
          },
        },
        include: {
          items: {
            include: {
              options: true,
            },
          },
        },
      });

      // Update user profile billing details
      await tx.user.update({
        where: { id: userId },
        data: {
          name: billing.name,
          phone: billing.phone,
          company: billing.company || null,
          gstNumber: billing.gstNumber || null,
          addressLine1: billing.addressLine1,
          addressLine2: billing.addressLine2 || null,
          city: billing.city,
          state: billing.state,
          postalCode: billing.postalCode,
          country: billing.country,
        },
      });

      // Increment discount usage if applied
      if (appliedDiscountId) {
        await tx.discountCode.update({
          where: { id: appliedDiscountId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // 9. Email Confirmation (Non-blocking: if email fails, order MUST remain intact)
    if (isEmailConfigured()) {
      const emailPayload = {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
        currency: order.currency,
        billingName: order.billingName,
        billingEmail: order.billingEmail,
        billingPhone: order.billingPhone,
        billingAddress: order.billingAddress,
        notes: order.notes,
        items: order.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          productSku: i.productSku,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
          tierName: i.tierName,
          tierLabel: i.tierLabel,
          options: i.options.map((o) => ({
            groupName: o.groupName,
            valueLabel: o.valueLabel,
            priceDelta: Number(o.priceDelta),
          })),
        })),
      };

      // Fire customer and admin notifications
      Promise.all([
        sendOrderCustomerConfirmation(emailPayload),
        sendOrderAdminNotification(emailPayload),
      ]).catch((emailErr) => {
        console.error('[ORDER EMAIL WARNING]', {
          orderNumber: order.orderNumber,
          error: emailErr instanceof Error ? emailErr.message : 'Email failed',
        });
      });
    }

    return NextResponse.json(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: 'Order created successfully.',
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[ORDER CREATION ERROR]', {
      timestamp: new Date().toISOString(),
      userId,
      error: err instanceof Error ? err.message : 'Unknown database error',
    });

    return NextResponse.json(
      { error: 'An unexpected database error occurred while creating your order. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { options: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ orders });
}
