import { errorResponse, successResponse } from '@/lib/api/response';
import { resetPassword } from '@/lib/services/passwordResetService';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    const result = await resetPassword(token, password);

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    return successResponse({ reset: true });
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
