import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/product/ProductCard';
import { Search } from 'lucide-react';

export const metadata = { title: 'Search Results' };

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? '').trim();

  const products = q
    ? await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { shortDesc: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: true },
        take: 48,
      }).catch(() => [])
    : [];

  return (
    <div className="container-page py-8 md:py-10">
      <h1 className="heading-page font-display font-extrabold">Search</h1>
      <form action="/search" className="mt-5 flex items-center gap-2 rounded-full border border-gray-200/90 bg-white p-1.5 shadow-soft transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 dark:border-navy-700/80 dark:bg-navy-900 sm:mt-6 sm:p-2">
        <Search className="ml-3 hidden h-5 w-5 flex-shrink-0 text-brand xs:block sm:ml-4" />
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Search for servers, workstations, CPUs..."
          className="w-full min-w-0 flex-1 !bg-transparent bg-transparent border-0 !border-0 border-none !border-none px-3 py-2 text-base shadow-none outline-none ring-0 focus:outline-none focus:ring-0 placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 sm:px-2"
        />
        <button className="flex-shrink-0 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-95 sm:px-6 sm:text-base">
          Search
        </button>
      </form>

      {q ? (
        <p className="mt-6 text-sm text-ink-muted">
          {products.length} result{products.length === 1 ? '' : 's'} for &ldquo;<span className="font-semibold text-ink dark:text-gray-100">{q}</span>&rdquo;
        </p>
      ) : (
        <p className="mt-6 text-sm text-ink-muted">Enter a search term to find products.</p>
      )}

      <div className="mt-6 grid gap-4 xs:grid-cols-2 sm:gap-5 lg:grid-cols-3 md:mt-8 md:gap-6 xl:grid-cols-4 3xl:grid-cols-5">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
