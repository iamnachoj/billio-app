import { getExpenseCategoryTotals } from '@/lib/repositories/expenseRepository';
import { getGroupById } from '@/lib/repositories/groupRepository';
import { getParticipantByGroupAndUserId } from '@/lib/repositories/participantRepository';
import { ExpenseCategory } from '@/lib/models/expense';

export type StatsServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status: number } };

export type CategoryStat = {
  category: ExpenseCategory;
  totalCents: number;
  expenseCount: number;
  percentageOfTotal: number;
};

export type GroupCategoryStats = {
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  totalSpentCents: number;
  categories: CategoryStat[];
  topCategory: CategoryStat | null;
};

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

export async function getGroupCategoryStats({
  groupId,
  userId,
  currency,
  dateFrom,
  dateTo,
}: {
  groupId: string;
  userId: string;
  currency: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<StatsServiceResult<GroupCategoryStats>> {
  if (!groupId || !userId || !currency) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID, user ID and currency are required',
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

  if (dateFrom && !parseIsoDateOrUndefined(dateFrom)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'dateFrom must be a valid ISO date',
        status: 400,
      },
    };
  }

  if (dateTo && !parseIsoDateOrUndefined(dateTo)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'dateTo must be a valid ISO date',
        status: 400,
      },
    };
  }

  const dateFromIso = parseIsoDateOrUndefined(dateFrom);
  const dateToIso = parseIsoDateOrUndefined(dateTo);

  const categoryTotals = await getExpenseCategoryTotals({
    groupId,
    currency,
    dateFromIso,
    dateToIso,
  });

  const totalSpentCents = categoryTotals.reduce(
    (sum, categoryTotal) => sum + categoryTotal.totalCents,
    0
  );

  const categories: CategoryStat[] = categoryTotals.map((categoryTotal) => ({
    ...categoryTotal,
    percentageOfTotal:
      totalSpentCents > 0
        ? (categoryTotal.totalCents / totalSpentCents) * 100
        : 0,
  }));

  return {
    ok: true,
    data: {
      currency,
      periodStart: dateFromIso ?? null,
      periodEnd: dateToIso ?? null,
      totalSpentCents,
      categories,
      topCategory: categories[0] ?? null,
    },
  };
}
