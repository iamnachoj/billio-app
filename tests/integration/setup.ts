import { beforeAll, beforeEach } from 'vitest';

import { db } from '../../lib/db/db';
import { initDB } from '../../lib/db/init-db';
import { clearIntegrationDatabase } from './clear-database';

beforeAll(async () => {
  if (!process.env.DATABASE_URL?.startsWith('file:')) {
    throw new Error('Integration tests must use a local file: database');
  }
  await initDB();
});

beforeEach(async () => {
  await clearIntegrationDatabase(db);
});
