import { beforeEach, describe, expect, it, vi } from 'vitest';

import webpush from 'web-push';
import { getGroupById } from '@/lib/repositories/groupRepository';
import { getParticipantsByGroupId } from '@/lib/repositories/participantRepository';
import {
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionsByUserIds,
} from '@/lib/repositories/pushSubscriptionRepository';
import { notifyNewExpense } from '../pushService';
import { getUserById } from '@/lib/repositories/userRepository';

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}));
vi.mock('@/lib/repositories/groupRepository', () => ({
  getGroupById: vi.fn(),
}));
vi.mock('@/lib/repositories/participantRepository', () => ({
  getParticipantsByGroupId: vi.fn(),
}));
vi.mock('@/lib/repositories/pushSubscriptionRepository', () => ({
  getPushSubscriptionsByUserIds: vi.fn(),
  deletePushSubscriptionByEndpoint: vi.fn(),
}));
vi.mock('@/lib/repositories/userRepository', () => ({
  getUserById: vi.fn(),
}));

const participant = (
  id: string,
  userId: string | undefined,
  status = 'active'
) => ({
  id,
  userId,
  status,
  displayName: `Name ${id}`,
});

describe('notifyNewExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub';
    process.env.VAPID_PRIVATE_KEY = 'priv';
    process.env.VAPID_SUBJECT = 'mailto:test@example.com';

    vi.mocked(getGroupById).mockResolvedValue({ name: 'Paris Trip' } as never);
    vi.mocked(getUserById).mockResolvedValue({ locale: 'en' } as never);
    vi.mocked(getParticipantsByGroupId).mockResolvedValue([
      participant('p1', 'u1'),
      participant('p2', 'u2'),
      participant('p3', undefined),
      participant('p4', 'u4', 'left'),
    ] as never);
  });

  it('notifies only active linked users other than the actor', async () => {
    vi.mocked(getPushSubscriptionsByUserIds).mockResolvedValue([
      { id: 's', userId: 'u2', endpoint: 'https://e', p256dh: 'k', auth: 'a' },
    ]);
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never);

    await notifyNewExpense({
      groupId: 'g1',
      actorUserId: 'u1',
      title: 'Dinner',
      amountCents: 4250,
      currency: 'EUR',
    });

    expect(getPushSubscriptionsByUserIds).toHaveBeenCalledWith(['u2']);
    const payload = JSON.parse(
      vi.mocked(webpush.sendNotification).mock.calls[0][1] as string
    );
    expect(payload.body).toContain('Name p1 added "Dinner"');
    expect(payload.body).toContain('"Paris Trip"');
    expect(payload.url).toBe('/en/dashboard/groups/g1');
  });

  it('localizes each recipient independently', async () => {
    vi.mocked(getPushSubscriptionsByUserIds).mockResolvedValue([
      {
        id: 's1',
        userId: 'u2',
        endpoint: 'https://e1',
        p256dh: 'k',
        auth: 'a',
      },
      {
        id: 's2',
        userId: 'u3',
        endpoint: 'https://e2',
        p256dh: 'k',
        auth: 'a',
      },
    ]);
    vi.mocked(getUserById).mockImplementation(
      async (id) => ({ locale: id === 'u3' ? 'es' : 'en' }) as never
    );
    await notifyNewExpense({
      groupId: 'g1',
      actorUserId: 'u1',
      title: 'Dinner',
      amountCents: 4250,
      currency: 'EUR',
    });
    const english = JSON.parse(
      vi.mocked(webpush.sendNotification).mock.calls[0][1] as string
    );
    const spanish = JSON.parse(
      vi.mocked(webpush.sendNotification).mock.calls[1][1] as string
    );
    expect(english.title).toBe('🔔 New expense');
    expect(spanish.title).toBe('🔔 Nuevo gasto');
    expect(spanish.body).toContain('añadió');
    expect(spanish.url).toBe('/es/dashboard/groups/g1');
  });

  it('localizes French recipients', async () => {
    vi.mocked(getPushSubscriptionsByUserIds).mockResolvedValue([
      {
        id: 's',
        userId: 'u2',
        endpoint: 'https://e',
        p256dh: 'k',
        auth: 'a',
      },
    ]);
    vi.mocked(getUserById).mockResolvedValue({ locale: 'fr' } as never);

    await notifyNewExpense({
      groupId: 'g1',
      actorUserId: 'u1',
      title: 'Dinner',
      amountCents: 4250,
      currency: 'EUR',
    });

    const payload = JSON.parse(
      vi.mocked(webpush.sendNotification).mock.calls[0][1] as string
    );
    expect(payload.title).toBe('🔔 Nouvelle dépense');
    expect(payload.body).toContain('a ajouté');
    expect(payload.url).toBe('/fr/dashboard/groups/g1');
  });

  it('removes expired subscriptions', async () => {
    vi.mocked(getPushSubscriptionsByUserIds).mockResolvedValue([
      { id: 's', userId: 'u2', endpoint: 'https://e', p256dh: 'k', auth: 'a' },
    ]);
    vi.mocked(webpush.sendNotification).mockRejectedValue({ statusCode: 410 });

    await notifyNewExpense({
      groupId: 'g1',
      actorUserId: 'u1',
      title: 'Dinner',
      amountCents: 100,
      currency: 'EUR',
    });

    expect(deletePushSubscriptionByEndpoint).toHaveBeenCalledWith('https://e');
  });
});
