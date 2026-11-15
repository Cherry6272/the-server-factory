'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShoppingCart, Sparkles, Wrench, FileText, ArrowRight } from 'lucide-react';
import { useCart, type CartOption, type CartTier } from '@/components/cart/CartProvider';
import { formatINR, cn } from '@/lib/utils';
import { ProductEnquiryModal } from './ProductEnquiryModal';

type OptionValue = { id: string; label: string; priceDelta: number; isDefault: boolean };
type OptionGroup = { id: string; name: string; label: string; required: boolean; values: OptionValue[] };
type Tier = {
  id: string;
  name: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  label: string;
  description: string | null;
  priceOverride: number | null;
  selectionValueIds: string[]; // option value IDs this tier selects
};
type Product = { id: string; slug: string; name: string; basePrice: number; image?: string };

type Mode = 'quick' | 'custom';

const TIER_ORDER = ['BASIC', 'INTERMEDIATE', 'ADVANCED'] as const;

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  BASIC: { label: 'Standard', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  INTERMEDIATE: { label: 'Recommended', className: 'bg-brand-50 text-brand-700 dark:bg-brand/20 dark:text-brand-300' },
  ADVANCED: { label: 'Max Compute', className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' },
};

export function Configurator({
  product,
  groups,
  tiers,
  hideSpecLabels = false,
}: {
  product: Product;
  groups: OptionGroup[];
  tiers: Tier[];
  /** Admin → Configs: render tier specs as bare values, without the component name. */
  hideSpecLabels?: boolean;
}) {
  const router = useRouter();
  const { add } = useCart();

  const hasTiers = tiers.length > 0;
  const [mode, setMode] = useState<Mode>(hasTiers ? 'quick' : 'custom');

  // Custom-mode selections
  const initCustom = () => {
    const init: Record<string, string> = {};
    for (const g of groups) {
      const def = g.values.find((v) => v.isDefault) ?? g.values[0];
      if (def) init[g.id] = def.id;
    }
    return init;
  };
  const [customSelections, setCustomSelections] = useState<Record<string, string>>(initCustom);

  // Tiers are fixed bundles: resolve each one's components and price up-front.
  // Nothing inside a tier is editable — customisation happens in Customize mode.
  const tierDetails = useMemo(() => {
    return [...tiers]
      .sort((a, b) => TIER_ORDER.indexOf(a.name) - TIER_ORDER.indexOf(b.name))
      .map((tier) => {
        const selections: Record<string, string> = {};
        const specs: { groupLabel: string; valueLabel: string }[] = [];
        let sum = product.basePrice;

        for (const g of groups) {
          const picked = g.values.find((v) => tier.selectionValueIds.includes(v.id))
            ?? g.values.find((v) => v.isDefault)
            ?? g.values[0];
          if (!picked) continue;
          selections[g.id] = picked.id;
          specs.push({ groupLabel: g.label, valueLabel: picked.label });
          sum += picked.priceDelta;
        }

        return {
          tier,
          selections,
          specs,
          price: tier.priceOverride ?? sum,
        };
      });
  }, [tiers, groups, product.basePrice]);

  const [activeTierId, setActiveTierId] = useState<string | null>(tierDetails[0]?.tier.id ?? null);

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);

  // ── Price calculation ────────────────────
  const activeDetail = tierDetails.find((d) => d.tier.id === activeTierId);
  const activeTier = activeDetail?.tier;
  const activeSelections = mode === 'quick' ? (activeDetail?.selections ?? {}) : customSelections;

  // Active specs for display and quote enquiries
  const activeSpecs = useMemo(() => {
    if (mode === 'quick' && activeDetail) {
      return activeDetail.specs;
    }
    return groups
      .map((g) => {
        const v = g.values.find((x) => x.id === customSelections[g.id]);
        return v ? { groupLabel: g.label, valueLabel: v.label } : null;
      })
      .filter(Boolean) as { groupLabel: string; valueLabel: string }[];
  }, [mode, activeDetail, groups, customSelections]);

  const unitPrice = useMemo(() => {
    if (mode === 'quick') return activeDetail?.price ?? product.basePrice;

    let sum = product.basePrice;
    for (const g of groups) {
      const v = g.values.find((x) => x.id === customSelections[g.id]);
      if (v) sum += v.priceDelta;
    }
    return sum;
  }, [mode, activeDetail, customSelections, product.basePrice, groups]);

  const totalPrice = unitPrice * qty;

  function handleAdd(goToCart = false) {
    const selections = activeSelections;
    const options: CartOption[] = groups
      .map((g) => {
        const v = g.values.find((x) => x.id === selections[g.id]);
        if (!v) return null;
        return {
          groupName: g.name,
          groupLabel: g.label,
          valueId: v.id,
          valueLabel: v.label,
          priceDelta: v.priceDelta,
        };
      })
      .filter(Boolean) as CartOption[];

    const tier: CartTier | undefined = mode === 'quick' && activeTier
      ? { name: activeTier.name, label: activeTier.label }
      : undefined;

    add({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: product.image,
      basePrice: product.basePrice,
      options,
      tier,
      unitPrice,
      quantity: qty,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    if (goToCart) router.push('/cart');
  }

  return (
    <div className="space-y-6">
      {/* Mode tabs - only if tiers exist */}
      {hasTiers && (
        <div className="flex rounded-full bg-gray-100 p-1 dark:bg-navy-950 dark:border dark:border-navy-800">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition',
              mode === 'quick' ? 'bg-brand text-white shadow-brand' : 'text-ink-muted dark:text-gray-300 hover:text-ink dark:hover:text-white'
            )}
          >
            <Sparkles className="h-4 w-4" /> Pre-Configured Tiers
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition',
              mode === 'custom' ? 'bg-brand text-white shadow-brand' : 'text-ink-muted dark:text-gray-300 hover:text-ink dark:hover:text-white'
            )}
          >
            <Wrench className="h-4 w-4" /> Customise Build
          </button>
        </div>
      )}

      <div>
        <h3 className="font-display text-lg font-bold">
          {mode === 'quick' ? 'Select an Architecture Tier' : 'Customise Your Hardware Build'}
        </h3>
        <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">
          {mode === 'quick'
            ? 'Choose from verified enterprise configurations (Basic, Intermediate, Advanced). Or switch to Customise to specify individual parts.'
            : 'Select individual processors, memory, storage, RAID, and power supplies to build your custom ' + product.name + '.'}
        </p>
      </div>

      {/* Fixed tiers — details only, no per-component selection */}
      {mode === 'quick' && (
        <div className="grid gap-3 xs:grid-cols-2 xl:grid-cols-3">
          {tierDetails.map(({ tier: t, specs, price }) => {
            const selected = activeTierId === t.id;
            const badge = TIER_BADGES[t.name] ?? { label: t.name, className: 'bg-gray-100 text-gray-700' };

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTierId(t.id)}
                className={cn(
                  'flex min-w-0 h-full flex-col justify-between rounded-2xl border p-4 text-left transition sm:p-5',
                  selected
                    ? 'border-brand bg-brand-50/70 ring-2 ring-brand/30 dark:bg-brand/10'
                    : 'border-gray-200 bg-white hover:border-brand-300 dark:border-navy-800/80 dark:bg-navy-900/90 dark:hover:border-navy-600'
                )}
              >
                <div>
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', badge.className)}>
                      {badge.label}
                    </span>
                    {selected && <Check className="h-5 w-5 flex-shrink-0 text-brand" />}
                  </div>

                  <span className="mt-2 block font-display text-lg font-bold">{t.label}</span>

                  <div className="mt-1">
                    {price > 0 ? (
                      <span className="text-base font-extrabold text-ink dark:text-white">{formatINR(price)}</span>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wider text-brand">Quote on Request</span>
                    )}
                  </div>

                  {t.description && (
                    <span className="mt-2 block text-xs leading-relaxed text-ink-muted dark:text-gray-400">
                      {t.description}
                    </span>
                  )}
                </div>

                {specs.length > 0 && (
                  <div className="mt-4 w-full space-y-1.5 border-t border-gray-200/80 pt-3 dark:border-gray-700/80">
                    {specs.map((s) =>
                      hideSpecLabels ? (
                        <span key={s.groupLabel} className="block text-xs font-medium">
                          {s.valueLabel}
                        </span>
                      ) : (
                        <div key={s.groupLabel} className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
                          <span className="flex-shrink-0 text-ink-muted dark:text-gray-400">{s.groupLabel}</span>
                          <span className="min-w-0 font-medium sm:text-right">{s.valueLabel}</span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {mode === 'quick' && (
        <p className="text-center text-sm text-ink-muted dark:text-gray-400">
          Need a different spec?{' '}
          <button
            type="button"
            onClick={() => setMode('custom')}
            className="font-semibold text-brand hover:underline"
          >
            Switch to Customise
          </button>{' '}
          to build your own.
        </p>
      )}

      {/* Option groups — customisation only */}
      {mode === 'custom' && groups.map((g) => {
        const selectedId = customSelections[g.id];
        return (
          <div key={g.id} className="card p-4 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <label className="font-semibold">
                {g.label}
                {g.required && <span className="ml-1 text-brand">*</span>}
              </label>
            </div>
            <div className="grid gap-2 xs:grid-cols-2 2xl:grid-cols-3">
              {g.values.map((v) => {
                const selected = selectedId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setCustomSelections((prev) => ({ ...prev, [g.id]: v.id }))}
                    className={cn(
                      'flex min-w-0 items-center justify-between gap-2 rounded-xl border p-3 text-left text-sm transition',
                      selected
                        ? 'border-brand bg-brand-50 ring-2 ring-brand/30 dark:bg-brand/10'
                        : 'border-gray-200 bg-white hover:border-brand-300 dark:border-navy-800/80 dark:bg-navy-900/90 dark:hover:border-navy-600'
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {selected && <Check className="h-4 w-4 flex-shrink-0 text-brand" />}
                      <span className="min-w-0 font-medium">{v.label}</span>
                    </span>
                    <span className={cn('flex-shrink-0 text-xs font-semibold', v.priceDelta === 0 ? 'text-ink-muted dark:text-gray-400' : 'text-brand-700 dark:text-brand-400')}>
                      {v.priceDelta === 0 ? 'Included' : `+${formatINR(v.priceDelta)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Summary + add to cart / quote */}
      <div className="sticky bottom-0 z-10 rounded-2xl border border-gray-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-navy-800/80 dark:bg-navy-900/95 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                {mode === 'quick' ? (activeTier?.label ?? 'Architecture Tier') : 'Custom Architecture'}
              </span>
              <span className="text-[11px] text-ink-muted dark:text-gray-400">• Total Estimate</span>
            </div>
            {totalPrice > 0 ? (
              <p className="text-2xl font-extrabold text-ink dark:text-white sm:text-3xl">{formatINR(totalPrice)}</p>
            ) : (
              <p className="text-xl font-extrabold text-ink dark:text-white sm:text-2xl">Pricing on Request</p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 rounded-full border border-gray-200 px-1 dark:border-navy-700 dark:bg-navy-950">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-lg text-ink-muted hover:text-brand dark:text-gray-400"
              aria-label="Decrease quantity"
            >−</button>
            <span className="min-w-[2ch] text-center font-bold">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="flex h-10 w-10 items-center justify-center text-lg text-ink-muted hover:text-brand dark:text-gray-400"
              aria-label="Increase quantity"
            >+</button>
          </div>
        </div>

        {/* Dynamic CTAs based on mode (Tiers vs Customise) */}
        {mode === 'quick' ? (
          /* QUICK PICK TIERS (BASIC, INTERMEDIATE, ADVANCED) */
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => handleAdd(true)}
              className="btn-brand flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold shadow-md hover:shadow-brand/25 transition-all active:scale-[0.99]"
            >
              <span>Buy Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setEnquiryModalOpen(true)}
              className="btn-outline flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-brand/60 text-brand hover:bg-brand-50 dark:border-brand/40 dark:text-brand-300 dark:hover:bg-brand/10 transition-all active:scale-[0.99]"
            >
              <FileText className="h-4 w-4" />
              <span>Request Estimate</span>
            </button>

            <button
              type="button"
              onClick={() => handleAdd(false)}
              title="Add to Cart"
              aria-label="Add to Cart"
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-brand sm:w-auto',
                added && 'border-green-500 text-green-600 dark:border-green-500 dark:text-green-400'
              )}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Add to Cart</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* CUSTOMISE MODE */
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => handleAdd(false)}
              className={cn(
                'btn-brand flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold shadow-md hover:shadow-brand/25 transition-all active:scale-[0.99]',
                added && 'bg-techgreen-600 hover:bg-techgreen-700'
              )}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Customisation Saved
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4" /> Save Customise
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleAdd(true)}
              className="btn-outline flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-brand/60 text-brand hover:bg-brand-50 dark:border-brand/40 dark:text-brand-300 dark:hover:bg-brand/10 transition-all active:scale-[0.99]"
            >
              <span>Buy Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setEnquiryModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200 dark:hover:border-brand sm:w-auto"
            >
              <FileText className="h-4 w-4" />
              <span>Request Estimate</span>
            </button>
          </div>
        )}

        <p className="mt-3 text-center text-[11px] text-ink-muted dark:text-gray-400">
          {mode === 'quick'
            ? '✓ Verified enterprise hardware spec with genuine OEM parts and warranty.'
            : '✓ Custom configured specification tailored for your enterprise workloads.'}
        </p>
      </div>

      {/* Quote / Configuration Enquiry Modal */}
      <ProductEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        product={product}
        configuration={{
          mode,
          tierLabel: mode === 'quick' ? activeTier?.label : undefined,
          specs: activeSpecs,
        }}
      />
    </div>
  );
}
