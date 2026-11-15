import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductForm } from '@/components/admin/ProductForm';
import { OptionGroupsEditor } from '@/components/admin/OptionGroupsEditor';
import { TiersEditor } from '@/components/admin/TiersEditor';
import { getCategoryOptions } from '@/lib/categories';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        optionGroups: {
          orderBy: { sortOrder: 'asc' },
          include: { values: { orderBy: { sortOrder: 'asc' } } },
        },
        tiers: {
          orderBy: { sortOrder: 'asc' },
          include: { selections: true },
        },
      },
    }),
    getCategoryOptions(),
  ]);

  if (!product) notFound();

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl text-ink dark:text-white">Edit Product</h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">{product.name}</p>

      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.label }))}
        product={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          brand: product.brand ?? '',
          shortDesc: product.shortDesc ?? '',
          description: product.description ?? '',
          basePrice: Number(product.basePrice),
          stock: product.stock,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          categoryId: product.categoryId,
          metaTitle: product.metaTitle ?? '',
          metaDescription: product.metaDescription ?? '',
          images: product.images.map((img) => ({
            url: img.url,
            publicId: img.publicId,
            alt: img.alt,
          })),
        }}
      />

      <div className="mt-12">
        <OptionGroupsEditor
          productId={product.id}
          groups={product.optionGroups.map((g) => ({
            id: g.id,
            name: g.name,
            label: g.label,
            required: g.required,
            sortOrder: g.sortOrder,
            values: g.values.map((v) => ({
              id: v.id,
              label: v.label,
              priceDelta: Number(v.priceDelta),
              isDefault: v.isDefault,
            })),
          }))}
        />
      </div>

      <div className="mt-12">
        <TiersEditor
          productId={product.id}
          basePrice={Number(product.basePrice)}
          groups={product.optionGroups.map((g) => ({
            id: g.id,
            name: g.name,
            label: g.label,
            values: g.values.map((v) => ({
              id: v.id,
              label: v.label,
              priceDelta: Number(v.priceDelta),
              isDefault: v.isDefault,
            })),
          }))}
          initialTiers={product.tiers.map((t) => ({
            id: t.id,
            name: t.name,
            label: t.label ?? t.name.charAt(0) + t.name.slice(1).toLowerCase(),
            description: t.description ?? '',
            priceOverride: t.priceOverride !== null ? Number(t.priceOverride) : null,
            isActive: t.isActive,
            selectionValueIds: t.selections.map((s) => s.optionValueId),
          }))}
        />
      </div>
    </div>
  );
}
