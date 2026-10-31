import { after } from 'next/server';

import { errorResponse, successResponse } from '@/lib/api/response';
import {
  createExpenseBodySchema,
  expenseListQuerySchema,
  readJsonBody,
  readSearchParams,
} from '@/lib/api/request-validation';
import { notifyNewExpense } from '@/lib/services/pushService';
import { getCurrentUser } from '@/lib/services/authService';
import {
  createExpense,
  getExpensesForGroup,
} from '@/lib/services/expenseService';

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
    const body = await readJsonBody(req, createExpenseBodySchema);
    if (!body.success) {
      return body.response;
    }

    const result = await createExpense({
      groupId,
      userId: currentUser.id,
      title: body.data.title,
      description: body.data.description,
      category: body.data.category,
      amount: body.data.amount,
      currency: body.data.currency,
      paidByParticipantId: body.data.paidByParticipantId,
      split: body.data.split,
    });

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }

    const created = result.data.expense as {
      title: string;
      amount: number;
      currency: string;
    };

    after(() =>
      notifyNewExpense({
        groupId,
        actorUserId: currentUser.id,
        title: created.title,
        amountCents: created.amount,
        currency: created.currency,
      }).catch((error) => console.error('Push notification failed', error))
    );

    return successResponse(result.data, 201);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { groupId } = await params;
    const query = readSearchParams(req, expenseListQuerySchema);
    if (!query.success) {
      return query.response;
    }

    const result = await getExpensesForGroup({
      groupId,
      userId: currentUser.id,
      limit: query.data.limit,
      cursor: query.data.cursor,
      category: query.data.category,
      dateFrom: query.data.dateFrom,
      dateTo: query.data.dateTo,
      minAmountCents: query.data.minAmountCents,
      maxAmountCents: query.data.maxAmountCents,
      search: query.data.search,
    });

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }

    return successResponse({
      expenses: result.data.expenses,
      nextCursor: result.data.nextCursor,
    });
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
