import {
  createExpenseWithSplits,
  deleteExpenseById,
  getExpenseById,
  getExpensesByGroupIdPaginated,
  getExpenseSplitsByExpenseId,
  updateExpenseById,
  updateExpenseWithSplits,
  type ExpenseListCursor,
  type ExpenseListFilters,
} from '@/lib/repositories/expenseRepository';
import { getGroupById } from '@/lib/repositories/groupRepository';
import {
  getParticipantByGroupAndUserId,
  getParticipantsByGroupId,
} from '@/lib/repositories/participantRepository';
import { ExpenseCategories, ExpenseCategory } from '@/lib/models/expense';

export type ExpenseServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status: number } };

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
  category: string;
  split: SplitInput;
};

const expenseCategorySet = new Set<string>(ExpenseCategories);

function normalizeExpenseCategory(category: string): ExpenseCategory {
  return category.trim().toLowerCase() as ExpenseCategory;
}

function isValidExpenseCategory(category: string): category is ExpenseCategory {
  return expenseCategorySet.has(category);
}

export const DEFAULT_EXPENSE_PAGE_SIZE = 20;
const MAX_EXPENSE_PAGE_SIZE = 100;

export function encodeExpenseCursor(cursor: ExpenseListCursor): string {
  return Buffer.from(`${cursor.createdAt}|${cursor.id}`, 'utf8').toString(
    'base64url'
  );
}

function decodeExpenseCursor(raw: string): ExpenseListCursor | null {
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const separatorIndex = decoded.indexOf('|');
    if (separatorIndex === -1) {
      return null;
    }

    const createdAt = decoded.slice(0, separatorIndex);
    const id = decoded.slice(separatorIndex + 1);

    if (!createdAt || !id || Number.isNaN(Date.parse(createdAt))) {
      return null;
    }

    return { createdAt, id };
  } catch {
    return null;
  }
}

function parseIsoDateOrUndefined(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
}

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

  let remaining =
    totalAmount - withRaw.reduce((sum, share) => sum + share.amount, 0);

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
}): Promise<
  ExpenseServiceResult<{
    splits: Array<{
      participantId: string;
      owedToParticipantId: string;
      amount: number;
    }>;
  }>
> {
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
  const participantIds = new Set(
    allParticipants.map((participant) => participant.id)
  );

  if (!participantIds.has(paidByParticipantId)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Payer must be a participant in this group',
        status: 400,
      },
    };
  }

  let shares: Array<{ participantId: string; amount: number }> = [];

  if (normalizedSplit.mode === 'equal') {
    if (allParticipants.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'No participants found for equal split',
          status: 400,
        },
      };
    }

    shares = buildEqualShares(
      amount,
      allParticipants.map((participant) => participant.id)
    );
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

    const hasInvalid = selectedIds.some(
      (participantId) => !participantIds.has(participantId)
    );
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
      (share) =>
        !participantIds.has(share.participantId) || share.percentage < 0
    );
    if (hasInvalid) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message:
            'Percentage split contains invalid participants or percentages',
          status: 400,
        },
      };
    }

    const percentageSum = sharesInput.reduce(
      (sum, share) => sum + share.percentage,
      0
    );
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
        .filter(
          (share) =>
            share.amount > 0 && share.participantId !== paidByParticipantId
        )
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
}: CreateExpenseInput): Promise<
  ExpenseServiceResult<{ expense: unknown; splits: unknown[] }>
> {
  if (
    !groupId ||
    !userId ||
    !title?.trim() ||
    !currency?.trim() ||
    !paidByParticipantId ||
    !category?.trim()
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message:
          'Group ID, user ID, title, category, currency and payer are required',
        status: 400,
      },
    };
  }

  const normalizedCategory = normalizeExpenseCategory(category);

  if (!isValidExpenseCategory(normalizedCategory)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Category is invalid',
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
  const participantIds = new Set(
    allParticipants.map((participant) => participant.id)
  );

  if (!participantIds.has(paidByParticipantId)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Payer must be a participant in this group',
        status: 400,
      },
    };
  }

  let shares: Array<{ participantId: string; amount: number }> = [];

  if (split.mode === 'equal') {
    if (allParticipants.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'No participants found for equal split',
          status: 400,
        },
      };
    }

    shares = buildEqualShares(
      amount,
      allParticipants.map((participant) => participant.id)
    );
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

    const hasInvalid = selectedIds.some(
      (participantId) => !participantIds.has(participantId)
    );
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
      (share) =>
        !participantIds.has(share.participantId) || share.percentage < 0
    );
    if (hasInvalid) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message:
            'Percentage split contains invalid participants or percentages',
          status: 400,
        },
      };
    }

    const percentageSum = sharesInput.reduce(
      (sum, share) => sum + share.percentage,
      0
    );
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
    .filter(
      (share) => share.amount > 0 && share.participantId !== paidByParticipantId
    )
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
      category: normalizedCategory,
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
  limit,
  cursor,
  category,
  dateFrom,
  dateTo,
  minAmountCents,
  maxAmountCents,
  search,
}: {
  groupId: string;
  userId: string;
  limit?: number;
  cursor?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmountCents?: number;
  maxAmountCents?: number;
  search?: string;
}): Promise<
  ExpenseServiceResult<{ expenses: unknown[]; nextCursor: string | null }>
