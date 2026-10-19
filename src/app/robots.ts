import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const ALWAYS_DISALLOWED = ['/admin/', '/account/', '/api/', '/checkout/', '/login', '/cart'];

export default function robots(): MetadataRoute.Robots {
  const disallow = ALWAYS_DISALLOWED;

  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
