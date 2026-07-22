import { errorResponse, successResponse } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/services/authService';
import { deleteExpenseForGroup, getExpenseForGroup } from '@/lib/services/expenseService';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; expenseId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { groupId, expenseId } = await params;

    const result = await getExpenseForGroup({
      groupId,
      expenseId,
      userId: currentUser.id,
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; expenseId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { groupId, expenseId } = await params;

    const result = await deleteExpenseForGroup({
      groupId,
      expenseId,
      userId: currentUser.id,
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
