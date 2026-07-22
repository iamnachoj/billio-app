import { errorResponse, successResponse } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/services/authService';
import { createExpense, getExpensesForGroup } from '@/lib/services/expenseService';

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
    const body = await req.json();

    const result = await createExpense({
      groupId,
      userId: currentUser.id,
      title: body?.title,
      description: body?.description,
      category: body?.category,
      amount: body?.amount,
      currency: body?.currency,
      paidByParticipantId: body?.paidByParticipantId,
      split: body?.split,
    });

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    return successResponse(result.data, 201);
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

    const result = await getExpensesForGroup({
      groupId,
      userId: currentUser.id,
    });

    if (!result.ok) {
      return errorResponse(result.error.code, result.error.message, result.error.status);
    }

    return successResponse(result.data.expenses);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
