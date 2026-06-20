import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const isPrivateRoute = request.nextUrl.pathname.startsWith('/dashboard');

  if (!isPrivateRoute) {
    return NextResponse.next();
  }

  if (!token || !verifyToken(token)) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};