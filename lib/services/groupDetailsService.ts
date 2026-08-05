import {
  getExpensesByGroupId,
  getExpenseSplitsByGroupId,
} from '@/lib/repositories/expenseRepository';
import { getGroupById } from '@/lib/repositories/groupRepository';
import {
  getParticipantByGroupAndUserId,
  getParticipantsByGroupId,
} from '@/lib/repositories/participantRepository';
import {
  calculateGroupBalancesFromData,
  type GroupBalances,
  type BalanceServiceResult,
} from './balanceService';
import { Group } from '@/lib/models/group';
import { GroupParticipant } from '@/lib/models/groupParticipant';
import { Expense } from '@/lib/models/expense';

export type GroupDetails = {
  group: Group;
  participants: GroupParticipant[];
  expenses: Expense[];
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

  const [group, participants, expenses, splits] = await Promise.all([
    getGroupById(groupId),
    getParticipantsByGroupId(groupId),
    getExpensesByGroupId(groupId),
    getExpenseSplitsByGroupId(groupId),
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

  const balances = calculateGroupBalancesFromData({
    groupId,
    myParticipantId: membership.id,
    participants,
    expenses,
    splits,
  });

  return {
    ok: true,
    data: {
      group,
      participants,
      expenses,
      balances,
    },
  };
}
