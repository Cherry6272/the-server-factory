import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Server, Cpu, HardDrive, Repeat, ArrowRight } from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  servers: Server,
  workstations: Cpu,
  components: HardDrive,
  rentals: Repeat,
};

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  servers: 'Enterprise rack, blade & tower servers from Dell, HPE, and Lenovo.',
  workstations: 'High-performance GPU workstations for AI, 3D rendering & CAD.',
  components: 'CPUs, ECC RAM, SAS drives, RAID cards & datacenter networking.',
  rentals: 'Flexible short & long-term server leasing and GPU clusters for intensive workloads.',
};

export async function CategoryGrid({ heading }: { heading?: string }) {
  const cats = await prisma.category
    .findMany({ where: { parentId: null, isVisible: true }, orderBy: { sortOrder: 'asc' } })
    .catch(() => []);
  if (!cats.length) return null;

  const hasRentals = cats.some((c) => c.slug === 'rentals');

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
          const desc = cat.description || DEFAULT_DESCRIPTIONS[cat.slug];
          const isRentals = cat.slug === 'rentals';

          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-brand dark:border-gray-800 dark:bg-navy-900/80 sm:p-6 lg:p-8"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-50 transition-transform duration-500 group-hover:scale-150 dark:bg-brand/10" />
              
              <div className="relative">
                {isRentals && (
                  <div className="absolute right-0 top-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-techgreen-500/40 bg-techgreen-50/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-techgreen-700 dark:border-techgreen-500/30 dark:bg-techgreen-950/60 dark:text-techgreen-300 backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-techgreen-500 animate-pulse" />
                      Coming Soon
                    </span>
                  </div>
                )}

                <div className="mb-3.5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-navy-900 text-white shadow-md sm:mb-4 sm:h-12 sm:w-12 group-hover:from-techgreen-500 group-hover:to-brand-600 transition-all duration-300">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink dark:text-gray-100 sm:text-xl group-hover:text-brand transition-colors">
                  {cat.name}
                </h3>
                {desc && (
                  <p className="mt-2 text-sm text-ink-muted dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                )}
              </div>

              <div className="relative mt-4 pt-2">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-transform duration-200 group-hover:translate-x-1">
                  Explore hardware <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}

        {/* 4th Block: Server Rentals with Coming Soon tag */}
        {!hasRentals && (
          <Link
            href="/contact?inquiry=rentals"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-techgreen-500/40 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-techgreen-500 hover:shadow-techgreen dark:border-techgreen-500/30 dark:bg-navy-900/80 sm:p-6 lg:p-8"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-techgreen-50 transition-transform duration-500 group-hover:scale-150 dark:bg-techgreen-950/20" />

            <div className="relative">
              {/* Coming Soon Badge in top right */}
              <div className="absolute right-0 top-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-techgreen-500/40 bg-techgreen-50/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-techgreen-700 dark:border-techgreen-500/30 dark:bg-techgreen-950/60 dark:text-techgreen-300 backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-techgreen-500 animate-pulse" />
                  Coming Soon
                </span>
              </div>

              <div className="mb-3.5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-techgreen-600 to-navy-900 text-white shadow-md sm:mb-4 sm:h-12 sm:w-12 group-hover:from-techgreen-500 group-hover:to-brand-600 transition-all duration-300">
                <Repeat className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <h3 className="font-display text-lg font-bold text-ink dark:text-gray-100 sm:text-xl group-hover:text-techgreen-600 dark:group-hover:text-techgreen-400 transition-colors">
                Server Rentals
              </h3>

              <p className="mt-2 text-sm text-ink-muted dark:text-gray-400 line-clamp-2 leading-relaxed">
                {DEFAULT_DESCRIPTIONS.rentals}
              </p>
            </div>

            <div className="relative mt-4 pt-2">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-techgreen-600 dark:text-techgreen-400 transition-transform duration-200 group-hover:translate-x-1">
                Pre-book / Enquire <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}