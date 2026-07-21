import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db/db';
import { cleanupEmptyGroups } from './groupRepository';
import {
  createParticipant,
  deleteParticipantById,
  getParticipantById,
  getParticipantsByGroupId,
  getParticipantByGroupAndUserId,
  participantHasLinkedExpenses,
  linkParticipantToUser,
  removeParticipantByGroupAndUserId,
  updateParticipantById,
} from './participantRepository';

vi.mock('@/lib/db/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('./groupRepository', () => ({
  cleanupEmptyGroups: vi.fn(),
}));

function getObjectExecuteCall(index = 0) {
  const firstArg = vi.mocked(db.execute).mock.calls[index]?.[0] as unknown;

  if (!firstArg || typeof firstArg === 'string') {
    throw new Error('Expected db.execute to be called with an object-style query');
  }

  return firstArg as { sql: string; args: unknown[] };
}

describe('participantRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a participant', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      rowsAffected: 1,
    } as never);

    const participant = await createParticipant({
      groupId: 'group-1',
      displayName: 'Guest',
      userId: 'user-1',
      role: 'member',
      status: 'active',
      createdBy: 'user-1',
    });

    expect(participant).toMatchObject({
      groupId: 'group-1',
      displayName: 'Guest',
      userId: 'user-1',
      role: 'member',
      status: 'active',
      createdBy: 'user-1',
    });
    expect(participant.id).toEqual(expect.any(String));
    expect(db.execute).toHaveBeenCalledTimes(1);

    const call = getObjectExecuteCall();
    expect(call.sql).toContain('INSERT INTO group_participants');
    expect(call.args).toEqual([
      participant.id,
      'group-1',
      'Guest',
      'user-1',
      'member',
      'active',
      expect.any(String),
      expect.any(String),
      expect.any(String),
    ]);
  });

  it('links a participant to a user', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      rowsAffected: 1,
    } as never);

    await linkParticipantToUser({
      participantId: 'participant-1',
      userId: 'user-2',
    });

    expect(db.execute).toHaveBeenCalledTimes(1);
    const call = getObjectExecuteCall();
    expect(call.sql).toContain('UPDATE group_participants');
    expect(call.sql).toContain('SET user_id = ?, updated_at = ?');
    expect(call.args).toEqual(['user-2', expect.any(String), 'participant-1']);
  });

  it('gets a participant by group and user id', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [
        {
          id: 'participant-1',
          group_id: 'group-1',
          display_name: 'Guest',
          user_id: 'user-1',
          role: 'member',
          status: 'active',
          joined_at: '2024-01-01T00:00:00.000Z',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ],
      rowsAffected: 1,
    } as never);

    const participant = await getParticipantByGroupAndUserId('group-1', 'user-1');

    expect(participant).toEqual({
      id: 'participant-1',
      groupId: 'group-1',
      displayName: 'Guest',
      userId: 'user-1',
      role: 'member',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
  });

  it('returns null when participant by group and user id does not exist', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      rowsAffected: 0,
    } as never);

    await expect(getParticipantByGroupAndUserId('group-1', 'user-1')).resolves.toBeNull();
  });

  it('gets a participant by id', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [
        {
          id: 'participant-1',
          group_id: 'group-1',
          display_name: 'Guest',
          user_id: 'user-1',
          role: 'member',
          status: 'active',
          joined_at: '2024-01-01T00:00:00.000Z',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ],
      rowsAffected: 1,
    } as never);

    const participant = await getParticipantById('participant-1');

    expect(participant).toEqual({
      id: 'participant-1',
      groupId: 'group-1',
      displayName: 'Guest',
      userId: 'user-1',
      role: 'member',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
  });

  it('lists participants for a group', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [
        {
          id: 'participant-1',
          group_id: 'group-1',
          display_name: 'Guest',
          user_id: 'user-1',
          role: 'member',
          status: 'active',
          joined_at: '2024-01-01T00:00:00.000Z',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'participant-2',
          group_id: 'group-1',
          display_name: 'Visitor',
          user_id: undefined,
          role: 'viewer',
          status: 'invited',
          joined_at: '2024-01-02T00:00:00.000Z',
          created_at: '2024-01-02T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z',
        },
      ],
      rowsAffected: 2,
    } as never);

    const participants = await getParticipantsByGroupId('group-1');

    expect(participants).toEqual([
      {
        id: 'participant-1',
        groupId: 'group-1',
        displayName: 'Guest',
        userId: 'user-1',
        role: 'member',
        status: 'active',
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: 'participant-2',
        groupId: 'group-1',
        displayName: 'Visitor',
        userId: undefined,
        role: 'viewer',
        status: 'invited',
        joinedAt: new Date('2024-01-02T00:00:00.000Z'),
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      },
    ]);
  });

  it('checks whether a participant has linked expenses', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [{ one: 1 }],
      rowsAffected: 1,
    } as never);

    await expect(participantHasLinkedExpenses('participant-1')).resolves.toBe(true);

    const call = getObjectExecuteCall();
    expect(call.sql).toContain('FROM expenses');
    expect(call.sql).toContain('FROM expense_splits');
    expect(call.args).toEqual(['participant-1', 'participant-1', 'participant-1', 'participant-1']);
  });

  it('updates a participant when fields are provided', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      rowsAffected: 1,
    } as never);

    await updateParticipantById('participant-1', {
      displayName: 'New name',
      role: 'admin',
      status: 'left',
    });

    expect(db.execute).toHaveBeenCalledTimes(1);
    const [sql, args] = vi.mocked(db.execute).mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('UPDATE group_participants');
    expect(sql).toContain('display_name = ?');
    expect(sql).toContain('role = ?');
    expect(sql).toContain('status = ?');
    expect(args).toEqual(['New name', 'admin', 'left', expect.any(String), 'participant-1']);
  });

  it('does nothing when no participant updates are provided', async () => {
    await updateParticipantById('participant-1', {});

    expect(db.execute).not.toHaveBeenCalled();
  });

  it('deletes a participant and cleans up empty groups', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      rowsAffected: 1,
    } as never);

    await deleteParticipantById('participant-1');

    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(cleanupEmptyGroups).toHaveBeenCalledTimes(1);
  });

  it('removes a member from a group and cleans up empty groups', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [],
      rowsAffected: 1,
    } as never);

    await removeParticipantByGroupAndUserId('group-1', 'user-1');

    expect(db.execute).toHaveBeenCalledTimes(1);
    const [sql, args] = vi.mocked(db.execute).mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('DELETE FROM group_participants');
    expect(args).toEqual(['group-1', 'user-1']);
    expect(cleanupEmptyGroups).toHaveBeenCalledTimes(1);
  });
});
