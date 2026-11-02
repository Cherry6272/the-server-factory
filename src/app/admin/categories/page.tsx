import { getAdminCategoryTree } from '@/lib/categories';
import { CategoriesEditor } from '@/components/admin/CategoriesEditor';

export default async function AdminCategoriesPage() {
  const tree = await getAdminCategoryTree();

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl text-ink dark:text-white">Categories</h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">
        Manage the navigation hierarchy. Nest categories as deep as you need — sub-categories and sub-sub-categories appear in the mega menu.
      </p>
      <CategoriesEditor initialTree={tree} />
    </div>
  );
}
