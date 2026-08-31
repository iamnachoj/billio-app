import {
  countExpensesByGroupId,
  getExpensesByGroupIdPaginated,
  getExpenseSplitTotalsByDebtor,
  getExpenseSplitTotalsByOwedTo,
  getExpenseTotalsByPayer,
} from '@/lib/repositories/expenseRepository';
import { getGroupById } from '@/lib/repositories/groupRepository';
import {
  getParticipantByGroupAndUserId,
  getParticipantsByGroupId,
} from '@/lib/repositories/participantRepository';
import {
  calculateGroupBalancesFromAggregates,
  type GroupBalances,
  type BalanceServiceResult,
} from './balanceService';
import {
  DEFAULT_EXPENSE_PAGE_SIZE,
  encodeExpenseCursor,
} from './expenseService';
import { Group } from '@/lib/models/group';
import { GroupParticipant } from '@/lib/models/groupParticipant';
import { Expense } from '@/lib/models/expense';

export type GroupDetails = {
  group: Group;
  participants: GroupParticipant[];
  expenses: Expense[];
  expensesNextCursor: string | null;
  expensesTotalCount: number;
  balances: GroupBalances;
};

export type GroupDetailsResult = BalanceServiceResult<GroupDetails>;

export async function getGroupDetails(
  groupId: string,
  userId: string
): Promise<GroupDetailsResult> {
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

  const [
    group,
    participants,
    firstExpensePage,
    expensesTotalCount,
    payerTotals,
    lentTotals,
    borrowedTotals,
  ] = await Promise.all([
    getGroupById(groupId),
    getParticipantsByGroupId(groupId),
    getExpensesByGroupIdPaginated({
      groupId,
      limit: DEFAULT_EXPENSE_PAGE_SIZE,
    }),
    countExpensesByGroupId(groupId),
    getExpenseTotalsByPayer(groupId),
    getExpenseSplitTotalsByOwedTo(groupId),
    getExpenseSplitTotalsByDebtor(groupId),
  ]);

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

  const balances = calculateGroupBalancesFromAggregates({
    groupId,
    myParticipantId: membership.id,
    participants,
    payerTotals,
    lentTotals,
    borrowedTotals,
  });

  const lastExpense =
    firstExpensePage.expenses[firstExpensePage.expenses.length - 1];
  const expensesNextCursor =
    firstExpensePage.hasMore && lastExpense
      ? encodeExpenseCursor({
          createdAt: lastExpense.createdAt.toISOString(),
          id: lastExpense.id,
        })
      : null;

  return {
    ok: true,
    data: {
      group,
      participants,
      expenses: firstExpensePage.expenses,
      expensesNextCursor,
      expensesTotalCount,
      balances,
    },
  };
}
