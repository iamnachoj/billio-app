import type { Client } from '@libsql/client';

export async function ensureGroupArchiveColumn(db: Client) {
  const info = await db.execute('PRAGMA table_info(groups);');
  if (info.rows.some((row) => row.name === 'archived_at')) return;

  try {
    await db.execute('ALTER TABLE groups ADD COLUMN archived_at TEXT;');
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !/duplicate column name: archived_at/i.test(error.message)
    ) {
      throw error;
    }
    const refreshed = await db.execute('PRAGMA table_info(groups);');
    if (!refreshed.rows.some((row) => row.name === 'archived_at')) {
      throw error;
    }
  }
}
