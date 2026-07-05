import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as groupRepository from '@/lib/repositories/groupRepository';
import { addParticipantToGroup, createGroup, getGroupsForUser, leaveGroup, linkParticipantToUser } from './groupService';

vi.mock('@/lib/repositories/groupRepository', () => ({
  createGroup: vi.fn(),
  addMemberToGroup: vi.fn(),
  createGroupParticipant: vi.fn(),
  linkParticipantToUser: vi.fn(),
  removeMemberFromGroup: vi.fn(),
  getGroupById: vi.fn(),
  getGroupsByUserId: vi.fn(),
  getParticipantByGroupAndUserId: vi.fn(),
  getGroupParticipantById: vi.fn(),
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
    expect(groupRepository.addMemberToGroup).toHaveBeenCalledWith('123-123-123-123-123', 'user-1', 'Alice');
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
    vi.mocked(groupRepository.getParticipantByGroupAndUserId).mockResolvedValue({
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

    expect(groupRepository.removeMemberFromGroup).toHaveBeenCalledWith('group-1', 'user-1');
  });

  it('returns not found when leaving a nonexistent group', async () => {
    vi.mocked(groupRepository.getParticipantByGroupAndUserId).mockResolvedValue(null);
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
    vi.mocked(groupRepository.getParticipantByGroupAndUserId).mockResolvedValue(null);
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
    vi.mocked(groupRepository.getParticipantByGroupAndUserId).mockResolvedValue({
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

    vi.mocked(groupRepository.createGroupParticipant).mockResolvedValue({
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

    expect(groupRepository.createGroupParticipant).toHaveBeenCalledWith({
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

    expect(groupRepository.linkParticipantToUser).toHaveBeenCalledWith({
      participantId: 'participant-1',
      userId: 'user-2',
    });
  });
});
