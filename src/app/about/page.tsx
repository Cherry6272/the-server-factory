import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Server, Shield, Truck, Users, MapPin, Phone } from 'lucide-react';
import { getContactSettings } from '@/lib/site-settings';
import { PhotoBackdrop } from '@/components/layout/PhotoBackdrop';

export const metadata: Metadata = {
  title: 'About Bytechip Technologies — The Server Factory Bangalore',
  description:
    'Bytechip Technologies (The Server Factory) is India\'s premier enterprise datacenter and server provider based in Bangalore — specializing in Dell, HPE, Lenovo, and NVIDIA enterprise hardware.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const contact = await getContactSettings();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:py-16 lg:px-8">
      <div className="relative -mx-4 -mt-10 px-4 pb-16 pt-14 sm:-mx-6 sm:px-6 md:-mt-16 md:pb-24 md:pt-24 lg:-mx-8 lg:px-8">
        <PhotoBackdrop variant="header" priority />
        <div className="relative text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-techgreen-500/30 bg-techgreen-50/70 px-4 py-1.5 text-xs font-bold tracking-wider text-techgreen-700 dark:border-techgreen-500/40 dark:bg-techgreen-950/40 dark:text-techgreen-300 mb-4">
            <span className="h-2 w-2 rounded-full bg-techgreen-500 animate-pulse" />
            BANGALORE ENTERPRISE INFRASTRUCTURE
          </div>
          <h1 className="heading-hero font-display font-extrabold text-navy-900 dark:text-white">
            About <span className="text-brand">Server Factory</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-muted dark:text-gray-300 sm:mt-6 sm:text-lg">
            A venture of <strong className="text-navy-900 dark:text-white">Bytechip Technologies</strong>, we provide India&apos;s most reliable,
            transparent enterprise hardware portal — custom rack servers, GPU AI workstations, storage arrays, and network infrastructure.
          </p>
        </div>
      </div>

      <section className="mt-12 grid gap-8 md:mt-20 md:grid-cols-2">
        <div className="card p-6 sm:p-8">
          <h2 className="heading-section font-display font-bold text-navy-900 dark:text-white">Our Mission</h2>
          <p className="mt-4 leading-relaxed text-ink-muted dark:text-gray-300 text-sm sm:text-base">
            Buying enterprise servers shouldn&apos;t require weeks of back-and-forth phone calls and opaque markup.
            Bytechip Technologies puts the configurator online at The Server Factory — pick your CPU, RAM, storage, RAID controllers, and OS,
            see the real transparent price, and order with confidence.
          </p>
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-brand-50/60 p-3.5 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/60 text-xs sm:text-sm">
            <MapPin className="h-5 w-5 flex-shrink-0 text-brand mt-0.5" />
            <div>
              <p className="font-bold text-navy-900 dark:text-gray-100">Headquartered in Bangalore</p>
              <p className="text-ink-muted dark:text-gray-400">No. 8, 24th Main Road, JP Nagar 7th Phase, Bangalore - 560078</p>
            </div>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="heading-section font-display font-bold text-navy-900 dark:text-white">Core Capabilities</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-muted dark:text-gray-300">
            {[
              'Enterprise Rack Servers (Dell PowerEdge, HPE ProLiant, Lenovo ThinkSystem)',
              'AI & Deep Learning GPU Servers (NVIDIA HGX, RTX, Tesla clusters)',
              'High-Density Enterprise Storage & SAN/NAS Solutions',
              'Engineering Workstations (Dell Precision, HP Z, Lenovo ThinkStation)',
              'Datacenter Networking (Broadcom, Mellanox 10G/25G/40G/100G NICs)',
              'Server Components, ECC Memory, SAS/NVMe SSDs, and RAID Cards',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-techgreen-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 grid gap-4 xs:grid-cols-2 md:mt-24 md:grid-cols-4 md:gap-6">
        {[
          { icon: Server, title: 'Configurator-First', desc: 'Build your exact server online with verified component compatibility.' },
          { icon: Shield, title: 'Tested & Warranted', desc: 'Rigorous 24-hour hardware burn-in with OEM & extended warranty.' },
          { icon: Truck, title: 'Pan-India Delivery', desc: 'Fast, secure dispatch from our Bangalore facility across all states.' },
          { icon: Users, title: 'Engineer-Led Support', desc: 'Direct access to certified hardware engineers for presales & deployment.' },
        ].map((v) => (
          <div key={v.title} className="card p-4 text-center sm:p-6 transition hover:border-brand">
            <v.icon className="mx-auto h-8 w-8 text-brand sm:h-10 sm:w-10" />
            <h3 className="mt-3 font-display text-sm font-bold sm:mt-4 sm:text-base text-navy-900 dark:text-white">{v.title}</h3>
            <p className="mt-2 text-xs text-ink-muted sm:text-sm">{v.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 px-5 py-10 text-center text-white shadow-brand sm:rounded-3xl sm:px-8 sm:py-12 md:mt-24 md:px-16 md:py-16">
        <h2 className="heading-section font-display font-extrabold">
          Ready to build your server infrastructure?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-300 sm:text-base">
          Start configuring from 80+ enterprise models, or speak directly with our hardware team in Bangalore.
        </p>
        <div className="mt-6 flex flex-col justify-center items-center gap-3 xs:flex-row xs:flex-wrap sm:mt-8">
          <Link href="/category/servers" className="rounded-full bg-techgreen-500 px-6 py-3 text-sm font-extrabold text-navy-950 transition hover:bg-techgreen-400 hover:scale-105 sm:px-8 sm:text-base">
            Shop Servers
          </Link>
          <Link href="/contact" className="rounded-full border-2 border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20 sm:px-8 sm:text-base">
            Contact Bangalore Office
          </Link>
          <a href="tel:+919916048404" className="inline-flex items-center gap-2 rounded-full border border-techgreen-400/40 bg-navy-950/60 px-6 py-3 text-sm font-bold text-techgreen-300 transition hover:bg-navy-950 sm:text-base">
            <Phone className="h-4 w-4" /> +91 99160 48404
          </a>
        </div>
      </section>
    </div>
  );
}
