import { describe, expect, it } from 'vitest';

import { getExpenseById } from '../../lib/repositories/expenseRepository';
import { getParticipantsByGroupId } from '../../lib/repositories/participantRepository';
import { getGroupBalances } from '../../lib/services/balanceService';
import { createExpense, deleteExpenseForGroup } from '../../lib/services/expenseService';
import {
  addParticipantToGroup,
  createGroup,
  deleteParticipant,
  getParticipantsForGroup,
  leaveGroup,
} from '../../lib/services/groupService';

type Participant = {
  id: string;
  userId?: string | null;
  displayName: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'left';
};

async function seedGroupWithOwnerMemberAndViewer() {
  const ownerUserId = 'owner-user';
  const memberUserId = 'member-user';
  const viewerUserId = 'viewer-user';

  const groupResult = await createGroup({
    name: 'Permissions group',
    description: 'integration basics',
    createdBy: ownerUserId,
    creatorName: 'Owner',
  });

  if (!groupResult.ok) {
    throw new Error(`Failed to create group: ${groupResult.error.code}`);
  }

  const group = groupResult.data.group as { id: string };

  const memberResult = await addParticipantToGroup({
    groupId: group.id,
    displayName: 'Member',
    userId: memberUserId,
    role: 'member',
    status: 'active',
    createdBy: ownerUserId,
  });

  if (!memberResult.ok) {
    throw new Error(`Failed to create member: ${memberResult.error.code}`);
  }

  const viewerResult = await addParticipantToGroup({
    groupId: group.id,
    displayName: 'Viewer',
    userId: viewerUserId,
    role: 'viewer',
    status: 'active',
    createdBy: ownerUserId,
  });

  if (!viewerResult.ok) {
    throw new Error(`Failed to create viewer: ${viewerResult.error.code}`);
  }

  const participantsResult = await getParticipantsForGroup(group.id, ownerUserId);

  if (!participantsResult.ok) {
    throw new Error(`Failed to list participants: ${participantsResult.error.code}`);
  }

  const participants = participantsResult.data.participants as Participant[];

  const owner = participants.find((participant) => participant.userId === ownerUserId);
  const member = participants.find((participant) => participant.userId === memberUserId);
  const viewer = participants.find((participant) => participant.userId === viewerUserId);

  if (!owner || !member || !viewer) {
    throw new Error('Failed to resolve seeded participants');
  }

  return {
    groupId: group.id,
    ownerUserId,
    memberUserId,
    viewerUserId,
    ownerParticipantId: owner.id,
    memberParticipantId: member.id,
    viewerParticipantId: viewer.id,
  };
}

