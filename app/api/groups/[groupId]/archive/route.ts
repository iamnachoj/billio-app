import {
  errorResponse,
  successResponse,
  unexpectedErrorResponse,
} from '@/lib/api/response';
import {
  archiveGroupBodySchema,
  readJsonBody,
} from '@/lib/api/request-validation';
import { getCurrentUser } from '@/lib/services/authService';
import { archiveGroup } from '@/lib/services/groupService';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    const { groupId } = await params;
    const body = await readJsonBody(req, archiveGroupBodySchema);
    if (!body.success) return body.response;
    const result = await archiveGroup({
      groupId,
      userId: user.id,
      archived: body.data.archived,
    });
    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }
    return successResponse(result.data.group);
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}
