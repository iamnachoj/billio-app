import webpush from 'web-push';

import { getGroupById } from '@/lib/repositories/groupRepository';
import { getParticipantsByGroupId } from '@/lib/repositories/participantRepository';
import { getUserById } from '@/lib/repositories/userRepository';
import { resolveLocale, type AppLocale } from '@/lib/locale';
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

function formatAmount(
  amountCents: number,
  currency: string,
  locale: AppLocale
) {
  try {
    return new Intl.NumberFormat(locale, {
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

  const recipients = await Promise.all(
    [...new Set(subscriptions.map((subscription) => subscription.userId))].map(
      async (userId) => [userId, await getUserById(userId)] as const
    )
  );
  const locales = new Map(
    recipients.map(([userId, user]) => [userId, resolveLocale(user?.locale)])
  );

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const locale = locales.get(subscription.userId) ?? 'en';
      const amount = formatAmount(amountCents, currency, locale);
      const actorName =
        actor?.displayName ??
        { en: 'Someone', es: 'Alguien', fr: 'Quelqu’un' }[locale];
      const groupName =
        group?.name ??
        { en: 'your group', es: 'tu grupo', fr: 'votre groupe' }[locale];
      const body = {
        en: `${actorName} added "${title}" (${amount}) to "${groupName}"`,
        es: `${actorName} añadió "${title}" (${amount}) a "${groupName}"`,
        fr: `${actorName} a ajouté « ${title} » (${amount}) au groupe « ${groupName} »`,
      }[locale];
      const payload = JSON.stringify({
        title: {
          en: '🔔 New expense',
          es: '🔔 Nuevo gasto',
          fr: '🔔 Nouvelle dépense',
        }[locale],
        body,
        url: `/${locale}/dashboard/groups/${encodeURIComponent(groupId)}`,
        tag: `group-${groupId}`,
      });
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
