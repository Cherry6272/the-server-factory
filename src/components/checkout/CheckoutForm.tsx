'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { formatINR } from '@/lib/utils';
import { ShieldCheck, CreditCard, Loader2 } from 'lucide-react';

const phoneRegex = /^[+]?[0-9\s\-().]{7,20}$/;

type UserProfile = {
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  gstNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export function CheckoutForm({ user }: { user: UserProfile }) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: user.name ?? '',
    email: user.email,
    phone: user.phone ?? '',
    company: user.company ?? '',
    gstNumber: user.gstNumber ?? '',
    addressLine1: user.addressLine1 ?? '',
    addressLine2: user.addressLine2 ?? '',
    city: user.city ?? '',
    state: user.state ?? '',
    postalCode: user.postalCode ?? '',
    country: user.country ?? 'India',
    notes: '',
  });

  function validateClient(): string | null {
    if (!form.name.trim() || form.name.trim().length < 2) {
      return 'Please enter your full name.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      return 'Please enter a valid billing email address.';
    }
    if (!form.phone.trim() || !phoneRegex.test(form.phone.trim())) {
      return 'Please enter a valid phone number (7-20 digits).';
    }
    if (!form.addressLine1.trim() || form.addressLine1.trim().length < 3) {
      return 'Please enter your address (at least 3 characters).';
    }
    if (!form.city.trim()) return 'Please enter your city.';
    if (!form.state.trim()) return 'Please enter your state.';
    if (!form.postalCode.trim() || form.postalCode.trim().length < 3) {
      return 'Please enter a valid postal code.';
    }
    if (!form.country.trim()) return 'Please enter your country.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    const validationErr = validateClient();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setLoading(true);
    setError(null);

    // Client idempotency key prevents duplicate orders from rapid multi-clicks or retries
    const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            tier: i.tier,
            options: i.options.map((o) => ({
              groupName: o.groupName,
              groupLabel: o.groupLabel,
              valueId: o.valueId,
              valueLabel: o.valueLabel,
              priceDelta: o.priceDelta,
            })),
          })),
          billing: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            company: form.company.trim() || undefined,
            gstNumber: form.gstNumber.trim() || undefined,
            addressLine1: form.addressLine1.trim(),
            addressLine2: form.addressLine2.trim() || undefined,
            city: form.city.trim(),
            state: form.state.trim(),
            postalCode: form.postalCode.trim(),
            country: form.country.trim(),
            notes: form.notes.trim() || undefined,
          },
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Checkout failed');
      }

      clear();
      router.push(`/account/orders/${data.orderId}?success=1`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong while placing your order.');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-gray-300 p-16 text-center">
        <p className="text-ink-muted">Your cart is empty. Add a server to continue.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] md:mt-10 md:gap-8 xl:grid-cols-[1fr_380px]">
      {/* Billing form */}
      <div className="space-y-4 md:space-y-6">
        <div className="card p-4 md:p-6">
          <h2 className="font-display text-lg font-bold md:text-xl">Billing Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:mt-6">
            <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Field label="Phone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
            <Field label="Company (optional)" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Field label="GSTIN (optional)" value={form.gstNumber} onChange={(v) => setForm({ ...form, gstNumber: v })} />
          </div>
        </div>

        <div className="card p-4 md:p-6">
          <h2 className="font-display text-lg font-bold md:text-xl">Shipping Address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:mt-6">
            <div className="sm:col-span-2">
              <Field label="Address Line 1" value={form.addressLine1} onChange={(v) => setForm({ ...form, addressLine1: v })} required />
            </div>
            <div className="sm:col-span-2">
              <Field label="Address Line 2" value={form.addressLine2} onChange={(v) => setForm({ ...form, addressLine2: v })} />
            </div>
            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
            <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} required />
            <Field label="Postal Code" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} required />
            <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-ink dark:text-gray-200">Order Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="mt-2 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              placeholder="Any special delivery instructions?"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
      </div>

      {/* Summary */}
      <aside className="card h-fit p-5 lg:sticky lg:top-24 md:p-6">
        <h2 className="font-display text-lg font-bold md:text-xl">Order Summary</h2>
        <ul className="mt-4 space-y-3 border-b border-gray-100 pb-4 text-sm dark:border-gray-800">
          {items.map((i) => (
            <li key={i.key} className="flex justify-between gap-4">
              <span className="min-w-0 flex-1">
                <span className="block truncate">{i.productName}</span>
                <span className="text-ink-muted dark:text-gray-400">×{i.quantity}</span>
              </span>
              <span className="flex-shrink-0 font-semibold">{formatINR(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 py-4 text-sm">
          <Row label="Subtotal" value={formatINR(subtotal)} />
          <Row label="GST (18%)" value={formatINR(tax)} />
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 py-4 dark:border-gray-800">
          <span className="font-display font-bold">Total</span>
          <span className="text-xl font-extrabold md:text-2xl">{formatINR(total)}</span>
        </div>
        <button type="submit" disabled={loading} className="btn-brand w-full disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Placing order...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" /> Place Order
            </>
          )}
        </button>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-muted dark:text-gray-400">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Payment coming soon — order marked pending
        </p>
      </aside>
    </form>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink dark:text-gray-200">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-base outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
