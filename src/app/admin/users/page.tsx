import { prisma } from '@/lib/prisma';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl text-ink dark:text-white">Users</h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">{users.length} registered</p>

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="font-medium text-ink dark:text-gray-100">{u.name ?? '—'}</p>
                <p className="truncate text-xs text-ink-muted dark:text-gray-400">{u.email}</p>
              </div>
              <span className={`ml-2 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-brand-50 text-brand-700 dark:bg-brand/10' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                {u.role}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-muted dark:text-gray-400">
              <span>{u._count.orders} order{u._count.orders === 1 ? '' : 's'}</span>
              <span>{new Date(u.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="card mt-6 hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-ink-muted dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Orders</th>
                <th className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-3 font-medium text-ink dark:text-gray-100">{u.name ?? '—'}</td>
                  <td className="px-6 py-3 text-ink-muted dark:text-gray-400">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-brand-50 text-brand-700 dark:bg-brand/10' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-ink dark:text-gray-200">{u._count.orders}</td>
                  <td className="px-6 py-3 text-ink-muted dark:text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
