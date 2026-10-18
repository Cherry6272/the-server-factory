'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, ChevronDown, X, Search, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BrandFacet = {
  name: string;
  count: number;
};

export type ConfigFacet = {
  name: string;
  options: {
    label: string;
    count: number;
  }[];
};

export type CategoryFiltersProps = {
  brands: BrandFacet[];
  configFacets: ConfigFacet[];
  currentSlug: string;
  current: Record<string, string | string[] | undefined>;
  priceBounds?: { min: number; max: number };
};

export function CategoryFilters({
  brands,
  configFacets,
  currentSlug,
  current,
  priceBounds,
}: CategoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Group search queries (for facet groups with > 6 options)
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  // Accordion open/expanded state for filter groups
  // Default: only 'brand' is open by default. All config facets (Processor, RAID, Memory, etc.) and Price are collapsed until clicked.
  // If a group has active selections from URL params, keep it open so the user sees their active choices.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const open = new Set<string>(['brand']);
    for (const [key, val] of Object.entries(current)) {
      if (key.startsWith('cfg_') && val) {
        open.add(key.slice(4));
      }
    }
    if (current.min || current.max) {
      open.add('price');
    }
    return open;
  });

  function toggleGroup(name: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  // Parse selected brands
  const selectedBrands = useMemo(() => {
    const raw = current.brand;
    const str = Array.isArray(raw) ? raw.join(',') : raw ?? '';
    return new Set(str.split(',').map((s) => s.trim()).filter(Boolean));
  }, [current.brand]);

  // Parse selected configs: Record<groupName, Set<value>>
  const selectedConfigs = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const [key, val] of Object.entries(current)) {
      if (key.startsWith('cfg_') && val) {
        const groupName = key.slice(4);
        const str = Array.isArray(val) ? val.join(',') : val;
        const vals = str.split(',').map((s) => s.trim()).filter(Boolean);
        if (vals.length > 0) {
          map.set(groupName, new Set(vals));
        }
      }
    }
    return map;
  }, [current]);

  // Count active filters
  const activeCount = useMemo(() => {
    let count = selectedBrands.size;
    if (current.min) count++;
    if (current.max) count++;
    for (const set of selectedConfigs.values()) {
      count += set.size;
    }
    return count;
  }, [selectedBrands, current.min, current.max, selectedConfigs]);

  // Navigate with updated search params
  function updateParams(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    router.push(`/category/${currentSlug}?${next.toString()}`, { scroll: false });
  }

  function toggleBrand(brand: string) {
    updateParams((p) => {
      const nextSet = new Set(selectedBrands);
      if (nextSet.has(brand)) nextSet.delete(brand);
      else nextSet.add(brand);

      if (nextSet.size === 0) p.delete('brand');
      else p.set('brand', Array.from(nextSet).join(','));
    });
  }

  function toggleConfig(groupName: string, value: string) {
    updateParams((p) => {
      const key = `cfg_${groupName}`;
      const currentSet = new Set(selectedConfigs.get(groupName) ?? []);
      if (currentSet.has(value)) currentSet.delete(value);
      else currentSet.add(value);

      if (currentSet.size === 0) p.delete(key);
      else p.set(key, Array.from(currentSet).join(','));
    });
  }

  function removeFilter(type: 'brand' | 'price' | 'config', groupName?: string, value?: string) {
    updateParams((p) => {
      if (type === 'brand' && value) {
        const nextSet = new Set(selectedBrands);
        nextSet.delete(value);
        if (nextSet.size === 0) p.delete('brand');
        else p.set('brand', Array.from(nextSet).join(','));
      } else if (type === 'price') {
        p.delete('min');
        p.delete('max');
      } else if (type === 'config' && groupName && value) {
        const key = `cfg_${groupName}`;
        const currentSet = new Set(selectedConfigs.get(groupName) ?? []);
        currentSet.delete(value);
        if (currentSet.size === 0) p.delete(key);
        else p.set(key, Array.from(currentSet).join(','));
      }
    });
  }

  function clearAll() {
    router.push(`/category/${currentSlug}`, { scroll: false });
  }

  return (
    <aside className="card h-fit p-4 md:p-6 bg-white dark:bg-navy-900 border border-gray-200/90 dark:border-gray-800 shadow-soft">
      {/* Phone/tablet toggle bar */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 lg:pointer-events-none"
        aria-expanded={mobileOpen}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand" />
          <span className="font-display text-base font-bold md:text-lg text-ink dark:text-white">Filters</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform lg:hidden', mobileOpen && 'rotate-180')} />
      </button>

      {/* Filter Body: always shown on desktop, collapsible on mobile */}
      <div className={cn('lg:block', mobileOpen ? 'block mt-4' : 'hidden')}>
        {/* Header row: Total active + Clear All */}
        {activeCount > 0 && (
          <div className="mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted dark:text-gray-400">
                {activeCount} active filter{activeCount === 1 ? '' : 's'}
              </span>
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-600 dark:text-brand-400 transition"
              >
                <RotateCcw className="h-3 w-3" /> Clear All
              </button>
            </div>

            {/* Active Pills */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {Array.from(selectedBrands).map((brand) => (
                <span
                  key={brand}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/60 dark:border-brand-800 dark:text-brand-300"
                >
                  {brand}
                  <button
                    onClick={() => removeFilter('brand', undefined, brand)}
                    className="hover:text-red-500 transition-colors"
                    aria-label={`Remove ${brand}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {Array.from(selectedConfigs.entries()).map(([gName, valSet]) =>
                Array.from(valSet).map((val) => (
                  <span
                    key={`${gName}-${val}`}
                    className="inline-flex items-center gap-1 rounded-full bg-techgreen-50 border border-techgreen-200 px-2.5 py-0.5 text-[11px] font-semibold text-techgreen-800 dark:bg-techgreen-950/60 dark:border-techgreen-800 dark:text-techgreen-300"
                  >
                    <span className="text-gray-500 dark:text-gray-400 font-normal">{gName}:</span> {val}
                    <button
                      onClick={() => removeFilter('config', gName, val)}
                      className="hover:text-red-500 transition-colors"
                      aria-label={`Remove ${val}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}

              {(current.min || current.max) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                  ₹{current.min || '0'} – ₹{current.max || '∞'}
                  <button
                    onClick={() => removeFilter('price')}
                    className="hover:text-red-500 transition-colors"
                    aria-label="Remove price filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
          {/* 1. Brand Section (Open by default) */}
          {brands.length > 0 && (
            <div className="pt-2 first:pt-0">
              <button
                type="button"
                onClick={() => toggleGroup('brand')}
                className="group flex w-full items-center justify-between text-left py-1 text-sm font-bold text-ink dark:text-gray-100 hover:text-brand dark:hover:text-brand-400 transition-colors"
                aria-expanded={openGroups.has('brand')}
              >
                <span className="flex items-center gap-2">
                  Brand
                  {selectedBrands.size > 0 ? (
                    <span className="rounded-full bg-brand px-1.5 py-0.2 text-[10px] font-bold text-white">
                      {selectedBrands.size}
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-ink-muted dark:text-gray-500">
                      ({brands.length})
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-gray-400 group-hover:text-brand transition-transform duration-200',
                    openGroups.has('brand') && 'rotate-180'
                  )}
                />
              </button>

              {openGroups.has('brand') && (
                <div className="mt-2.5 space-y-1">
                  {brands.map((b) => (
                    <label
                      key={b.name}
                      className="flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedBrands.has(b.name)}
                          onChange={() => toggleBrand(b.name)}
                          className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand dark:border-gray-700 dark:bg-gray-900"
                        />
                        <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                          {b.name}
                        </span>
                      </div>
                      <span className="text-xs text-ink-muted dark:text-gray-500">
                        ({b.count})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Dynamic Config Sections (Processor, Memory, Storage, RAID, Power Supply, etc. - Collapsed by default until clicked) */}
          {configFacets.map((facet) => {
            const isOpen = openGroups.has(facet.name);
            const activeInGroup = selectedConfigs.get(facet.name)?.size ?? 0;
            const query = (searchQueries[facet.name] ?? '').toLowerCase();
            const filteredOptions = query
              ? facet.options.filter((o) => o.label.toLowerCase().includes(query))
              : facet.options;

            return (
              <div key={facet.name} className="pt-3">
                <button
                  type="button"
                  onClick={() => toggleGroup(facet.name)}
                  className="group flex w-full items-center justify-between text-left py-1 text-sm font-bold text-ink dark:text-gray-100 hover:text-brand dark:hover:text-brand-400 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-2">
                    {facet.name}
                    {activeInGroup > 0 ? (
                      <span className="rounded-full bg-techgreen-500 px-1.5 py-0.2 text-[10px] font-extrabold text-navy-950">
                        {activeInGroup}
                      </span>
                    ) : (
                      <span className="text-xs font-normal text-ink-muted dark:text-gray-500">
                        ({facet.options.length})
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-gray-400 group-hover:text-brand transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="mt-2.5">
                    {/* Quick filter input if group has > 6 options */}
                    {facet.options.length > 6 && (
                      <div className="relative mb-2">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder={`Filter ${facet.name}...`}
                          value={searchQueries[facet.name] ?? ''}
                          onChange={(e) =>
                            setSearchQueries({ ...searchQueries, [facet.name]: e.target.value })
                          }
                          className="w-full rounded-lg border border-gray-200 bg-gray-50/70 py-1 pl-8 pr-2 text-xs outline-none focus:border-brand focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        />
                      </div>
                    )}

                    <div
                      className={cn(
                        'space-y-1 pr-1',
                        facet.options.length > 6 && 'max-h-52 overflow-y-auto scrollbar-thin'
                      )}
                    >
                      {filteredOptions.map((opt) => {
                        const isChecked = selectedConfigs.get(facet.name)?.has(opt.label) ?? false;
                        return (
                          <label
                            key={opt.label}
                            className="flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-sm"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleConfig(facet.name, opt.label)}
                                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand dark:border-gray-700 dark:bg-gray-900"
                              />
                              <span className="truncate text-xs font-medium text-gray-800 dark:text-gray-200 sm:text-sm">
                                {opt.label}
                              </span>
                            </div>
                            <span className="text-xs text-ink-muted dark:text-gray-500">
                              ({opt.count})
                            </span>
                          </label>
                        );
                      })}
                      {filteredOptions.length === 0 && (
                        <p className="px-2 py-2 text-xs text-ink-muted dark:text-gray-500">
                          No matching options
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 3. Price Range Section (Collapsed by default until clicked) */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => toggleGroup('price')}
              className="group flex w-full items-center justify-between text-left py-1 text-sm font-bold text-ink dark:text-gray-100 hover:text-brand dark:hover:text-brand-400 transition-colors"
              aria-expanded={openGroups.has('price')}
            >
              <span className="flex items-center gap-2">
                Price Range (₹)
                {(current.min || current.max) && (
                  <span className="h-2 w-2 rounded-full bg-brand" />
                )}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-gray-400 group-hover:text-brand transition-transform duration-200',
                  openGroups.has('price') && 'rotate-180'
                )}
              />
            </button>

            {openGroups.has('price') && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Min"
                    defaultValue={current.min}
                    onBlur={(e) => {
                      updateParams((p) => {
                        if (e.target.value.trim()) p.set('min', e.target.value.trim());
                        else p.delete('min');
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-1.5 text-xs outline-none focus:border-brand focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-xs text-gray-400">—</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Max"
                    defaultValue={current.max}
                    onBlur={(e) => {
                      updateParams((p) => {
                        if (e.target.value.trim()) p.set('max', e.target.value.trim());
                        else p.delete('max');
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-1.5 text-xs outline-none focus:border-brand focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                {priceBounds && priceBounds.max > 0 && (
                  <p className="mt-1.5 text-[11px] text-ink-muted dark:text-gray-400">
                    Range: ₹{priceBounds.min.toLocaleString('en-IN')} – ₹
                    {priceBounds.max.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}