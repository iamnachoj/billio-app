import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { getUser } from '@/lib/repositories/userRepository';
import { generateToken } from '@/lib/auth/jwt';
import { errorResponse } from '@/lib/api/response';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return errorResponse(
        'INVALID_INPUT',
        'Email and password are required',
        400,
      );
    }

    const user = await getUser(email);

    if (!user) {
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        401,
      );
    }

    const isValidPassword = await bcrypt.compare(
      password,
      user.password_hash as string,
    );

    if (!isValidPassword) {
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        401,
      );
    }

    const token = generateToken(user.id as string);

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(error);

    return errorResponse(
      'INTERNAL_ERROR',
      'Something went wrong',
      500,
    );
  }
}