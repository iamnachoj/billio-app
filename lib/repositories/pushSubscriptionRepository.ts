import { randomUUID } from 'crypto';

import { db } from '@/lib/db/db';

export type PushSubscriptionRecord = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function upsertPushSubscription({
  userId,
  endpoint,
  p256dh,
  auth,
}: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  // An endpoint identifies a device; re-subscribing on a shared device
  // reassigns it to the currently logged in user.
  await db.execute({
    sql: `
      INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth
    `,
    args: [randomUUID(), userId, endpoint, p256dh, auth, new Date().toISOString()],
  });
}

export async function deletePushSubscriptionByEndpoint(
  endpoint: string,
  userId?: string
) {
  if (userId) {
    await db.execute({
      sql: 'DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?',
      args: [endpoint, userId],
    });
    return;
  }

  await db.execute({
    sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?',
    args: [endpoint],
  });
}

export async function getPushSubscriptionsByUserIds(
  userIds: string[]
): Promise<PushSubscriptionRecord[]> {
  if (userIds.length === 0) {
    return [];
  }

  const placeholders = userIds.map(() => '?').join(', ');
  const result = await db.execute({
    sql: `SELECT * FROM push_subscriptions WHERE user_id IN (${placeholders})`,
    args: userIds,
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    endpoint: row.endpoint as string,
    p256dh: row.p256dh as string,
    auth: row.auth as string,
  }));
}
