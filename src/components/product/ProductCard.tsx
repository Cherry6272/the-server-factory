import Link from 'next/link';
import Image from 'next/image';
import { Server } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { cloudinaryUrl } from '@/lib/cloudinary';

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string | null;
    basePrice: any;
    shortDesc: string | null;
    images: { url: string; alt: string | null }[];
    category?: { name: string; slug: string } | null;
  };
};

export function ProductCard({ product }: Props) {
  const img = product.images[0];
  const price = Number(product.basePrice) || 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-brand dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Product Image Canvas - Normalized Pedestal */}
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-gray-100 bg-white p-3.5 dark:border-gray-800/80 dark:bg-gray-950/60 sm:p-5">
        {img ? (
          <div className="relative h-full w-full">
            <Image
              src={cloudinaryUrl(img.url, 600)}
              alt={img.alt ?? product.name}
              fill
              sizes="(max-width: 475px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1920px) 25vw, 20vw"
              className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-gray-50 text-gray-400 dark:bg-gray-800/40 dark:text-gray-500">
            <Server className="h-7 w-7 opacity-50" />
            <span className="text-[11px] font-medium">Specs Available</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 xs:p-4 sm:p-5">
        {product.brand && (
          <p className="truncate text-[11px] font-bold uppercase tracking-wider text-brand sm:text-xs">
            {product.brand}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 font-display text-sm font-bold text-ink transition-colors group-hover:text-brand-700 dark:text-gray-100 dark:group-hover:text-brand-400 xs:text-base sm:text-lg">
          {product.name}
        </h3>
        {product.shortDesc && (
          <p className="mt-2 line-clamp-2 hidden text-xs leading-relaxed text-ink-muted dark:text-gray-400 xs:block sm:text-sm">
            {product.shortDesc}
          </p>
        )}

        <div className="mt-auto pt-3 sm:pt-4">
          {price > 0 ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted dark:text-gray-400">
                Starting at
              </p>
              <p className="text-lg font-extrabold text-ink dark:text-white xs:text-xl sm:text-2xl">
                {formatINR(price)}
              </p>
            </div>
          ) : (
            <div>
              <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-brand-700 dark:bg-brand/10 dark:text-brand-300">
                Custom Config
              </span>
              <p className="mt-1 text-base font-extrabold text-ink dark:text-gray-100 sm:text-lg">
                Price on Request
              </p>
            </div>
          )}

          <span className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-brand/70 bg-transparent px-3 py-1.5 text-xs font-semibold text-brand transition-all duration-200 group-hover:bg-brand group-hover:text-white group-hover:shadow-brand xs:px-4 xs:py-2 sm:text-sm">
            {price > 0 ? 'Configure Now' : 'Configure & Enquire'}
          </span>
        </div>
      </div>
    </Link>
  );
}
