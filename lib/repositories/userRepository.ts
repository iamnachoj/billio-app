import { randomUUID } from 'crypto';
import { db } from '@/lib/db/db';

type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export async function getUser(email: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM users
      WHERE email = ?
    `,
    args: [email],
  });

  return result.rows[0] ?? null;
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
    args: [
      id,
      name,
      email,
      passwordHash,
      1,
      new Date().toISOString(),
    ],
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

  return result.rows[0] ?? null;
}