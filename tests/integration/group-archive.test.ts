import { describe, expect, it } from 'vitest';

import { db } from '../../lib/db/db';
import { initDB } from '../../lib/db/init-db';
import { getGroupById } from '../../lib/repositories/groupRepository';
import { getGroupBalances } from '../../lib/services/balanceService';
import {
  createExpense,
  deleteExpenseForGroup,
  updateExpenseForGroup,
} from '../../lib/services/expenseService';
import {
  addParticipantToGroup,
  archiveGroup,
  createGroup,
  deleteParticipant,
  getParticipantsForGroup,
  leaveGroup,
  updateGroupName,
  updateParticipant,
} from '../../lib/services/groupService';
import {
  acceptInvite,
  createGroupInvite,
} from '../../lib/services/inviteService';
import {
  createSettlementPayment,
  deleteSettlementPayment,
} from '../../lib/services/paymentService';
import type { GroupParticipant } from '../../lib/models/groupParticipant';

describe('integration: group archiving', () => {
  it('requires every currency settled and makes the group read-only until restored', async () => {
    const created = await createGroup({
      name: 'Archive',
      createdBy: 'owner',
      creatorName: 'Owner',
    });
    if (!created.ok) throw new Error(created.error.code);
    const groupId = created.data.group.id;
    const member = await addParticipantToGroup({
      groupId,
      displayName: 'Member',
      userId: 'member',
      createdBy: 'owner',
    });
    if (!member.ok) throw new Error(member.error.code);
    const listed = await getParticipantsForGroup(groupId, 'owner');
    if (!listed.ok) throw new Error(listed.error.code);
    const people = listed.data.participants as GroupParticipant[];
    const owner = people.find((p) => p.userId === 'owner')!;
    const other = people.find((p) => p.userId === 'member')!;
    const invite = await createGroupInvite({ groupId, createdBy: 'owner' });
    if (!invite.ok) throw new Error(invite.error.code);
    const token = (invite.data.invite as { token: string }).token;
    const expenseIds: string[] = [];

    for (const currency of ['EUR', 'USD']) {
      const expense = await createExpense({
        groupId,
        userId: 'owner',
        title: 'Meal',
        amount: 1235,
        category: 'groceries',
        currency,
        paidByParticipantId: owner.id,
        split: { mode: 'equal' },
      });
      if (!expense.ok) throw new Error(expense.error.code);
      expenseIds.push((expense.data.expense as { id: string }).id);
    }

    expect(
      await archiveGroup({ groupId, userId: 'member', archived: true })
    ).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(
      await archiveGroup({ groupId, userId: 'owner', archived: true })
    ).toMatchObject({ ok: false, error: { code: 'GROUP_NOT_SETTLED' } });

    const balances = await getGroupBalances({ groupId, userId: 'owner' });
    if (!balances.ok) throw new Error(balances.error.code);
    const paymentIds: string[] = [];
    for (const [index, currency] of balances.data.currencies.entries()) {
      const settlement = currency.settlements[0];
      expect(settlement.amountCents).toBeGreaterThan(0);
      const paid = await createSettlementPayment({
        groupId,
        userId: 'owner',
        ...settlement,
        currency: currency.currency,
      });
      if (!paid.ok) throw new Error(paid.error.code);
      paymentIds.push(paid.data.id);
      if (index === 0) {
        expect(
          await archiveGroup({ groupId, userId: 'owner', archived: true })
        ).toMatchObject({ ok: false, error: { code: 'GROUP_NOT_SETTLED' } });
      }
    }

    const archived = await archiveGroup({
      groupId,
      userId: 'owner',
      archived: true,
    });
    if (!archived.ok) throw new Error(archived.error.code);
    expect(archived.data.group.archivedAt).toBeInstanceOf(Date);
    expect(
      await archiveGroup({ groupId, userId: 'owner', archived: true })
    ).toMatchObject({
      ok: true,
      data: { group: { archivedAt: archived.data.group.archivedAt } },
    });
    expect((await getGroupById(groupId))?.archivedAt).not.toBeNull();
    await initDB();
    expect((await getGroupById(groupId))?.archivedAt).not.toBeNull();
    expect((await getGroupBalances({ groupId, userId: 'owner' })).ok).toBe(
      true
    );

    const writes = [
      updateGroupName({ groupId, userId: 'owner', name: 'Other' }),
      leaveGroup({ groupId, userId: 'member' }),
      addParticipantToGroup({
        groupId,
        displayName: 'Extra',
        createdBy: 'owner',
      }),
      updateParticipant({
        participantId: other.id,
        userId: 'owner',
        displayName: 'Changed',
      }),
      deleteParticipant({ groupId, participantId: other.id, userId: 'owner' }),
      createGroupInvite({ groupId, createdBy: 'owner' }),
      acceptInvite({ token, userId: 'new-user', displayName: 'New' }),
      createExpense({
        groupId,
        userId: 'owner',
        title: 'Blocked',
        amount: 100,
        category: 'groceries',
        currency: 'EUR',
        paidByParticipantId: owner.id,
        split: { mode: 'equal' },
      }),
      updateExpenseForGroup({
        groupId,
        userId: 'owner',
        expenseId: expenseIds[0],
        title: 'Blocked',
      }),
      deleteExpenseForGroup({
        groupId,
        expenseId: expenseIds[0],
        userId: 'owner',
      }),
      deleteSettlementPayment({
        groupId,
        paymentId: paymentIds[0],
        userId: 'owner',
      }),
      createSettlementPayment({
        groupId,
        userId: 'owner',
        fromParticipantId: other.id,
        toParticipantId: owner.id,
        amountCents: 1,
        currency: 'EUR',
      }),
    ];
    for (const result of await Promise.all(writes)) {
      expect(result).toMatchObject({
        ok: false,
        error: { code: 'GROUP_ARCHIVED' },
      });
    }

    // Simulates a write that passed its service check before the archive committed.
    await expect(
      db.execute({
        sql: 'UPDATE payments SET amount = amount + 1 WHERE id = ?',
        args: [paymentIds[0]],
      })
    ).rejects.toThrow('GROUP_ARCHIVED');

    expect(
      await archiveGroup({ groupId, userId: 'owner', archived: false })
    ).toMatchObject({ ok: true, data: { group: { archivedAt: null } } });
    expect(
      (await updateGroupName({ groupId, userId: 'owner', name: 'Restored' })).ok
    ).toBe(true);

    const [archiveRace, paymentRace] = await Promise.allSettled([
      archiveGroup({ groupId, userId: 'owner', archived: true }),
      db.execute({
        sql: 'UPDATE payments SET amount = amount + 1 WHERE id = ?',
        args: [paymentIds[0]],
      }),
    ]);
    expect(archiveRace.status).toBe('fulfilled');
    if (archiveRace.status !== 'fulfilled') throw archiveRace.reason;
    if (archiveRace.value.ok) {
      expect(paymentRace.status).toBe('rejected');
      const current = await getGroupBalances({ groupId, userId: 'owner' });
      if (!current.ok) throw new Error(current.error.code);
      expect(
        current.data.currencies.every((currency) =>
          currency.participantBalances.every((p) => p.netBalanceCents === 0)
        )
      ).toBe(true);
    } else {
      expect(archiveRace.value.error.code).toBe('GROUP_NOT_SETTLED');
      expect(paymentRace.status).toBe('fulfilled');
    }
  });
});
