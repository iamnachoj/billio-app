import { errorResponse, successResponse } from '@/lib/api/response';
import {
  createGroupBodySchema,
  leaveGroupBodySchema,
  readJsonBody,
} from '@/lib/api/request-validation';
import { getCurrentUser } from '@/lib/services/authService';
import {
  createGroup,
  getGroupsForUser,
  leaveGroup,
} from '@/lib/services/groupService';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await readJsonBody(req, createGroupBodySchema);
    if (!body.success) {
      return body.response;
    }

    const result = await createGroup({
      name: body.data.name,
      description: body.data.description,
      createdBy: currentUser.id,
      creatorName: currentUser.name,
    });

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
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
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
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

    const body = await readJsonBody(req, leaveGroupBodySchema);
    if (!body.success) {
      return body.response;
    }

    const result = await leaveGroup({
      groupId: body.data.groupId,
      userId: currentUser.id,
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
