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
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      amount INTEGER NOT NULL,
      category TEXT,
      currency TEXT NOT NULL,
      group_id TEXT NOT NULL,
      paid_by_user_id TEXT NOT NULL,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS expense_splits (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      owed_to_user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

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
