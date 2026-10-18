'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Cpu, HardDrive, Network, Wrench } from 'lucide-react';

type Slide = { imageUrl: string; heading: string; subheading?: string; ctaText?: string; ctaLink?: string };

const PILLARS = [
  { label: 'SERVERS', icon: Cpu },
  { label: 'WORKSTATIONS', icon: Cpu },
  { label: 'STORAGE', icon: HardDrive },
  { label: 'NETWORKING', icon: Network },
  { label: 'IT HARDWARE', icon: Wrench },
] as const;

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setI((v) => (v + 1) % slides.length), 6500);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) return null;
  const slide = slides[i];

  return (
    <div className="relative">
      <section className="relative h-[clamp(24rem,72vh,42rem)] overflow-hidden">
        {slides.map((s, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: `linear-gradient(rgba(6,21,39,0.70), rgba(6,21,39,0.85)), url(${s.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}

        {/* Dynamic cyber/datacenter grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-4 text-center text-white xs:px-14 sm:px-16 2xl:max-w-5xl">
          {/* Top Server Factory pill */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-techgreen-500/40 bg-navy-950/80 px-4 py-1.5 text-xs font-bold tracking-wider text-techgreen-300 backdrop-blur-md shadow-glow">
            <span className="h-2 w-2 rounded-full bg-techgreen-400 animate-pulse" />
            SERVER FACTORY • ENTERPRISE INFRASTRUCTURE
          </div>

          <h1 className="heading-hero animate-slide-up font-display font-extrabold tracking-tight drop-shadow-md">
            {slide.heading.split(' ').map((w, idx, arr) => {
              const midpoint = Math.floor(arr.length / 2);
              return idx >= midpoint ? (
                <span key={idx} className="bg-gradient-to-r from-sky-300 via-sky-100 to-techgreen-300 bg-clip-text text-transparent"> {w}</span>
              ) : (
                <span key={idx} className="text-white">{idx > 0 ? ' ' : ''}{w}</span>
              );
            })}
          </h1>

          {slide.subheading && (
            <p className="mt-4 max-w-2xl text-sm text-gray-200 sm:mt-6 sm:text-base md:text-lg leading-relaxed drop-shadow-sm">
              {slide.subheading}
            </p>
          )}

          {/* Dual Action Buttons */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5 sm:mt-8">
            {slide.ctaText && slide.ctaLink && (
              <Link
                href={slide.ctaLink}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white shadow-brand transition hover:bg-brand-600 hover:scale-105 sm:px-8 sm:text-base"
              >
                {slide.ctaText} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/25 sm:text-base shadow-sm"
            >
              Get Custom Quote
            </Link>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={() => setI((v) => (v - 1 + slides.length) % slides.length)}
              className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-navy-900/80 text-white shadow-xl backdrop-blur transition hover:bg-navy-800 xs:flex sm:left-4 sm:h-12 sm:w-12 lg:left-6 border border-white/10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setI((v) => (v + 1) % slides.length)}
              className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-navy-900/80 text-white shadow-xl backdrop-blur transition hover:bg-navy-800 xs:flex sm:right-4 sm:h-12 sm:w-12 lg:right-6 border border-white/10"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-6">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  className="flex h-8 items-center px-1"
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  <span className={`block h-2 rounded-full transition-all ${idx === i ? 'w-8 bg-techgreen-400' : 'w-2 bg-white/50'}`} />
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Pillars & Trust Ribbon matching Bytechip Board */}
      <div className="border-y border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-navy-900">
        <div className="container-page py-3 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-display font-bold tracking-wider text-navy-900 dark:text-gray-200">
              <span className="hidden md:inline-flex items-center gap-1.5 text-techgreen-600 dark:text-techgreen-400">
                <ShieldCheck className="h-4 w-4" /> CORE PILLARS:
              </span>
              {PILLARS.map((p, idx) => (
                <span key={p.label} className="inline-flex items-center gap-1.5">
                  {idx > 0 && <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>}
                  <span className="hover:text-brand transition-colors cursor-pointer">{p.label}</span>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-ink-muted dark:text-gray-400">
              <span className="hidden lg:inline">Bangalore HQ: JP Nagar 7th Phase</span>
              <span className="hidden lg:inline">•</span>
              <a href="tel:+919916048404" className="text-brand font-bold hover:underline">
                Call: +91 99160 48404
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
