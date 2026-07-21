import { errorResponse, successResponse } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/services/authService';
import { createGroupInvite } from '@/lib/services/inviteService';

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
    let body: { email?: string } = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const result = await createGroupInvite({
      groupId,
      email: body.email,
      createdBy: currentUser.id,
    });

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    return successResponse(result.data.invite, 201);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
