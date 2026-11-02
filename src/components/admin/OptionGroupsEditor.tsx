'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save } from 'lucide-react';

type Value = { id?: string; label: string; priceDelta: number; isDefault: boolean };
type Group = { id?: string; name: string; label: string; required: boolean; sortOrder: number; values: Value[] };

export function OptionGroupsEditor({ productId, groups: initial }: { productId: string; groups: Group[] }) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function addGroup() {
    setGroups([...groups, { name: '', label: '', required: true, sortOrder: groups.length, values: [] }]);
  }
  function updateGroup(idx: number, patch: Partial<Group>) {
    setGroups(groups.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }
  function removeGroup(idx: number) {
    setGroups(groups.filter((_, i) => i !== idx));
  }
  function addValue(gIdx: number) {
    const updated = [...groups];
    updated[gIdx].values.push({ label: '', priceDelta: 0, isDefault: updated[gIdx].values.length === 0 });
    setGroups(updated);
  }
  function updateValue(gIdx: number, vIdx: number, patch: Partial<Value>) {
    const updated = [...groups];
    updated[gIdx].values[vIdx] = { ...updated[gIdx].values[vIdx], ...patch };
    setGroups(updated);
  }
  function removeValue(gIdx: number, vIdx: number) {
    const updated = [...groups];
    updated[gIdx].values = updated[gIdx].values.filter((_, i) => i !== vIdx);
    setGroups(updated);
  }

  async function save() {
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      setMsg('✔ Configurator options saved');
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-ink dark:text-white">Configurator Options</h2>
          <p className="text-sm text-ink-muted dark:text-gray-400">CPU, RAM, Storage, OS, add-ons the customer picks from.</p>
        </div>
        <button onClick={addGroup} className="btn-outline text-sm">
          <Plus className="h-4 w-4" /> Add Group
        </button>
      </div>

      <div className="space-y-6">
        {groups.map((g, gIdx) => (
          <div key={gIdx} className="rounded-xl border border-gray-200 dark:border-navy-700/80 dark:bg-navy-950/50 p-4">
            <div className="mb-3 flex flex-wrap gap-3">
              <input
                placeholder="Internal name (cpu, ram)"
                value={g.name}
                onChange={(e) => updateGroup(gIdx, { name: e.target.value })}
                className="flex-1 min-w-[140px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-white"
              />
              <input
                placeholder="Display label (CPU)"
                value={g.label}
                onChange={(e) => updateGroup(gIdx, { label: e.target.value })}
                className="flex-1 min-w-[140px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-white"
              />
              <label className="flex items-center gap-2 text-sm text-ink dark:text-gray-200">
                <input type="checkbox" checked={g.required} onChange={(e) => updateGroup(gIdx, { required: e.target.checked })} className="rounded text-brand" /> Required
              </label>
              <button onClick={() => removeGroup(gIdx)} className="text-red-500 hover:text-red-600" title="Delete group">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 pl-2 sm:pl-4">
              {g.values.map((v, vIdx) => (
                <div key={vIdx} className="flex flex-wrap items-center gap-2">
                  <input
                    placeholder="Label"
                    value={v.label}
                    onChange={(e) => updateValue(gIdx, vIdx, { label: e.target.value })}
                    className="flex-1 min-w-[120px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="+Price"
                    value={v.priceDelta}
                    onChange={(e) => updateValue(gIdx, vIdx, { priceDelta: Number(e.target.value) })}
                    className="w-28 sm:w-32 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                  />
                  <label className="flex items-center gap-1 text-xs text-ink dark:text-gray-200">
                    <input
                      type="radio"
                      name={`default-${gIdx}`}
                      checked={v.isDefault}
                      onChange={() => {
                        const updated = [...groups];
                        updated[gIdx].values = updated[gIdx].values.map((val, i) => ({ ...val, isDefault: i === vIdx }));
                        setGroups(updated);
                      }}
                      className="text-brand"
                    /> Default
                  </label>
                  <button onClick={() => removeValue(gIdx, vIdx)} className="text-red-500 hover:text-red-600" title="Delete value">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => addValue(gIdx)} className="text-sm font-semibold text-brand hover:underline pt-1">
                + Add value
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={loading} className="btn-brand">
          <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Save Options'}
        </button>
        {msg && <span className="text-sm text-ink-muted dark:text-gray-300 font-medium">{msg}</span>}
      </div>
    </div>
  );
}
