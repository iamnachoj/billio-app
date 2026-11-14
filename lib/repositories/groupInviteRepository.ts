import { randomUUID } from 'crypto';

import { db } from '@/lib/db/db';
import { GroupInvite } from '@/lib/models/groupInvite';

export async function createGroupInvite({
  groupId,
  participantId,
  token,
  email,
  expiresAt,
  createdBy,
}: {
  groupId: string;
  participantId?: string;
  token: string;
  email?: string;
  expiresAt: string;
  createdBy: string;
}) {
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO group_invites (
        id,
        group_id,
        participant_id,
        token,
        email,
        status,
        expires_at,
        accepted_at,
        revoked_at,
        created_by,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      groupId,
      participantId ?? null,
      token,
      email ?? null,
      'pending',
      expiresAt,
      null,
      null,
      createdBy,
      now,
      now,
    ],
  });

  return {
    id,
    groupId,
    participantId,
    token,
    email,
    status: 'pending' as const,
    expiresAt: new Date(expiresAt),
    acceptedAt: undefined,
    revokedAt: undefined,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    createdBy,
  } satisfies GroupInvite;
}

export async function getGroupInviteByToken(token: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM group_invites
      WHERE token = ?
      LIMIT 1
    `,
    args: [token],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id as string,
    groupId: row.group_id as string,
    participantId: row.participant_id as string | undefined,
    token: row.token as string,
    email: row.email as string | undefined,
    status: row.status as GroupInvite['status'],
    expiresAt: new Date(row.expires_at as string),
    acceptedAt: row.accepted_at
      ? new Date(row.accepted_at as string)
      : undefined,
    revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    createdBy: row.created_by as string,
  } satisfies GroupInvite;
}

export async function acceptGroupInviteAtomically({
  inviteId,
  userId,
  participantId,
  displayName,
}: {
  inviteId: string;
  userId: string;
  participantId?: string;
  displayName?: string;
}): Promise<
  | { status: 'accepted' }
  | { status: 'group_archived' }
  | { status: 'invite_unavailable' }
  | { status: 'participant_not_found' }
  | { status: 'participant_claimed' }
> {
  const transaction = await db.transaction('write');

  try {
    const now = new Date().toISOString();
    const inviteUpdate = await transaction.execute({
      sql: `
        UPDATE group_invites
        SET status = 'accepted', accepted_at = ?, updated_at = ?
        WHERE id = ?
          AND status = 'pending'
          AND expires_at > ?
          AND EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_invites.group_id
              AND groups.archived_at IS NULL
          )
      `,
      args: [now, now, inviteId, now],
    });

    if (inviteUpdate.rowsAffected === 0) {
      const state = await transaction.execute({
        sql: `
          SELECT g.archived_at
          FROM group_invites i
          LEFT JOIN groups g ON g.id = i.group_id
          WHERE i.id = ?
        `,
        args: [inviteId],
      });
      await transaction.rollback();

      if (state.rows[0]?.archived_at) {
        return { status: 'group_archived' };
      }

      return { status: 'invite_unavailable' };
    }

    if (participantId) {
      const participantUpdate = await transaction.execute({
        sql: `
          UPDATE group_participants
          SET user_id = COALESCE(user_id, ?), status = 'active', updated_at = ?
          WHERE id = ?
            AND group_id = (
              SELECT group_id FROM group_invites WHERE id = ?
            )
            AND (user_id IS NULL OR user_id = ?)
        `,
        args: [userId, now, participantId, inviteId, userId],
      });

      if (participantUpdate.rowsAffected === 0) {
        const participant = await transaction.execute({
          sql: `
            SELECT user_id
            FROM group_participants
            WHERE id = ?
              AND group_id = (
                SELECT group_id FROM group_invites WHERE id = ?
              )
          `,
          args: [participantId, inviteId],
        });
        await transaction.rollback();

        if (!participant.rows[0]) {
          return { status: 'participant_not_found' };
        }

        return { status: 'participant_claimed' };
      }
    } else {
      if (!displayName) {
        throw new Error('Display name is required when creating a participant');
      }
      await transaction.execute({
        sql: `
          INSERT INTO group_participants (
            id, group_id, display_name, user_id, role, status,
            joined_at, created_at, updated_at
          )
          SELECT ?, group_id, ?, ?, 'member', 'active', ?, ?, ?
          FROM group_invites
          WHERE id = ?
        `,
        args: [randomUUID(), displayName, userId, now, now, now, inviteId],
      });
    }

    await transaction.commit();
    return { status: 'accepted' };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error('Failed to roll back invite acceptance', rollbackError);
    }
    throw error;
  }
}

export async function deleteGroupInviteById(id: string) {
  await db.execute({
    sql: `
      DELETE FROM group_invites
      WHERE id = ?
    `,
    args: [id],
  });
}

export async function cleanupExpiredGroupInvites() {
  const now = new Date().toISOString();
  const staleCutoff = new Date(
    Date.now() - 1000 * 60 * 60 * 24 * 7
  ).toISOString();

  await db.execute({
    sql: `
      DELETE FROM group_invites
      WHERE ((status = 'pending' AND expires_at < ?)
         OR (status IN ('accepted', 'expired', 'revoked') AND updated_at < ?))
        AND group_id IN (SELECT id FROM groups WHERE archived_at IS NULL)
    `,
    args: [now, staleCutoff],
  });
}
