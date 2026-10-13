import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Folder } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryFilters } from '@/components/catalog/CategoryFilters';
import { SortDropdown } from '@/components/catalog/SortDropdown';
import { CategoryBreadcrumb } from '@/components/layout/CategoryBreadcrumb';
import { getCategoryTree, findBySlug, getBreadcrumb, collectDescendantIds } from '@/lib/categories';

type Props = {
  params: { slug: string };
  searchParams: { brand?: string; min?: string; max?: string; sort?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await prisma.category.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!cat) return { title: 'Category not found' };
  return {
    title: `${cat.name} | Buy Online in India`,
    description: cat.description ?? `Shop ${cat.name} from top brands at ServerFactory.`,
    alternates: { canonical: `/category/${cat.slug}` },
  };
}

export async function generateStaticParams() {
  const cats = await prisma.category.findMany({ select: { slug: true } }).catch(() => []);
  return cats.map((c) => ({ slug: c.slug }));
}

export const revalidate = 120;

export default async function CategoryPage({ params, searchParams }: Props) {
  // Load the full tree once, then locate our node within it
  const tree = await getCategoryTree();
  const node = findBySlug(tree, params.slug);
  if (!node) notFound();

  const breadcrumb = getBreadcrumb(tree, params.slug);
  const descendantIds = collectDescendantIds(node);

  // Filters
  const brandFilter = searchParams.brand ? { brand: { in: searchParams.brand.split(',') } } : {};
  const minPrice = searchParams.min ? Number(searchParams.min) : undefined;
  const maxPrice = searchParams.max ? Number(searchParams.max) : undefined;
  const sortMap: Record<string, any> = {
    newest: { createdAt: 'desc' },
    'price-asc': { basePrice: 'asc' },
    'price-desc': { basePrice: 'desc' },
    name: { name: 'asc' },
  };
  const orderBy = sortMap[searchParams.sort ?? 'newest'] ?? sortMap.newest;

  const [products, allBrands] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId: { in: descendantIds },
        isActive: true,
        ...brandFilter,
        ...(minPrice !== undefined || maxPrice !== undefined
          ? { basePrice: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            }}
          : {}),
      },
      include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: true },
      orderBy,
    }).catch(() => []),
    prisma.product.findMany({
      where: { categoryId: { in: descendantIds }, isActive: true, brand: { not: null } },
      select: { brand: true },
      distinct: ['brand'],
    }).catch(() => []),
  ]);

  const hasSubcategories = node.children.length > 0;

  return (
    <div className="container-page py-6 md:py-10">
      {/* Breadcrumb */}
      <CategoryBreadcrumb
        crumbs={[
          { label: 'Home', href: '/', children: tree },
          ...breadcrumb.map((crumb, idx) => ({
            label: crumb.name,
            href: idx === breadcrumb.length - 1 ? null : `/category/${crumb.slug}`,
            children: crumb.children,
          })),
        ]}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:mb-8 md:flex-row md:items-center md:gap-6">
        <div>
          <h1 className="heading-page font-display font-extrabold">
            {node.name.includes(' ') ? (
              <>
                {node.name.split(' ')[0]}{' '}
                <span className="text-brand">{node.name.split(' ').slice(1).join(' ')}</span>
              </>
            ) : (
              <span className="text-ink dark:text-white">{node.name}</span>
            )}
          </h1>
          {node.description && <p className="mt-2 max-w-2xl text-sm text-ink-muted dark:text-gray-400 md:text-base">{node.description}</p>}
        </div>
      </div>

      {/* Sub-category tiles */}
      {hasSubcategories && breadcrumb.length > 1 && (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-ink-muted dark:text-gray-400">
            Browse by sub-category
          </h2>
          <div className="grid gap-3 xs:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {node.children.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${sub.slug}`}
                className="group card flex flex-col gap-1 p-5 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-brand"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand dark:bg-brand/20">
                    <Folder className="h-4 w-4" />
                  </div>
                  <h3 className="font-display font-bold group-hover:text-brand">{sub.name}</h3>
                </div>
                {sub.children.length > 0 && (
                  <p className="mt-1 text-xs text-ink-muted dark:text-gray-400">
                    {sub.children.map((c) => c.name).slice(0, 3).join(' · ')}
                    {sub.children.length > 3 && ` +${sub.children.length - 3}`}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products section */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] md:gap-8 xl:grid-cols-[280px_1fr]">
        <CategoryFilters
          brands={allBrands.map((b) => b.brand!).filter(Boolean)}
          currentSlug={node.slug}
          current={searchParams}
        />
        <div>
          <div className="mb-4 flex items-center justify-between md:mb-6">
            <div>
              <p className="text-xs text-ink-muted dark:text-gray-400 md:text-sm">
                {products.length} product{products.length === 1 ? '' : 's'}
                {hasSubcategories && descendantIds.length > 1 && (
                  <span className="ml-1">across {descendantIds.length - 1} sub-categories</span>
                )}
              </p>
            </div>
            <SortDropdown currentSlug={node.slug} currentSort={searchParams.sort ?? 'newest'} />
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-700">
              <p className="text-ink-muted dark:text-gray-400">
                {hasSubcategories ? 'No products yet — pick a sub-category above to drill in.' : 'No products match your filters.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xs:grid-cols-2 lg:grid-cols-2 md:gap-6 xl:grid-cols-3 3xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
