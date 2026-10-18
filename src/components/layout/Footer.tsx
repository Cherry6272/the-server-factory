'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { telHref, type ContactSettings } from '@/lib/site-settings';

export function Footer({ contact }: { contact: ContactSettings }) {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-navy-950 md:mt-24">
      <div className="container-page py-10 md:py-16">
        <div className="grid gap-8 xs:grid-cols-2 md:gap-10 lg:grid-cols-5">
          <div className="xs:col-span-2">
            <Link href="/" className="inline-block">
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                  <span className="text-brand">SERVER</span>
                  <span className="text-navy-900 dark:text-white">FACTORY</span>
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold tracking-wider text-techgreen-600 dark:text-techgreen-400 uppercase">
                A BYTECHIP TECHNOLOGIES VENTURE
              </p>
            </Link>

            <p className="mt-4 max-w-sm text-sm text-ink-muted dark:text-gray-400">
              India&apos;s configurator-first enterprise infrastructure provider — custom rack servers, GPU workstations,
              storage arrays, and datacenter hardware from Dell, HPE, Lenovo, and NVIDIA.
            </p>

            <div className="mt-6 space-y-2.5 text-sm text-ink-muted dark:text-gray-400">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 transition-colors hover:text-brand">
                <Mail className="h-4 w-4 flex-shrink-0 text-brand" /> <span className="min-w-0 break-all">{contact.email}</span>
              </a>
              <a href={telHref(contact.phone)} className="flex items-center gap-2 font-medium transition-colors hover:text-brand">
                <Phone className="h-4 w-4 flex-shrink-0 text-brand" /> {contact.phone}
              </a>
              <Link href="/contact" className="flex items-start gap-2 transition-colors hover:text-brand">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
                <span className="min-w-0 whitespace-pre-line leading-relaxed">{contact.address}</span>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-ink dark:text-gray-100">Hardware</h4>
            <ul className="mt-4 space-y-2 text-sm text-ink-muted dark:text-gray-400">
              <li><Link href="/category/servers" className="hover:text-brand transition-colors">Servers</Link></li>
              <li><Link href="/category/workstations" className="hover:text-brand transition-colors">Workstations</Link></li>
              <li><Link href="/category/components" className="hover:text-brand transition-colors">Storage & Components</Link></li>
              <li><Link href="/category/networking" className="hover:text-brand transition-colors">Networking</Link></li>
              <li><Link href="/category/rentals" className="hover:text-brand transition-colors">Server Rentals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-ink dark:text-gray-100">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-ink-muted dark:text-gray-400">
              <li><Link href="/about" className="hover:text-brand transition-colors">About Bytechip</Link></li>
              <li><Link href="/contact" className="hover:text-brand transition-colors">Contact & Location</Link></li>
              <li><span className="text-xs text-techgreen-600 dark:text-techgreen-400 font-medium flex items-center gap-1 mt-2"><ShieldCheck className="h-3.5 w-3.5" /> ISO Certified Standards</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-ink dark:text-gray-100">Customer Support</h4>
            <ul className="mt-4 space-y-2 text-sm text-ink-muted dark:text-gray-400">
              <li><Link href="/account" className="hover:text-brand transition-colors">Client Portal</Link></li>
              <li><Link href="/account/orders" className="hover:text-brand transition-colors">Order Tracking</Link></li>
              <li><Link href="/contact" className="hover:text-brand transition-colors">Request a Quote (RFQ)</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 text-xs text-ink-muted dark:border-gray-800 dark:text-gray-500 md:flex-row">
          <p>© {new Date().getFullYear()} Bytechip Technologies — The Server Factory. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Bangalore, Karnataka, India 🇮🇳</span>
            <span>•</span>
            <span className="font-mono text-gray-400">www.theserverfactory.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
