'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nextImage = useCallback(() => {
    if (!images || images.length === 0) return;
    setActiveIdx((prev) => (prev + 1) % images.length);
  }, [images]);

  const prevImage = useCallback(() => {
    if (!images || images.length === 0) return;
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  }, [images]);

  // Handle keyboard shortcuts (Escape to close, Arrow keys to navigate) and lock body scroll
  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [lightboxOpen, nextImage, prevImage]);

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

  return (
    <div className="lg:sticky lg:top-24">
      {/* Main Image Stage */}
      <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-4 shadow-soft dark:border-gray-800 dark:bg-gray-950/60 sm:p-6 md:p-8">
        <div className="relative h-full w-full">
          <Image
            src={activeImg.url}
            alt={activeImg.alt ?? productName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain transition-all duration-300 group-hover:scale-[1.02]"
          />
        </div>

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

      {/* Fullscreen Lightbox Modal (rendered directly to <body> via Portal to escape parent sticky stacking contexts) */}
      {lightboxOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image gallery"
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95 p-4 sm:p-6 md:p-8 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar: Title & Prominent Close Button */}
          <div
            className="fixed top-0 left-0 right-0 z-[100000] flex items-center justify-between p-4 sm:p-6 md:px-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                {activeIdx + 1} / {images.length}
              </span>
              <span className="hidden sm:inline-block max-w-md truncate text-xs font-medium text-gray-300">
                {productName}
              </span>
            </div>

            {/* High-Visibility Close Button */}
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="flex items-center gap-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/25 px-4 py-2 text-white shadow-2xl backdrop-blur-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand"
              aria-label="Close fullscreen"
            >
              <X className="h-5 w-5 text-white" />
              <span className="text-xs font-bold uppercase tracking-wider">Close</span>
            </button>
          </div>

          {/* Centered Image Canvas */}
          <div
            className="relative aspect-[16/10] max-h-[82vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white p-4 dark:bg-gray-950 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImg.url}
              alt={activeImg.alt ?? productName}
              fill
              className="object-contain p-2 sm:p-4"
              sizes="100vw"
              priority
            />
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="fixed left-4 top-1/2 z-[100000] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 sm:left-6"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="fixed right-4 top-1/2 z-[100000] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 sm:right-6"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

