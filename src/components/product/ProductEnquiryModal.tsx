'use client';

import { X, Server } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';

export type ProductEnquiryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  configuration: {
    mode: 'quick' | 'custom';
    tierLabel?: string;
    specs: { groupLabel: string; valueLabel: string }[];
  };
};

export function ProductEnquiryModal({
  isOpen,
  onClose,
  product,
  configuration,
}: ProductEnquiryModalProps) {
  if (!isOpen) return null;

  const defaultSubject = `Quote Request: ${product.name}${
    configuration.tierLabel ? ` (${configuration.tierLabel})` : ''
  }`;

  // Formatted configuration object for API persistence
  const configSnapshot: Record<string, string> = {};
  if (configuration.tierLabel) {
    configSnapshot['Tier'] = configuration.tierLabel;
  }
  configuration.specs.forEach((s) => {
    configSnapshot[s.groupLabel] = s.valueLabel;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-900 border border-gray-200 dark:border-gray-800 sm:p-8">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand/20">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold sm:text-xl text-ink dark:text-white">
              Request Hardware Quote
            </h2>
            <p className="text-xs text-ink-muted dark:text-gray-400 sm:text-sm">
              {product.name}
            </p>
          </div>
        </div>

        {/* Config Summary Card */}
        {configuration.specs.length > 0 && (
          <div className="mt-4 rounded-xl border border-gray-200/80 bg-gray-50/70 p-3.5 text-xs dark:border-gray-800 dark:bg-gray-800/40">
            <div className="flex items-center justify-between font-semibold text-ink dark:text-gray-200 mb-2">
              <span>Configured Architecture</span>
              {configuration.tierLabel && (
                <span className="rounded bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">
                  {configuration.tierLabel}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 text-ink-muted dark:text-gray-400">
              {configuration.specs.map((s, idx) => (
                <div key={idx} className="truncate">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {s.groupLabel}:
                  </span>{' '}
                  {s.valueLabel}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Embedded Contact Form */}
        <div className="mt-4">
          <ContactForm
            defaultSubject={defaultSubject}
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            configuration={configSnapshot}
          />
        </div>
      </div>
    </div>
  );
}
