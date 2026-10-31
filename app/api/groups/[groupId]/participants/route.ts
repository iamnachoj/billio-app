import { errorResponse, successResponse } from '@/lib/api/response';
import {
  addParticipantBodySchema,
  readJsonBody,
} from '@/lib/api/request-validation';
import { getCurrentUser } from '@/lib/services/authService';
import {
  addParticipantToGroup,
  getParticipantsForGroup,
} from '@/lib/services/groupService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { groupId } = await params;
    const body = await readJsonBody(req, addParticipantBodySchema);
    if (!body.success) {
      return body.response;
    }

    const result = await addParticipantToGroup({
      groupId,
      displayName: body.data.displayName,
      userId: body.data.userId,
      role: body.data.role,
      status: body.data.status,
      createdBy: currentUser.id,
    });

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }

    return successResponse(result.data.participant, 201);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { groupId } = await params;

    const result = await getParticipantsForGroup(groupId, currentUser.id);

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }

    return successResponse(result.data.participants);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
