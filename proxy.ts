import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';

function resolveSafeNextPath(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next');

  if (!next || !next.startsWith('/')) {
    return null;
  }

  return next;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get('token')?.value;

  const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password'];

  const isPublicRoute = publicRoutes.includes(pathname);

  // User already logged in
  if (token && isPublicRoute) {
    try {
      verifyToken(token);

      const nextPath = resolveSafeNextPath(request);

      return NextResponse.redirect(
        new URL(nextPath || '/dashboard', request.url)
      );
    } catch {
      // invalid token -> ignore
    }
  }

  // User accessing dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);

      return NextResponse.redirect(loginUrl);
    }

    try {
      verifyToken(token);
    } catch {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/dashboard/:path*',
  ],
};
