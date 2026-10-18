import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';

/**
 * Cache tags. The contact settings are read by the ROOT LAYOUT, so without
 * caching every page view would issue an extra query and every page without
 * generateStaticParams would drop to dynamic rendering. Reads go through
 * unstable_cache; the admin save handler calls revalidateTag to purge.
 */
export const SETTINGS_CACHE_TAG = 'site-settings';

/** Display settings for the product-page configurator, editable from Admin → Configs. */
export type ConfiguratorSettings = {
  /**
   * Render tier specs as bare values ("Intel Xeon Gold 6248") instead of
   * label/value pairs ("Processor: Intel Xeon Gold 6248").
   */
  hideSpecLabels: boolean;
};

export const CONFIGURATOR_SETTINGS_KEY = 'configurator';

export const CONFIGURATOR_DEFAULTS: ConfiguratorSettings = {
  hideSpecLabels: false,
};

/** Never throws — a missing row or unreachable database falls back to defaults. */
export const getConfiguratorSettings = unstable_cache(
  async (): Promise<ConfiguratorSettings> => {
    const row = await prisma.siteSetting
      .findUnique({ where: { key: CONFIGURATOR_SETTINGS_KEY } })
      .catch(() => null);

    const stored = (row?.value ?? {}) as Partial<ConfiguratorSettings>;
    return {
      hideSpecLabels:
        typeof stored.hideSpecLabels === 'boolean'
          ? stored.hideSpecLabels
          : CONFIGURATOR_DEFAULTS.hideSpecLabels,
    };
  },
  ['configurator-settings'],
  // The 1h ceiling is a backstop: a transient DB error caches the defaults,
  // and without it those defaults would stick until the next admin save.
  { tags: [SETTINGS_CACHE_TAG], revalidate: 3600 }
);

/** Public contact details shown in the footer and on /contact, editable from Admin → Configs. */
export type ContactSettings = {
  email: string;
  phone: string;
  /** May contain newlines — rendered with whitespace-pre-line. */
  address: string;
};

export const CONTACT_SETTINGS_KEY = 'contact';

export const CONTACT_DEFAULTS: ContactSettings = {
  email: 'sales@theserverfactory.com',
  phone: '+91 99160 48404',
  address: 'No. 8, 24th Main Road, JP Nagar 7th Phase,\nBangalore - 560078',
};

/** Never throws — a missing row or unreachable database falls back to defaults. */
export const getContactSettings = unstable_cache(
  async (): Promise<ContactSettings> => {
    const row = await prisma.siteSetting
      .findUnique({ where: { key: CONTACT_SETTINGS_KEY } })
      .catch(() => null);

    const stored = (row?.value ?? {}) as Partial<ContactSettings>;
    const pick = (v: unknown, fallback: string) =>
      typeof v === 'string' && v.trim() ? v.trim() : fallback;

    return {
      email: pick(stored.email, CONTACT_DEFAULTS.email),
      phone: pick(stored.phone, CONTACT_DEFAULTS.phone),
      address: pick(stored.address, CONTACT_DEFAULTS.address),
    };
  },
  ['contact-settings'],
  { tags: [SETTINGS_CACHE_TAG], revalidate: 3600 }
);

/**
 * Build a dialable `tel:` href from a display phone number.
 * "+91 80 4000 0000" → "tel:+918040000000"
 */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const plus = phone.trim().startsWith('+') ? '+' : '';
  return `tel:${plus}${digits}`;
}
