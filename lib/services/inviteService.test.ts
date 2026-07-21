import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as groupRepository from '@/lib/repositories/groupRepository';
import * as groupInviteRepository from '@/lib/repositories/groupInviteRepository';
import * as participantRepository from '@/lib/repositories/participantRepository';
import { acceptInvite, createGroupInvite, getInviteByToken } from './inviteService';

vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(() => ({ toString: () => 'invite-token' })),
  },
}));

vi.mock('@/lib/repositories/groupRepository', () => ({
  getGroupById: vi.fn(),
}));

vi.mock('@/lib/repositories/participantRepository', () => ({
  getParticipantByGroupAndUserId: vi.fn(),
  getParticipantById: vi.fn(),
  updateParticipantById: vi.fn(),
  linkParticipantToUser: vi.fn(),
  createParticipant: vi.fn(),
}));

vi.mock('@/lib/repositories/groupInviteRepository', () => ({
  cleanupExpiredGroupInvites: vi.fn(),
  createGroupInvite: vi.fn(),
  getGroupInviteByToken: vi.fn(),
}));

describe('inviteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a reusable group invite link for an admin user', async () => {
    vi.mocked(groupRepository.getGroupById).mockResolvedValue({
      id: 'group-1',
      name: 'Trip',
      description: 'Weekend trip',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-1',
    });
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      id: 'participant-admin',
      groupId: 'group-1',
      displayName: 'Owner',
      userId: 'user-1',
      role: 'owner',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    vi.mocked(groupInviteRepository.createGroupInvite).mockResolvedValue({
      id: 'invite-1-a-b-c-d',
      groupId: 'group-1',
      participantId: undefined,
      token: 'invite-token',
      email: undefined,
      status: 'pending',
      expiresAt: new Date('2024-01-08T00:00:00.000Z'),
      acceptedAt: undefined,
      revokedAt: undefined,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-1',
    });

    const result = await createGroupInvite({
      groupId: 'group-1',
      createdBy: 'user-1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected invite creation to succeed');
    }

    expect(groupInviteRepository.createGroupInvite).toHaveBeenCalledWith({
      groupId: 'group-1',
      token: 'invite-token',
      email: undefined,
      expiresAt: expect.any(String),
      createdBy: 'user-1',
    });
  });

  it('accepts a link invite by claiming an existing participant', async () => {
    vi.mocked(groupInviteRepository.getGroupInviteByToken).mockResolvedValue({
      id: 'invite-1-a-b-c-d',
      groupId: 'group-1',
      participantId: undefined,
      token: 'invite-token',
      email: undefined,
      status: 'pending',
      expiresAt: new Date(Date.now() + 60_000),
      acceptedAt: undefined,
      revokedAt: undefined,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-1',
    });
    vi.mocked(participantRepository.getParticipantById).mockResolvedValue({
      id: 'participant-1',
      groupId: 'group-1',
      displayName: 'Guest',
      userId: undefined,
      role: 'member',
      status: 'invited',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const result = await acceptInvite({
      token: 'invite-token',
      userId: 'user-2',
      participantId: 'participant-1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected invite acceptance to succeed');
    }

    expect(participantRepository.updateParticipantById).toHaveBeenCalledWith('participant-1', {
      status: 'active',
    });
    expect(participantRepository.linkParticipantToUser).toHaveBeenCalledWith({
      participantId: 'participant-1',
      userId: 'user-2',
    });
  });

  it('accepts a link invite by creating a new participant', async () => {
    vi.mocked(groupInviteRepository.getGroupInviteByToken).mockResolvedValue({
      id: 'invite-1-a-b-c-d',
      groupId: 'group-1',
      participantId: undefined,
      token: 'invite-token',
      email: undefined,
      status: 'pending',
      expiresAt: new Date(Date.now() + 60_000),
      acceptedAt: undefined,
      revokedAt: undefined,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-1',
    });

    const result = await acceptInvite({
      token: 'invite-token',
      userId: 'user-2',
      displayName: 'Carlos',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected invite acceptance to succeed');
    }

    expect(participantRepository.createParticipant).toHaveBeenCalledWith({
      groupId: 'group-1',
      displayName: 'Carlos',
      userId: 'user-2',
      role: 'member',
      status: 'active',
      createdBy: 'user-2',
    });
  });

  it('returns an invite when the token is valid', async () => {
    vi.mocked(groupInviteRepository.getGroupInviteByToken).mockResolvedValue({
      id: 'invite-1-a-b-c-d',
      groupId: 'group-1',
      participantId: undefined,
      token: 'invite-token',
      email: 'guest@example.com',
      status: 'pending',
      expiresAt: new Date(Date.now() + 60_000),
      acceptedAt: undefined,
      revokedAt: undefined,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-1',
    });

    const result = await getInviteByToken('invite-token');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected invite lookup to succeed');
    }

    expect(result.data.invite).toEqual(expect.objectContaining({
      token: 'invite-token',
      groupId: 'group-1',
    }));
  });
});
