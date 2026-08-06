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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeErrorFromPayload(payload: unknown): ApiError | null {
  if (!isRecord(payload)) {
    return null;
  }

  const error = payload.error;
  if (!isRecord(error)) {
    return null;
  }

  const code = typeof error.code === 'string' ? error.code : 'UNKNOWN_ERROR';
  const message =
    typeof error.message === 'string'
      ? error.message
      : 'Request failed unexpectedly';

  return { code, message };
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const rawText = await response.text();
    if (!rawText.trim()) {
      return null;
    }

    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

async function parseApiResult<T>(
  response: Response,
  options?: { successFallbackData?: T }
): Promise<ApiResult<T>> {
  const payload = await readResponsePayload(response);

  if (isRecord(payload) && typeof payload.success === 'boolean') {
    if (payload.success) {
      return {
        success: true,
        data: (payload.data ?? options?.successFallbackData) as T,
      };
    }

    return {
      success: false,
      error:
        normalizeErrorFromPayload(payload) ??
        ({
          code: 'UNKNOWN_ERROR',
          message: 'Request failed unexpectedly',
        } satisfies ApiError),
    };
  }

  // Backward-compatibility with environments still returning { ok, data, error }.
  if (isRecord(payload) && typeof payload.ok === 'boolean') {
    if (payload.ok) {
      return {
        success: true,
        data: (payload.data ?? options?.successFallbackData) as T,
      };
    }

    return {
      success: false,
      error:
        normalizeErrorFromPayload(payload) ??
        ({
          code: 'UNKNOWN_ERROR',
          message: 'Request failed unexpectedly',
        } satisfies ApiError),
    };
  }

  if (response.ok) {
    if (options && 'successFallbackData' in options) {
      return {
        success: true,
        data: options.successFallbackData as T,
      };
    }

    return {
      success: false,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'Server returned an unexpected success response',
      },
    };
  }

  return {
    success: false,
    error: normalizeErrorFromPayload(payload) ?? {
      code: `HTTP_${response.status}`,
      message: `Request failed with status ${response.status}`,
    },
  };
}

export async function createExpense(groupId: string, body: CreateExpenseInput) {
  const response = await fetch(`/api/groups/${groupId}/expenses`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseApiResult<ExpenseDetailsData>(response, {
    successFallbackData: {
      expense: {} as Expense,
      splits: [],
    },
  });
}

export async function getExpenseById(groupId: string, expenseId: string) {
  const response = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseApiResult<ExpenseDetailsData>(response);
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

  return parseApiResult<ExpenseDetailsData>(response);
}

export async function deleteExpense(groupId: string, expenseId: string) {
  const response = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return parseApiResult<{ success: true }>(response, {
    successFallbackData: { success: true },
  });
}
