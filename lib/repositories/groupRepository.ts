import { randomUUID } from 'crypto';
import { db } from '@/lib/db/db';
import { Group } from '@/lib/models/group';

type CreateGroupInput = {
  name: string;
  description?: string;
  createdBy: string;
};

export async function createGroup({ name, description, createdBy }: CreateGroupInput) {
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO groups (
        id,
        name,
        description,
        created_by,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [id, name, description ?? null, createdBy, now, now],
  });

  return {
    id,
    name,
    description,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    createdBy,
  } satisfies Group;
}

export async function cleanupEmptyGroups() {
  await db.execute({
    sql: `
      DELETE FROM groups
      WHERE id IN (
        SELECT g.id
        FROM groups g
        LEFT JOIN group_participants gp ON gp.group_id = g.id
        GROUP BY g.id
        HAVING COUNT(CASE WHEN gp.user_id IS NOT NULL THEN 1 END) = 0
      )
    `,
  });
}

export async function removeUserFromAllGroups(userId: string) {
  await db.execute({
    sql: `
      DELETE FROM group_participants
      WHERE user_id = ?
    `,
    args: [userId],
  });

  await cleanupEmptyGroups();
}

export async function getGroupById(id: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM groups
      WHERE id = ?
    `,
    args: [id],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    createdBy: row.created_by as string,
  } satisfies Group;
}

export async function getGroupsByUserId(userId: string) {
  const result = await db.execute({
    sql: `
      SELECT g.*
      FROM groups g
      INNER JOIN group_participants gp ON gp.group_id = g.id
      WHERE gp.user_id = ?
      ORDER BY g.created_at DESC
    `,
    args: [userId],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    createdBy: row.created_by as string,
  }));
}
