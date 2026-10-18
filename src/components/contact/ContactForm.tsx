'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const phoneRegex = /^[+]?[0-9\s\-().]{7,20}$/;

export type ContactFormProps = {
  defaultSubject?: string;
  productId?: string;
  productName?: string;
  productSlug?: string;
  configuration?: Record<string, unknown>;
  onSuccess?: () => void;
};

export function ContactForm({
  defaultSubject = '',
  productId,
  productName,
  productSlug,
  configuration,
  onSuccess,
}: ContactFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: defaultSubject,
    message: '',
  });

  // Client validation
  function validateClient(): string | null {
    if (!form.name.trim() || form.name.trim().length < 2) {
      return 'Please enter your full name (at least 2 characters).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (form.phone.trim() && !phoneRegex.test(form.phone.trim())) {
      return 'Please enter a valid phone number (7-20 digits).';
    }
    if (!form.subject.trim() || form.subject.trim().length < 2) {
      return 'Please provide a subject for your enquiry.';
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      return 'Please provide more details in your message (at least 10 characters).';
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const validationErr = validateClient();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setLoading(true);
    setError(null);

    // Generate client-side idempotency key for this submission attempt
    const idempotencyKey = `enq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          subject: form.subject.trim(),
          message: form.message.trim(),
          productId,
          productName,
          productSlug,
          configuration,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry. Please try again.');
      }

      setSent(true);
      setServerMessage(data.message || 'We will get back to you within 4 business hours.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 text-center sm:p-8 dark:border-green-900/50 dark:bg-green-950/40">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 font-display text-xl font-bold text-green-800 dark:text-green-300">
          Enquiry Received!
        </h3>
        <p className="mt-2 text-sm text-green-700 dark:text-green-400">
          {serverMessage || 'Our hardware engineering team will get back to you within 4 business hours.'}
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setServerMessage(null);
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-green-600 bg-white px-5 py-2 text-xs font-bold text-green-700 shadow-sm transition hover:bg-green-50 dark:bg-gray-900 dark:text-green-300"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Full Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="e.g. Rahul Sharma"
          required
        />
        <Field
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="name@company.com"
          required
        />
        <Field
          label="Phone Number"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder="+91 98765 43210"
        />
        <Field
          label="Subject"
          value={form.subject}
          onChange={(v) => setForm({ ...form, subject: v })}
          placeholder="e.g. Enterprise Quote / 2U Server Cluster"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          Requirement Details <span className="text-brand">*</span>
        </label>
        <textarea
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={5}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          placeholder="Specify required quantity, workloads, target delivery timeline, or questions..."
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-brand w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting Enquiry...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Send Enquiry
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-brand"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-base outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
      />
    </div>
  );
}
