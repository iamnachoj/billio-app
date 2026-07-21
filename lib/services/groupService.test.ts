import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as groupRepository from '@/lib/repositories/groupRepository';
import * as participantRepository from '@/lib/repositories/participantRepository';
import { addParticipantToGroup, createGroup, deleteParticipant, getGroupsForUser, leaveGroup, linkParticipantToUser } from './groupService';

vi.mock('@/lib/repositories/groupRepository', () => ({
  createGroup: vi.fn(),
  getGroupById: vi.fn(),
  getGroupsByUserId: vi.fn(),
}));

vi.mock('@/lib/repositories/participantRepository', () => ({
  createParticipant: vi.fn(),
  linkParticipantToUser: vi.fn(),
  deleteParticipantById: vi.fn(),
  removeParticipantByGroupAndUserId: vi.fn(),
  getParticipantByGroupAndUserId: vi.fn(),
  getParticipantById: vi.fn(),
  getParticipantsByGroupId: vi.fn(),
  participantHasLinkedExpenses: vi.fn(),
  updateParticipantById: vi.fn(),
}));

describe('groupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a group and adds the creator as a member', async () => {
    vi.mocked(groupRepository.createGroup).mockResolvedValue({
      id: '123-123-123-123-123',
      name: 'Trip',
      description: 'Weekend trip',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-1',
    });

    const result = await createGroup({
      name: 'Trip',
      description: 'Weekend trip',
      createdBy: 'user-1',
      creatorName: 'Alice',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected group creation to succeed');
    }

    expect(result.data.group).toEqual({
      id: '123-123-123-123-123',
      name: 'Trip',
      description: 'Weekend trip',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-1',
    });
    expect(groupRepository.createGroup).toHaveBeenCalledWith({
      name: 'Trip',
      description: 'Weekend trip',
      createdBy: 'user-1',
    });
    expect(participantRepository.createParticipant).toHaveBeenCalledWith({
      groupId: '123-123-123-123-123',
      displayName: 'Alice',
      userId: 'user-1',
      role: 'owner',
      status: 'active',
      createdBy: 'user-1',
    });
  });

  it('rejects invalid input', async () => {
    const result = await createGroup({
      name: '   ',
      description: 'Weekend trip',
      createdBy: 'user-1',
      creatorName: 'Alice',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid input to be rejected');
    }

    expect(result.error).toEqual({
      code: 'INVALID_INPUT',
      message: 'Name is required',
      status: 400,
    });
  });

  it('returns the groups for a user', async () => {
    vi.mocked(groupRepository.getGroupsByUserId).mockResolvedValue([
      {
        id: 'group-1',
        name: 'Trip',
        description: 'Weekend trip',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdBy: 'user-1',
      },
    ]);

    const result = await getGroupsForUser('user-1');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected groups lookup to succeed');
    }

    expect(result.data.groups).toEqual([
      {
        id: 'group-1',
        name: 'Trip',
        description: 'Weekend trip',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdBy: 'user-1',
      },
    ]);
  });

  it('allows a user to leave a group without deleting the group history', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      id: 'participant-1',
      groupId: 'group-1',
      displayName: 'Owner',
      userId: 'user-1',
      role: 'owner',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const result = await leaveGroup({ groupId: 'group-1', userId: 'user-1' });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected leaving the group to succeed');
    }

    expect(participantRepository.removeParticipantByGroupAndUserId).toHaveBeenCalledWith('group-1', 'user-1');
  });

  it('returns not found when leaving a nonexistent group', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue(null);
    vi.mocked(groupRepository.getGroupById).mockResolvedValue(null);

    const result = await leaveGroup({ groupId: 'missing-group', userId: 'user-1' });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected failure result');
    }

    expect(result.error).toEqual({
      code: 'NOT_FOUND',
      message: 'Group not found',
      status: 404,
    });
  });

  it('returns forbidden when a user leaves a group they do not belong to', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue(null);
    vi.mocked(groupRepository.getGroupById).mockResolvedValue({
      id: 'group-1',
      name: 'Trip',
      description: 'Weekend trip',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-2',
    });

    const result = await leaveGroup({ groupId: 'group-1', userId: 'user-1' });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected failure result');
    }

    expect(result.error).toEqual({
      code: 'FORBIDDEN',
      message: 'You are not a member of this group',
      status: 403,
    });
  });

  it('adds a named participant to a group', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      id: 'participant-1',
      groupId: 'group-1',
      displayName: 'Owner',
      userId: 'user-1',
      role: 'owner',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    vi.mocked(participantRepository.createParticipant).mockResolvedValue({
      id: '123-123-123-123-123',
      groupId: 'group-1',
      displayName: 'Ana',
      userId: undefined,
      role: 'member',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-1',
    });

    const result = await addParticipantToGroup({
      groupId: 'group-1',
      displayName: 'Ana',
      createdBy: 'user-1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected participant creation to succeed');
    }

    expect(participantRepository.createParticipant).toHaveBeenCalledWith({
      groupId: 'group-1',
      displayName: 'Ana',
      userId: undefined,
      role: 'member',
      status: 'active',
      createdBy: 'user-1',
    });
  });

  it('links a participant to a registered user account', async () => {
    const result = await linkParticipantToUser({
      participantId: 'participant-1',
      userId: 'user-2',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected linking to succeed');
    }

    expect(participantRepository.linkParticipantToUser).toHaveBeenCalledWith({
      participantId: 'participant-1',
      userId: 'user-2',
    });
  });

  it('deletes a participant when it has no linked expenses', async () => {
    vi.mocked(participantRepository.getParticipantById).mockResolvedValue({
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
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      id: 'participant-admin',
      groupId: 'group-1',
      displayName: 'Owner',
      userId: 'admin-1',
      role: 'owner',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    vi.mocked(participantRepository.participantHasLinkedExpenses).mockResolvedValue(false);

    const result = await deleteParticipant({
      participantId: 'participant-1',
      userId: 'admin-1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected participant deletion to succeed');
    }

    expect(participantRepository.participantHasLinkedExpenses).toHaveBeenCalledWith('participant-1');
    expect(participantRepository.deleteParticipantById).toHaveBeenCalledWith('participant-1');
  });

  it('rejects deleting a participant that already has linked expenses', async () => {
    vi.mocked(participantRepository.getParticipantById).mockResolvedValue({
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
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      id: 'participant-admin',
      groupId: 'group-1',
      displayName: 'Owner',
      userId: 'admin-1',
      role: 'owner',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    vi.mocked(participantRepository.participantHasLinkedExpenses).mockResolvedValue(true);

    const result = await deleteParticipant({
      participantId: 'participant-1',
      userId: 'admin-1',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected participant deletion to fail');
    }

    expect(result.error).toEqual({
      code: 'CONFLICT',
      message: 'Participant has linked expenses and cannot be deleted',
      status: 409,
    });
    expect(participantRepository.deleteParticipantById).not.toHaveBeenCalled();
  });

  it('rejects deleting an admin participant', async () => {
    vi.mocked(participantRepository.getParticipantById).mockResolvedValue({
      id: 'participant-1',
      groupId: 'group-1',
      displayName: 'Moderator',
      userId: 'user-1',
      role: 'admin',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      id: 'participant-admin',
      groupId: 'group-1',
      displayName: 'Owner',
      userId: 'admin-1',
      role: 'owner',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const result = await deleteParticipant({
      participantId: 'participant-1',
      groupId: 'group-1',
      userId: 'admin-1',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected participant deletion to fail');
    }

    expect(result.error).toEqual({
      code: 'FORBIDDEN',
      message: 'Admin participants cannot be deleted',
      status: 403,
    });
    expect(participantRepository.deleteParticipantById).not.toHaveBeenCalled();
  });

  it('rejects deleting any participant when the caller is not an admin', async () => {
    vi.mocked(participantRepository.getParticipantById).mockResolvedValue({
      id: 'participant-1',
      groupId: 'group-1',
      displayName: 'Guest',
      userId: 'user-2',
      role: 'member',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      id: 'participant-member',
      groupId: 'group-1',
      displayName: 'Member',
      userId: 'user-1',
      role: 'member',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const result = await deleteParticipant({
      participantId: 'participant-1',
      groupId: 'group-1',
      userId: 'user-1',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected participant deletion to fail');
    }

    expect(result.error).toEqual({
      code: 'FORBIDDEN',
      message: 'Admin privileges required',
      status: 403,
    });
    expect(participantRepository.deleteParticipantById).not.toHaveBeenCalled();
  });
});
