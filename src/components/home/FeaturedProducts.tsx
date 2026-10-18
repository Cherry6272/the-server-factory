import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/product/ProductCard';
import { ArrowRight } from 'lucide-react';

export async function FeaturedProducts({ heading, limit = 8 }: { heading?: string; limit?: number }) {
  const products = await prisma.product
    .findMany({
      where: { isActive: true, isFeatured: true },
      take: limit,
      include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: true },
      orderBy: { createdAt: 'desc' },
    })
    .catch(() => []);

  if (!products.length) return null;

  return (
    <section className="container-page section-y">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:mb-8 md:mb-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-techgreen-600 dark:text-techgreen-400">
            Enterprise Ready
          </span>
          <h2 className="heading-section font-display font-bold mt-1 text-ink dark:text-white">
            {heading ?? 'Featured '}<span className="text-brand">Hardware</span>
          </h2>
        </div>
        <Link href="/category/servers" className="text-xs sm:text-sm font-semibold text-brand hover:underline inline-flex items-center gap-1">
          Explore full catalogue <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-4 xs:grid-cols-2 sm:gap-5 lg:grid-cols-3 md:gap-6 xl:grid-cols-4 3xl:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
