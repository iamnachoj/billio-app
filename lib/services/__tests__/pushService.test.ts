import { beforeEach, describe, expect, it, vi } from 'vitest';

import webpush from 'web-push';
import { getGroupById } from '@/lib/repositories/groupRepository';
import { getParticipantsByGroupId } from '@/lib/repositories/participantRepository';
import {
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionsByUserIds,
} from '@/lib/repositories/pushSubscriptionRepository';
import { notifyNewExpense } from '../pushService';

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

const participant = (id: string, userId: string | undefined, status = 'active') => ({
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
