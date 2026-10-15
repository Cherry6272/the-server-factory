'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CategoryFilters({
  brands,
  currentSlug,
  current,
}: {
  brands: string[];
  currentSlug: string;
  current: { brand?: string; min?: string; max?: string; sort?: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  // Collapsed by default on phones so the product grid stays near the top of the page;
  // from lg up the sidebar has its own column and is always open.
  const [open, setOpen] = useState(false);

  const selectedBrands = new Set((current.brand ?? '').split(',').filter(Boolean));
  const activeCount =
    selectedBrands.size + (current.min ? 1 : 0) + (current.max ? 1 : 0);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    router.push(`/category/${currentSlug}?${next.toString()}`);
  }

  function toggleBrand(brand: string) {
    if (selectedBrands.has(brand)) selectedBrands.delete(brand);
    else selectedBrands.add(brand);
    setParam('brand', Array.from(selectedBrands).join(','));
  }

  function clearAll() {
    router.push(`/category/${currentSlug}`);
  }

  return (
    <aside className="card h-fit p-4 md:p-6">
      {/* Phone/tablet: tap to reveal. Desktop: the heading row, always expanded. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 lg:pointer-events-none"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand lg:hidden" />
          <span className="font-display text-base font-bold md:text-lg">Filters</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">{activeCount}</span>
          )}
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform lg:hidden', open && 'rotate-180')} />
      </button>

      <div className={cn('lg:block', open ? 'block' : 'hidden')}>
        <div className="mb-4 mt-4 flex justify-end md:mb-6 lg:mt-6">
          <button onClick={clearAll} className="text-xs font-semibold text-brand hover:underline md:text-sm">
            Clear All
          </button>
        </div>

        <div className="mb-4 md:mb-6">
          <h4 className="mb-2 text-sm font-semibold">Brand</h4>
          <div className="space-y-0.5">
            {brands.map((brand) => (
              <label key={brand} className="flex min-h-[40px] cursor-pointer items-center gap-3 py-1">
                <input
                  type="checkbox"
                  checked={selectedBrands.has(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <span className="min-w-0 text-sm">{brand}</span>
              </label>
            ))}
            {brands.length === 0 && <p className="text-sm text-ink-muted dark:text-gray-400">—</p>}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Price Range (₹)</h4>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              defaultValue={current.min}
              onBlur={(e) => setParam('min', e.target.value)}
              className="w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-base dark:border-gray-700 lg:py-1.5 lg:text-sm"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              defaultValue={current.max}
              onBlur={(e) => setParam('max', e.target.value)}
              className="w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-base dark:border-gray-700 lg:py-1.5 lg:text-sm"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}