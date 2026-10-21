import nodemailer from 'nodemailer';

export type EmailResult = {
  success: boolean;
  configured: boolean;
  error?: string;
  messageId?: string;
};

// Check if email integration is properly configured via environment variables
export function isEmailConfigured(): boolean {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  return Boolean(host && user && pass);
}

// Get business notification recipient address
export function getBusinessEmail(): string {
  return (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'sales@theserverfactory.com'
  );
}

// Get sender address
export function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'ServerFactory <sales@theserverfactory.com>';
}

// Create Nodemailer transport
function createTransport() {
  if (!isEmailConfigured()) return null;

  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    },
    // Reasonable timeouts so serverless / API requests don't hang indefinitely
    connectionTimeout: 8000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

/**
 * Send an email safely with production-grade error handling.
 * Never leaks credentials or sensitive data in logs or returned error messages.
 */
async function sendMailSafely({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    return {
      success: false,
      configured: false,
      error: 'Email service is not configured on this server.',
    };
  }

  const transporter = createTransport();
  if (!transporter) {
    return {
      success: false,
      configured: false,
      error: 'Email transporter could not be initialized.',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: getFromEmail(),
      to,
      replyTo,
      subject,
      html,
    });

    return {
      success: true,
      configured: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    // Log safe error without exposing credentials or internal tokens
    const errMsg = err instanceof Error ? err.message : 'Unknown mail transport error';
    console.error('[EMAIL ERROR]', {
      recipientDomain: to.split('@')[1] ?? 'unknown',
      subjectPrefix: subject.slice(0, 30),
      reason: errMsg,
    });

    return {
      success: false,
      configured: true,
      error: 'Failed to deliver message through mail server.',
    };
  }
}

// ─────────────────────────────────────────────
// 1. Enquiry Emails
// ─────────────────────────────────────────────

export type EnquiryEmailPayload = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  productName?: string | null;
  productSlug?: string | null;
  configuration?: Record<string, unknown> | null;
  createdAt: Date;
};

/**
 * Send enquiry notification to the business admin
 */
export async function sendEnquiryAdminNotification(
  enquiry: EnquiryEmailPayload
): Promise<EmailResult> {
  const businessEmail = getBusinessEmail();

  const configHtml = enquiry.configuration
    ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 10px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #0b2545;">Selected Configuration:</h4>
        <pre style="margin: 0; font-size: 12px; white-space: pre-wrap; font-family: monospace;">${JSON.stringify(enquiry.configuration, null, 2)}</pre>
      </div>`
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="border-bottom: 2px solid #0066cc; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0b2545; margin: 0; font-size: 20px;">New Customer Enquiry</h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Reference ID: ${enquiry.id}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 120px;"><strong>Customer:</strong></td>
          <td style="padding: 6px 0;">${escapeHtml(enquiry.name)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td>
          <td style="padding: 6px 0;"><a href="mailto:${escapeHtml(enquiry.email)}">${escapeHtml(enquiry.email)}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td>
          <td style="padding: 6px 0;">${enquiry.phone ? escapeHtml(enquiry.phone) : 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Subject:</strong></td>
          <td style="padding: 6px 0; font-weight: bold;">${escapeHtml(enquiry.subject)}</td>
        </tr>
        ${
          enquiry.productName
            ? `<tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Product:</strong></td>
                <td style="padding: 6px 0;">${escapeHtml(enquiry.productName)}</td>
              </tr>`
            : ''
        }
      </table>

      <div style="background-color: #f1f5f9; border-left: 4px solid #0066cc; padding: 14px; border-radius: 4px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #334155; text-transform: uppercase;">Message:</h4>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(enquiry.message)}</p>
      </div>

      ${configHtml}

      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        ServerFactory • Bytechip Technologies Enterprise Portal
      </div>
    </div>
  `;

  return sendMailSafely({
    to: businessEmail,
    replyTo: enquiry.email,
    subject: `[Enquiry #${enquiry.id.slice(-6).toUpperCase()}] ${enquiry.subject}`,
    html,
  });
}

/**
 * Send customer receipt acknowledgement for their enquiry
 */
