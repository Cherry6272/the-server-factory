import Link from 'next/link';
import { Phone, ArrowRight, MessageSquare, ShieldCheck } from 'lucide-react';

export function CtaBlock({
  heading,
  subheading,
  ctaText,
  ctaLink,
}: {
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
}) {
  return (
    <section className="container-page section-y">
      <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 px-6 py-12 text-center text-white shadow-2xl sm:rounded-3xl sm:px-10 sm:py-16 md:px-16 md:py-20">
        {/* Subtle glowing background orbs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-techgreen-500/20 blur-3xl" />

        {/* Datacenter grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-techgreen-500/40 bg-techgreen-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-techgreen-300">
            <ShieldCheck className="h-4 w-4 text-techgreen-400" /> SERVER FACTORY ENGINEERING & HARDWARE CONSULTATION
          </div>

          <h2 className="heading-section mx-auto mt-4 max-w-3xl font-display font-extrabold tracking-tight text-white">
            {heading ?? 'Need a Custom Server or Enterprise Hardware Architecture?'}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-300 sm:text-base md:text-lg leading-relaxed">
            {subheading ??
              'Our hardware engineers in Bangalore spec, test, and deliver custom server clusters, GPU nodes, and storage solutions configured exactly for your production workloads.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {ctaText && ctaLink && (
              <Link
                href={ctaLink}
                className="inline-flex items-center gap-2 rounded-full bg-techgreen-500 px-8 py-3.5 text-sm font-extrabold text-navy-950 shadow-techgreen transition hover:bg-techgreen-400 hover:scale-105 sm:text-base"
              >
                {ctaText} <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <a
              href="tel:+919916048404"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 sm:text-base"
            >
              <Phone className="h-4 w-4 text-techgreen-400" /> +91 99160 48404
            </a>

            <a
              href="https://wa.me/919916048404?text=Hi%20Server%20Factory%2C%20I%20am%20looking%20for%20enterprise%20server%20quotes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1EBE5D] sm:text-base"
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </a>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Facility: No. 8, 24th Main Road, JP Nagar 7th Phase, Bangalore - 560078 • A Bytechip Technologies Venture
          </p>
        </div>
      </div>
    </section>
  );
}
