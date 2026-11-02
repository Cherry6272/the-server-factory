import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function AdminOrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  const statusFilter = searchParams.status;
  const statuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

  const orders = await prisma.order.findMany({
    where: statusFilter && statuses.includes(statusFilter) ? { status: statusFilter as any } : {},
    include: { user: { select: { email: true, name: true } }, _count: { select: { items: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl text-ink dark:text-white">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-2 md:mt-6">
        <Link href="/admin/orders" className={`rounded-full px-3 py-1 text-xs md:text-sm ${!statusFilter ? 'bg-brand text-white' : 'border border-gray-200 bg-white dark:border-navy-700 dark:bg-navy-900 dark:text-gray-200'}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs md:text-sm ${statusFilter === s ? 'bg-brand text-white' : 'border border-gray-200 bg-white dark:border-navy-700 dark:bg-navy-900 dark:text-gray-200'}`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Mobile: cards */}
      <div className="mt-6 space-y-3 md:hidden">
        {orders.map((o) => (
          <Link key={o.id} href={`/admin/orders/${o.id}`} className="card block p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-brand">{o.orderNumber}</span>
              <StatusBadge status={o.status} />
            </div>
            <p className="mt-2 text-sm font-medium text-ink dark:text-gray-100">{o.user.name ?? o.user.email}</p>
            <p className="truncate text-xs text-ink-muted dark:text-gray-400">{o.user.email}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-ink-muted dark:text-gray-400">{o._count.items} item{o._count.items === 1 ? '' : 's'} · {new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
              <span className="font-semibold text-ink dark:text-white">{formatINR(o.total)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="card mt-6 hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-ink-muted dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold text-brand hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="px-6 py-3 text-ink-muted dark:text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-3">
                    <p className="font-medium text-ink dark:text-gray-100">{o.user.name ?? o.user.email}</p>
                    <p className="text-xs text-ink-muted dark:text-gray-400">{o.user.email}</p>
                  </td>
                  <td className="px-6 py-3 text-ink dark:text-gray-200">{o._count.items}</td>
                  <td className="px-6 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-6 py-3 text-right font-semibold text-ink dark:text-white">{formatINR(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && <p className="p-8 text-center text-sm text-ink-muted dark:text-gray-400">No orders.</p>}
      </div>
    </div>
  );
}
