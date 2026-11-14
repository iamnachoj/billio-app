import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { verifyToken } from '@/lib/utils/jwt';

const handleI18nRouting = createMiddleware(routing);

export function resolveSafeNextPath(request: NextRequest, locale: string) {
  const next = request.nextUrl.searchParams.get('next');
  if (
    !next ||
    !next.startsWith('/') ||
    next.startsWith('//') ||
    /[\\\u0000-\u001f\u007f]/.test(next)
  ) {
    return null;
  }

  const url = new URL(next, request.url);
  if (url.origin !== request.nextUrl.origin) return null;

  const hasLocale = routing.locales.some(
    (value) =>
      url.pathname === `/${value}` || url.pathname.startsWith(`/${value}/`)
  );
  return `${hasLocale ? '' : `/${locale}`}${url.pathname}${url.search}${url.hash}`;
}

export function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  if (response.headers.has('location')) return response;

  const pathname = request.nextUrl.pathname;
  const locale = routing.locales.find(
    (value) => pathname === `/${value}` || pathname.startsWith(`/${value}/`)
  );
  if (!locale) return response;

  const unprefixed = pathname.slice(locale.length + 1) || '/';
  const token = request.cookies.get('token')?.value;
  const isPublicRoute = [
    '/',
    '/login',
    '/forgot-password',
    '/reset-password',
  ].includes(unprefixed);

  let validToken = false;
  if (token) {
    try {
      verifyToken(token);
      validToken = true;
    } catch {
      // Invalid tokens are treated as unauthenticated.
    }
  }

  let redirectUrl: URL | undefined;
  if (validToken && isPublicRoute) {
    redirectUrl = new URL(
      resolveSafeNextPath(request, locale) || `/${locale}/dashboard`,
      request.url
    );
  } else if (
    !validToken &&
    (unprefixed === '/dashboard' || unprefixed.startsWith('/dashboard/'))
  ) {
    redirectUrl = new URL(`/${locale}/login`, request.url);
    redirectUrl.searchParams.set(
      'next',
      `${pathname}${request.nextUrl.search}`
    );
  }

  if (!redirectUrl) return response;
  const redirectResponse = NextResponse.redirect(redirectUrl);
  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  return redirectResponse;
}

export const config = {
  matcher: ['/((?!api(?:/|$)|_next(?:/|$)|.*\\..*).*)'],
};
