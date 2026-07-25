import { errorResponse, successResponse } from '@/lib/api/response';
import { registerUser } from '@/lib/services/authService';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const result = await registerUser({ name, email, password });

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }

    return successResponse(result.data.user, 201);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
