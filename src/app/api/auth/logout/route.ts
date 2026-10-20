import { NextResponse } from 'next/server';

const AUTH_COOKIE_BASES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'authjs.csrf-token',
  '__Host-authjs.csrf-token',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
  'authjs.callback-url',
  '__Secure-authjs.callback-url',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
  'authjs.pkce.code_verifier',
  '__Secure-authjs.pkce.code_verifier',
  'authjs.state',
  '__Secure-authjs.state',
  'authjs.nonce',
  '__Secure-authjs.nonce',
];

function collectCookieNames(req: Request): Set<string> {
  const names = new Set<string>();

  // 1. Add all standard Auth.js / NextAuth names and chunks (.0 - .9)
  for (const base of AUTH_COOKIE_BASES) {
    names.add(base);
    for (let i = 0; i <= 9; i++) {
      names.add(`${base}.${i}`);
    }
  }

  // 2. Add any cookies present in the incoming request header
  const rawCookieHeader = req.headers.get('cookie');
  if (rawCookieHeader) {
    const parts = rawCookieHeader.split(';');
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx > 0) {
        const cName = part.slice(0, eqIdx).trim();
        if (
          cName.includes('auth') ||
          cName.includes('session') ||
          cName.includes('csrf') ||
          cName.includes('callback') ||
          cName.startsWith('__Secure-') ||
          cName.startsWith('__Host-')
        ) {
          names.add(cName);
        }
      }
    }
  }

  return names;
}

function applyCookieDeletions(res: NextResponse, req: Request) {
  const isHttps = req.url.startsWith('https:') || req.headers.get('x-forwarded-proto') === 'https';
  const cookieNames = collectCookieNames(req);

  for (const name of cookieNames) {
    const requiresSecure = name.startsWith('__Secure-') || name.startsWith('__Host-');
    res.cookies.set({
      name,
      value: '',
      path: '/',
      expires: new Date(0),
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
      secure: requiresSecure || isHttps,
    });
  }

  // Modern browser directive: immediately invalidate all cookies for this origin
  res.headers.set('Clear-Site-Data', '"cookies"');
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const callbackUrl = url.searchParams.get('callbackUrl') || '/login';
  const safeDest = callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/login';

  const redirectUrl = new URL(safeDest, req.url);
  const res = NextResponse.redirect(redirectUrl, 302);
  applyCookieDeletions(res, req);
  return res;
}

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true, message: 'Logged out successfully' });
  applyCookieDeletions(res, req);
  return res;
}
