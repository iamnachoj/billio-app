import { NextResponse } from 'next/server';

import { errorResponse } from '@/lib/api/response';
import { loginUser } from '@/lib/services/authService';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const result = await loginUser({ email, password });

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    const response = NextResponse.json({
      success: true,
      data: result.data.user,
    });

    response.cookies.set('token', result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
