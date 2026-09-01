import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as expenseRepository from '@/lib/repositories/expenseRepository';
import * as paymentRepository from '@/lib/repositories/paymentRepository';
import * as groupRepository from '@/lib/repositories/groupRepository';
import * as participantRepository from '@/lib/repositories/participantRepository';
import { getGroupBalances } from '../balanceService';

vi.mock('@/lib/repositories/expenseRepository', () => ({
  getExpenseTotalsByPayer: vi.fn(),
  getExpenseSplitTotalsByOwedTo: vi.fn(),
  getExpenseSplitTotalsByDebtor: vi.fn(),
}));

vi.mock('@/lib/repositories/paymentRepository', () => ({
  getPaymentTotalsBySender: vi.fn(),
  getPaymentTotalsByReceiver: vi.fn(),
}));

vi.mock('@/lib/repositories/groupRepository', () => ({
  getGroupById: vi.fn(),
}));

vi.mock('@/lib/repositories/participantRepository', () => ({
  getParticipantByGroupAndUserId: vi.fn(),
  getParticipantsByGroupId: vi.fn(),
}));

describe('balanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(paymentRepository.getPaymentTotalsBySender).mockResolvedValue([]);
    vi.mocked(paymentRepository.getPaymentTotalsByReceiver).mockResolvedValue(
      []
    );
  });

  it('calculates balances and settlements for a group', async () => {
    vi.mocked(
      participantRepository.getParticipantByGroupAndUserId
    ).mockResolvedValue({
      id: 'participant-a',
      groupId: 'group-1',
      displayName: 'Ana',
      userId: 'user-a',
      role: 'owner',
      status: 'active',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    vi.mocked(participantRepository.getParticipantsByGroupId).mockResolvedValue(
      [
        {
          id: 'participant-a',
          groupId: 'group-1',
          displayName: 'Ana',
          userId: 'user-a',
          role: 'owner',
          status: 'active',
          joinedAt: new Date('2024-01-01T00:00:00.000Z'),
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          id: 'participant-b',
          groupId: 'group-1',
          displayName: 'Beto',
          userId: 'user-b',
          role: 'member',
          status: 'active',
          joinedAt: new Date('2024-01-01T00:00:00.000Z'),
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          id: 'participant-c',
          groupId: 'group-1',
          displayName: 'Carla',
          userId: null as unknown as string,
          role: 'member',
          status: 'left',
          joinedAt: new Date('2024-01-01T00:00:00.000Z'),
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ] as never
    );

    vi.mocked(expenseRepository.getExpenseTotalsByPayer).mockResolvedValue([
      {
        currency: 'EUR',
        participantId: 'participant-b',
        totalCents: 1235,
      },
    ] as never);

    vi.mocked(
      expenseRepository.getExpenseSplitTotalsByOwedTo
    ).mockResolvedValue([
      {
        currency: 'EUR',
        participantId: 'participant-b',
        totalCents: 823,
      },
    ] as never);

    vi.mocked(
      expenseRepository.getExpenseSplitTotalsByDebtor
    ).mockResolvedValue([
      {
        currency: 'EUR',
        participantId: 'participant-a',
        totalCents: 412,
      },
      {
        currency: 'EUR',
        participantId: 'participant-c',
        totalCents: 411,
      },
    ] as never);

    const result = await getGroupBalances({
      groupId: 'group-1',
      userId: 'user-a',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected balances to succeed');
    }

    expect(result.data.groupId).toBe('group-1');
    expect(result.data.myParticipantId).toBe('participant-a');
    expect(result.data.participants).toHaveLength(3);
    expect(result.data.currencies).toHaveLength(1);

    const eur = result.data.currencies[0];
    expect(eur.currency).toBe('EUR');
    expect(eur.totals).toEqual({
      totalSpentCents: 1235,
      totalLentCents: 823,
      totalBorrowedCents: 823,
    });

    expect(eur.participantBalances).toEqual([
      {
        participantId: 'participant-a',
        totalSpentCents: 0,
        totalLentCents: 0,
        totalBorrowedCents: 412,
        netBalanceCents: -412,
        position: 'debtor',
      },
      {
        participantId: 'participant-b',
        totalSpentCents: 1235,
        totalLentCents: 823,
        totalBorrowedCents: 0,
        netBalanceCents: 823,
        position: 'creditor',
      },
      {
        participantId: 'participant-c',
        totalSpentCents: 0,
        totalLentCents: 0,
        totalBorrowedCents: 411,
        netBalanceCents: -411,
        position: 'debtor',
      },
    ]);

    expect(eur.settlements).toEqual([
      {
        fromParticipantId: 'participant-a',
        toParticipantId: 'participant-b',
        amountCents: 412,
      },
      {
        fromParticipantId: 'participant-c',
        toParticipantId: 'participant-b',
        amountCents: 411,
      },
    ]);
    expect(eur.meta.algorithm).toBe('min-transfers-greedy-v1');
    expect(eur.meta.minimalTransfersCount).toBe(2);
  });

  it('returns not found when user is not in group and group is missing', async () => {
    vi.mocked(
      participantRepository.getParticipantByGroupAndUserId
    ).mockResolvedValue(null);
    vi.mocked(groupRepository.getGroupById).mockResolvedValue(null);

    const result = await getGroupBalances({
      groupId: 'group-404',
      userId: 'user-a',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected missing group to fail');
    }

    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns forbidden when user is not in group but group exists', async () => {
    vi.mocked(
      participantRepository.getParticipantByGroupAndUserId
    ).mockResolvedValue(null);
    vi.mocked(groupRepository.getGroupById).mockResolvedValue({
      id: 'group-1',
      name: 'Trip',
      description: 'Weekend',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdBy: 'user-z',
    } as never);

    const result = await getGroupBalances({
      groupId: 'group-1',
      userId: 'user-a',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected forbidden result');
    }

    expect(result.error.code).toBe('FORBIDDEN');
  });
});