describe('integration: basic permission and lifecycle guards', () => {
  it('blocks non-admin users from adding participants', async () => {
    const seeded = await seedGroupWithOwnerMemberAndViewer();

    const result = await addParticipantToGroup({
      groupId: seeded.groupId,
      displayName: 'Late guest',
      role: 'member',
      status: 'active',
      createdBy: seeded.memberUserId,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected participant creation by member to fail');
    }

    expect(result.error).toEqual({
      code: 'FORBIDDEN',
      message: 'Admin privileges required',
      status: 403,
    });
  });

  it('blocks viewer users from creating expenses', async () => {
    const seeded = await seedGroupWithOwnerMemberAndViewer();

    const result = await createExpense({
      groupId: seeded.groupId,
      userId: seeded.viewerUserId,
      title: 'Should fail',
      category: 'food',
      amount: 500,
      currency: 'EUR',
      paidByParticipantId: seeded.ownerParticipantId,
      split: { mode: 'equal' },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected expense creation by viewer to fail');
    }

    expect(result.error).toEqual({
      code: 'FORBIDDEN',
      message: 'Viewer participants cannot create expenses',
      status: 403,
    });
  });

  it('blocks members from deleting expenses', async () => {
    const seeded = await seedGroupWithOwnerMemberAndViewer();

    const createdExpenseResult = await createExpense({
      groupId: seeded.groupId,
      userId: seeded.ownerUserId,
      title: 'Dinner',
      category: 'food',
      amount: 1200,
      currency: 'EUR',
      paidByParticipantId: seeded.ownerParticipantId,
      split: { mode: 'equal' },
    });

    expect(createdExpenseResult.ok).toBe(true);
    if (!createdExpenseResult.ok) {
      throw new Error('Expected expense creation to succeed');
    }

    const createdExpense = createdExpenseResult.data.expense as { id: string };

    const deleteResult = await deleteExpenseForGroup({
      groupId: seeded.groupId,
      expenseId: createdExpense.id,
      userId: seeded.memberUserId,
    });

    expect(deleteResult.ok).toBe(false);
    if (deleteResult.ok) {
      throw new Error('Expected expense deletion by member to fail');
    }

    expect(deleteResult.error).toEqual({
      code: 'FORBIDDEN',
      message: 'Admin privileges required',
      status: 403,
    });
  });

  it('allows owners to delete expenses and removes them from persistence', async () => {
    const seeded = await seedGroupWithOwnerMemberAndViewer();

    const createdExpenseResult = await createExpense({
      groupId: seeded.groupId,
      userId: seeded.ownerUserId,
      title: 'Taxi',
      category: 'travel',
      amount: 900,
      currency: 'EUR',
      paidByParticipantId: seeded.ownerParticipantId,
      split: {
        mode: 'selected',
        participantIds: [seeded.ownerParticipantId, seeded.memberParticipantId],
      },
    });

    expect(createdExpenseResult.ok).toBe(true);
    if (!createdExpenseResult.ok) {
      throw new Error('Expected expense creation to succeed');
    }

    const createdExpense = createdExpenseResult.data.expense as { id: string };

    const deleteResult = await deleteExpenseForGroup({
      groupId: seeded.groupId,
      expenseId: createdExpense.id,
      userId: seeded.ownerUserId,
    });

    expect(deleteResult).toEqual({ ok: true, data: { success: true } });

    const persistedExpense = await getExpenseById(createdExpense.id);
    expect(persistedExpense).toBeNull();
  });

  it('blocks participant deletion when participant is linked to expenses', async () => {
    const seeded = await seedGroupWithOwnerMemberAndViewer();

    const createdExpenseResult = await createExpense({
      groupId: seeded.groupId,
      userId: seeded.ownerUserId,
      title: 'Groceries',
      category: 'groceries',
      amount: 1200,
      currency: 'EUR',
      paidByParticipantId: seeded.ownerParticipantId,
      split: {
        mode: 'selected',
        participantIds: [seeded.ownerParticipantId, seeded.memberParticipantId],
      },
    });

    expect(createdExpenseResult.ok).toBe(true);
    if (!createdExpenseResult.ok) {
      throw new Error('Expected expense creation to succeed');
    }

    const deleteParticipantResult = await deleteParticipant({
      participantId: seeded.memberParticipantId,
      groupId: seeded.groupId,
      userId: seeded.ownerUserId,
    });

    expect(deleteParticipantResult.ok).toBe(false);
    if (deleteParticipantResult.ok) {
      throw new Error('Expected participant deletion with linked expenses to fail');
    }

    expect(deleteParticipantResult.error).toEqual({
      code: 'CONFLICT',
      message: 'Participant has linked expenses and cannot be deleted',
      status: 409,
    });
  });

  it('leaveGroup keeps participant history and removes active membership access', async () => {
    const seeded = await seedGroupWithOwnerMemberAndViewer();

    const leaveResult = await leaveGroup({
      groupId: seeded.groupId,
      userId: seeded.memberUserId,
    });

    expect(leaveResult).toEqual({ ok: true, data: { success: true } });

    const groupParticipants = await getParticipantsByGroupId(seeded.groupId);
    const historicalMember = groupParticipants.find(
      (participant) => participant.id === seeded.memberParticipantId
    );

    expect(historicalMember).toBeDefined();
    expect(historicalMember?.status).toBe('left');
    expect(historicalMember?.userId).toBeNull();

    const balancesAfterLeave = await getGroupBalances({
      groupId: seeded.groupId,
      userId: seeded.memberUserId,
    });

    expect(balancesAfterLeave.ok).toBe(false);
    if (balancesAfterLeave.ok) {
      throw new Error('Expected ex-member balances access to fail');
    }

    expect(balancesAfterLeave.error).toEqual({
      code: 'FORBIDDEN',
      message: 'You are not a member of this group',
      status: 403,
    });
  });
});
