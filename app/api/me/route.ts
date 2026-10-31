import {
  deleteUserAccount,
  getCurrentUser,
  updateUserAccount,
} from '@/lib/services/authService';
import { errorResponse, successResponse } from '@/lib/api/response';
import {
  readJsonBody,
  updateUserBodySchema,
} from '@/lib/api/request-validation';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  return successResponse(user);
}

export async function DELETE() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const result = await deleteUserAccount(currentUser.id, currentUser.id);

  if (!result.ok) {
    return errorResponse(
      result.error.code,
      result.error.message,
      result.error.status
    );
  }

  return successResponse({ deleted: true }, 200);
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = await readJsonBody(req, updateUserBodySchema);
  if (!body.success) {
    return body.response;
  }

  const result = await updateUserAccount(user.id, body.data);

  if (!result.ok) {
    return errorResponse(
      result.error.code,
      result.error.message,
      result.error.status
    );
  }

  return successResponse(result.data, 200);
}