> {
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

  const pageSize = limit ?? DEFAULT_EXPENSE_PAGE_SIZE;
  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_EXPENSE_PAGE_SIZE
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: `limit must be an integer between 1 and ${MAX_EXPENSE_PAGE_SIZE}`,
        status: 400,
      },
    };
  }

  let decodedCursor: ExpenseListCursor | undefined;
  if (cursor) {
    decodedCursor = decodeExpenseCursor(cursor) ?? undefined;
    if (!decodedCursor) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'cursor is invalid',
          status: 400,
        },
      };
    }
  }

  let normalizedCategory: ExpenseCategory | undefined;
  if (category) {
    normalizedCategory = normalizeExpenseCategory(category);
    if (!isValidExpenseCategory(normalizedCategory)) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'category is invalid',
          status: 400,
        },
      };
    }
  }

  const dateFromIso = parseIsoDateOrUndefined(dateFrom);
  if (dateFrom && !dateFromIso) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'dateFrom must be a valid ISO date',
        status: 400,
      },
    };
  }

  const dateToIso = parseIsoDateOrUndefined(dateTo);
  if (dateTo && !dateToIso) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'dateTo must be a valid ISO date',
        status: 400,
      },
    };
  }

  if (
    (minAmountCents !== undefined &&
      (!Number.isInteger(minAmountCents) || minAmountCents < 0)) ||
    (maxAmountCents !== undefined &&
      (!Number.isInteger(maxAmountCents) || maxAmountCents < 0))
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message:
          'minAmountCents and maxAmountCents must be non-negative integers',
        status: 400,
      },
    };
  }

  if (
    minAmountCents !== undefined &&
    maxAmountCents !== undefined &&
    minAmountCents > maxAmountCents
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'minAmountCents cannot be greater than maxAmountCents',
        status: 400,
      },
    };
  }

  const filters: ExpenseListFilters = {
    category: normalizedCategory,
    dateFromIso,
    dateToIso,
    minAmountCents,
    maxAmountCents,
    searchTitle: search?.trim() || undefined,
  };

  const { expenses, hasMore } = await getExpensesByGroupIdPaginated({
    groupId,
    limit: pageSize,
    cursor: decodedCursor,
    filters,
  });

  const lastExpense = expenses[expenses.length - 1];
  const nextCursor =
    hasMore && lastExpense
      ? encodeExpenseCursor({
          createdAt: lastExpense.createdAt.toISOString(),
          id: lastExpense.id,
        })
      : null;

  return {
    ok: true,
    data: { expenses, nextCursor },
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
}: PatchExpenseInput): Promise<
  ExpenseServiceResult<{ expense: unknown; splits: unknown[] }>
> {
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
  const nextDescription =
    description === undefined ? expense.description : description.trim();

  let validatedCategory: ExpenseCategory | undefined;
  if (category !== undefined) {
    if (!category.trim()) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Category is required',
          status: 400,
        },
      };
    }

    const normalizedCategory = normalizeExpenseCategory(category);
    if (!isValidExpenseCategory(normalizedCategory)) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Category is invalid',
          status: 400,
        },
      };
    }

    validatedCategory = normalizedCategory;
  }

  const nextCategory = validatedCategory ?? expense.category;
  const nextCurrency = currency?.trim().toUpperCase() ?? expense.currency;
  const nextAmount = amount ?? expense.amount;
  const nextPaidByParticipantId =
    paidByParticipantId ?? expense.paidByParticipantId;

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

  if (
    !title &&
    description === undefined &&
    amount === undefined &&
    currency === undefined &&
    paidByParticipantId === undefined &&
    category === undefined &&
    split === undefined
  ) {
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
      editedByParticipantId: membership.id,
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
    editedByParticipantId: membership.id,
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
