'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2, Check } from 'lucide-react';
import { formatINR } from '@/lib/utils';

type Value = { id: string; label: string; priceDelta: number; isDefault: boolean };
type Group = { id: string; name: string; label: string; values: Value[] };
type Tier = {
  id?: string;
  name: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  label: string;
  description: string;
  priceOverride: number | null;
  isActive: boolean;
  selectionValueIds: string[];
};

const TIER_NAMES = ['BASIC', 'INTERMEDIATE', 'ADVANCED'] as const;

export function TiersEditor({
  productId,
  basePrice,
  groups,
  initialTiers,
}: {
  productId: string;
  basePrice: number;
  groups: Group[];
  initialTiers: Tier[];
}) {
  const router = useRouter();
  const [tiers, setTiers] = useState<Record<string, Tier>>(() => {
    const map: Record<string, Tier> = {};
    for (const t of initialTiers) map[t.name] = t;
    return map;
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function getOrInitTier(name: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'): Tier {
    return tiers[name] ?? {
      name,
      label: name.charAt(0) + name.slice(1).toLowerCase(),
      description: '',
      priceOverride: null,
      isActive: true,
      selectionValueIds: [],
    };
  }

  function setTier(name: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED', patch: Partial<Tier>) {
    setTiers((prev) => ({ ...prev, [name]: { ...getOrInitTier(name), ...patch } }));
  }

  function setTierValue(name: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED', groupId: string, valueId: string) {
    const t = getOrInitTier(name);
    // Remove any existing selection from this group, add new
    const groupValueIds = new Set(groups.find((g) => g.id === groupId)?.values.map((v) => v.id) ?? []);
    const filtered = t.selectionValueIds.filter((id) => !groupValueIds.has(id));
    setTier(name, { selectionValueIds: [...filtered, valueId] });
  }

  async function saveTier(name: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED') {
    const tier = tiers[name];
    if (!tier) return;
    setLoading(name); setMsg(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/tiers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setTiers((prev) => ({ ...prev, [name]: { ...tier, id: data.tier.id } }));
      setMsg(`✔ ${tier.label} saved`);
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(null);
    }
  }

  async function deleteTier(name: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED') {
    const tier = tiers[name];
    if (!tier?.id) {
      setTiers((prev) => { const n = { ...prev }; delete n[name]; return n; });
      return;
    }
    if (!confirm(`Delete the ${tier.label} tier?`)) return;
    setLoading(name);
    try {
      const res = await fetch(`/api/admin/products/${productId}/tiers?name=${name}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Delete failed');
      setTiers((prev) => { const n = { ...prev }; delete n[name]; return n; });
      setMsg(`✔ Deleted ${tier.label}`);
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(null);
    }
  }

  const computedPrice = (t: Tier) => {
    if (t.priceOverride !== null && t.priceOverride !== undefined) return t.priceOverride;
    let sum = basePrice;
    for (const vid of t.selectionValueIds) {
      const v = groups.flatMap((g) => g.values).find((x) => x.id === vid);
      if (v) sum += v.priceDelta;
    }
    return sum;
  };

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-ink dark:text-white">Quick-Pick Tiers</h2>
          <p className="text-sm text-ink-muted dark:text-gray-400">
            Optional: define Basic / Intermediate / Advanced presets so customers can pick a bundle instead of configuring manually.
          </p>
        </div>
      </div>

      {msg && <div className="mb-4 text-sm text-ink-muted dark:text-gray-400">{msg}</div>}

      <div className="space-y-6">
        {TIER_NAMES.map((name) => {
          const tier = tiers[name];
          const exists = !!tier;
          const displayLabel = name.charAt(0) + name.slice(1).toLowerCase();

          if (!exists) {
            return (
              <div key={name} className="rounded-xl border border-dashed border-gray-300 p-5 text-center dark:border-gray-700">
                <p className="text-sm text-ink-muted dark:text-gray-400">{displayLabel} tier not configured</p>
                <button
                  onClick={() => setTier(name, {})}
                  className="mt-3 inline-flex items-center gap-1 rounded-full border border-brand px-4 py-1.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Add {displayLabel}
                </button>
              </div>
            );
          }

          return (
            <div key={name} className="rounded-xl border border-gray-200 p-5 dark:border-navy-700 dark:bg-navy-900/40">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand">{name}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-ink dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={tier.isActive}
                      onChange={(e) => setTier(name, { isActive: e.target.checked })}
                    />
                    Active
                  </label>
                  <button onClick={() => saveTier(name)} disabled={loading === name} className="btn-brand text-sm">
                    <Save className="h-3.5 w-3.5" /> {loading === name ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => deleteTier(name)} className="text-red-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-ink dark:text-gray-300">Display Label</label>
                  <input
                    value={tier.label}
                    onChange={(e) => setTier(name, { label: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand focus:bg-white dark:border-navy-700 dark:bg-navy-950/60 dark:text-gray-100 dark:focus:bg-navy-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink dark:text-gray-300">Price Override (optional, ₹)</label>
                  <input
                    type="number"
                    value={tier.priceOverride ?? ''}
                    onChange={(e) => setTier(name, { priceOverride: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder={`Auto: ${formatINR(computedPrice(tier))}`}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand focus:bg-white dark:border-navy-700 dark:bg-navy-950/60 dark:text-gray-100 dark:focus:bg-navy-900"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs font-medium text-ink dark:text-gray-300">Description (optional)</label>
                <input
                  value={tier.description}
                  onChange={(e) => setTier(name, { description: e.target.value })}
                  placeholder="e.g. Great for small workloads and dev environments"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand focus:bg-white dark:border-navy-700 dark:bg-navy-950/60 dark:text-gray-100 dark:focus:bg-navy-900"
                />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink dark:text-gray-200">Preset Components</p>
                <p className="mb-3 text-xs text-ink-muted dark:text-gray-400">
                  Pick one value per group. Customer will see these pre-selected when they choose this tier.
                </p>
                {groups.length === 0 ? (
                  <p className="text-sm text-ink-muted dark:text-gray-400">
                    Add option groups above first, then come back here to configure tiers.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {groups.map((g) => {
                      const selectedId = tier.selectionValueIds.find((id) => g.values.some((v) => v.id === id));
                      return (
                        <div key={g.id}>
                          <p className="mb-1 text-xs font-medium text-ink dark:text-gray-300">{g.label}</p>
                          <div className="flex flex-wrap gap-2">
                            {g.values.map((v) => {
                              const selected = selectedId === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => setTierValue(name, g.id, v.id)}
                                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
                                    selected
                                      ? 'border-brand bg-brand-50 text-brand dark:bg-brand/20 dark:text-brand-300 dark:border-brand'
                                      : 'border-gray-200 bg-white hover:border-brand-300 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-200 hover:dark:border-brand-400'
                                  }`}
                                >
                                  {selected && <Check className="h-3 w-3" />}
                                  {v.label}
                                  {v.priceDelta > 0 && <span className="text-ink-muted dark:text-gray-400">+{formatINR(v.priceDelta)}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 dark:bg-navy-950/60 dark:border dark:border-navy-800">
                <p className="text-xs text-ink-muted dark:text-gray-400">Customer sees</p>
                <p className="text-lg font-extrabold text-ink dark:text-white">{formatINR(computedPrice(tier))}</p>
                {tier.priceOverride !== null && <p className="text-xs text-brand">Price overridden</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
