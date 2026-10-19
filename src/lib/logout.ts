import { signOut as nextAuthSignOut } from 'next-auth/react';

/**
 * Robust, cross-environment logout handler.
 * Clears cookies on the server authoritative endpoint, triggers client signout,
 * and performs a full hard window navigation to purge memory, React state, and Next.js router cache.
 */
export async function logoutUser(redirectTo: string = '/login') {
  try {
    // 1. Authoritative server cookie eradication
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[LOGOUT] Server endpoint error:', err);
  }

  try {
    // 2. Client-side NextAuth cleanup
    await nextAuthSignOut({ redirect: false });
  } catch {
    // NextAuth beta CSRF mismatch can be safely caught here
  }

  // 3. Clear non-essential session state
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.clear();
    } catch {}

    // 4. Hard full page navigation ensures zero stale state or router cache
    window.location.href = redirectTo;
  }
}
