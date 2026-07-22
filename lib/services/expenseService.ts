import {
  createExpenseWithSplits,
  deleteExpenseById,
  getExpenseById,
  getExpensesByGroupId,
  getExpenseSplitsByExpenseId,
  updateExpenseById,
  updateExpenseWithSplits,
} from '@/lib/repositories/expenseRepository';
import { getGroupById } from '@/lib/repositories/groupRepository';
import {
  getParticipantByGroupAndUserId,
  getParticipantsByGroupId,
} from '@/lib/repositories/participantRepository';

export type ExpenseServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status: number } };

type SplitMode = 'equal' | 'selected' | 'percentage';

type SplitInput =
  | {
      mode: 'equal';
    }
  | {
      mode: 'selected';
      participantIds: string[];
    }
  | {
      mode: 'percentage';
      shares: Array<{ participantId: string; percentage: number }>;
    };

type NormalizedSplit =
  | {
      mode: 'equal';
    }
  | {
      mode: 'selected';
      participantIds: string[];
    }
  | {
      mode: 'percentage';
      shares: Array<{ participantId: string; percentage: number }>;
    };

type PatchExpenseInput = {
  groupId: string;
  expenseId: string;
  userId: string;
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  paidByParticipantId?: string;
  category?: string;
  split?: SplitInput;
};

type CreateExpenseInput = {
  groupId: string;
  userId: string;
  title: string;
  amount: number;
  currency: string;
  paidByParticipantId: string;
  description?: string;
  category?: string;
  split: SplitInput;
};

function buildEqualShares(totalAmount: number, participantIds: string[]) {
  const base = Math.floor(totalAmount / participantIds.length);
  const remainder = totalAmount % participantIds.length;

  return participantIds.map((participantId, index) => ({
    participantId,
    amount: base + (index < remainder ? 1 : 0),
  }));
}

function buildPercentageShares(
  totalAmount: number,
  shares: Array<{ participantId: string; percentage: number }>
) {
  const withRaw = shares.map((share) => {
    const raw = (totalAmount * share.percentage) / 100;
    const floored = Math.floor(raw);

    return {
      participantId: share.participantId,
      amount: floored,
      fraction: raw - floored,
    };
  });

  let remaining = totalAmount - withRaw.reduce((sum, share) => sum + share.amount, 0);

  const byFraction = [...withRaw].sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < byFraction.length && remaining > 0; i += 1) {
    byFraction[i].amount += 1;
    remaining -= 1;
  }

  return withRaw.map((share) => ({
    participantId: share.participantId,
    amount: share.amount,
  }));
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function normalizeSplit(split?: SplitInput): NormalizedSplit | null {
  if (!split) {
    return null;
  }

  if (typeof split === 'string') {
    if (split === 'equal') {
      return { mode: 'equal' };
    }

    return null;
  }

  if (split.mode === 'equal') {
    return { mode: 'equal' };
  }

  if (split.mode === 'selected') {
    return {
      mode: 'selected',
      participantIds: split.participantIds ?? [],
    };
  }

  if (split.mode === 'percentage') {
    return {
      mode: 'percentage',
      shares: split.shares ?? [],
    };
  }

  return null;
}

async function resolveExpenseSplits({
  groupId,
  amount,
  paidByParticipantId,
  split,
}: {
  groupId: string;
  amount: number;
  paidByParticipantId: string;
  split: SplitInput;
}): Promise<ExpenseServiceResult<{ splits: Array<{ participantId: string; owedToParticipantId: string; amount: number }> }>> {
  const normalizedSplit = normalizeSplit(split);
  if (!normalizedSplit) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Split must be equal or a valid split configuration',
        status: 400,
      },
    };
  }

  const allParticipants = await getParticipantsByGroupId(groupId);
  const activeParticipants = allParticipants.filter((participant) => participant.status === 'active');
  const activeParticipantIds = new Set(activeParticipants.map((participant) => participant.id));

  if (!activeParticipantIds.has(paidByParticipantId)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Payer must be an active participant in this group',
        status: 400,
      },
    };
  }

  let shares: Array<{ participantId: string; amount: number }> = [];

  if (normalizedSplit.mode === 'equal') {
    if (activeParticipants.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'No active participants found for equal split',
          status: 400,
        },
      };
    }

    shares = buildEqualShares(amount, activeParticipants.map((participant) => participant.id));
  }

  if (normalizedSplit.mode === 'selected') {
    const selectedIds = unique(normalizedSplit.participantIds ?? []);
    if (selectedIds.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Selected split requires at least one participant',
          status: 400,
        },
      };
    }

    const hasInvalid = selectedIds.some((participantId) => !activeParticipantIds.has(participantId));
    if (hasInvalid) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Selected split contains participants outside the group',
          status: 400,
        },
      };
    }

    shares = buildEqualShares(amount, selectedIds);
  }

  if (normalizedSplit.mode === 'percentage') {
    const sharesInput = normalizedSplit.shares ?? [];
    if (sharesInput.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Percentage split requires at least one share',
          status: 400,
        },
      };
    }

    const uniqueIds = unique(sharesInput.map((share) => share.participantId));
    if (uniqueIds.length !== sharesInput.length) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Percentage split contains duplicated participants',
          status: 400,
        },
      };
    }

    const hasInvalid = sharesInput.some(
      (share) => !activeParticipantIds.has(share.participantId) || share.percentage < 0
    );
    if (hasInvalid) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Percentage split contains invalid participants or percentages',
          status: 400,
        },
      };
    }

    const percentageSum = sharesInput.reduce((sum, share) => sum + share.percentage, 0);
    if (Math.abs(percentageSum - 100) > 0.0001) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Percentage split must sum exactly 100',
          status: 400,
        },
      };
    }

    shares = buildPercentageShares(amount, sharesInput);
  }

  return {
    ok: true,
    data: {
      splits: shares
        .filter((share) => share.amount > 0 && share.participantId !== paidByParticipantId)
        .map((share) => ({
          participantId: share.participantId,
          owedToParticipantId: paidByParticipantId,
          amount: share.amount,
        })),
    },
  };
}

