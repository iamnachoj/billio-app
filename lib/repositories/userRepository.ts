import { randomUUID } from 'crypto';
import { db } from '@/lib/db/db';
import { mapUser, UserRow } from '@/lib/mappers/userMapper';

type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export async function getUserByEmail(email: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM users
      WHERE email = ?
    `,
    args: [email],
  });

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return mapUser(row as unknown as UserRow);
}

export async function createUserByEmail({
  name,
  email,
  passwordHash,
}: CreateUserInput) {
  const id = randomUUID();

  await db.execute({
    sql: `
      INSERT INTO users (
        id,
        name,
        email,
        password_hash,
        is_active,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [id, name, email, passwordHash, 1, new Date().toISOString()],
  });

  return {
    id,
    name,
    email,
  };
}

export async function getUserById(id: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM users
      WHERE id = ?
    `,
    args: [id],
  });

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return mapUser(row as unknown as UserRow);
}

export async function updateUserPassword(id: string, passwordHash: string) {
  await db.execute({
    sql: `
      UPDATE users
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `,
    args: [passwordHash, new Date().toISOString(), id],
  });
}

export async function deleteUserById(id: string) {
  const result = await db.execute({
    sql: `
      DELETE FROM users
      WHERE id = ?
    `,
    args: [id],
  });

  return result.rowsAffected > 0;
}
