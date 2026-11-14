import { createClient } from '@libsql/client';
import { describe, expect, it } from 'vitest';
import { ensureUserLocaleColumn } from '../user-locale-migration';

describe('user locale migration', () => {
  it('handles concurrent migration attempts without losing existing data', async () => {
    const db = createClient({ url: 'file::memory:' });
    try {
      await db.execute('CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT)');
      await db.execute("INSERT INTO users (id, name) VALUES ('1', 'Existing')");
      await Promise.all([
        ensureUserLocaleColumn(db),
        ensureUserLocaleColumn(db),
      ]);
      const users = await db.execute('SELECT name, locale FROM users');
      expect(users.rows[0]).toMatchObject({ name: 'Existing', locale: 'en' });
    } finally {
      db.close();
    }
  });

  it('propagates migration failures', async () => {
    const db = createClient({ url: 'file::memory:' });
    try {
      await expect(ensureUserLocaleColumn(db)).rejects.toThrow();
    } finally {
      db.close();
    }
  });
});
