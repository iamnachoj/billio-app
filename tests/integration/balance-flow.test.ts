import { describe, expect, it } from 'vitest';

import { getGroupBalances } from '../../lib/services/balanceService';
import {
  createExpense,
  updateExpenseForGroup,
} from '../../lib/services/expenseService';
import {
  addParticipantToGroup,
  createGroup,
  getParticipantsForGroup,
} from '../../lib/services/groupService';

type Participant = {
  id: string;
  userId?: string | null;
  displayName: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'left';
};

async function seedGroupWithThreeParticipants() {
  const ownerUserId = 'user-owner';
  const memberUserId = 'user-member';

  const groupResult = await createGroup({
    name: 'Integration group',
    description: 'integration',
    createdBy: ownerUserId,
    creatorName: 'Owner',
  });

  if (!groupResult.ok) {
    throw new Error(`Failed to create group: ${groupResult.error.code}`);
  }

  const group = groupResult.data.group as { id: string };

  const secondParticipant = await addParticipantToGroup({
    groupId: group.id,
    displayName: 'Member linked',
    userId: memberUserId,
    role: 'member',
    status: 'active',
    createdBy: ownerUserId,
  });

  if (!secondParticipant.ok) {
    throw new Error(
      `Failed to add linked member: ${secondParticipant.error.code}`
    );
  }

  const thirdParticipant = await addParticipantToGroup({
    groupId: group.id,
    displayName: 'Member unlinked',
    role: 'member',
    status: 'active',
    createdBy: ownerUserId,
  });

  if (!thirdParticipant.ok) {
    throw new Error(
      `Failed to add unlinked member: ${thirdParticipant.error.code}`
    );
  }

  const participantsResult = await getParticipantsForGroup(
    group.id,
    ownerUserId
  );

  if (!participantsResult.ok) {
    throw new Error(
      `Failed to list participants: ${participantsResult.error.code}`
    );
  }

  const participants = participantsResult.data.participants as Participant[];

  const ownerParticipant = participants.find(
    (participant) => participant.userId === ownerUserId
  );
  const linkedMember = participants.find(
    (participant) => participant.userId === memberUserId
  );
  const unlinkedMember = participants.find(
    (participant) => participant.displayName === 'Member unlinked'
  );

  if (!ownerParticipant || !linkedMember || !unlinkedMember) {
    throw new Error(
      'Failed to resolve participant identities for integration setup'
    );
  }

  return {
    groupId: group.id,
    ownerUserId,
    ownerParticipantId: ownerParticipant.id,
    linkedMemberParticipantId: linkedMember.id,
    unlinkedMemberParticipantId: unlinkedMember.id,
  };
}

