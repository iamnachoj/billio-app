import webpush from 'web-push';

import { getGroupById } from '@/lib/repositories/groupRepository';
import { getParticipantsByGroupId } from '@/lib/repositories/participantRepository';
import {
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionsByUserIds,
} from '@/lib/repositories/pushSubscriptionRepository';

type NewExpenseNotificationInput = {
  groupId: string;
  actorUserId: string;
  title: string;
  amountCents: number;
  currency: string;
};

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) {
    return true;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;

  return true;
}

function formatAmount(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

export async function notifyNewExpense({
  groupId,
  actorUserId,
  title,
  amountCents,
  currency,
}: NewExpenseNotificationInput) {
  if (!configureVapid()) {
    return;
  }

  const [group, participants] = await Promise.all([
    getGroupById(groupId),
    getParticipantsByGroupId(groupId),
  ]);

  const actor = participants.find(
    (participant) => participant.userId === actorUserId
  );

  const recipientUserIds = [
    ...new Set(
      participants
        .filter(
          (participant) =>
            participant.status === 'active' &&
            participant.userId &&
            participant.userId !== actorUserId
        )
        .map((participant) => participant.userId as string)
    ),
  ];

  const subscriptions = await getPushSubscriptionsByUserIds(recipientUserIds);

  if (subscriptions.length === 0) {
    return;
  }

  const payload = JSON.stringify({
    title: '🔔 New expense',
    body: `${actor?.displayName ?? 'Someone'} added "${title}" (${formatAmount(
      amountCents,
      currency
    )}) to "${group?.name ?? 'your group'}"`,
    url: `/dashboard/groups/${groupId}`,
    tag: `group-${groupId}`,
  });

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;

        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscriptionByEndpoint(subscription.endpoint);
          return;
        }

        console.error('Failed to send push notification', error);
      }
    })
  );
}
