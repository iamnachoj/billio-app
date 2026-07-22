import { randomUUID } from 'crypto';
import { db } from '@/lib/db/db';
import { mapUser, UserRow } from '@/lib/mappers/userMapper';
import { get } from 'http';

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

export async function getUserByName(name: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM users
      WHERE name = ?
    `,
    args: [name],
  });

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return mapUser(row as unknown as UserRow);
}

export async function updateUserById(
  id: string,
  { email, name }: { email?: string; name?: string }
) {
  const updates = [];
  const args = [];

  if (email) {
    updates.push('email = ?');
    args.push(email);
  }

  if (name) {
    updates.push('name = ?');
    args.push(name);
  }

  if (updates.length === 0) {
    return;
  }

  updates.push('updated_at = ?');
  args.push(new Date().toISOString());

  args.push(id);

  await db.execute({
    sql: `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `,
    args,
  });

  return getUserById(id);
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
