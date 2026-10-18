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
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await prisma.category.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!cat) return { title: 'Category not found' };
  return {
    title: `${cat.name} | Buy Online in India`,
    description: cat.description ?? `Shop ${cat.name} from top brands at Server Factory.`,
    alternates: { canonical: `/category/${cat.slug}` },
  };
}

export async function generateStaticParams() {
  const cats = await prisma.category.findMany({ select: { slug: true } }).catch(() => []);
  return cats.map((c) => ({ slug: c.slug }));
}

export const revalidate = 60;

export default async function CategoryPage({ params, searchParams }: Props) {
  // Load the full tree once, then locate our node within it
  const tree = await getCategoryTree();
  const node = findBySlug(tree, params.slug);
  if (!node) notFound();

  const breadcrumb = getBreadcrumb(tree, params.slug);
  const descendantIds = collectDescendantIds(node);

  // 1. Parse Brand filter
  const rawBrand = searchParams.brand;
  const brandList = Array.isArray(rawBrand)
    ? rawBrand.join(',').split(',').map((s) => s.trim()).filter(Boolean)
    : (rawBrand ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const brandFilter = brandList.length > 0 ? { brand: { in: brandList } } : {};

  // 2. Parse Price filter
  const minPrice = searchParams.min ? Number(searchParams.min) : undefined;
  const maxPrice = searchParams.max ? Number(searchParams.max) : undefined;

  // 3. Parse Dynamic Config filters (any searchParam key starting with "cfg_")
  const configFilters: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(searchParams)) {
    if (key.startsWith('cfg_') && val) {
      const groupName = key.slice(4);
      const str = Array.isArray(val) ? val.join(',') : val;
      const vals = str.split(',').map((s) => s.trim()).filter(Boolean);
      if (vals.length > 0) {
        configFilters[groupName] = vals;
      }
    }
  }

  // 4. Construct Prisma WHERE clauses for dynamic config options
  const configWhereClauses = Object.entries(configFilters).map(([groupName, values]) => ({
    optionGroups: {
      some: {
        OR: [
          { name: { equals: groupName, mode: 'insensitive' as const } },
          { label: { equals: groupName, mode: 'insensitive' as const } },
        ],
        values: {
          some: {
            label: { in: values },
          },
        },
      },
    },
  }));

  const sortMap: Record<string, any> = {
    newest: { createdAt: 'desc' },
    'price-asc': { basePrice: 'asc' },
    'price-desc': { basePrice: 'desc' },
    name: { name: 'asc' },
  };
  const sortParam = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;
  const orderBy = sortMap[sortParam ?? 'newest'] ?? sortMap.newest;

  const whereClause: any = {
    categoryId: { in: descendantIds },
    isActive: true,
    ...brandFilter,
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          basePrice: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(configWhereClauses.length > 0 ? { AND: configWhereClauses } : {}),
  };

  // 5. Parallel fetch: filtered products + all products in this category for facet counting
  const [products, allCategoryProducts] = await Promise.all([
    prisma.product
      .findMany({
        where: whereClause,
        include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: true },
        orderBy,
      })
      .catch(() => []),
    prisma.product
      .findMany({
        where: { categoryId: { in: descendantIds }, isActive: true },
        select: {
          id: true,
          brand: true,
          basePrice: true,
          optionGroups: {
            select: {
              name: true,
              label: true,
              sortOrder: true,
              values: {
                select: {
                  label: true,
                  sortOrder: true,
                },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
      .catch(() => []),
  ]);

  // 6. Compute available brand facets with counts & category price range
  const brandCountMap = new Map<string, number>();
  let minCategoryPrice = Infinity;
  let maxCategoryPrice = 0;

  for (const p of allCategoryProducts) {
    if (p.brand) {
      brandCountMap.set(p.brand, (brandCountMap.get(p.brand) || 0) + 1);
    }
    const price = Number(p.basePrice) || 0;
    if (price > 0) {
      if (price < minCategoryPrice) minCategoryPrice = price;
      if (price > maxCategoryPrice) maxCategoryPrice = price;
    }
  }

  const brands = Array.from(brandCountMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  // 7. Compute dynamic config facets with counts and preserve admin sort order
  const groupOrderMap = new Map<string, number>();
  const facetMap = new Map<string, Map<string, number>>();

  for (const p of allCategoryProducts) {
    for (const g of p.optionGroups) {
      const gName = (g.label || g.name).trim();
      if (!gName) continue;

      if (!groupOrderMap.has(gName)) {
        groupOrderMap.set(gName, g.sortOrder);
      }

      if (!facetMap.has(gName)) {
        facetMap.set(gName, new Map());
      }
      const valMap = facetMap.get(gName)!;
      for (const v of g.values) {
        const vLabel = v.label?.trim();
        if (vLabel) {
          valMap.set(vLabel, (valMap.get(vLabel) || 0) + 1);
        }
      }
    }
  }

  const configFacets = Array.from(facetMap.entries())
    .sort((a, b) => (groupOrderMap.get(a[0]) ?? 0) - (groupOrderMap.get(b[0]) ?? 0))
    .map(([name, valMap]) => ({
      name,
      options: Array.from(valMap.entries()).map(([label, count]) => ({
        label,
        count,
      })),
    }))
    .filter((f) => f.options.length > 0);

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
          <h1 className="heading-page font-display font-extrabold text-navy-900 dark:text-white">
            {node.name.includes(' ') ? (
              <>
                {node.name.split(' ')[0]}{' '}
                <span className="text-brand">{node.name.split(' ').slice(1).join(' ')}</span>
              </>
            ) : (
              <span className="text-ink dark:text-white">{node.name}</span>
            )}
          </h1>
          {node.description && (
            <p className="mt-2 max-w-2xl text-sm text-ink-muted dark:text-gray-400 md:text-base">
              {node.description}
            </p>
          )}
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
      <div className="grid gap-6 lg:grid-cols-[280px_1fr] md:gap-8 xl:grid-cols-[300px_1fr]">
        <CategoryFilters
          brands={brands}
          configFacets={configFacets}
          currentSlug={node.slug}
          current={searchParams}
          priceBounds={
            maxCategoryPrice > 0
              ? {
                  min: minCategoryPrice === Infinity ? 0 : minCategoryPrice,
                  max: maxCategoryPrice,
                }
              : undefined
          }
        />

        <div>
          <div className="mb-4 flex items-center justify-between md:mb-6">
            <div>
              <p className="text-xs text-ink-muted dark:text-gray-400 md:text-sm">
                <strong className="text-navy-900 dark:text-white font-bold">{products.length}</strong>{' '}
                product{products.length === 1 ? '' : 's'}
                {hasSubcategories && descendantIds.length > 1 && (
                  <span className="ml-1">across {descendantIds.length - 1} sub-categories</span>
                )}
              </p>
            </div>
            <SortDropdown currentSlug={node.slug} currentSort={String(sortParam ?? 'newest')} />
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-700 bg-gray-50/50 dark:bg-navy-900/40">
              <p className="font-semibold text-ink dark:text-gray-200">No products match your filters</p>
              <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">
                Try selecting different config options or clearing some filters.
              </p>
              <div className="mt-4">
                <Link
                  href={`/category/${node.slug}`}
                  className="btn-outline text-xs font-semibold"
                >
                  Clear All Filters
                </Link>
              </div>
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
