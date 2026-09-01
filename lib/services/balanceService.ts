import {
  getExpenseSplitTotalsByDebtor,
  getExpenseSplitTotalsByOwedTo,
  getExpenseTotalsByPayer,
  type CurrencyParticipantTotal,
} from '@/lib/repositories/expenseRepository';
import {
  getPaymentTotalsByReceiver,
  getPaymentTotalsBySender,
} from '@/lib/repositories/paymentRepository';
import { getGroupById } from '@/lib/repositories/groupRepository';
import {
  getParticipantByGroupAndUserId,
  getParticipantsByGroupId,
} from '@/lib/repositories/participantRepository';
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

export function calculateGroupBalancesFromAggregates({
  groupId,
  myParticipantId,
  participants,
  payerTotals,
  lentTotals,
  borrowedTotals,
  paymentsSentTotals,
  paymentsReceivedTotals,
}: {
  groupId: string;
  myParticipantId: string;
  participants: GroupParticipant[];
  payerTotals: CurrencyParticipantTotal[];
  lentTotals: CurrencyParticipantTotal[];
  borrowedTotals: CurrencyParticipantTotal[];
  paymentsSentTotals?: CurrencyParticipantTotal[];
  paymentsReceivedTotals?: CurrencyParticipantTotal[];
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
    new Set([
      ...payerTotals.map((total) => total.currency),
      ...lentTotals.map((total) => total.currency),
      ...borrowedTotals.map((total) => total.currency),
      ...(paymentsSentTotals ?? []).map((total) => total.currency),
      ...(paymentsReceivedTotals ?? []).map((total) => total.currency),
    ])
  ).sort();

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

    for (const total of payerTotals) {
      if (total.currency !== currency) {
        continue;
      }

      totalSpentCents += total.totalCents;

      const payer = participantBalancesMap.get(total.participantId);
      if (payer) {
        payer.totalSpentCents += total.totalCents;
      }
    }

    for (const total of lentTotals) {
      if (total.currency !== currency) {
        continue;
      }

      const owedTo = participantBalancesMap.get(total.participantId);
      if (owedTo) {
        owedTo.totalLentCents += total.totalCents;
      }
    }

    for (const total of borrowedTotals) {
      if (total.currency !== currency) {
        continue;
      }

      const debtor = participantBalancesMap.get(total.participantId);
      if (debtor) {
        debtor.totalBorrowedCents += total.totalCents;
      }
    }

    // Paying down a debt raises net balance; receiving a payment lowers it.
    for (const total of paymentsSentTotals ?? []) {
      if (total.currency !== currency) {
        continue;
      }

      const sender = participantBalancesMap.get(total.participantId);
      if (sender) {
        sender.netBalanceCents += total.totalCents;
      }
    }

    for (const total of paymentsReceivedTotals ?? []) {
      if (total.currency !== currency) {
        continue;
      }

      const receiver = participantBalancesMap.get(total.participantId);
      if (receiver) {
        receiver.netBalanceCents -= total.totalCents;
      }
    }

    const participantBalances = participants.map((participant) => {
      const balance = participantBalancesMap.get(participant.id)!;
      balance.netBalanceCents +=
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

  const [
    participants,
    payerTotals,
    lentTotals,
    borrowedTotals,
    paymentsSentTotals,
    paymentsReceivedTotals,
  ] = await Promise.all([
    getParticipantsByGroupId(groupId),
    getExpenseTotalsByPayer(groupId),
    getExpenseSplitTotalsByOwedTo(groupId),
    getExpenseSplitTotalsByDebtor(groupId),
    getPaymentTotalsBySender(groupId),
    getPaymentTotalsByReceiver(groupId),
  ]);

  return {
    ok: true,
    data: calculateGroupBalancesFromAggregates({
      groupId,
      myParticipantId: membership.id,
      participants,
      payerTotals,
      lentTotals,
      borrowedTotals,
      paymentsSentTotals,
      paymentsReceivedTotals,
    }),
  };
}
