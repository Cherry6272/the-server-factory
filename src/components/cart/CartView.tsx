'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { useCart } from './CartProvider';
import { formatINR } from '@/lib/utils';

export function CartView() {
  const { items, remove, updateQty, subtotal, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700 sm:p-12 md:mt-10 md:p-16">
        <p className="text-base text-ink-muted sm:text-lg">Your cart is empty.</p>
        <Link href="/" className="btn-brand mt-6">Shop Hardware →</Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] md:mt-10 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="card flex gap-3 p-3 xs:p-4 md:gap-4 md:p-5">
            {item.productImage && (
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 dark:border-gray-800 dark:bg-gray-950 xs:h-20 xs:w-20 md:h-24 md:w-24">
                <div className="relative h-full w-full">
                  <Image src={item.productImage} alt={item.productName} fill sizes="96px" className="object-contain" />
                </div>
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="min-w-0">
                <Link href={`/product/${item.productSlug}`} className="font-display text-sm font-bold text-ink hover:text-brand dark:text-gray-100 xs:text-base sm:text-lg">
                  {item.productName}
                </Link>
                {item.tier && (
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-brand">
                    {item.tier.label} tier
                  </p>
                )}
                {item.options.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-ink-muted dark:text-gray-400">
                    {item.options.map((o, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{o.groupLabel}:</span> {o.valueLabel}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
                <div className="flex items-center gap-1 rounded-full border border-gray-200 px-1 dark:border-gray-700">
                  <button onClick={() => updateQty(item.key, item.quantity - 1)} className="flex h-8 w-8 items-center justify-center" aria-label="Decrease quantity">
                    <Minus className="h-3.5 w-3.5 text-ink-muted dark:text-gray-400" />
                  </button>
                  <span className="min-w-[2ch] text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.key, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center" aria-label="Increase quantity">
                    <Plus className="h-3.5 w-3.5 text-ink-muted dark:text-gray-400" />
                  </button>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="text-sm font-extrabold md:text-base">{formatINR(item.unitPrice * item.quantity)}</span>
                  <button onClick={() => remove(item.key)} className="flex h-8 w-8 items-center justify-center text-ink-muted hover:text-red-500 dark:text-gray-400" aria-label="Remove item">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="card h-fit p-5 lg:sticky lg:top-24 md:p-6">
        <h2 className="font-display text-lg font-bold md:text-xl">Order Summary</h2>
        <div className="mt-4 space-y-3 border-y border-gray-100 py-4 text-sm dark:border-gray-800 md:mt-6 md:py-6">
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-gray-400">Total Items</span>
            <span className="font-semibold">{itemCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-gray-400">Subtotal</span>
            <span className="font-semibold">{formatINR(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-gray-400">Tax (GST 18%)</span>
            <span className="font-semibold">{formatINR(subtotal * 0.18)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between py-4">
          <span className="font-display font-bold">Payable</span>
          <span className="text-xl font-extrabold md:text-2xl">{formatINR(subtotal * 1.18)}</span>
        </div>
        <Link href="/checkout" className="btn-brand w-full">
          Proceed to Checkout <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-4 text-xs text-ink-muted dark:text-gray-400">
          ℹ Login required for checkout. Payment gateway integration coming soon.
        </p>
      </aside>
    </div>
  );
}