export async function sendEnquiryCustomerAcknowledgement(
  enquiry: EnquiryEmailPayload
): Promise<EmailResult> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #0b2545; margin: 0; font-size: 22px; font-weight: 800;">SERVER FACTORY</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px;">A Bytechip Technologies Venture</p>
      </div>

      <p style="font-size: 15px; line-height: 1.6;">Dear ${escapeHtml(enquiry.name)},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Thank you for contacting <strong>ServerFactory</strong>. We have received your enquiry regarding <strong>"${escapeHtml(enquiry.subject)}"</strong> (Reference ID: <code>${enquiry.id}</code>).
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #0b2545;">Your Message Summary:</h3>
        <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(enquiry.message)}</p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Our hardware and datacenter engineering team in Bangalore is reviewing your requirements and will respond within <strong>4 business hours</strong>.
      </p>

      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        For urgent infrastructure queries or immediate server dispatch, feel free to call our direct helpline at <strong>+91 99160 48404</strong>.
      </p>

      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        No. 8, 24th Main Road, JP Nagar 7th Phase, Bangalore - 560078<br />
        © ${new Date().getFullYear()} ServerFactory / Bytechip Technologies. All rights reserved.
      </div>
    </div>
  `;

  return sendMailSafely({
    to: enquiry.email,
    subject: `Enquiry Received: ${enquiry.subject} [Ref: #${enquiry.id.slice(-6).toUpperCase()}]`,
    html,
  });
}

// ─────────────────────────────────────────────
// 2. Order Confirmation Emails
// ─────────────────────────────────────────────

export type OrderEmailPayload = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  billingName: string;
  billingEmail: string;
  billingPhone?: string | null;
  billingAddress: string;
  notes?: string | null;
  items: {
    id: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    tierName?: string | null;
    tierLabel?: string | null;
    options: {
      groupName: string;
      valueLabel: string;
      priceDelta: number;
    }[];
  }[];
};

/**
 * Send order confirmation email to the customer
 */
