import { createClient } from '@libsql/client';
import { expect, it, vi } from 'vitest';

it('migrates existing users without losing data and is idempotent', async () => {
  const db = createClient({ url: 'file::memory:' });
  await db.execute(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
      password_hash TEXT NOT NULL, avatar_url TEXT, is_active INTEGER NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT
    )
  `);
  await db.execute(
    "INSERT INTO users (id, name, email, password_hash, is_active, created_at) VALUES ('1', 'Ana', 'ana@example.com', 'hash', 1, '2026-01-01')"
  );
  vi.doMock('@/lib/db/db', () => ({ db }));
  vi.doMock('dotenv', () => ({ default: { config: vi.fn() } }));
  const { initDB } = await import('../init-db');
  await vi.waitFor(async () => {
    const result = await db.execute(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_expense_splits_expense_id'"
    );
    expect(result.rows).toHaveLength(1);
  });
  await initDB();
  await initDB();
  const result = await db.execute(
    'SELECT name, locale FROM users WHERE id = ?',
    ['1']
  );
  expect(result.rows[0]).toMatchObject({ name: 'Ana', locale: 'en' });
  db.close();
});
