import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.AUTH_TOKEN!,
});