export async function createExpense({
  groupId,
  userId,
  title,
  amount,
  currency,
  paidByParticipantId,
  description,
  category,
  split,
}: CreateExpenseInput): Promise<ExpenseServiceResult<{ expense: unknown; splits: unknown[] }>> {
  if (!groupId || !userId || !title?.trim() || !currency?.trim() || !paidByParticipantId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID, user ID, title, currency and payer are required',
        status: 400,
      },
    };
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Amount must be a positive integer in cents',
        status: 400,
      },
    };
  }

  const membership = await getParticipantByGroupAndUserId(groupId, userId);
  if (!membership) {
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
          status: 404,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  if (membership.role === 'viewer') {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Viewer participants cannot create expenses',
        status: 403,
      },
    };
  }

  const allParticipants = await getParticipantsByGroupId(groupId);
  const activeParticipants = allParticipants.filter((participant) => participant.status === 'active');
  const activeParticipantIds = new Set(activeParticipants.map((participant) => participant.id));

  if (!activeParticipantIds.has(paidByParticipantId)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Payer must be an active participant in this group',
        status: 400,
      },
    };
  }

  let shares: Array<{ participantId: string; amount: number }> = [];

  if (split.mode === 'equal') {
    if (activeParticipants.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'No active participants found for equal split',
          status: 400,
        },
      };
    }

    shares = buildEqualShares(amount, activeParticipants.map((participant) => participant.id));
  }

  if (split.mode === 'selected') {
    const selectedIds = unique(split.participantIds ?? []);
    if (selectedIds.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Selected split requires at least one participant',
          status: 400,
        },
      };
    }

    const hasInvalid = selectedIds.some((participantId) => !activeParticipantIds.has(participantId));
    if (hasInvalid) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Selected split contains participants outside the group',
          status: 400,
        },
      };
    }

    shares = buildEqualShares(amount, selectedIds);
  }

  if (split.mode === 'percentage') {
    const sharesInput = split.shares ?? [];
    if (sharesInput.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Percentage split requires at least one share',
          status: 400,
        },
      };
    }

    const uniqueIds = unique(sharesInput.map((share) => share.participantId));
    if (uniqueIds.length !== sharesInput.length) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Percentage split contains duplicated participants',
          status: 400,
        },
      };
    }

    const hasInvalid = sharesInput.some(
      (share) => !activeParticipantIds.has(share.participantId) || share.percentage < 0
    );
    if (hasInvalid) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Percentage split contains invalid participants or percentages',
          status: 400,
        },
      };
    }

    const percentageSum = sharesInput.reduce((sum, share) => sum + share.percentage, 0);
    if (Math.abs(percentageSum - 100) > 0.0001) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Percentage split must sum exactly 100',
          status: 400,
        },
      };
    }

    shares = buildPercentageShares(amount, sharesInput);
  }

  const splitsToPersist = shares
    .filter((share) => share.amount > 0 && share.participantId !== paidByParticipantId)
    .map((share) => ({
      participantId: share.participantId,
      owedToParticipantId: paidByParticipantId,
      amount: share.amount,
    }));

  const expense = await createExpenseWithSplits({
    expense: {
      title: title.trim(),
      description: description?.trim(),
      amount,
      category: category?.trim(),
      currency: currency.trim().toUpperCase(),
      groupId,
      paidByParticipantId,
      createdByParticipantId: membership.id,
    },
    splits: splitsToPersist,
  });

  const persistedSplits = await getExpenseSplitsByExpenseId(expense.id);

  return {
    ok: true,
    data: {
      expense,
      splits: persistedSplits,
    },
  };
}

