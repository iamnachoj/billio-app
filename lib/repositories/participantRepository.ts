import { randomUUID } from 'crypto';

import { db } from '@/lib/db/db';
import { GroupParticipant } from '@/lib/models/groupParticipant';
import { cleanupEmptyGroups } from './groupRepository';

export async function createParticipant({
  groupId,
  displayName,
  userId,
  role,
  status,
  createdBy,
}: {
  groupId: string;
  displayName: string;
  userId?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'left';
  createdBy?: string;
}) {
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO group_participants (
        id,
        group_id,
        display_name,
        user_id,
        role,
        status,
        joined_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [id, groupId, displayName, userId ?? null, role, status, now, now, now],
  });

  return {
    id,
    groupId,
    displayName,
    userId,
    role,
    status,
    joinedAt: new Date(now),
    createdAt: new Date(now),
    updatedAt: new Date(now),
    createdBy,
  } satisfies GroupParticipant & { createdBy?: string };
}

export async function linkParticipantToUser({
  participantId,
  userId,
}: {
  participantId: string;
  userId: string;
}) {
  await db.execute({
    sql: `
      UPDATE group_participants
      SET user_id = ?, updated_at = ?
      WHERE id = ?
    `,
    args: [userId, new Date().toISOString(), participantId],
  });
}

export async function getParticipantByGroupAndUserId(groupId: string, userId: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM group_participants
      WHERE group_id = ? AND user_id = ?
      LIMIT 1
    `,
    args: [groupId, userId],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id as string,
    groupId: row.group_id as string,
    displayName: row.display_name as string,
    userId: row.user_id as string | undefined,
    role: row.role as 'owner' | 'admin' | 'member' | 'viewer',
    status: row.status as 'active' | 'invited' | 'left',
    joinedAt: new Date(row.joined_at as string),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getParticipantById(participantId: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM group_participants
      WHERE id = ?
      LIMIT 1
    `,
    args: [participantId],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id as string,
    groupId: row.group_id as string,
    displayName: row.display_name as string,
    userId: row.user_id as string | undefined,
    role: row.role as 'owner' | 'admin' | 'member' | 'viewer',
    status: row.status as 'active' | 'invited' | 'left',
    joinedAt: new Date(row.joined_at as string),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getParticipantsByGroupId(groupId: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM group_participants
      WHERE group_id = ?
      ORDER BY created_at ASC
    `,
    args: [groupId],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    groupId: row.group_id as string,
    displayName: row.display_name as string,
    userId: row.user_id as string | undefined,
    role: row.role as 'owner' | 'admin' | 'member' | 'viewer',
    status: row.status as 'active' | 'invited' | 'left',
    joinedAt: new Date(row.joined_at as string),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }));
}

export async function participantHasLinkedExpenses(participantId: string) {
  const result = await db.execute({
    sql: `
      SELECT 1
      FROM expenses
      WHERE paid_by_participant_id = ? OR created_by_participant_id = ?
      UNION
      SELECT 1
      FROM expense_splits
      WHERE participant_id = ? OR owed_to_participant_id = ?
      LIMIT 1
    `,
    args: [participantId, participantId, participantId, participantId],
  });

  return result.rows.length > 0;
}

export async function updateParticipantById(participantId: string, updates: { displayName?: string; role?: 'owner' | 'admin' | 'member' | 'viewer'; status?: 'active' | 'invited' | 'left' }) {
  const fields = [] as string[];
  const args: string[] = [];

  if (updates.displayName !== undefined) {
    fields.push('display_name = ?');
    args.push(updates.displayName);
  }
  if (updates.role !== undefined) {
    fields.push('role = ?');
    args.push(updates.role);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    args.push(updates.status);
  }

  if (fields.length === 0) {
    return;
  }

  args.push(new Date().toISOString(), participantId);

  await db.execute(
    `
      UPDATE group_participants
      SET ${fields.join(', ')}, updated_at = ?
      WHERE id = ?
    `,
    args
  );
}

export async function deleteParticipantById(participantId: string) {
  await db.execute(
    `
      DELETE FROM group_participants
      WHERE id = ?
    `,
    [participantId]
  );

  await cleanupEmptyGroups();
}

export async function removeParticipantByGroupAndUserId(groupId: string, userId: string) {
  await db.execute(
    `
      DELETE FROM group_participants
      WHERE group_id = ? AND user_id = ?
    `,
    [groupId, userId]
  );

  await cleanupEmptyGroups();
}