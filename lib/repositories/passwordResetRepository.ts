import { randomUUID } from 'crypto';
import { db } from '@/lib/db/db';

type CreatePasswordResetInput = {
  userId: string;
  token: string;
  expiresAt: string;
};

export async function createPasswordResetToken({ userId, token, expiresAt }: CreatePasswordResetInput) {
  const id = randomUUID();

  await db.execute({
    sql: `
      INSERT INTO password_resets (
        id,
        user_id,
        token,
        expires_at,
        used_at,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [id, userId, token, expiresAt, null, new Date().toISOString()],
  });

  return { id, userId, token, expiresAt };
}

export async function getPasswordResetTokenByToken(token: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM password_resets
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
    userId: row.user_id as string,
    token: row.token as string,
    expiresAt: new Date(row.expires_at as string),
    usedAt: row.used_at ? new Date(row.used_at as string) : null,
    createdAt: new Date(row.created_at as string),
  };
}

export async function markPasswordResetTokenAsUsed(id: string) {
  await db.execute({
    sql: `
      UPDATE password_resets
      SET used_at = ?
      WHERE id = ?
    `,
    args: [new Date().toISOString(), id],
  });
}

export async function deletePasswordResetTokensForUser(userId: string) {
  await db.execute({
    sql: `
      DELETE FROM password_resets
      WHERE user_id = ?
    `,
    args: [userId],
  });
}

export async function getRecentPasswordResetRequests(userId: string, windowMs: number) {
  const cutoff = new Date(Date.now() - windowMs).toISOString();

  const result = await db.execute({
    sql: `
      SELECT COUNT(*) as count
      FROM password_resets
      WHERE user_id = ?
        AND created_at >= ?
    `,
    args: [userId, cutoff],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  return Number(row?.count ?? 0);
}
