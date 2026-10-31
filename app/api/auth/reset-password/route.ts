import { errorResponse, successResponse } from '@/lib/api/response';
import {
  readJsonBody,
  resetPasswordBodySchema,
} from '@/lib/api/request-validation';
import { resetPassword } from '@/lib/services/passwordResetService';

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req, resetPasswordBodySchema);
    if (!body.success) {
      return body.response;
    }

    const result = await resetPassword(body.data.token, body.data.password);

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }

    return successResponse({ reset: true });
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
