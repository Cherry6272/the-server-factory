import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { getCategoryTree, getBreadcrumb } from '@/lib/categories';
import { getConfiguratorSettings } from '@/lib/site-settings';
import { Configurator } from '@/components/product/Configurator';
import { ProductGallery } from '@/components/product/ProductGallery';
import { CategoryBreadcrumb } from '@/components/layout/CategoryBreadcrumb';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await prisma.product.findUnique({ where: { slug: params.slug } }).catch(() => null);
  if (!p) return { title: 'Product not found' };
  return {
    title: p.metaTitle ?? p.name,
    description: p.metaDescription ?? p.shortDesc ?? undefined,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      title: p.name,
      description: p.shortDesc ?? undefined,
    },
  };
}

export async function generateStaticParams() {
  const ps = await prisma.product.findMany({ where: { isActive: true }, select: { slug: true } }).catch(() => []);
  return ps.map((p) => ({ slug: p.slug }));
}

export const revalidate = 300;

export default async function ProductPage({ params }: Props) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: true,
      optionGroups: {
        orderBy: { sortOrder: 'asc' },
        include: { values: { orderBy: { sortOrder: 'asc' } } },
      },
      tiers: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { selections: true },
      },
    },
  }).catch(() => null);

  if (!product || !product.isActive) notFound();

  // Full category trail (Servers → Rack Servers → 1U) so each crumb can offer its own flyout
  const [tree, configurator] = await Promise.all([
    getCategoryTree(),
    getConfiguratorSettings(),
  ]);
  const trail = getBreadcrumb(tree, product.category.slug);
  const categoryCrumbs = trail.length > 0
    ? trail.map((crumb) => ({
        label: crumb.name,
        href: `/category/${crumb.slug}`,
        children: crumb.children,
      }))
    // Category is hidden (so absent from the tree) — fall back to a flat link
    : [{ label: product.category.name, href: `/category/${product.category.slug}`, children: [] }];

  // JSON-LD Product schema for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.description ?? product.shortDesc,
    brand: { '@type': 'Brand', name: product.brand ?? 'ServerFactory' },
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`,
      priceCurrency: 'INR',
      price: Number(product.basePrice),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-page py-6 md:py-10">
        <CategoryBreadcrumb
          crumbs={[
            { label: 'Home', href: '/', children: tree },
            ...categoryCrumbs,
            { label: product.name, href: null, children: [] },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-2 md:gap-10 lg:items-start 2xl:gap-14">
          {/* Interactive Gallery */}
          <ProductGallery
            images={product.images.map((img) => ({
              id: img.id,
              url: img.url,
              alt: img.alt,
            }))}
            productName={product.name}
          />

          {/* Details + configurator */}
          <div>
            {product.brand && (
              <p className="text-xs font-bold uppercase tracking-wider text-brand">{product.brand}</p>
            )}
            <h1 className="heading-page mt-1 font-display font-extrabold">{product.name}</h1>
            {product.shortDesc && (
              <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-gray-400 sm:text-base md:mt-3 md:text-lg">
                {product.shortDesc}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-gray-100 pb-4 dark:border-gray-800 md:mt-6 md:pb-6">
              {Number(product.basePrice) > 0 ? (
                <>
                  <span className="text-xs text-ink-muted dark:text-gray-400 md:text-sm">Starting at</span>
                  <span className="text-2xl font-extrabold xs:text-3xl md:text-4xl text-ink dark:text-white">
                    {formatINR(product.basePrice)}
                  </span>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand/10 dark:text-brand-300">
                    Enterprise Tier
                  </span>
                  <span className="text-xl font-extrabold text-ink dark:text-white sm:text-2xl">
                    Custom Pricing on Request
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 md:mt-8">
              <Configurator
                hideSpecLabels={configurator.hideSpecLabels}
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  basePrice: Number(product.basePrice),
                  image: product.images[0]?.url,
                }}
                groups={product.optionGroups.map((g) => ({
                  id: g.id,
                  name: g.name,
                  label: g.label,
                  required: g.required,
                  values: g.values.map((v) => ({
                    id: v.id,
                    label: v.label,
                    priceDelta: Number(v.priceDelta),
                    isDefault: v.isDefault,
                  })),
                }))}
                tiers={product.tiers.map((t) => ({
                  id: t.id,
                  name: t.name,
                  label: t.label ?? t.name.charAt(0) + t.name.slice(1).toLowerCase(),
                  description: t.description,
                  priceOverride: t.priceOverride !== null ? Number(t.priceOverride) : null,
                  selectionValueIds: t.selections.map((s) => s.optionValueId),
                }))}
              />
            </div>
          </div>
        </div>

        {product.description && (
          <section className="mt-10 max-w-4xl md:mt-16">
            <h2 className="font-display text-lg font-bold sm:text-xl md:text-2xl">About this {product.category.name}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted dark:text-gray-400 md:mt-4 md:text-base">{product.description}</p>
          </section>
        )}
      </div>
    </>
  );
}
