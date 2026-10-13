'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Server, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
};

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-800 dark:bg-gray-950/60">
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-gray-50 text-gray-400 dark:bg-gray-800/40 dark:text-gray-500">
          <Server className="h-12 w-12 opacity-40" />
          <p className="text-sm font-medium">Enterprise Hardware Imagery</p>
          <span className="text-xs text-ink-muted dark:text-gray-500">Specs & Configurations Listed Below</span>
        </div>
      </div>
    );
  }

  const activeImg = images[activeIdx] ?? images[0];

  function nextImage() {
    setActiveIdx((prev) => (prev + 1) % images.length);
  }

  function prevImage() {
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  }

  return (
    <div className="lg:sticky lg:top-24">
      {/* Main Image Stage */}
      <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-4 shadow-soft dark:border-gray-800 dark:bg-gray-950/60 sm:p-6 md:p-8">
        <Image
          src={activeImg.url}
          alt={activeImg.alt ?? productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-2 transition-all duration-300 md:p-4 group-hover:scale-[1.02]"
        />

        {/* Image Counter Badge */}
        {images.length > 1 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur sm:bottom-4 sm:left-4">
            {activeIdx + 1} / {images.length}
          </span>
        )}

        {/* Fullscreen Zoom trigger */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-brand dark:bg-gray-900/80 dark:text-gray-300 dark:hover:bg-gray-900 sm:right-4 sm:top-4 sm:h-9 sm:w-9"
          aria-label="View fullscreen image"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Arrow Navigation (Desktop on hover / Touch buttons) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur transition-all hover:bg-white hover:text-brand dark:bg-gray-900/90 dark:text-gray-200 sm:left-3 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur transition-all hover:bg-white hover:text-brand dark:bg-gray-900/90 dark:text-gray-200 sm:right-3 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:mt-4 sm:gap-3">
          {images.map((img, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={cn(
                  'relative aspect-square h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border bg-white p-1.5 transition-all duration-200 dark:bg-gray-950 sm:h-20 sm:w-20',
                  isActive
                    ? 'border-brand ring-2 ring-brand/40 shadow-sm'
                    : 'border-gray-200 hover:border-brand/40 dark:border-gray-800'
                )}
                aria-label={`View photo ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? ''}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close fullscreen"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative aspect-[16/10] max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white p-6 dark:bg-gray-950 sm:p-10">
            <Image
              src={activeImg.url}
              alt={activeImg.alt ?? productName}
              fill
              className="object-contain p-4"
              sizes="100vw"
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
