import { errorResponse, successResponse } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/services/authService';
import { createGroup, getGroupsForUser, leaveGroup } from '@/lib/services/groupService';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await req.json();

    const { name, description } = body;

    const result = await createGroup({
      name,
      description,
      createdBy: currentUser.id,
      creatorName: currentUser.name,
    });

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    return successResponse(result.data.group, 201);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const result = await getGroupsForUser(currentUser.id);

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    return successResponse(result.data.groups);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { groupId } = await req.json();

    const result = await leaveGroup({
      groupId,
      userId: currentUser.id,
    });

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    return successResponse({ success: true });
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
