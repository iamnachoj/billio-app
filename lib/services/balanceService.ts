import {
  getExpensesByGroupId,
  getExpenseSplitsByGroupId,
} from '@/lib/repositories/expenseRepository';
import { getGroupById } from '@/lib/repositories/groupRepository';
import {
  getParticipantByGroupAndUserId,
  getParticipantsByGroupId,
} from '@/lib/repositories/participantRepository';
import { Expense } from '@/lib/models/expense';
import { ExpenseSplit } from '@/lib/models/expenseSplit';
import { GroupParticipant } from '@/lib/models/groupParticipant';

export type BalanceServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status: number } };

type ParticipantBalance = {
  participantId: string;
  totalSpentCents: number;
  totalLentCents: number;
  totalBorrowedCents: number;
  netBalanceCents: number;
  position: 'creditor' | 'debtor' | 'settled';
};

type Settlement = {
  fromParticipantId: string;
  toParticipantId: string;
  amountCents: number;
};

type CurrencySummary = {
  currency: string;
  totals: {
    totalSpentCents: number;
    totalLentCents: number;
    totalBorrowedCents: number;
  };
  participantBalances: ParticipantBalance[];
  settlements: Settlement[];
  meta: {
    algorithm: 'min-transfers-greedy-v1';
    minimalTransfersCount: number;
  };
};

type ParticipantInfo = {
  id: string;
  displayName: string;
  userId: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'left';
};

export type GroupBalances = {
  groupId: string;
  calculatedAt: string;
  myParticipantId: string;
  participants: ParticipantInfo[];
  currencies: CurrencySummary[];
};

function buildSettlements(
  participantBalances: ParticipantBalance[]
): Settlement[] {
  const creditors = participantBalances
    .filter((participant) => participant.netBalanceCents > 0)
    .map((participant) => ({
      participantId: participant.participantId,
      amountCents: participant.netBalanceCents,
    }))
    .sort(
      (a, b) =>
        b.amountCents - a.amountCents ||
        a.participantId.localeCompare(b.participantId)
    );

  const debtors = participantBalances
    .filter((participant) => participant.netBalanceCents < 0)
    .map((participant) => ({
      participantId: participant.participantId,
      amountCents: Math.abs(participant.netBalanceCents),
    }))
    .sort(
      (a, b) =>
        b.amountCents - a.amountCents ||
        a.participantId.localeCompare(b.participantId)
    );

  const settlements: Settlement[] = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const amountCents = Math.min(creditor.amountCents, debtor.amountCents);

    if (amountCents > 0) {
      settlements.push({
        fromParticipantId: debtor.participantId,
        toParticipantId: creditor.participantId,
        amountCents,
      });
    }

    creditor.amountCents -= amountCents;
    debtor.amountCents -= amountCents;

    if (creditor.amountCents === 0) {
      creditorIndex += 1;
    }

    if (debtor.amountCents === 0) {
      debtorIndex += 1;
    }
  }

  return settlements;
}

export function calculateGroupBalancesFromData({
  groupId,
  myParticipantId,
  participants,
  expenses,
  splits,
}: {
  groupId: string;
  myParticipantId: string;
  participants: GroupParticipant[];
  expenses: Expense[];
  splits: ExpenseSplit[];
}): GroupBalances {
  const participantInfos: ParticipantInfo[] = participants.map(
    (participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      userId: participant.userId ?? null,
      role: participant.role,
      status: participant.status,
    })
  );

  const currencies = Array.from(
    new Set(expenses.map((expense) => expense.currency))
  ).sort();

  const expenseCurrencyById = new Map(
    expenses.map((expense) => [expense.id, expense.currency])
  );

  const currencySummaries: CurrencySummary[] = currencies.map((currency) => {
    const participantBalancesMap = new Map<string, ParticipantBalance>();

    for (const participant of participants) {
      participantBalancesMap.set(participant.id, {
        participantId: participant.id,
        totalSpentCents: 0,
        totalLentCents: 0,
        totalBorrowedCents: 0,
        netBalanceCents: 0,
        position: 'settled',
      });
    }

    let totalSpentCents = 0;

    for (const expense of expenses) {
      if (expense.currency !== currency) {
        continue;
      }

      totalSpentCents += expense.amount;

      const payer = participantBalancesMap.get(expense.paidByParticipantId);
      if (payer) {
        payer.totalSpentCents += expense.amount;
      }
    }

    for (const split of splits) {
      const splitCurrency = expenseCurrencyById.get(split.expenseId);
      if (splitCurrency !== currency) {
        continue;
      }

      const owedTo = participantBalancesMap.get(split.owedToParticipantId);
      if (owedTo) {
        owedTo.totalLentCents += split.amount;
      }

      const debtor = participantBalancesMap.get(split.participantId);
      if (debtor) {
        debtor.totalBorrowedCents += split.amount;
      }
    }

    const participantBalances = participants.map((participant) => {
      const balance = participantBalancesMap.get(participant.id)!;
      balance.netBalanceCents =
        balance.totalLentCents - balance.totalBorrowedCents;
      balance.position =
        balance.netBalanceCents > 0
          ? 'creditor'
          : balance.netBalanceCents < 0
            ? 'debtor'
            : 'settled';

      return balance;
    });

    const totalLentCents = participantBalances.reduce(
      (sum, participant) => sum + participant.totalLentCents,
      0
    );
    const totalBorrowedCents = participantBalances.reduce(
      (sum, participant) => sum + participant.totalBorrowedCents,
      0
    );

    const settlements = buildSettlements(participantBalances);

    return {
      currency,
      totals: {
        totalSpentCents,
        totalLentCents,
        totalBorrowedCents,
      },
      participantBalances,
      settlements,
      meta: {
        algorithm: 'min-transfers-greedy-v1',
        minimalTransfersCount: settlements.length,
      },
    };
  });

  return {
    groupId,
    calculatedAt: new Date().toISOString(),
    myParticipantId,
    participants: participantInfos,
    currencies: currencySummaries,
  };
}

export async function getGroupBalances({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}): Promise<BalanceServiceResult<GroupBalances>> {
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

  const [participants, expenses, splits] = await Promise.all([
    getParticipantsByGroupId(groupId),
    getExpensesByGroupId(groupId),
    getExpenseSplitsByGroupId(groupId),
  ]);

  return {
    ok: true,
    data: calculateGroupBalancesFromData({
      groupId,
      myParticipantId: membership.id,
      participants,
      expenses,
      splits,
    }),
  };
}
