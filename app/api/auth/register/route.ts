import { errorResponse, successResponse } from '@/lib/api/response';
import {
  readJsonBody,
  registerBodySchema,
} from '@/lib/api/request-validation';
import { registerUser } from '@/lib/services/authService';

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req, registerBodySchema);
    if (!body.success) {
      return body.response;
    }

    const result = await registerUser(body.data);

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
