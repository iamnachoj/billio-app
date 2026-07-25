import { beforeAll, beforeEach } from 'vitest';

import { db } from '../../lib/db/db';
import { initDB } from '../../lib/db/init-db';

const TABLES = [
  'expense_splits',
  'expenses',
  'group_invites',
  'group_participants',
  'groups',
  'password_resets',
  'users',
];

beforeAll(async () => {
  await initDB();
});

beforeEach(async () => {
  for (const table of TABLES) {
    await db.execute(`DELETE FROM ${table};`);
  }
});
