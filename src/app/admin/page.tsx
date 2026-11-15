import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { TrendingUp, ShoppingBag, Users, Package } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function AdminDashboard() {
  const [productCount, orderCount, userCount, revenue, recentOrders, topProducts] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } }),
    prisma.order.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { user: { select: { email: true, name: true } } } }),
    prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl text-ink dark:text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">Overview of your store performance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:mt-8 md:grid-cols-4">
        <StatCard icon={TrendingUp} label="Revenue" value={formatINR(Number(revenue._sum.total ?? 0))} accent />
        <StatCard icon={ShoppingBag} label="Orders" value={orderCount.toString()} />
        <StatCard icon={Package} label="Products" value={productCount.toString()} />
        <StatCard icon={Users} label="Customers" value={userCount.toString()} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr] md:mt-10 md:gap-8">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800 md:px-6 md:py-4">
            <h2 className="font-display font-bold text-ink dark:text-white">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-brand hover:underline">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-muted dark:text-gray-400">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-ink-muted dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 md:px-6">Order</th>
                    <th className="px-4 py-3 md:px-6">Customer</th>
                    <th className="px-4 py-3 md:px-6">Status</th>
                    <th className="px-4 py-3 text-right md:px-6">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 md:px-6">
                        <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold text-brand hover:underline">{o.orderNumber}</Link>
                      </td>
                      <td className="px-4 py-3 text-ink-muted dark:text-gray-400 md:px-6">
                        <span className="block max-w-[160px] truncate">{o.user.email}</span>
                      </td>
                      <td className="px-4 py-3 md:px-6"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-right font-semibold md:px-6 text-ink dark:text-white">{formatINR(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <h2 className="border-b border-gray-100 px-4 py-3 font-display font-bold dark:border-gray-800 md:px-6 md:py-4 text-ink dark:text-white">Top Products</h2>
          {topProducts.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-muted dark:text-gray-400">No sales data yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {topProducts.map((p, idx) => (
                <li key={p.productId} className="flex items-center justify-between px-4 py-3 text-sm md:px-6 md:py-4">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand dark:bg-brand/10">{idx + 1}</span>
                    <span className="truncate font-medium text-ink dark:text-gray-100">{p.productName}</span>
                  </span>
                  <span className="flex-shrink-0 text-ink-muted dark:text-gray-400">{p._sum.quantity} sold</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent = false }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`card p-4 md:p-5 ${accent ? 'border-0 bg-gradient-to-br from-brand-500 to-brand-400 text-white dark:bg-gradient-to-br' : ''}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs md:text-sm ${accent ? 'text-white/90' : 'text-ink-muted dark:text-gray-400'}`}>{label}</p>
        <Icon className={`h-4 w-4 md:h-5 md:w-5 ${accent ? 'text-white/80' : 'text-brand'}`} />
      </div>
      <p className={`mt-2 text-xl font-extrabold md:mt-3 md:text-2xl ${accent ? 'text-white' : 'text-ink dark:text-white'}`}>{value}</p>
    </div>
  );
}
