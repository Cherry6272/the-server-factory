import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Server, Cpu, HardDrive, Repeat } from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  servers: Server,
  workstations: Cpu,
  components: HardDrive,
  rentals: Repeat,
};

export async function CategoryGrid({ heading }: { heading?: string }) {
  const cats = await prisma.category
    .findMany({ where: { parentId: null, isVisible: true }, orderBy: { sortOrder: 'asc' } })
    .catch(() => []);
  if (!cats.length) return null;

  return (
    <section className="container-page section-y">
      <h2 className="heading-section mb-6 font-display font-bold sm:mb-8 md:mb-10">
        {heading ?? 'Shop by Category'}
      </h2>
      <div className="grid gap-4 xs:grid-cols-2 sm:gap-5 lg:grid-cols-4 md:gap-6">
        {cats.map((cat) => {
          const Icon = ICONS[cat.slug] ?? Server;
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-brand dark:border-gray-800 dark:bg-gray-900 sm:p-6 lg:p-8"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-50 transition-transform duration-500 group-hover:scale-150 dark:bg-brand/10" />
              <div className="relative">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white sm:mb-4 sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink dark:text-gray-100 sm:text-xl">{cat.name}</h3>
                {cat.description && <p className="mt-2 text-sm text-ink-muted dark:text-gray-400">{cat.description}</p>}
                <span className="mt-3 inline-block text-sm font-semibold text-brand sm:mt-4">Explore →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}