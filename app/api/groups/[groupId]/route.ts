import { errorResponse, successResponse } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/services/authService';
import { updateGroupName } from '@/lib/services/groupService';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { groupId } = await params;
    const body = await req.json();

    const result = await updateGroupName({
      groupId,
      userId: currentUser.id,
      name: body?.name,
    });

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }

    return successResponse({ success: true });
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
