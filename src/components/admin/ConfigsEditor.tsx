'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { telHref, type ConfiguratorSettings, type ContactSettings } from '@/lib/site-settings';

type Settings = {
  configurator: ConfiguratorSettings;
  contact: ContactSettings;
};

export function ConfigsEditor({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [configurator, setConfigurator] = useState(initial.configurator);
  const [contact, setContact] = useState(initial.contact);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    JSON.stringify({ configurator, contact }) !== JSON.stringify(initial);

  const emailError = !contact.email.trim()
    ? 'Email is required'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())
      ? 'Enter a valid email address'
      : null;
  const phoneEmpty = !contact.phone.trim();
  const addressEmpty = !contact.address.trim();
  const invalid = !!emailError || phoneEmpty || addressEmpty;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configurator,
          contact: {
            email: contact.email.trim(),
            phone: contact.phone.trim(),
            address: contact.address.trim(),
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 max-w-3xl space-y-6 md:mt-8">
      {/* ── Contact details ─────────────────────────── */}
      <section className="card p-4 sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink dark:text-white">Contact details</h2>
        <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">
          Shown in the site footer and on the Contact page.
        </p>

        <div className="mt-5 space-y-4">
          <Field
            label="Email address"
            type="email"
            hint="Used for the mailto: links in the footer and on the Contact page."
            value={contact.email}
            onChange={(email) => setContact({ ...contact, email })}
            error={emailError}
            placeholder="sales@example.com"
          />

          <Field
            label="Phone number"
            hint="Displayed as typed. The dial link strips spaces automatically."
            value={contact.phone}
            onChange={(phone) => setContact({ ...contact, phone })}
            error={phoneEmpty ? 'Phone is required' : null}
            placeholder="+91 80 4000 0000"
          />

          <div>
            <label className="text-sm font-semibold text-ink dark:text-gray-200" htmlFor="cfg-address">Address</label>
            <p className="mt-0.5 text-sm text-ink-muted dark:text-gray-400">
              Line breaks are preserved.
            </p>
            <textarea
              id="cfg-address"
              rows={3}
              value={contact.address}
              onChange={(e) => setContact({ ...contact, address: e.target.value })}
              placeholder="Bengaluru, Karnataka, India"
              className={cn(
                'mt-2 w-full min-w-0 rounded-xl border bg-gray-50 px-4 py-2.5 text-base outline-none transition focus:bg-white focus:ring-2 focus:ring-brand/20 dark:border-navy-700 dark:bg-navy-950/60 dark:text-gray-100 dark:focus:bg-navy-900',
                addressEmpty ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-brand dark:border-navy-700'
              )}
            />
            {addressEmpty && <p className="mt-1 text-xs font-medium text-red-600">Address is required</p>}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-navy-700 dark:bg-navy-950/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-gray-400">
            Preview
          </p>
          <div className="mt-3 space-y-1.5 text-sm">
            <p>
              <span className="text-ink-muted dark:text-gray-400">Email: </span>
              <span className="break-all font-medium text-ink dark:text-gray-100">{contact.email || '—'}</span>
            </p>
            <p>
              <span className="text-ink-muted dark:text-gray-400">Phone: </span>
              <span className="font-medium text-ink dark:text-gray-100">{contact.phone || '—'}</span>
              <span className="ml-2 text-xs text-ink-muted dark:text-gray-500">
                ({contact.phone ? telHref(contact.phone) : 'tel:'})
              </span>
            </p>
            <p className="flex gap-1">
              <span className="flex-shrink-0 text-ink-muted dark:text-gray-400">Address: </span>
              <span className="whitespace-pre-line font-medium text-ink dark:text-gray-100">{contact.address || '—'}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Product configurator ────────────────────── */}
      <section className="card p-4 sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink dark:text-white">Product configurator</h2>
        <p className="mt-1 text-sm text-ink-muted dark:text-gray-400">
          Controls how the &ldquo;Choose a configuration&rdquo; section renders on every product page.
        </p>

        <Toggle
          className="mt-5"
          label="Hide spec labels"
          description="Show each spec as just its value. Turn this off to show the component name alongside it."
          checked={configurator.hideSpecLabels}
          onChange={(hideSpecLabels) => setConfigurator({ ...configurator, hideSpecLabels })}
        />

        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-navy-700 dark:bg-navy-950/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-gray-400">
            Preview
          </p>
          <div className="mt-3 space-y-1.5">
            {SAMPLE_SPECS.map((s) =>
              configurator.hideSpecLabels ? (
                <p key={s.label} className="text-xs font-medium text-ink dark:text-gray-200">{s.value}</p>
              ) : (
                <p key={s.label} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-ink-muted dark:text-gray-400">{s.label}</span>
                  <span className="text-right font-medium text-ink dark:text-gray-200">{s.value}</span>
                </p>
              )
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving || !dirty || invalid} className="btn-brand disabled:opacity-50">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        {dirty && !invalid && !saving && !saved && (
          <span className="text-sm text-ink-muted dark:text-gray-400">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}

const SAMPLE_SPECS = [
  { label: 'Processor', value: '2x Intel Xeon Gold 6248' },
  { label: 'RAM', value: '256GB DDR4 ECC RDIMM' },
  { label: 'Storage', value: '4x 3.2TB NVMe U.2 SSD' },
];

function Field({
  label, hint, value, onChange, error, placeholder, type = 'text',
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  placeholder?: string;
  type?: string;
}) {
  const id = `cfg-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label className="text-sm font-semibold text-ink dark:text-gray-200" htmlFor={id}>{label}</label>
      {hint && <p className="mt-0.5 text-sm text-ink-muted dark:text-gray-400">{hint}</p>}
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'mt-2 w-full min-w-0 rounded-xl border bg-gray-50 px-4 py-2.5 text-base outline-none transition focus:bg-white focus:ring-2 focus:ring-brand/20 dark:border-navy-700 dark:bg-navy-950/60 dark:text-gray-100 dark:focus:bg-navy-900',
          error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-brand dark:border-navy-700'
        )}
      />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function Toggle({
  label, description, checked, onChange, className,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <p className="font-semibold text-ink dark:text-gray-100">{label}</p>
        <p className="mt-0.5 text-sm text-ink-muted dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-1 h-6 w-11 flex-shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        {/* left-0 is load-bearing: without it the knob falls back to its static
            position, and a button's default text-align:center starts it 12px in,
            so the "on" state pushed it past the right edge of the track. */}
        <span
          className={cn(
            'absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
