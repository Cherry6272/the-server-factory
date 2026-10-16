'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Trash2, Star } from 'lucide-react';
import { ImageUploader, type UploadedImage } from './ImageUploader';

export type ProductImageInput = {
  url: string;
  publicId: string | null;
  alt: string | null;
};

export function ProductImageManager({
  images,
  onChange,
  defaultAlt,
}: {
  images: ProductImageInput[];
  onChange: (next: ProductImageInput[]) => void;
  defaultAlt?: string;
}) {
  // publicIds that already existed when the form loaded. Anything uploaded in
  // this session and then removed is deleted from Cloudinary immediately —
  // it was never persisted, so the save-time diff would never see it.
  const originalPublicIds = useRef<Set<string>>(
    new Set(images.map((i) => i.publicId).filter((id): id is string => Boolean(id)))
  );

  function add(uploaded: UploadedImage[]) {
    onChange([
      ...images,
      ...uploaded.map((u) => ({
        url: u.url,
        publicId: u.publicId,
        alt: defaultAlt?.trim() || null,
      })),
    ]);
  }

  async function remove(index: number) {
    const img = images[index];
    onChange(images.filter((_, i) => i !== index));

    if (img.publicId && !originalPublicIds.current.has(img.publicId)) {
      // Never saved — clean it up now rather than leaving an orphan.
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: img.publicId }),
      }).catch(() => {});
    }
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function setAlt(index: number, alt: string) {
    onChange(images.map((img, i) => (i === index ? { ...img, alt } : img)));
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-bold">Images</h2>
          <p className="mt-0.5 text-sm text-ink-muted dark:text-gray-400">
            The first image is the primary one shown in listings. Drag order with the arrows.
          </p>
        </div>
        <ImageUploader folder="products" multiple onUploaded={add} label="Upload images" />
      </div>

      {images.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <p className="text-sm text-ink-muted dark:text-gray-400">
            No images yet. Uploaded files go to Cloudinary and are attached when you save.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li
              key={`${img.publicId ?? img.url}-${i}`}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="relative aspect-[4/3] border-b border-gray-100 bg-white p-2 dark:border-gray-800 dark:bg-gray-950/60">
                <div className="relative h-full w-full">
                  <Image
                    src={img.url}
                    alt={img.alt ?? ''}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
                {i === 0 && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
                    <Star className="h-3 w-3" /> Primary
                  </span>
                )}
                {!img.publicId && (
                  <span
                    className="absolute right-2 top-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-[11px] font-semibold text-white"
                    title="External URL — removing it here won't delete anything from Cloudinary"
                  >
                    External
                  </span>
                )}
              </div>

              <div className="p-2.5">
                <input
                  value={img.alt ?? ''}
                  onChange={(e) => setAlt(i, e.target.value)}
                  placeholder="Alt text (for accessibility & SEO)"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs outline-none focus:border-brand focus:bg-white dark:border-gray-700 dark:bg-gray-800"
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded p-1.5 text-ink-muted hover:text-brand disabled:opacity-30"
                      aria-label="Move earlier"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === images.length - 1}
                      className="rounded p-1.5 text-ink-muted hover:text-brand disabled:opacity-30"
                      aria-label="Move later"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="rounded p-1.5 text-red-500 hover:text-red-600"
                    aria-label="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
