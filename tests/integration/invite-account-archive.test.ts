import { describe, expect, it } from 'vitest';

import { db } from '../../lib/db/db';
import { cleanupEmptyGroups } from '../../lib/repositories/groupRepository';
import { cleanupExpiredGroupInvites } from '../../lib/repositories/groupInviteRepository';
import { deleteUserAccount } from '../../lib/services/authService';
import { archiveGroup, createGroup } from '../../lib/services/groupService';
import {
  acceptInvite,
  createGroupInvite,
} from '../../lib/services/inviteService';

describe('integration: invites and account deletion with archived groups', () => {
  it('commits invite acceptance atomically with the participant write and archive', async () => {
    const created = await createGroup({
      name: 'Invite race',
      createdBy: 'owner',
      creatorName: 'Owner',
    });
    if (!created.ok) throw new Error(created.error.code);

    const inviteResult = await createGroupInvite({
      groupId: created.data.group.id,
      createdBy: 'owner',
    });
    if (!inviteResult.ok) throw new Error(inviteResult.error.code);

    const token = (inviteResult.data.invite as { token: string }).token;
    const [accepted, archived] = await Promise.all([
      acceptInvite({ token, userId: 'joining-user', displayName: 'Joiner' }),
      archiveGroup({
        groupId: created.data.group.id,
        userId: 'owner',
        archived: true,
      }),
    ]);

    expect(archived.ok).toBe(true);

    const invite = await db.execute({
      sql: 'SELECT status FROM group_invites WHERE token = ?',
      args: [token],
    });
    const participant = await db.execute({
      sql: `
        SELECT id FROM group_participants
        WHERE group_id = ? AND user_id = ?
      `,
      args: [created.data.group.id, 'joining-user'],
    });

    if (accepted.ok) {
      expect(invite.rows[0].status).toBe('accepted');
      expect(participant.rows).toHaveLength(1);
    } else {
      expect(accepted.error.code).toBe('GROUP_ARCHIVED');
      expect(invite.rows[0].status).toBe('pending');
      expect(participant.rows).toHaveLength(0);
    }
  });

  it('preserves account deletion and skips archived-group cleanup writes', async () => {
    const userId = 'archived-member';
    await db.execute({
      sql: `
        INSERT INTO users (
          id, name, email, password_hash, is_active, locale, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        userId,
        'Archived member',
        'archived-member@example.com',
        'hash',
        1,
        'en',
        new Date().toISOString(),
      ],
    });

    const created = await createGroup({
      name: 'Archived account',
      createdBy: userId,
      creatorName: 'Archived member',
    });
    if (!created.ok) throw new Error(created.error.code);

    const inviteResult = await createGroupInvite({
      groupId: created.data.group.id,
      createdBy: userId,
    });
    if (!inviteResult.ok) throw new Error(inviteResult.error.code);
    const inviteId = (inviteResult.data.invite as { id: string }).id;

    const archived = await archiveGroup({
      groupId: created.data.group.id,
      userId,
      archived: true,
    });
    if (!archived.ok) throw new Error(archived.error.code);

    await expect(cleanupExpiredGroupInvites()).resolves.toBeUndefined();
    await expect(cleanupEmptyGroups()).resolves.toBeUndefined();

    const deleted = await deleteUserAccount(userId, userId);
    expect(deleted).toMatchObject({ ok: true, data: { deleted: true } });

    const user = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ?',
      args: [userId],
    });
    const group = await db.execute({
      sql: 'SELECT archived_at FROM groups WHERE id = ?',
      args: [created.data.group.id],
    });
    const participant = await db.execute({
      sql: `
        SELECT user_id FROM group_participants
        WHERE group_id = ? AND user_id = ?
      `,
      args: [created.data.group.id, userId],
    });
    const invite = await db.execute({
      sql: 'SELECT id FROM group_invites WHERE id = ?',
      args: [inviteId],
    });

    expect(user.rows).toHaveLength(0);
    expect(group.rows).toHaveLength(1);
    expect(group.rows[0].archived_at).toBeTruthy();
    expect(participant.rows).toHaveLength(1);
    expect(invite.rows).toHaveLength(1);
  });
});