export async function sendOrderCustomerConfirmation(
  order: OrderEmailPayload
): Promise<EmailResult> {
  const itemsHtml = order.items
    .map((item) => {
      const optionsList =
        item.options.length > 0
          ? `<ul style="margin: 4px 0 0 0; padding-left: 18px; font-size: 12px; color: #64748b;">
              ${item.options
                .map(
                  (o) =>
                    `<li><strong>${escapeHtml(o.groupName)}:</strong> ${escapeHtml(o.valueLabel)}</li>`
                )
                .join('')}
            </ul>`
          : '';

      const tierBadge = item.tierLabel
        ? `<span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-left: 6px;">${escapeHtml(item.tierLabel)}</span>`
        : '';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; vertical-align: top;">
            <div style="font-weight: 600; color: #0b2545;">${escapeHtml(item.productName)} ${tierBadge}</div>
            <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">SKU: ${escapeHtml(item.productSku)}</div>
            ${optionsList}
          </td>
          <td style="padding: 12px 8px; vertical-align: top; text-align: center; color: #475569;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 8px; vertical-align: top; text-align: right; color: #475569;">
            ₹${item.unitPrice.toLocaleString('en-IN')}
          </td>
          <td style="padding: 12px 8px; vertical-align: top; text-align: right; font-weight: bold; color: #0b2545;">
            ₹${item.lineTotal.toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 640px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #0b2545; margin: 0; font-size: 24px; font-weight: 800;">SERVER FACTORY</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px;">Order Confirmation & Receipt</p>
      </div>

      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px; margin-bottom: 24px; text-align: center;">
        <h3 style="color: #065f46; margin: 0; font-size: 16px;">Order Placed Successfully!</h3>
        <p style="color: #047857; margin: 4px 0 0 0; font-size: 13px;">Order #${order.orderNumber} is registered in our fulfillment system.</p>
      </div>

      <p style="font-size: 15px; line-height: 1.6;">Dear ${escapeHtml(order.billingName)},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Thank you for your server order with <strong>ServerFactory</strong>. Below is the full breakdown of your configured hardware items and billing information.
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
            <th style="padding: 10px 8px; color: #475569;">Item & Configuration</th>
            <th style="padding: 10px 8px; text-align: center; color: #475569;">Qty</th>
            <th style="padding: 10px 8px; text-align: right; color: #475569;">Unit Price</th>
            <th style="padding: 10px 8px; text-align: right; color: #475569;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
        <table style="width: 260px; font-size: 13px; border-collapse: collapse; margin-left: auto;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">₹${order.subtotal.toLocaleString('en-IN')}</td>
          </tr>
          ${
            order.discount > 0
              ? `<tr>
                  <td style="padding: 6px 0; color: #16a34a;">Discount:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #16a34a;">-₹${order.discount.toLocaleString('en-IN')}</td>
                </tr>`
              : ''
          }
          <tr>
            <td style="padding: 6px 0; color: #64748b;">GST (18%):</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">₹${order.tax.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-top: 2px solid #0b2545;">
            <td style="padding: 10px 0; font-size: 15px; font-weight: bold; color: #0b2545;">Grand Total:</td>
            <td style="padding: 10px 0; text-align: right; font-size: 16px; font-weight: 800; color: #0066cc;">₹${order.total.toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 24px;">
        <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #0b2545;">Delivery & Billing Details:</h4>
        <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5; white-space: pre-line;">${escapeHtml(order.billingAddress)}</p>
        ${order.billingPhone ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">Contact Phone: ${escapeHtml(order.billingPhone)}</p>` : ''}
        ${order.notes ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;"><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ''}
      </div>

      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px; margin-top: 16px; font-size: 13px; color: #475569; line-height: 1.5;">
        <strong>Next Steps:</strong> An enterprise account manager will contact you within 24 hours to confirm hardware staging, burn-in testing schedules, and dispatch logistics.
      </div>

      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        ServerFactory • Bytechip Technologies • No. 8, 24th Main Road, JP Nagar 7th Phase, Bangalore - 560078<br />
        Support: +91 99160 48404 • sales@theserverfactory.com
      </div>
    </div>
  `;

  return sendMailSafely({
    to: order.billingEmail,
    subject: `Order Confirmation #${order.orderNumber} — ServerFactory`,
    html,
  });
}

/**
 * Send new order notification to the business admin
 */
export async function sendOrderAdminNotification(
  order: OrderEmailPayload
): Promise<EmailResult> {
  const businessEmail = getBusinessEmail();

  const itemsText = order.items
    .map(
      (i) =>
        `- ${i.productName} (SKU: ${i.productSku}) x${i.quantity} @ ₹${i.unitPrice.toLocaleString('en-IN')}`
    )
    .join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="border-bottom: 2px solid #72bf24; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0b2545; margin: 0; font-size: 20px;">🎉 New Order Received!</h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Order #${order.orderNumber}</p>
      </div>

      <p style="font-size: 14px;"><strong>Customer:</strong> ${escapeHtml(order.billingName)} (<a href="mailto:${escapeHtml(order.billingEmail)}">${escapeHtml(order.billingEmail)}</a>)</p>
      <p style="font-size: 14px;"><strong>Phone:</strong> ${order.billingPhone ? escapeHtml(order.billingPhone) : 'Not provided'}</p>
      <p style="font-size: 14px;"><strong>Total Value:</strong> ₹${order.total.toLocaleString('en-IN')}</p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px;">Ordered Items:</h4>
        <pre style="margin: 0; font-size: 12px; white-space: pre-wrap; font-family: monospace;">${escapeHtml(itemsText)}</pre>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px;">Shipping & Billing:</h4>
        <p style="margin: 0; font-size: 13px; white-space: pre-line;">${escapeHtml(order.billingAddress)}</p>
      </div>

      <p style="font-size: 12px; color: #94a3b8;">Manage this order in your <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/orders">Admin Dashboard</a>.</p>
    </div>
  `;

  return sendMailSafely({
    to: businessEmail,
    replyTo: order.billingEmail,
    subject: `[NEW ORDER #${order.orderNumber}] ₹${order.total.toLocaleString('en-IN')} from ${order.billingName}`,
    html,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
