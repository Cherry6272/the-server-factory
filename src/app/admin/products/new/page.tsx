import { getCategoryOptions } from '@/lib/categories';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  const categories = await getCategoryOptions();
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl text-ink dark:text-white">New Product</h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">Add a product to the catalog.</p>
      <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.label }))} />
    </div>
  );
}
