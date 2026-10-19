import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { Package, ShoppingBag, User as UserIcon, LogOut } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const metadata = { title: 'My Account', robots: { index: false } };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/account');

  const [user, orders] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="heading-page font-display font-extrabold">
            Hello, <span className="text-brand">{user?.name ?? 'there'}</span>
          </h1>
          <p className="mt-2 text-sm text-ink-muted dark:text-gray-400 md:text-base">{user?.email}</p>
        </div>
        <form action={async () => {
          'use server';
          const { cookies } = await import('next/headers');
          const cookieStore = cookies();
          const names = [
            'authjs.session-token',
            '__Secure-authjs.session-token',
            'authjs.csrf-token',
            '__Host-authjs.csrf-token',
            'authjs.callback-url',
            'next-auth.session-token',
            '__Secure-next-auth.session-token',
            'next-auth.csrf-token',
            'next-auth.callback-url',
          ];
          for (const n of names) {
            try { cookieStore.delete(n); } catch {}
          }
          await signOut({ redirectTo: '/' });
        }}>
          <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-red-800 dark:hover:bg-red-950/30">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3 md:mt-10 md:gap-6">
        <StatCard icon={ShoppingBag} label="Total Orders" value={orders.length.toString()} />
        <StatCard icon={Package} label="Pending" value={orders.filter((o) => o.status === 'PENDING').length.toString()} />
        <StatCard icon={UserIcon} label="Role" value={session.user.role} />
      </div>

      <section className="mt-10 md:mt-12">
        <div className="mb-4 flex items-center justify-between md:mb-6">
          <h2 className="font-display text-xl font-bold md:text-2xl">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-brand hover:underline">View all →</Link>
        </div>
        {orders.length === 0 ? (
          <div className="card p-10 text-center md:p-16">
            <p className="text-sm text-ink-muted dark:text-gray-400">You haven&apos;t placed any orders yet.</p>
            <Link href="/" className="btn-brand mt-6">Shop Hardware</Link>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {orders.map((o) => (
                <Link key={o.id} href={`/account/orders/${o.id}`} className="card block p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-muted dark:text-gray-400">
                    <span>{new Date(o.createdAt).toLocaleDateString('en-IN')} · {o._count.items} item{o._count.items === 1 ? '' : 's'}</span>
                    <span className="text-base font-semibold text-ink dark:text-gray-100">{formatINR(o.total)}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop table */}
            <div className="card hidden overflow-hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-ink-muted dark:bg-gray-800/50 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3">Order #</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Items</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <Link href={`/account/orders/${o.id}`} className="font-mono font-semibold text-brand hover:underline">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-ink-muted dark:text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-6 py-4">{o._count.items}</td>
                        <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                        <td className="px-6 py-4 text-right font-semibold">{formatINR(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand/10">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-ink-muted dark:text-gray-400 md:text-sm">{label}</p>
          <p className="truncate text-xl font-extrabold md:text-2xl">{value}</p>
        </div>
      </div>
    </div>
  );
}
