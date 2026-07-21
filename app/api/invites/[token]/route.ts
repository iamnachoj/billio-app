import { errorResponse, successResponse } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/services/authService';
import { acceptInvite, getInviteByToken } from '@/lib/services/inviteService';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const result = await getInviteByToken(token);

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    return successResponse(result.data.invite);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await req.json();
    const { token } = await params;

    const result = await acceptInvite({
      token,
      userId: currentUser.id,
      userEmail: currentUser.email,
      participantId: body?.participantId,
      displayName: body?.displayName,
    });

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    return successResponse(result.data);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
