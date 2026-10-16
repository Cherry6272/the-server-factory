'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Plus, Server, Filter, X, ExternalLink } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export type AdminProductItem = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  brand: string | null;
  basePrice: any;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  images: { url: string }[];
  _count: { optionGroups: number; tiers: number };
};

export function AdminProductTable({
  initialProducts,
  categories,
}: {
  initialProducts: AdminProductItem[];
  categories: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const filtered = useMemo(() => {
    return initialProducts.filter((p) => {
      // Query filter
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBrand = (p.brand ?? '').toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBrand) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && p.category.id !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && !p.isActive) return false;
      if (statusFilter === 'INACTIVE' && p.isActive) return false;

      return true;
    });
  }, [initialProducts, query, selectedCategory, statusFilter]);

  return (
    <div>
      {/* Search & Filter Toolbar */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-200/90 bg-white p-4 shadow-soft dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name, SKU, or brand..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-brand focus:bg-white dark:border-gray-700 dark:bg-gray-800/80 dark:focus:border-brand dark:focus:bg-gray-900"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-ink-muted dark:text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-semibold outline-none focus:border-brand dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 sm:text-sm"
            >
              <option value="ALL">All Categories ({initialProducts.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-semibold outline-none focus:border-brand dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 sm:text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Results Counter */}
      <div className="mt-3 flex items-center justify-between px-1 text-xs text-ink-muted dark:text-gray-400">
        <span>
          Showing <strong className="text-ink dark:text-gray-200">{filtered.length}</strong> of{' '}
          {initialProducts.length} products
        </span>
        {(query || selectedCategory !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            onClick={() => {
              setQuery('');
              setSelectedCategory('ALL');
              setStatusFilter('ALL');
            }}
            className="font-medium text-brand hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-ink-muted dark:border-gray-700">
            No products match your search.
          </div>
        ) : (
          filtered.map((p) => {
            const price = Number(p.basePrice) || 0;
            return (
              <div key={p.id} className="card flex flex-col gap-3 p-4">
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 dark:border-gray-800 dark:bg-gray-950">
                    {p.images[0] ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={p.images[0].url}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
                        <Server className="h-6 w-6 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink dark:text-gray-100">{p.name}</p>
                    <p className="truncate text-xs text-ink-muted dark:text-gray-400">
                      {p.brand ? `${p.brand} · ` : ''}
                      {p.category.name}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-gray-400">{p.sku}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                  <div>
                    <span className="text-sm font-bold">
                      {price > 0 ? formatINR(price) : 'Custom Quote'}
                    </span>
                    {p._count.tiers > 0 && (
                      <span className="ml-2 inline-flex rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand/10 dark:text-brand-300">
                        {p._count.tiers} Tiers
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold hover:border-brand hover:text-brand dark:border-gray-700"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/product/${p.slug}`}
                      target="_blank"
                      className="rounded-lg p-1.5 text-gray-400 hover:text-brand"
                      title="View live page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="mt-4 hidden md:block">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-left text-xs uppercase tracking-wider text-ink-muted dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Tiers</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-ink-muted dark:text-gray-400">
                      No products match your current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const price = Number(p.basePrice) || 0;
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white p-1 dark:border-gray-800 dark:bg-gray-950">
                              {p.images[0] ? (
                                <div className="relative h-full w-full">
                                  <Image
                                    src={p.images[0].url}
                                    alt=""
                                    fill
                                    sizes="48px"
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
                                  <Server className="h-5 w-5 opacity-40" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-ink dark:text-gray-100">{p.name}</p>
                              {p.brand && <p className="text-xs text-brand">{p.brand}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3 font-mono text-xs text-ink-muted dark:text-gray-400">
                          {p.sku}
                        </td>

                        <td className="px-6 py-3 text-ink-muted dark:text-gray-400">
                          {p.category.name}
                        </td>

                        <td className="px-6 py-3 font-semibold">
                          {price > 0 ? (
                            formatINR(price)
                          ) : (
                            <span className="text-xs text-brand font-bold uppercase tracking-wide">
                              Quote on Request
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-3">
                          {p._count.tiers > 0 ? (
                            <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand/10 dark:text-brand-300">
                              {p._count.tiers} tier{p._count.tiers === 1 ? '' : 's'}
                            </span>
                          ) : (
                            <span className="text-xs text-ink-muted dark:text-gray-500">—</span>
                          )}
                        </td>

                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              p.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold hover:border-brand hover:text-brand dark:border-gray-700"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              className="rounded-lg p-1.5 text-gray-400 hover:text-brand"
                              title="View on site"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
