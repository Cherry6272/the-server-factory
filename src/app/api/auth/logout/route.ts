import { NextResponse } from 'next/server';

const TARGET_AUTH_COOKIES = [
  // Auth.js v5 session tokens & chunks
  'authjs.session-token',
  'authjs.session-token.0',
  'authjs.session-token.1',
  '__Secure-authjs.session-token',
  '__Secure-authjs.session-token.0',
  '__Secure-authjs.session-token.1',

  // NextAuth v4 session tokens & chunks
  'next-auth.session-token',
  'next-auth.session-token.0',
  'next-auth.session-token.1',
  '__Secure-next-auth.session-token',
  '__Secure-next-auth.session-token.0',
  '__Secure-next-auth.session-token.1',

  // CSRF tokens & Callback URLs
  'authjs.csrf-token',
  '__Host-authjs.csrf-token',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
  'authjs.callback-url',
  '__Secure-authjs.callback-url',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
];

function collectCookiesToDelete(req: Request): Set<string> {
  const names = new Set<string>(TARGET_AUTH_COOKIES);

  // Also include any cookie currently present in the client request header
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
  const cookieNames = collectCookiesToDelete(req);

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

  // Instruct modern browsers (Chrome, Edge, Firefox, Safari 17+) to clear all cookies for this origin
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
