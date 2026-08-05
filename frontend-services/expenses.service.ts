import { Expense } from '@/lib/models/expense';
import { ExpenseSplit } from '@/lib/models/expenseSplit';

export type CreateExpenseSplitInput =
  | { mode: 'equal' }
  | { mode: 'selected'; participantIds: string[] }
  | {
      mode: 'percentage';
      shares: Array<{ participantId: string; percentage: number }>;
    };

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export type CreateExpenseInput = {
  title: string;
  description?: string;
  category: string;
  amount: number;
  currency: string;
  paidByParticipantId: string;
  split: CreateExpenseSplitInput;
};

export type UpdateExpenseInput = {
  title?: string;
  description?: string;
  category?: string;
  amount?: number;
  currency?: string;
  paidByParticipantId?: string;
  split?: CreateExpenseSplitInput;
};

export type ExpenseDetailsData = {
  expense: Expense;
  splits: ExpenseSplit[];
};

export async function createExpense(groupId: string, body: CreateExpenseInput) {
  const response = await fetch(`/api/groups/${groupId}/expenses`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json() as Promise<ApiResult<ExpenseDetailsData>>;
}

export async function getExpenseById(groupId: string, expenseId: string) {
  const response = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
    method: 'GET',
    credentials: 'include',
  });

  return response.json() as Promise<ApiResult<ExpenseDetailsData>>;
}

export async function updateExpense(
  groupId: string,
  expenseId: string,
  body: UpdateExpenseInput
) {
  const response = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json() as Promise<ApiResult<ExpenseDetailsData>>;
}