export async function getExpensesForGroup({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}): Promise<ExpenseServiceResult<{ expenses: unknown[] }>> {
  if (!groupId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID and user ID are required',
        status: 400,
      },
    };
  }

  const membership = await getParticipantByGroupAndUserId(groupId, userId);
  if (!membership) {
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
          status: 404,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  const expenses = await getExpensesByGroupId(groupId);

  return {
    ok: true,
    data: { expenses },
  };
}

export async function getExpenseForGroup({
  groupId,
  expenseId,
  userId,
}: {
  groupId: string;
  expenseId: string;
  userId: string;
}): Promise<ExpenseServiceResult<{ expense: unknown; splits: unknown[] }>> {
  if (!groupId || !expenseId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID, expense ID and user ID are required',
        status: 400,
      },
    };
  }

  const membership = await getParticipantByGroupAndUserId(groupId, userId);
  if (!membership) {
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
          status: 404,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  const expense = await getExpenseById(expenseId);
  if (!expense || expense.groupId !== groupId) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Expense not found',
        status: 404,
      },
    };
  }

  const splits = await getExpenseSplitsByExpenseId(expenseId);

  return {
    ok: true,
    data: { expense, splits },
  };
}

export async function deleteExpenseForGroup({
  groupId,
  expenseId,
  userId,
}: {
  groupId: string;
  expenseId: string;
  userId: string;
}): Promise<ExpenseServiceResult<{ success: true }>> {
  if (!groupId || !expenseId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID, expense ID and user ID are required',
        status: 400,
      },
    };
  }

  const membership = await getParticipantByGroupAndUserId(groupId, userId);
  if (!membership) {
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
          status: 404,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  if (membership.role !== 'owner' && membership.role !== 'admin') {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin privileges required',
        status: 403,
      },
    };
  }

  const expense = await getExpenseById(expenseId);
  if (!expense || expense.groupId !== groupId) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Expense not found',
        status: 404,
      },
    };
  }

  await deleteExpenseById(expenseId);

  return {
    ok: true,
    data: { success: true },
  };
}

export async function updateExpenseForGroup({
  groupId,
  expenseId,
  userId,
  title,
  description,
  amount,
  currency,
  paidByParticipantId,
  category,
  split,
}: PatchExpenseInput): Promise<ExpenseServiceResult<{ expense: unknown; splits: unknown[] }>> {
  if (!groupId || !expenseId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID, expense ID and user ID are required',
        status: 400,
      },
    };
  }

  const membership = await getParticipantByGroupAndUserId(groupId, userId);
  if (!membership) {
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
          status: 404,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  if (membership.role === 'viewer') {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Viewer participants cannot edit expenses',
        status: 403,
      },
    };
  }

  const expense = await getExpenseById(expenseId);
  if (!expense || expense.groupId !== groupId) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Expense not found',
        status: 404,
      },
    };
  }

  const nextTitle = title?.trim() ?? expense.title;
  const nextDescription = description === undefined ? expense.description : description.trim();
  const nextCategory = category === undefined ? expense.category : category.trim();
  const nextCurrency = currency?.trim().toUpperCase() ?? expense.currency;
  const nextAmount = amount ?? expense.amount;
  const nextPaidByParticipantId = paidByParticipantId ?? expense.paidByParticipantId;

  const amountChanged = amount !== undefined;
  const payerChanged = paidByParticipantId !== undefined;
  const splitProvided = split !== undefined;

  if ((amountChanged || payerChanged) && !splitProvided) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Split is required when changing amount or payer',
        status: 400,
      },
    };
  }

  if (!title && description === undefined && amount === undefined && currency === undefined && paidByParticipantId === undefined && category === undefined && split === undefined) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'At least one field must be provided',
        status: 400,
      },
    };
  }

  if (splitProvided) {
    const splitResult = await resolveExpenseSplits({
      groupId,
      amount: nextAmount,
      paidByParticipantId: nextPaidByParticipantId,
      split,
    });

    if (!splitResult.ok) {
      return splitResult;
    }

    await updateExpenseWithSplits({
      expenseId,
      expense: {
        title: nextTitle,
        description: nextDescription,
        amount: nextAmount,
        category: nextCategory,
        currency: nextCurrency,
        paidByParticipantId: nextPaidByParticipantId,
      },
      splits: splitResult.data.splits,
    });

    const updatedExpense = await getExpenseById(expenseId);
    const splits = await getExpenseSplitsByExpenseId(expenseId);

    return {
      ok: true,
      data: {
        expense: updatedExpense,
        splits,
      },
    };
  }

  await updateExpenseById({
    expenseId,
    expense: {
      title: nextTitle,
      description: nextDescription,
      amount: nextAmount,
      category: nextCategory,
      currency: nextCurrency,
      paidByParticipantId: nextPaidByParticipantId,
    },
  });

  const updatedExpense = await getExpenseById(expenseId);
  const splits = await getExpenseSplitsByExpenseId(expenseId);

  return {
    ok: true,
    data: {
      expense: updatedExpense,
      splits,
    },
  };
}