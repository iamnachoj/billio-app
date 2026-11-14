import { createClient } from '@libsql/client';
import { describe, expect, it } from 'vitest';

import { ensureGroupArchiveColumn } from '../group-archive-migration';

describe('group archive migration', () => {
  it('preserves existing groups and is idempotent', async () => {
    const db = createClient({ url: 'file::memory:' });
    try {
      await db.execute(`
        CREATE TABLE groups (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, created_by TEXT NOT NULL,
          created_at TEXT NOT NULL, updated_at TEXT
        )
      `);
      await db.execute(
        "INSERT INTO groups VALUES ('g1', 'Trip', 'owner', '2024-01-01', NULL)"
      );
      await ensureGroupArchiveColumn(db);
      await ensureGroupArchiveColumn(db);

      const { rows } = await db.execute(
        "SELECT id, name, archived_at FROM groups WHERE id = 'g1'"
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: 'g1',
        name: 'Trip',
        archived_at: null,
      });
    } finally {
      db.close();
    }
  });
});
