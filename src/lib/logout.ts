/**
 * Authoritative logout handler.
 * Performs a top-level document navigation through /api/auth/logout, which erases
 * all session tokens, cookie chunks, and security cookies on the server response,
 * and clears the browser client router cache upon redirecting.
 */
export function logoutUser(redirectTo: string = '/login') {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.clear();
      localStorage.removeItem('next-auth.message');
    } catch {}

    // Direct browser navigation through the logout route ensures that
    // Set-Cookie headers with Max-Age=0 are processed directly by the browser network stack.
    const destination = `/api/auth/logout?callbackUrl=${encodeURIComponent(redirectTo)}`;
    window.location.href = destination;
  }
}
