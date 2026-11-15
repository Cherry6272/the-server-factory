'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export function OrderStatusControl({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      setMsg('✔ Updated');
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-950/60 dark:text-gray-100"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={save} disabled={loading || status === currentStatus} className="btn-brand w-full text-sm disabled:opacity-50">
        {loading ? 'Saving...' : 'Update Status'}
      </button>
      {msg && <p className="text-xs text-ink-muted dark:text-gray-400">{msg}</p>}
    </div>
  );
}
