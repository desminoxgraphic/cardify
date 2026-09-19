import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'cardify_admin_session';

function encodeBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(bytes))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  const value = request.cookies.get(COOKIE_NAME)?.value;
  if (!secret || secret.length < 32 || !value) return false;
  const [expiresAt, signature] = value.split('.');
  if (!expiresAt || !signature || Number(expiresAt) <= Date.now() / 1000) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(expiresAt));
  return signature === encodeBase64Url(digest);
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();
  if (await hasValidSession(request)) return NextResponse.next();
  return NextResponse.redirect(new URL('/admin/login', request.url));
}

export const config = { matcher: ['/admin/:path*'] };
