import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderStatusControl } from '@/components/admin/OrderStatusControl';

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { options: true } }, user: true },
  });
  if (!order) notFound();

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div className="min-w-0">
          <p className="text-xs text-ink-muted dark:text-gray-400 md:text-sm">Order</p>
          <h1 className="break-all font-mono text-xl font-extrabold text-ink dark:text-white md:text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-xs text-ink-muted dark:text-gray-400 md:text-sm">
            {new Date(order.createdAt).toLocaleString('en-IN')} · {order.user.email}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-4 md:mt-8 md:gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden">
          <h2 className="border-b border-gray-100 px-6 py-4 font-display font-bold text-ink dark:border-navy-800 dark:text-white">Items</h2>
          <ul className="divide-y divide-gray-100 dark:divide-navy-800">
            {order.items.map((i) => (
              <li key={i.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink dark:text-gray-100">{i.productName}</p>
                    <p className="text-xs font-mono text-ink-muted dark:text-gray-400">{i.productSku}</p>
                    {i.options.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-ink-muted dark:text-gray-400">
                        {i.options.map((o) => (
                          <li key={o.id}>
                            <span className="font-semibold uppercase text-ink dark:text-gray-300">{o.groupName}:</span> {o.valueLabel}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink dark:text-white">{formatINR(i.lineTotal)}</p>
                    <p className="text-xs text-ink-muted dark:text-gray-400">Qty {i.quantity} × {formatINR(i.unitPrice)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <h3 className="font-display font-bold text-ink dark:text-white">Update Status</h3>
            <OrderStatusControl orderId={order.id} currentStatus={order.status} />
          </div>

          <div className="card p-6">
            <h3 className="font-display font-bold text-ink dark:text-white">Summary</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted dark:text-gray-400">Subtotal</dt><dd className="font-medium text-ink dark:text-gray-200">{formatINR(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted dark:text-gray-400">Tax</dt><dd className="font-medium text-ink dark:text-gray-200">{formatINR(order.tax)}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-ink dark:border-navy-800 dark:text-white"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
            </dl>
          </div>

          <div className="card p-6">
            <h3 className="font-display font-bold text-ink dark:text-white">Billing</h3>
            <p className="mt-3 text-sm font-semibold text-ink dark:text-gray-100">{order.billingName}</p>
            <p className="text-sm text-ink-muted dark:text-gray-400">{order.billingEmail}</p>
            {order.billingPhone && <p className="text-sm text-ink-muted dark:text-gray-400">{order.billingPhone}</p>}
            <p className="mt-3 whitespace-pre-line text-sm text-ink-muted dark:text-gray-400 leading-relaxed">{order.billingAddress}</p>
            {order.notes && (
              <>
                <h4 className="mt-4 text-sm font-semibold text-ink dark:text-white">Notes</h4>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-muted dark:text-gray-400">{order.notes}</p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
