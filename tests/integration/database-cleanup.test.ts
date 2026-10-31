import { describe, expect, it } from 'vitest';

import { db } from '../../lib/db/db';
import { clearIntegrationDatabase } from './clear-database';

describe('integration database cleanup', () => {
  it('clears payment and push subscription data between tests', async () => {
    await db.execute({
      sql: `
        INSERT INTO payments (
          id,
          group_id,
          from_participant_id,
          to_participant_id,
          amount,
          currency,
          created_by_participant_id,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        'cleanup-payment',
        'group',
        'from',
        'to',
        100,
        'EUR',
        'creator',
        new Date().toISOString(),
      ],
    });
    await db.execute({
      sql: `
        INSERT INTO push_subscriptions (
          id,
          user_id,
          endpoint,
          p256dh,
          auth,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        'cleanup-subscription',
        'user',
        'https://push.example/cleanup',
        'p256dh',
        'auth',
        new Date().toISOString(),
      ],
    });

    await clearIntegrationDatabase(db);

    const payments = await db.execute(
      'SELECT COUNT(*) AS count FROM payments;'
    );
    const subscriptions = await db.execute(
      'SELECT COUNT(*) AS count FROM push_subscriptions;'
    );

    expect(Number(payments.rows[0].count)).toBe(0);
    expect(Number(subscriptions.rows[0].count)).toBe(0);
  });
});
