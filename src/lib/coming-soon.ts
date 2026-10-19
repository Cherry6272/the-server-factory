/**
 * Pre-launch gate. With COMING_SOON=true the site serves only a holding page
 * and /about; everything else redirects to the holding page.
 *
 * SEO notes, since this runs on a domain we want to rank later:
 *  - redirects are 307 (temporary), never 301 — a permanent redirect would
 *    tell Google to de-index the real URLs and fold them into "/", which is
 *    expensive to undo at launch
 *  - the sitemap lists only the pages that actually resolve, so crawl budget
 *    isn't spent on URLs that just bounce
 *  - robots disallows the gated sections for the same reason
 *  - the holding page itself stays indexable, so the brand starts earning
 *    its own SERP entry before launch
 *
 * All of that reverts automatically when the flag is turned off.
 */
export function isComingSoon(): boolean {
  return false;
}

/** Path prefixes that still resolve while the gate is on. */
export const COMING_SOON_ALLOWED = [
  '/about',
  '/login',   // the only way in to admin while the nav hides it
  '/admin',
  '/api',
  '/robots.txt',
  '/sitemap.xml',
] as const;

/** Sections that are gated — used by robots.txt to avoid crawling redirects. */
export const COMING_SOON_DISALLOWED = [
  '/category/',
  '/product/',
  '/search',
  '/cart',
  '/checkout/',
  '/contact',
] as const;

export function isAllowedWhileComingSoon(pathname: string): boolean {
  if (pathname === '/') return true;
  return COMING_SOON_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
