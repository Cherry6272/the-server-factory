'use client';

const LINKS: Record<string, string> = {
  Dell: 'https://www.dell.com/en-in/work/shop/enterprise/sc/servers',
  HP: 'https://www.hpe.com/in/en/servers.html',
  Lenovo: 'https://www.lenovo.com/in/en/servers-storage/',
  NVIDIA: 'https://www.nvidia.com/en-in/data-center/products/dgx-platform/',
  Intel: 'https://www.intel.in/content/www/in/en/products/details/processors/xeon.html',
  Samsung: 'https://semiconductor.samsung.com/in/us/consumer-storage/internal-ssd/',
};

export function BrandLogos({ heading, brands }: { heading?: string; brands: string[] }) {
  const safeBrands = Array.isArray(brands) ? brands.filter(Boolean) : [];
  if (safeBrands.length === 0) return null;

  return (
    <section className="border-y border-gray-200 bg-white py-8 dark:border-navy-800/80 dark:bg-navy-950/70 sm:py-10 md:py-12">
      <div className="container-page">
        {heading && <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-400 sm:mb-8 sm:text-sm">{heading}</p>}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-10 sm:gap-y-6 lg:gap-x-12">
          {safeBrands.map((brand) => {
            const link = LINKS[brand];
            const style = 'font-display text-lg font-bold text-gray-400 dark:text-gray-400 hover:dark:text-white sm:text-xl lg:text-2xl';
            return link ? (
              <a key={brand} href={link} target="_blank" rel="noopener noreferrer" className={`${style} transition hover:text-brand`}>{brand}</a>
            ) : (
              <span key={brand} className={style}>{brand}</span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
