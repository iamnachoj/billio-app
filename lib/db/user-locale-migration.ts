import type { Client } from '@libsql/client';

export async function ensureUserLocaleColumn(db: Client) {
  const info = await db.execute('PRAGMA table_info(users);');
  if (info.rows.some((row) => row.name === 'locale')) return;

  try {
    await db.execute(
      "ALTER TABLE users ADD COLUMN locale TEXT NOT NULL DEFAULT 'en';"
    );
  } catch (error) {
    // Another application instance may have applied the same migration.
    if (
      !(error instanceof Error) ||
      !/duplicate column name: locale/i.test(error.message)
    ) {
      throw error;
    }

    const updatedInfo = await db.execute('PRAGMA table_info(users);');
    if (!updatedInfo.rows.some((row) => row.name === 'locale')) throw error;
  }
}
