'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowUp, ArrowDown, Plus, Trash2, Save, ImageOff } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

export type HeroSlide = {
  imageUrl?: string;
  /** Present only for images uploaded here; enables cleanup on removal. */
  imagePublicId?: string;
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
};

/**
 * Structured editor for HERO_CAROUSEL blocks. These are the only blocks that
 * carry images, and hand-editing their JSON to paste image URLs was the last
 * thing standing between an admin and a working homepage.
 */
export function HeroSlidesEditor({
  slides: initial,
  onSave,
  saving,
}: {
  slides: HeroSlide[];
  onSave: (slides: HeroSlide[]) => void;
  saving?: boolean;
}) {
  const [slides, setSlides] = useState<HeroSlide[]>(initial);
  const dirty = JSON.stringify(slides) !== JSON.stringify(initial);

  const update = (i: number, patch: Partial<HeroSlide>) =>
    setSlides(slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= slides.length) return;
    const next = [...slides];
    [next[i], next[t]] = [next[t], next[i]];
    setSlides(next);
  };

  return (
    <div>
      <div className="space-y-3">
        {slides.map((slide, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-3 dark:border-navy-700 dark:bg-navy-900/40">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-gray-400">
                Slide {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  className="rounded p-1.5 text-ink-muted hover:text-brand disabled:opacity-30 dark:text-gray-400" aria-label="Move up">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === slides.length - 1}
                  className="rounded p-1.5 text-ink-muted hover:text-brand disabled:opacity-30 dark:text-gray-400" aria-label="Move down">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setSlides(slides.filter((_, idx) => idx !== i))}
                  className="rounded p-1.5 text-red-500 hover:text-red-400" aria-label="Remove slide">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
              <div>
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-100 dark:bg-navy-950/60 dark:border dark:border-navy-800">
                  {slide.imageUrl ? (
                    <Image src={slide.imageUrl} alt="" fill sizes="200px" className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <ImageOff className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <ImageUploader
                  className="mt-2"
                  folder="landing"
                  label={slide.imageUrl ? 'Replace' : 'Upload'}
                  onUploaded={([img]) => update(i, { imageUrl: img.url, imagePublicId: img.publicId })}
                />
              </div>

              <div className="grid gap-2">
                <SlideField label="Heading" value={slide.heading ?? ''} onChange={(v) => update(i, { heading: v })} />
                <SlideField label="Subheading" value={slide.subheading ?? ''} onChange={(v) => update(i, { subheading: v })} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <SlideField label="Button text" value={slide.ctaText ?? ''} onChange={(v) => update(i, { ctaText: v })} />
                  <SlideField label="Button link" value={slide.ctaLink ?? ''} onChange={(v) => update(i, { ctaLink: v })} placeholder="/category/servers" />
                </div>
                <SlideField
                  label="Image URL"
                  value={slide.imageUrl ?? ''}
                  onChange={(v) => update(i, { imageUrl: v, imagePublicId: undefined })}
                  placeholder="Or paste an external URL"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSlides([...slides, {}])}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold hover:border-brand hover:text-brand dark:border-navy-700 dark:bg-navy-900 dark:text-gray-200"
        >
          <Plus className="h-3 w-3" /> Add slide
        </button>
        <button type="button" onClick={() => onSave(slides)} disabled={!dirty || saving} className="btn-brand text-sm disabled:opacity-50">
          <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save slides'}
        </button>
        {dirty && !saving && <span className="text-xs text-ink-muted dark:text-gray-400">Unsaved changes</span>}
      </div>
      <p className="mt-2 text-xs text-ink-muted dark:text-gray-400">
        Removing a slide or replacing its image deletes the old file from Cloudinary when you save.
      </p>
    </div>
  );
}

function SlideField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-muted dark:text-gray-300">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-brand focus:bg-white dark:border-navy-700 dark:bg-navy-950/60 dark:text-gray-100 dark:focus:bg-navy-900"
      />
    </label>
  );
}
