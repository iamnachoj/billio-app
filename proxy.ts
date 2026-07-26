import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get('token')?.value;

  const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password'];

  const isPublicRoute = publicRoutes.includes(pathname);

  // User already logged in
  if (token && isPublicRoute) {
    try {
      verifyToken(token);

      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // invalid token -> ignore
    }
  }

  // User accessing dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      verifyToken(token);
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
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
