import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Server, Cpu, HardDrive, Repeat, ArrowRight } from 'lucide-react';

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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:mb-8 md:mb-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-techgreen-600 dark:text-techgreen-400">
            Datacenter Infrastructure
          </span>
          <h2 className="heading-section font-display font-bold mt-1 text-ink dark:text-white">
            {heading ?? 'Shop by Category'}
          </h2>
        </div>
        <Link href="/category/servers" className="text-xs sm:text-sm font-semibold text-brand hover:underline inline-flex items-center gap-1">
          View all categories <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 xs:grid-cols-2 sm:gap-5 lg:grid-cols-4 md:gap-6">
        {cats.map((cat) => {
          const Icon = ICONS[cat.slug] ?? Server;
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-brand dark:border-gray-800 dark:bg-navy-900/80 sm:p-6 lg:p-8"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-50 transition-transform duration-500 group-hover:scale-150 dark:bg-brand/10" />
              <div className="relative">
                <div className="mb-3.5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-navy-900 text-white shadow-md sm:mb-4 sm:h-12 sm:w-12 group-hover:from-techgreen-500 group-hover:to-brand-600 transition-all duration-300">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink dark:text-gray-100 sm:text-xl group-hover:text-brand transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="mt-2 text-sm text-ink-muted dark:text-gray-400 line-clamp-2">
                    {cat.description}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand transition-transform duration-200 group-hover:translate-x-1">
                  Explore hardware <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}