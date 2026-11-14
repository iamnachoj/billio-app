import type { Client } from '@libsql/client';

const TABLES = [
  'payments',
  'expense_splits',
  'expenses',
  'group_invites',
  'group_participants',
  'groups',
  'password_resets',
  'push_subscriptions',
  'users',
];

export async function clearIntegrationDatabase(db: Client) {
  await db.execute('UPDATE groups SET archived_at = NULL;');
  for (const table of TABLES) {
    await db.execute(`DELETE FROM ${table};`);
  }
}
