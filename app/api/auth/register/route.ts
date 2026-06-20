import bcrypt from 'bcryptjs';
import { createUserByEmail, getUser } from '@/lib/repositories/userRepository';
import { errorResponse, successResponse } from '@/lib/api/response';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return errorResponse(
        'INVALID_INPUT',
        'Name, email and password are required',
        400
      );
    }

    if (password.length < 6) {
      return errorResponse(
        'WEAK_PASSWORD',
        'Password must be at least 6 characters',
        400
      );
    }

    const existingUser = await getUser(email);

    if (existingUser) {
      return errorResponse('EMAIL_IN_USE', 'Email already in use', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUserByEmail({
      name,
      email,
      passwordHash,
    });

    return successResponse(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      201
    );
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
