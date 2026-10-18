import type { Metadata } from 'next';
import { Mail, Phone, MapPin, Clock, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { getContactSettings, telHref } from '@/lib/site-settings';

export const metadata: Metadata = {
  title: 'Contact Bytechip Technologies — The Server Factory Bangalore',
  description:
    'Contact Bytechip Technologies at JP Nagar 7th Phase Bangalore (+91 99160 48404) for enterprise server quotes, custom builds, and hardware support.',
  alternates: { canonical: '/contact' },
};

const PILLARS = ['SERVERS', 'WORKSTATIONS', 'STORAGE', 'NETWORKING', 'IT HARDWARE'] as const;

export default async function ContactPage() {
  const contact = await getContactSettings();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'No. 8, 24th Main road, jp nagar 7th phase Bangalore 560078'
  )}`;
  const whatsappUrl = `https://wa.me/919916048404?text=${encodeURIComponent(
    'Hello Bytechip Technologies, I would like to inquire about servers and enterprise hardware.'
  )}`;

  return (
    <div className="relative overflow-hidden">
      {/* Background ambient glow matching brand board */}
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/15" />
      <div className="pointer-events-none absolute right-0 top-32 h-96 w-96 rounded-full bg-techgreen-500/10 blur-3xl dark:bg-techgreen-500/15" />

      <div className="container-page py-10 sm:py-14 md:py-20">
        {/* Header with Bytechip branding */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-techgreen-500/30 bg-techgreen-50/70 px-4 py-1.5 text-xs font-bold tracking-wider text-techgreen-700 dark:border-techgreen-500/40 dark:bg-techgreen-950/40 dark:text-techgreen-300">
            <span className="h-2 w-2 rounded-full bg-techgreen-500 animate-pulse" />
            BYTECHIP TECHNOLOGIES
          </div>

          <h1 className="heading-page mt-4 font-display font-extrabold tracking-tight">
            Connect With Our <span className="text-brand">Hardware Engineers</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-ink-muted dark:text-gray-400 sm:text-base">
            Visit our Bangalore office or reach out directly for enterprise quotes, custom server configurations,
            bulk procurement, and 24/7 technical infrastructure support.
          </p>

          {/* Pillars badge bar */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {PILLARS.map((p, i) => (
              <span
                key={p}
                className="inline-flex items-center rounded-lg border border-gray-200/80 bg-white/80 px-3 py-1 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80"
              >
                {i > 0 && <span className="mr-2 text-techgreen-500 font-bold">•</span>}
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Content grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_1.4fr] lg:gap-12">
          {/* Contact info cards */}
          <aside className="space-y-4">
            {/* Main Phone Card with Call & WhatsApp quick actions */}
            <div className="card p-5 transition hover:border-brand sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand/15">
                  <Phone className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-gray-400">Direct Contact & Mobile</p>
                  <a
                    href={telHref(contact.phone)}
                    className="mt-1 block text-lg font-bold text-ink hover:text-brand dark:text-white sm:text-xl"
                  >
                    {contact.phone}
                  </a>
                  <p className="mt-1 text-xs text-ink-muted dark:text-gray-400">Bytechip Technologies Helpline</p>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <a
                      href={telHref(contact.phone)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 shadow-sm"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call Now
                    </a>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1EBE5D] shadow-sm"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Card with Google Maps action */}
            <div className="card p-5 transition hover:border-brand sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-techgreen-50 text-techgreen-600 dark:bg-techgreen-950/40 dark:text-techgreen-400">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-gray-400">Corporate Office</p>
                  <p className="mt-1 font-semibold text-ink dark:text-white">Bytechip Technologies</p>
                  <p className="mt-0.5 whitespace-pre-line text-sm text-ink-muted dark:text-gray-300">
                    {contact.address}
                  </p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                  >
                    Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Email Card */}
            <div className="card p-5 transition hover:border-brand sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand/15">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-gray-400">Email Inquiries</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="mt-1 block break-all font-semibold text-ink hover:text-brand dark:text-white"
                  >
                    {contact.email}
                  </a>
                  <p className="mt-1 text-xs text-ink-muted dark:text-gray-400">
                    RFQs, procurement orders, and enterprise hardware specs
                  </p>
                </div>
              </div>
            </div>

            {/* Hours & Assurance Card */}
            <div className="card p-5 transition hover:border-brand sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-600 dark:bg-brand/15 dark:text-brand-300">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-gray-400">Business Hours</p>
                  <p className="mt-1 text-sm font-semibold text-ink dark:text-white">
                    Monday – Saturday: 9:30 AM – 7:30 PM IST
                  </p>
                  <p className="text-xs text-ink-muted dark:text-gray-400">
                    Sunday: By appointment for datacenter emergency dispatches
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-techgreen-600 dark:text-techgreen-400">
                    <ShieldCheck className="h-4 w-4" /> Official Verified Partner • www.theserverfactory.com
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Contact form card */}
          <div className="card p-6 sm:p-8 md:p-10">
            <div className="border-b border-gray-100 pb-5 dark:border-gray-800">
              <h2 className="font-display text-xl font-bold sm:text-2xl text-ink dark:text-white">
                Request an Enterprise Quote
              </h2>
              <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">
                Submit your BOM, required specs, or system inquiries. Our certified engineers reply within 4 business hours.
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
