import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as groups from '@/lib/repositories/groupRepository';
import * as participants from '@/lib/repositories/participantRepository';
import { archiveGroup, updateGroupName } from '../groupService';

vi.mock('@/lib/repositories/groupRepository', () => ({
  cleanupEmptyGroups: vi.fn(),
  createGroup: vi.fn(),
  getGroupById: vi.fn(),
  getGroupsByUserId: vi.fn(),
  setGroupArchived: vi.fn(),
  updateGroupById: vi.fn(),
}));
vi.mock('@/lib/repositories/participantRepository', () => ({
  createParticipant: vi.fn(),
  deleteParticipantById: vi.fn(),
  getParticipantById: vi.fn(),
  getParticipantsByGroupId: vi.fn(),
  getParticipantByGroupAndUserId: vi.fn(),
  participantHasLinkedExpenses: vi.fn(),
  linkParticipantToUser: vi.fn(),
  updateParticipantById: vi.fn(),
}));

const group = {
  id: 'group',
  name: 'Group',
  description: undefined,
  createdBy: 'owner',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  archivedAt: null as Date | null,
};
const participant = {
  id: 'participant',
  groupId: 'group',
  displayName: 'Owner',
  userId: 'owner',
  role: 'owner' as const,
  status: 'active' as const,
  joinedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('group archiving', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(groups.getGroupById).mockResolvedValue(group);
    vi.mocked(participants.getParticipantByGroupAndUserId).mockResolvedValue(
      participant
    );
    vi.mocked(groups.setGroupArchived).mockResolvedValue(true);
  });

  it.each([true, false])('sets archived=%s for an owner', async (archived) => {
    const updated = { ...group, archivedAt: archived ? new Date() : null };
    vi.mocked(groups.getGroupById)
      .mockResolvedValueOnce(group)
      .mockResolvedValueOnce(updated);
    const result = await archiveGroup({
      groupId: 'group',
      userId: 'owner',
      archived,
    });
    expect(result).toEqual({ ok: true, data: { group: updated } });
    expect(groups.setGroupArchived).toHaveBeenCalledWith(
      'group',
      'owner',
      archived
    );
  });

  it('allows admins and rejects non-members', async () => {
    vi.mocked(participants.getParticipantByGroupAndUserId).mockResolvedValue({
      ...participant,
      role: 'admin',
    });
    expect(
      await archiveGroup({ groupId: 'group', userId: 'owner', archived: true })
    ).toMatchObject({ ok: true });

    vi.mocked(participants.getParticipantByGroupAndUserId).mockResolvedValue(
      null
    );
    expect(
      await archiveGroup({
        groupId: 'group',
        userId: 'stranger',
        archived: true,
      })
    ).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });

  it('rejects invalid input and missing groups', async () => {
    expect(
      await archiveGroup({ groupId: '', userId: 'owner', archived: true })
    ).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } });
    vi.mocked(groups.getGroupById).mockResolvedValue(null);
    expect(
      await archiveGroup({
        groupId: 'missing',
        userId: 'owner',
        archived: true,
      })
    ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });

  it.each(['member', 'viewer'] as const)('rejects role %s', async (role) => {
    vi.mocked(participants.getParticipantByGroupAndUserId).mockResolvedValue({
      ...participant,
      role,
    });
    expect(
      await archiveGroup({ groupId: 'group', userId: 'owner', archived: true })
    ).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(groups.setGroupArchived).not.toHaveBeenCalled();
  });

  it('rejects unsettled groups', async () => {
    vi.mocked(groups.setGroupArchived).mockResolvedValue(false);
    expect(
      await archiveGroup({ groupId: 'group', userId: 'owner', archived: true })
    ).toMatchObject({
      ok: false,
      error: { code: 'GROUP_NOT_SETTLED', status: 409 },
    });
  });

  it('rechecks authorization when the atomic update loses a role race', async () => {
    vi.mocked(groups.setGroupArchived).mockResolvedValue(false);
    vi.mocked(participants.getParticipantByGroupAndUserId)
      .mockResolvedValueOnce(participant)
      .mockResolvedValueOnce(null);
    expect(
      await archiveGroup({ groupId: 'group', userId: 'owner', archived: true })
    ).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });

  it('rejects ordinary writes to archived groups', async () => {
    vi.mocked(groups.getGroupById).mockResolvedValue({
      ...group,
      archivedAt: new Date(),
    });
    expect(
      await updateGroupName({ groupId: 'group', userId: 'owner', name: 'New' })
    ).toMatchObject({
      ok: false,
      error: { code: 'GROUP_ARCHIVED', status: 409 },
    });
    expect(groups.updateGroupById).not.toHaveBeenCalled();
  });
});
