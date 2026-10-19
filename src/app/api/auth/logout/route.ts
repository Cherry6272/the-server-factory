import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signOut } from '@/lib/auth';

const AUTH_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'authjs.csrf-token',
  '__Host-authjs.csrf-token',
  'authjs.callback-url',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.csrf-token',
  'next-auth.callback-url',
];

function expireAllCookies(res: NextResponse) {
  const cookieStore = cookies();
  for (const name of AUTH_COOKIE_NAMES) {
    try {
      cookieStore.delete(name);
    } catch {
      // Ignore errors if cookie not present in store
    }

    // Set deletion on outgoing response headers with both standard and host-prefixed scopes
    res.cookies.set({
      name,
      value: '',
      path: '/',
      expires: new Date(0),
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
}

export async function POST(req: Request) {
  try {
    await signOut({ redirect: false });
  } catch {
    // NextAuth internal signOut might throw redirect or error
  }

  const res = NextResponse.json({ ok: true, message: 'Logged out successfully' });
  expireAllCookies(res);
  return res;
}

export async function GET(req: Request) {
  try {
    await signOut({ redirect: false });
  } catch {
    // NextAuth internal signOut might throw redirect or error
  }

  const loginUrl = new URL('/login', req.url);
  const res = NextResponse.redirect(loginUrl, 302);
  expireAllCookies(res);
  return res;
}
