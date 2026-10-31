import { errorResponse, successResponse } from '@/lib/api/response';
import {
  forgotPasswordBodySchema,
  readJsonBody,
} from '@/lib/api/request-validation';
import { requestPasswordReset } from '@/lib/services/passwordResetService';

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req, forgotPasswordBodySchema);
    if (!body.success) {
      return body.response;
    }

    const result = await requestPasswordReset(body.data.email);

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }

    return successResponse({ sent: true });
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
