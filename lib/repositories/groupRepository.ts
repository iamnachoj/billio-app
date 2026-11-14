import { randomUUID } from 'crypto';
import { db } from '@/lib/db/db';
import { Group } from '@/lib/models/group';

type CreateGroupInput = {
  name: string;
  description?: string;
  createdBy: string;
};

export async function createGroup({
  name,
  description,
  createdBy,
}: CreateGroupInput) {
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
    archivedAt: null,
    createdBy,
  } satisfies Group;
}

export async function cleanupEmptyGroups() {
  const emptyGroupsSubquery = `
    SELECT g.id
    FROM groups g
    LEFT JOIN group_participants gp ON gp.group_id = g.id
    WHERE g.archived_at IS NULL
    GROUP BY g.id
    HAVING COUNT(CASE WHEN gp.user_id IS NOT NULL THEN 1 END) = 0
  `;

  await db.batch(
    [
      {
        sql: `
          DELETE FROM expense_splits
          WHERE expense_id IN (
            SELECT e.id
            FROM expenses e
            WHERE e.group_id IN (${emptyGroupsSubquery})
          )
        `,
      },
      {
        sql: `
          DELETE FROM expenses
          WHERE group_id IN (${emptyGroupsSubquery})
        `,
      },
      {
        sql: `
          DELETE FROM group_invites
          WHERE group_id IN (${emptyGroupsSubquery})
        `,
      },
      {
        sql: `
          DELETE FROM group_participants
          WHERE group_id IN (${emptyGroupsSubquery})
        `,
      },
      {
        sql: `
          DELETE FROM groups
          WHERE id IN (${emptyGroupsSubquery})
        `,
      },
    ],
    'write'
  );
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
    archivedAt: row.archived_at ? new Date(row.archived_at as string) : null,
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
    archivedAt: row.archived_at ? new Date(row.archived_at as string) : null,
    createdBy: row.created_by as string,
  }));
}

// The role and all currency balances are checked in the same write statement
// as the transition, so a concurrent payment cannot invalidate the snapshot.
export async function setGroupArchived(
  groupId: string,
  userId: string,
  archived: boolean
): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: `
      UPDATE groups
      SET archived_at = CASE WHEN ? THEN COALESCE(archived_at, ?) ELSE NULL END,
          updated_at = CASE
            WHEN (? AND archived_at IS NULL) OR (NOT ? AND archived_at IS NOT NULL)
            THEN ? ELSE updated_at END
      WHERE id = ?
        AND EXISTS (
          SELECT 1 FROM group_participants gp
          WHERE gp.group_id = groups.id AND gp.user_id = ?
            AND gp.role IN ('owner', 'admin')
        )
        AND (NOT ? OR NOT EXISTS (
          SELECT 1 FROM (
            SELECT currency, participant_id, SUM(delta) AS net
            FROM (
              SELECT e.currency, s.owed_to_participant_id AS participant_id, s.amount AS delta
              FROM expense_splits s JOIN expenses e ON e.id = s.expense_id
              WHERE e.group_id = ?
              UNION ALL
              SELECT e.currency, s.participant_id, -s.amount
              FROM expense_splits s JOIN expenses e ON e.id = s.expense_id
              WHERE e.group_id = ?
              UNION ALL
              SELECT currency, from_participant_id, amount FROM payments WHERE group_id = ?
              UNION ALL
              SELECT currency, to_participant_id, -amount FROM payments WHERE group_id = ?
            )
            GROUP BY currency, participant_id
            HAVING SUM(delta) != 0
          )
        ))
    `,
    args: [
      Number(archived),
      now,
      Number(archived),
      Number(archived),
      now,
      groupId,
      userId,
      Number(archived),
      groupId,
      groupId,
      groupId,
      groupId,
    ],
  });
  return result.rowsAffected > 0;
}

export async function updateGroupById(
  groupId: string,
  updates: {
    name?: string;
    description?: string | null;
  }
) {
  const fields = [] as string[];
  const args: Array<string | null> = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    args.push(updates.name);
  }

  if (updates.description !== undefined) {
    fields.push('description = ?');
    args.push(updates.description);
  }

  if (fields.length === 0) {
    return;
  }

  args.push(new Date().toISOString(), groupId);

  await db.execute(
    `
      UPDATE groups
      SET ${fields.join(', ')}, updated_at = ?
      WHERE id = ?
    `,
    args
  );
}
