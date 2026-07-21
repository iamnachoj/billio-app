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
    args: [id, groupId, participantId ?? null, token, email ?? null, 'pending', expiresAt, null, null, createdBy, now, now],
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
    acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : undefined,
    revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    createdBy: row.created_by as string,
  } satisfies GroupInvite;
}

export async function markGroupInviteAsAccepted(id: string) {
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      UPDATE group_invites
      SET status = ?, accepted_at = ?, updated_at = ?
      WHERE id = ?
    `,
    args: ['accepted', now, now, id],
  });
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
  const staleCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();

  await db.execute({
    sql: `
      DELETE FROM group_invites
      WHERE (status = 'pending' AND expires_at < ?)
         OR (status IN ('accepted', 'expired', 'revoked') AND updated_at < ?)
    `,
    args: [now, staleCutoff],
  });
}
