import { createClient } from '@libsql/client';

import dotenv from 'dotenv';

dotenv.config({
  path: process.env.ENV_FILE || '.env.local',
});


const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing');
}

export const db = createClient({
  url: databaseUrl,
  authToken: process.env.AUTH_TOKEN!,
});
