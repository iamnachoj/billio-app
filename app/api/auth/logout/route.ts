import { successResponse } from '@/lib/api/response';

export async function POST() {
  const response = successResponse({
    loggedOut: true,
  });

  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
