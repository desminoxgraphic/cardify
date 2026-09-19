import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'cardify_admin_session';
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

function getAuthConfig() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!password || password.length < 12 || !secret || secret.length < 32) return null;
  return { password, secret };
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(expiresAt: string, secret: string): string {
  return createHmac('sha256', secret).update(expiresAt).digest('base64url');
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(getAuthConfig());
}

export function verifyAdminPassword(password: string): boolean {
  const config = getAuthConfig();
  return Boolean(config && safeEqual(password, config.password));
}

export function createAdminSessionValue(): string | null {
  const config = getAuthConfig();
  if (!config) return null;
  const expiresAt = Math.floor(Date.now() / 1000 + SESSION_LIFETIME_SECONDS).toString();
  return `${expiresAt}.${sign(expiresAt, config.secret)}`;
}

export function verifyAdminSessionValue(value: string | undefined): boolean {
  const config = getAuthConfig();
  if (!config || !value) return false;
  const [expiresAt, signature] = value.split('.');
  if (!expiresAt || !signature || Number(expiresAt) <= Date.now() / 1000) return false;
  return safeEqual(signature, sign(expiresAt, config.secret));
}

export function setAdminCookie(): boolean {
  const value = createAdminSessionValue();
  if (!value) return false;
  cookies().set(ADMIN_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_LIFETIME_SECONDS,
  });
  return true;
}

export function removeAdminCookie() {
  cookies().delete(ADMIN_COOKIE_NAME);
}

export function isAdminAuthenticated(): boolean {
  return verifyAdminSessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value);
}
