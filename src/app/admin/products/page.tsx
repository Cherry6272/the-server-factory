import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Plus } from 'lucide-react';
import { AdminProductTable, type AdminProductItem } from '@/components/admin/AdminProductTable';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        images: { take: 1, orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { optionGroups: true, tiers: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">
            {products.length} products across {categories.length} categories
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-brand w-full sm:w-auto">
          <Plus className="h-4 w-4" /> New Product
        </Link>
      </div>

      <AdminProductTable
        initialProducts={products as unknown as AdminProductItem[]}
        categories={categories}
      />
    </div>
  );
}
