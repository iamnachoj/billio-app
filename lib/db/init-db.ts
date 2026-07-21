import dotenv from 'dotenv';

dotenv.config({
  path: process.env.ENV_FILE || '.env.local',
});

import { db } from './db';

export async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      is_active INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS group_participants (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      user_id TEXT,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS group_invites (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      participant_id TEXT,
      token TEXT UNIQUE NOT NULL,
      email TEXT,
      status TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      revoked_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  const inviteTableInfo = await db.execute('PRAGMA table_info(group_invites);');
  const participantIdColumn = (inviteTableInfo.rows as Record<string, unknown>[]).find(
    (row) => row.name === 'participant_id'
  );

  if (Number(participantIdColumn?.notnull ?? 0) === 1) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS group_invites_new (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        participant_id TEXT,
        token TEXT UNIQUE NOT NULL,
        email TEXT,
        status TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        accepted_at TEXT,
        revoked_at TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    await db.execute(`
      INSERT INTO group_invites_new (
        id,
        group_id,
        participant_id,
        token,
        email,
        status,
        expires_at,
        accepted_at,
        revoked_at,
        created_by,
        created_at,
        updated_at
      )
      SELECT
        id,
        group_id,
        participant_id,
        token,
        email,
        status,
        expires_at,
        accepted_at,
        revoked_at,
        created_by,
        created_at,
        updated_at
      FROM group_invites;
    `);

    await db.execute('DROP TABLE group_invites;');
    await db.execute('ALTER TABLE group_invites_new RENAME TO group_invites;');
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      amount INTEGER NOT NULL,
      category TEXT,
      currency TEXT NOT NULL,
      group_id TEXT NOT NULL,
      paid_by_participant_id TEXT NOT NULL,
      created_by_participant_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS expense_splits (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      owed_to_participant_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  const expensesInfo = await db.execute('PRAGMA table_info(expenses);');
  const expensesColumns = (expensesInfo.rows as Record<string, unknown>[]).map((row) => String(row.name));

  if (expensesColumns.includes('paid_by_user_id') || expensesColumns.includes('created_by_user_id')) {
    await db.execute('DROP TABLE IF EXISTS expenses_new;');

    await db.execute(`
      CREATE TABLE expenses_new (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        amount INTEGER NOT NULL,
        category TEXT,
        currency TEXT NOT NULL,
        group_id TEXT NOT NULL,
        paid_by_participant_id TEXT NOT NULL,
        created_by_participant_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    await db.execute(`
      INSERT INTO expenses_new (
        id,
        title,
        description,
        amount,
        category,
        currency,
        group_id,
        paid_by_participant_id,
        created_by_participant_id,
        created_at,
        updated_at
      )
      SELECT
        e.id,
        e.title,
        e.description,
        e.amount,
        e.category,
        e.currency,
        e.group_id,
        paid.id,
        created.id,
        e.created_at,
        e.updated_at
      FROM expenses e
      JOIN group_participants paid ON paid.user_id = e.paid_by_user_id AND paid.group_id = e.group_id
      JOIN group_participants created ON created.user_id = e.created_by_user_id AND created.group_id = e.group_id;
    `);

    await db.execute('DROP TABLE expenses;');
    await db.execute('ALTER TABLE expenses_new RENAME TO expenses;');
  }

  const expenseSplitsInfo = await db.execute('PRAGMA table_info(expense_splits);');
  const expenseSplitsColumns = (expenseSplitsInfo.rows as Record<string, unknown>[]).map((row) => String(row.name));

  if (expenseSplitsColumns.includes('user_id') || expenseSplitsColumns.includes('owed_to_user_id')) {
    await db.execute('DROP TABLE IF EXISTS expense_splits_new;');

    await db.execute(`
      CREATE TABLE expense_splits_new (
        id TEXT PRIMARY KEY,
        expense_id TEXT NOT NULL,
        participant_id TEXT NOT NULL,
        owed_to_participant_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    await db.execute(`
      INSERT INTO expense_splits_new (
        id,
        expense_id,
        participant_id,
        owed_to_participant_id,
        amount,
        created_at,
        updated_at
      )
      SELECT
        s.id,
        s.expense_id,
        payer.id,
        owed.id,
        s.amount,
        s.created_at,
        s.updated_at
      FROM expense_splits s
      JOIN expenses e ON e.id = s.expense_id
      JOIN group_participants payer ON payer.user_id = s.user_id AND payer.group_id = e.group_id
      JOIN group_participants owed ON owed.user_id = s.owed_to_user_id AND owed.group_id = e.group_id;
    `);

    await db.execute('DROP TABLE expense_splits;');
    await db.execute('ALTER TABLE expense_splits_new RENAME TO expense_splits;');
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

initDB()
  .then(() => console.log('Database initialized'))
  .catch(console.error);
