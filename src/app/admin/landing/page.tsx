import { prisma } from '@/lib/prisma';
import { LandingEditor } from '@/components/admin/LandingEditor';

export default async function AdminLandingPage() {
  const blocks = await prisma.landingBlock.findMany({ orderBy: { sortOrder: 'asc' } });
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl text-ink dark:text-white">Landing Page</h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">Customise the homepage by toggling, reordering and editing blocks.</p>
      <LandingEditor
        blocks={blocks.map((b) => ({
          id: b.id,
          type: b.type,
          title: b.title,
          data: b.data as any,
          sortOrder: b.sortOrder,
          isVisible: b.isVisible,
        }))}
      />
    </div>
  );
}
