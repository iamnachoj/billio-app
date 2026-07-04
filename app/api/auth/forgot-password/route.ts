import { errorResponse, successResponse } from '@/lib/api/response';
import { requestPasswordReset } from '@/lib/services/passwordResetService';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const result = await requestPasswordReset(email);

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    return successResponse({ sent: true });
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
