import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Folder, Server, Cpu, HardDrive, ShieldCheck,
  PhoneCall, ArrowRight, Clock, CheckCircle2, X,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryFilters } from '@/components/catalog/CategoryFilters';
import { SortDropdown } from '@/components/catalog/SortDropdown';
import { CategoryBreadcrumb } from '@/components/layout/CategoryBreadcrumb';
import { CategorySearchBar } from '@/components/catalog/CategorySearchBar';
import { getCategoryTree, findBySlug, getBreadcrumb, collectDescendantIds } from '@/lib/categories';

type Props = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await prisma.category.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!cat) return { title: 'Category not found' };
  return {
    title: `${cat.name} | Buy & Rent Online in India`,
    description: cat.description ?? `Shop and rent ${cat.name} from top brands at Server Factory.`,
    alternates: { canonical: `/category/${cat.slug}` },
  };
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default async function CategoryPage({ params, searchParams }: Props) {
  // Ensure searchParams is an object
  const safeParams = searchParams ?? {};

  // Load the full tree once, then locate our node within it
  const tree = await getCategoryTree().catch(() => []);
  const node = findBySlug(tree, params.slug);
  if (!node) notFound();

  const breadcrumb = getBreadcrumb(tree, params.slug);
  const descendantIds = collectDescendantIds(node);

  // 1. Parse In-Category Search query
  const rawQ = Array.isArray(safeParams.q) ? safeParams.q[0] : safeParams.q;
  const searchQuery = typeof rawQ === 'string' ? rawQ.trim() : undefined;

  // 2. Parse Brand filter safely
  const rawBrand = safeParams.brand;
  const brandList = Array.isArray(rawBrand)
    ? rawBrand.flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean)
    : typeof rawBrand === 'string'
      ? rawBrand.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  // 3. Parse Price filter safely (prevent NaN from corrupting Prisma Decimal queries)
  const rawMin = Array.isArray(safeParams.min) ? safeParams.min[0] : safeParams.min;
  const rawMax = Array.isArray(safeParams.max) ? safeParams.max[0] : safeParams.max;
  const numMin = rawMin !== undefined && String(rawMin).trim() !== '' ? Number(rawMin) : undefined;
  const numMax = rawMax !== undefined && String(rawMax).trim() !== '' ? Number(rawMax) : undefined;
  const minPrice = typeof numMin === 'number' && !Number.isNaN(numMin) && numMin >= 0 ? numMin : undefined;
  const maxPrice = typeof numMax === 'number' && !Number.isNaN(numMax) && numMax >= 0 ? numMax : undefined;

  // 4. Parse Dynamic Config filters (any searchParam key starting with "cfg_")
  const configFilters: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(safeParams)) {
    if (key.startsWith('cfg_') && val) {
      try {
        const groupName = decodeURIComponent(key.slice(4)).trim();
        if (!groupName) continue;
        const str = Array.isArray(val) ? val.join(',') : String(val);
        const vals = str.split(',').map((s) => s.trim()).filter(Boolean);
        if (vals.length > 0) {
          configFilters[groupName] = vals;
        }
      } catch {
        // Ignore malformed query string keys
      }
    }
  }

  // 5. Construct Prisma WHERE clauses for dynamic config options
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
  const sortParam = Array.isArray(safeParams.sort) ? safeParams.sort[0] : safeParams.sort;
  const orderBy = sortMap[sortParam ?? 'newest'] ?? sortMap.newest;

  // 6. Assemble robust unified AND conditions to prevent Prisma OR/AND conflict errors
  const andConditions: any[] = [
    { categoryId: { in: descendantIds } },
    { isActive: true },
  ];

  if (brandList.length > 0) {
    andConditions.push({ brand: { in: brandList } });
  }

  if (searchQuery) {
    andConditions.push({
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' as const } },
        { sku: { contains: searchQuery, mode: 'insensitive' as const } },
        { brand: { contains: searchQuery, mode: 'insensitive' as const } },
        { shortDesc: { contains: searchQuery, mode: 'insensitive' as const } },
        { description: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    });
  }

  if (minPrice !== undefined) {
    andConditions.push({ basePrice: { gte: minPrice } });
  }

  if (maxPrice !== undefined) {
    andConditions.push({ basePrice: { lte: maxPrice } });
  }

  if (configWhereClauses.length > 0) {
    andConditions.push(...configWhereClauses);
  }

  const whereClause = { AND: andConditions };

  // 7. Parallel fetch: filtered products + all products in this category for facet counting
  const [products, allCategoryProducts] = await Promise.all([
    prisma.product
      .findMany({
        where: whereClause,
        include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: true },
        orderBy,
      })
      .catch((err) => {
        console.error('[CategoryPage] Filter query failed:', err);
        return [];
      }),
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
      .catch((err) => {
        console.error('[CategoryPage] Facet query failed:', err);
        return [];
      }),
  ]);

  // 8. Compute available brand facets with counts & category price range
  const brandCountMap = new Map<string, number>();
  let minCategoryPrice = Infinity;
  let maxCategoryPrice = 0;

  for (const p of (allCategoryProducts ?? [])) {
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

  // 9. Compute dynamic config facets with counts and preserve admin sort order
  const groupOrderMap = new Map<string, number>();
  const facetMap = new Map<string, Map<string, number>>();

  for (const p of (allCategoryProducts ?? [])) {
    for (const g of (p.optionGroups ?? [])) {
      const gName = (g.label || g.name || '').trim();
      if (!gName) continue;

      if (!groupOrderMap.has(gName)) {
        groupOrderMap.set(gName, g.sortOrder ?? 0);
      }

      if (!facetMap.has(gName)) {
        facetMap.set(gName, new Map());
      }
      const valMap = facetMap.get(gName)!;
      for (const v of (g.values ?? [])) {
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
      {/* Top Utility Bar: Route Map Link (Breadcrumb) + In-Category Search Bar */}
      <div className="mb-6 flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between md:mb-8">
        <div className="flex-shrink-0">
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
        </div>
        <div className="w-full lg:w-auto lg:flex-1 lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl lg:ml-6">
          <CategorySearchBar categoryName={node.name} currentSlug={node.slug} />
        </div>
      </div>

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
          {/* Active Search Filter Banner */}
          {searchQuery && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/20 bg-brand-50/60 px-4 py-2.5 text-xs sm:text-sm text-ink dark:border-brand/30 dark:bg-brand/10 dark:text-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-ink-muted dark:text-gray-400">Search results for:</span>
                <span className="font-bold text-brand dark:text-brand-300">&ldquo;{searchQuery}&rdquo;</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink-muted shadow-2xs dark:bg-navy-900 dark:text-gray-400">
                  {products.length} found
                </span>
              </div>
              <Link
                href={`/category/${node.slug}`}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 hover:text-red-600 dark:bg-navy-900 dark:text-gray-300 dark:hover:text-red-400"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" /> Clear search
              </Link>
            </div>
          )}

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
            node.slug === 'rentals' ? (
              <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-soft dark:border-gray-800 dark:bg-navy-900/80 md:p-10">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-techgreen-500/40 bg-techgreen-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-techgreen-700 dark:border-techgreen-500/30 dark:bg-techgreen-950/60 dark:text-techgreen-300">
                    <span className="h-2 w-2 rounded-full bg-techgreen-500 animate-pulse" />
                    Enterprise Server Leasing & GPU Clusters
                  </span>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand dark:bg-brand/20">
                    Bangalore Local Dispatch & Pan-India
                  </span>
                </div>

                <h2 className="font-display text-2xl font-extrabold text-navy-900 dark:text-white sm:text-3xl">
                  Enterprise Infrastructure on Your Terms
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted dark:text-gray-300 sm:text-base">
                  Bytechip Technologies (Server Factory) offers turnkey server rentals for enterprise compute, AI/ML model training,
                  virtualization, rendering, testing, and temporary datacenter staging. Choose from flexible daily, weekly, monthly,
                  or annual lease agreements with zero long-term capital lockup.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-navy-950/60">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                      <Server className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-bold text-ink dark:text-white">Rack & Blade Servers</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-gray-400">
                      Dell PowerEdge & HPE ProLiant (1U, 2U, 4U). Dual Intel Xeon / AMD EPYC, up to 1TB+ ECC RAM, and redundant hot-plug power supplies.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-navy-950/60">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-navy-900 text-white shadow-sm">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-bold text-ink dark:text-white">AI & GPU Workstations</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-gray-400">
                      High-performance multi-GPU rental nodes featuring NVIDIA RTX 4090, A6000, and A100 for deep learning, CAD, and 3D simulation.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-navy-950/60">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-techgreen-600 text-white shadow-sm">
                      <HardDrive className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-bold text-ink dark:text-white">Storage & Networking</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-gray-400">
                      Enterprise SAS/SATA/NVMe storage arrays and 10GbE / 25GbE optical networking cards for high-throughput clustered workloads.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-techgreen-500/20 bg-techgreen-50/40 p-5 dark:bg-techgreen-950/20">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-ink dark:text-gray-200">
                      <CheckCircle2 className="h-4 w-4 text-techgreen-600 dark:text-techgreen-400 flex-shrink-0" />
                      <span>Custom configurations tested before dispatch</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-ink dark:text-gray-200">
                      <Clock className="h-4 w-4 text-techgreen-600 dark:text-techgreen-400 flex-shrink-0" />
                      <span>Daily, Monthly, & Annual contract terms</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-ink dark:text-gray-200">
                      <ShieldCheck className="h-4 w-4 text-techgreen-600 dark:text-techgreen-400 flex-shrink-0" />
                      <span>24/7 SLA hardware support & instant replacement</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/contact?inquiry=rentals"
                    className="btn-brand inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold shadow-brand"
                  >
                    Request Rental Quote / Pre-book <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="tel:9916048404"
                    className="btn-outline inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold"
                  >
                    <PhoneCall className="h-4 w-4 text-brand" /> Call Direct: 9916048404
                  </a>
                </div>
              </div>
            ) : searchQuery ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700 bg-gray-50/50 dark:bg-navy-900/40">
                <p className="font-semibold text-ink dark:text-gray-200">
                  No hardware found matching &ldquo;{searchQuery}&rdquo; in {node.name}
                </p>
                <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">
                  Try checking the spelling, using different keywords, or clear your search query.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Link
                    href={`/category/${node.slug}`}
                    className="btn-brand text-xs font-semibold"
                  >
                    Clear Search
                  </Link>
                </div>
              </div>
            ) : (
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
            )
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
