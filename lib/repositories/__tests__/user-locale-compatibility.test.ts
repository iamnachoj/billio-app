import { createClient, type Client } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let db: Client;
let repository: typeof import('../userRepository');

describe('user locale compatibility with existing databases', () => {
  beforeEach(async () => {
    vi.resetModules();
    db = createClient({ url: 'file::memory:' });
    vi.doMock('@/lib/db/db', () => ({ db }));
    repository = await import('../userRepository');
    await db.execute(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL, avatar_url TEXT, is_active INTEGER NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT
      )
    `);
    await db.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        'existing',
        'Existing',
        'existing@example.test',
        'hash',
        1,
        '2026-01-01',
      ],
    });
  });

  afterEach(() => {
    db.close();
    vi.doUnmock('@/lib/db/db');
    vi.doUnmock('@/lib/utils/jwt');
  });

  it('reads legacy users and saves a locale without a separate migration command', async () => {
    expect(
      (await repository.getUserByEmail('existing@example.test'))?.locale
    ).toBe('en');
    const updated = await repository.updateUserById('existing', {
      locale: 'es',
    });
    expect(updated?.locale).toBe('es');
    expect(
      (await repository.getUserByEmail('existing@example.test'))?.locale
    ).toBe('es');
  });

  it('registers new users directly on an unmigrated table', async () => {
    const created = await repository.createUserByEmail({
      name: 'New user',
      email: 'new@example.test',
      passwordHash: 'hash',
      locale: 'es',
    });
    expect((await repository.getUserByEmail(created.email))?.locale).toBe('es');
    expect(
      (await repository.getUserByEmail('existing@example.test'))?.locale
    ).toBe('en');
  });

  it('logs in to an unmigrated database when the selected locale is Spanish', async () => {
    await db.execute({
      sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
      args: [await bcrypt.hash('test-password', 4), 'existing'],
    });
    vi.doMock('@/lib/utils/jwt', () => ({
      generateToken: () => 'test-token',
      verifyToken: vi.fn(),
    }));
    const { loginUser } = await import('@/lib/services/authService');
    const result = await loginUser({
      email: 'existing@example.test',
      password: 'test-password',
      locale: 'es',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected login to succeed');
    expect(result.data.user.locale).toBe('es');
    expect(
      (await repository.getUserByEmail('existing@example.test'))?.locale
    ).toBe('es');
  });
});