describe('integration: balances from real DB data', () => {
  it('includes invited and left participants in equal expense splits', async () => {
    const seeded = await seedGroupWithThreeParticipants();

    for (const [displayName, status] of [
      ['Invited participant', 'invited'],
      ['Left participant', 'left'],
    ] as const) {
      const result = await addParticipantToGroup({
        groupId: seeded.groupId,
        displayName,
        status,
        createdBy: seeded.ownerUserId,
      });

      if (!result.ok) {
        throw new Error(
          `Failed to add ${status} participant: ${result.error.code}`
        );
      }
    }

    const participants = await getParticipantsForGroup(
      seeded.groupId,
      seeded.ownerUserId
    );
    if (!participants.ok) {
      throw new Error(
        `Failed to list participants: ${participants.error.code}`
      );
    }
    const inactiveIds = new Set(
      (participants.data.participants as Participant[])
        .filter((participant) => participant.status !== 'active')
        .map((participant) => participant.id)
    );

    const result = await createExpense({
      groupId: seeded.groupId,
      userId: seeded.ownerUserId,
      title: 'All group participants',
      category: 'groceries',
      amount: 1235,
      currency: 'EUR',
      paidByParticipantId: seeded.linkedMemberParticipantId,
      split: { mode: 'equal' },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(`Expense creation failed: ${result.error.code}`);
    }

    const storedSplits = result.data.splits as Array<{
      participantId: string;
      amount: number;
    }>;
    for (const participantId of inactiveIds) {
      expect(
        storedSplits.some((split) => split.participantId === participantId)
      ).toBe(true);
    }
    expect(storedSplits.reduce((total, split) => total + split.amount, 0)).toBe(
      988
    );
    expect(988 + 247).toBe(1235);
  });

  it('computes balances after creating an expense', async () => {
    const seeded = await seedGroupWithThreeParticipants();

    const createResult = await createExpense({
      groupId: seeded.groupId,
      userId: seeded.ownerUserId,
      title: 'Dinner',
      category: 'eating_out',
      amount: 1235,
      currency: 'EUR',
      paidByParticipantId: seeded.linkedMemberParticipantId,
      split: { mode: 'equal' },
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      throw new Error(
        `Expected expense creation to succeed: ${createResult.error.code}`
      );
    }

    const persistedSplits = createResult.data.splits as Array<{
      amount: number;
    }>;
    const persistedSplitTotal = persistedSplits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    expect(persistedSplitTotal).toBe(823);
    expect(persistedSplitTotal + 412).toBe(1235);

    const balancesResult = await getGroupBalances({
      groupId: seeded.groupId,
      userId: seeded.ownerUserId,
    });

    expect(balancesResult.ok).toBe(true);
    if (!balancesResult.ok) {
      throw new Error(
        `Expected balances to succeed: ${balancesResult.error.code}`
      );
    }

    const eur = balancesResult.data.currencies.find(
      (currency) => currency.currency === 'EUR'
    );

    expect(eur).toBeDefined();
    if (!eur) {
      throw new Error('EUR summary was expected but not found');
    }

    const ownerBalance = eur.participantBalances.find(
      (balance) => balance.participantId === seeded.ownerParticipantId
    );
    const payerBalance = eur.participantBalances.find(
      (balance) => balance.participantId === seeded.linkedMemberParticipantId
    );
    const unlinkedBalance = eur.participantBalances.find(
      (balance) => balance.participantId === seeded.unlinkedMemberParticipantId
    );

    expect(ownerBalance?.netBalanceCents).toBe(-412);
    expect(payerBalance?.netBalanceCents).toBe(823);
    expect(unlinkedBalance?.netBalanceCents).toBe(-411);
    expect(
      eur.participantBalances.reduce(
        (sum, balance) => sum + balance.netBalanceCents,
        0
      )
    ).toBe(0);

    expect(eur.settlements).toEqual([
      {
        fromParticipantId: seeded.ownerParticipantId,
        toParticipantId: seeded.linkedMemberParticipantId,
        amountCents: 412,
      },
      {
        fromParticipantId: seeded.unlinkedMemberParticipantId,
        toParticipantId: seeded.linkedMemberParticipantId,
        amountCents: 411,
      },
    ]);

    const settledBalances = new Map(
      eur.participantBalances.map((balance) => [
        balance.participantId,
        balance.netBalanceCents,
      ])
    );
    for (const settlement of eur.settlements) {
      settledBalances.set(
        settlement.fromParticipantId,
        (settledBalances.get(settlement.fromParticipantId) ?? 0) +
          settlement.amountCents
      );
      settledBalances.set(
        settlement.toParticipantId,
        (settledBalances.get(settlement.toParticipantId) ?? 0) -
          settlement.amountCents
      );
    }
    expect(
      [...settledBalances.values()].every((balance) => balance === 0)
    ).toBe(true);
  });

  it('recomputes balances after editing an expense amount with split', async () => {
    const seeded = await seedGroupWithThreeParticipants();

    const createResult = await createExpense({
      groupId: seeded.groupId,
      userId: seeded.ownerUserId,
      title: 'Groceries',
      category: 'groceries',
      amount: 900,
      currency: 'EUR',
      paidByParticipantId: seeded.ownerParticipantId,
      split: {
        mode: 'selected',
        participantIds: [
          seeded.ownerParticipantId,
          seeded.linkedMemberParticipantId,
        ],
      },
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      throw new Error(
        `Expected expense creation to succeed: ${createResult.error.code}`
      );
    }

    const createdExpense = createResult.data.expense as { id: string };

    const updateResult = await updateExpenseForGroup({
      groupId: seeded.groupId,
      expenseId: createdExpense.id,
      userId: seeded.ownerUserId,
      amount: 1200,
      split: {
        mode: 'selected',
        participantIds: [
          seeded.ownerParticipantId,
          seeded.linkedMemberParticipantId,
        ],
      },
    });

    expect(updateResult.ok).toBe(true);
    if (!updateResult.ok) {
      throw new Error(
        `Expected expense update to succeed: ${updateResult.error.code}`
      );
    }

    const balancesResult = await getGroupBalances({
      groupId: seeded.groupId,
      userId: seeded.ownerUserId,
    });

    expect(balancesResult.ok).toBe(true);
    if (!balancesResult.ok) {
      throw new Error(
        `Expected balances to succeed: ${balancesResult.error.code}`
      );
    }

    const eur = balancesResult.data.currencies.find(
      (currency) => currency.currency === 'EUR'
    );

    expect(eur).toBeDefined();
    if (!eur) {
      throw new Error('EUR summary was expected but not found');
    }

    const ownerBalance = eur.participantBalances.find(
      (balance) => balance.participantId === seeded.ownerParticipantId
    );
    const memberBalance = eur.participantBalances.find(
      (balance) => balance.participantId === seeded.linkedMemberParticipantId
    );

    expect(ownerBalance?.netBalanceCents).toBe(600);
    expect(memberBalance?.netBalanceCents).toBe(-600);

    expect(eur.settlements).toEqual([
      {
        fromParticipantId: seeded.linkedMemberParticipantId,
        toParticipantId: seeded.ownerParticipantId,
        amountCents: 600,
      },
    ]);
  });
});
