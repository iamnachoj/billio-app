import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as expenseRepository from '@/lib/repositories/expenseRepository';
import * as groupRepository from '@/lib/repositories/groupRepository';
import * as participantRepository from '@/lib/repositories/participantRepository';
import { createExpense, deleteExpenseForGroup, updateExpenseForGroup } from './expenseService';

vi.mock('@/lib/repositories/expenseRepository', () => ({
  createExpenseWithSplits: vi.fn(),
  deleteExpenseById: vi.fn(),
  getExpenseById: vi.fn(),
  getExpensesByGroupId: vi.fn(),
  getExpenseSplitsByExpenseId: vi.fn(),
  updateExpenseById: vi.fn(),
  updateExpenseWithSplits: vi.fn(),
}));

vi.mock('@/lib/repositories/groupRepository', () => ({
  getGroupById: vi.fn(),
}));

vi.mock('@/lib/repositories/participantRepository', () => ({
  getParticipantByGroupAndUserId: vi.fn(),
  getParticipantsByGroupId: vi.fn(),
}));

describe('expenseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const activeParticipants = [
    {
      id: 'participant-a',
      groupId: 'group-1',
      displayName: 'A',
      userId: 'user-a',
      role: 'owner' as const,
      status: 'active' as const,
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 'participant-b',
      groupId: 'group-1',
      displayName: 'B',
      userId: undefined,
      role: 'member' as const,
      status: 'active' as const,
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 'participant-c',
      groupId: 'group-1',
      displayName: 'C',
      userId: undefined,
      role: 'member' as const,
      status: 'active' as const,
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  ];

  function setupCommonMembership() {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue(activeParticipants[0]);
    vi.mocked(participantRepository.getParticipantsByGroupId).mockResolvedValue(activeParticipants);
    vi.mocked(expenseRepository.createExpenseWithSplits).mockResolvedValue({
      id: 'expense-1',
      title: 'Dinner',
      description: undefined,
      category: undefined,
      amount: 1000,
      currency: 'EUR',
      groupId: 'group-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      paidByParticipantId: 'participant-b',
      createdByParticipantId: 'participant-a',
    });
    vi.mocked(expenseRepository.getExpenseSplitsByExpenseId).mockResolvedValue([]);
    vi.mocked(expenseRepository.updateExpenseById).mockResolvedValue('2024-01-01T00:00:00.000Z');
    vi.mocked(expenseRepository.updateExpenseWithSplits).mockResolvedValue('2024-01-01T00:00:00.000Z');
  }

  it('creates an expense with equal split and allows paying participant to be different from creator participant', async () => {
    setupCommonMembership();

    const result = await createExpense({
      groupId: 'group-1',
      userId: 'user-a',
      title: 'Dinner',
      amount: 1000,
      currency: 'eur',
      paidByParticipantId: 'participant-b',
      split: { mode: 'equal' },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected expense creation to succeed');
    }

    expect(expenseRepository.createExpenseWithSplits).toHaveBeenCalledWith(
      expect.objectContaining({
        expense: expect.objectContaining({
          paidByParticipantId: 'participant-b',
          createdByParticipantId: 'participant-a',
          currency: 'EUR',
        }),
      })
    );
  });

  it('creates an expense with selected participants split', async () => {
    setupCommonMembership();

    await createExpense({
      groupId: 'group-1',
      userId: 'user-a',
      title: 'Taxi',
      amount: 900,
      currency: 'EUR',
      paidByParticipantId: 'participant-a',
      split: {
        mode: 'selected',
        participantIds: ['participant-a', 'participant-c'],
      },
    });

    expect(expenseRepository.createExpenseWithSplits).toHaveBeenCalledWith(
      expect.objectContaining({
        splits: [
          {
            participantId: 'participant-c',
            owedToParticipantId: 'participant-a',
            amount: 450,
          },
        ],
      })
    );
  });

  it('creates an expense with percentage split', async () => {
    setupCommonMembership();

    await createExpense({
      groupId: 'group-1',
      userId: 'user-a',
      title: 'Groceries',
      amount: 1000,
      currency: 'EUR',
      paidByParticipantId: 'participant-a',
      split: {
        mode: 'percentage',
        shares: [
          { participantId: 'participant-a', percentage: 30 },
          { participantId: 'participant-b', percentage: 70 },
        ],
      },
    });

    expect(expenseRepository.createExpenseWithSplits).toHaveBeenCalledWith(
      expect.objectContaining({
        splits: [
          {
            participantId: 'participant-b',
            owedToParticipantId: 'participant-a',
            amount: 700,
          },
        ],
      })
    );
  });

  it('rejects percentage split when total is not 100', async () => {
    setupCommonMembership();

    const result = await createExpense({
      groupId: 'group-1',
      userId: 'user-a',
      title: 'Groceries',
      amount: 1000,
      currency: 'EUR',
      paidByParticipantId: 'participant-a',
      split: {
        mode: 'percentage',
        shares: [
          { participantId: 'participant-a', percentage: 60 },
          { participantId: 'participant-b', percentage: 30 },
        ],
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid percentage split to fail');
    }

    expect(result.error.code).toBe('INVALID_INPUT');
    expect(expenseRepository.createExpenseWithSplits).not.toHaveBeenCalled();
  });

  it('rejects expense creation for viewer participants', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      ...activeParticipants[0],
      role: 'viewer',
    });

    const result = await createExpense({
      groupId: 'group-1',
      userId: 'user-a',
      title: 'Dinner',
      amount: 1000,
      currency: 'EUR',
      paidByParticipantId: 'participant-a',
      split: { mode: 'equal' },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected viewer expense creation to fail');
    }

    expect(result.error.code).toBe('FORBIDDEN');
  });

  it('returns not found when group does not exist and user is not a member', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue(null);
    vi.mocked(groupRepository.getGroupById).mockResolvedValue(null);

    const result = await createExpense({
      groupId: 'group-404',
      userId: 'user-a',
      title: 'Dinner',
      amount: 1000,
      currency: 'EUR',
      paidByParticipantId: 'participant-a',
      split: { mode: 'equal' },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected missing group to fail');
    }

    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('updates basic expense fields without rebuilding splits', async () => {
    setupCommonMembership();
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      ...activeParticipants[1],
      role: 'member',
    });

    vi.mocked(expenseRepository.getExpenseById).mockResolvedValue({
      id: 'expense-1',
      title: 'Dinner',
      description: 'old',
      category: 'food',
      amount: 1000,
      currency: 'EUR',
      groupId: 'group-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      paidByParticipantId: 'participant-b',
      createdByParticipantId: 'participant-a',
    });
    vi.mocked(expenseRepository.getExpenseSplitsByExpenseId).mockResolvedValue([
      {
        id: 'split-1',
        expenseId: 'expense-1',
        participantId: 'participant-c',
        amount: 500,
        owedToParticipantId: 'participant-b',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await updateExpenseForGroup({
      groupId: 'group-1',
      expenseId: 'expense-1',
      userId: 'user-a',
      title: 'Dinner updated',
      category: 'restaurant',
    });

    expect(result.ok).toBe(true);
    expect(expenseRepository.updateExpenseById).toHaveBeenCalledWith({
      expenseId: 'expense-1',
      expense: expect.objectContaining({
        title: 'Dinner updated',
        category: 'restaurant',
        amount: 1000,
        paidByParticipantId: 'participant-b',
      }),
    });
    expect(expenseRepository.updateExpenseWithSplits).not.toHaveBeenCalled();
  });

  it('rejects amount changes without a split payload', async () => {
    setupCommonMembership();

    vi.mocked(expenseRepository.getExpenseById).mockResolvedValue({
      id: 'expense-1',
      title: 'Dinner',
      description: 'old',
      category: 'food',
      amount: 1000,
      currency: 'EUR',
      groupId: 'group-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      paidByParticipantId: 'participant-b',
      createdByParticipantId: 'participant-a',
    });

    const result = await updateExpenseForGroup({
      groupId: 'group-1',
      expenseId: 'expense-1',
      userId: 'user-a',
      amount: 1235,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected amount change without split to fail');
    }

    expect(result.error.code).toBe('INVALID_INPUT');
    expect(expenseRepository.updateExpenseById).not.toHaveBeenCalled();
    expect(expenseRepository.updateExpenseWithSplits).not.toHaveBeenCalled();
  });

  it('updates expense and rebuilds splits when amount changes', async () => {
    setupCommonMembership();

    vi.mocked(expenseRepository.getExpenseById).mockResolvedValue({
      id: 'expense-1',
      title: 'Dinner',
      description: 'old',
      category: 'food',
      amount: 1000,
      currency: 'EUR',
      groupId: 'group-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      paidByParticipantId: 'participant-b',
      createdByParticipantId: 'participant-a',
    });
    vi.mocked(expenseRepository.getExpenseSplitsByExpenseId).mockResolvedValue([
      {
        id: 'split-1',
        expenseId: 'expense-1',
        participantId: 'participant-c',
        amount: 500,
        owedToParticipantId: 'participant-b',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await updateExpenseForGroup({
      groupId: 'group-1',
      expenseId: 'expense-1',
      userId: 'user-a',
      amount: 1235,
      split: { mode: 'equal' },
    });

    expect(result.ok).toBe(true);
    expect(expenseRepository.updateExpenseWithSplits).toHaveBeenCalledWith({
      expenseId: 'expense-1',
      expense: expect.objectContaining({
        amount: 1235,
        paidByParticipantId: 'participant-b',
      }),
      splits: [
        {
          participantId: 'participant-a',
          owedToParticipantId: 'participant-b',
          amount: 412,
        },
        {
          participantId: 'participant-c',
          owedToParticipantId: 'participant-b',
          amount: 411,
        },
      ],
    });
    expect(expenseRepository.updateExpenseById).not.toHaveBeenCalled();
  });

  it('rejects expense updates from viewers', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      ...activeParticipants[0],
      role: 'viewer',
    });

    const result = await updateExpenseForGroup({
      groupId: 'group-1',
      expenseId: 'expense-1',
      userId: 'user-a',
      title: 'Dinner updated',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected viewer update to fail');
    }

    expect(result.error.code).toBe('FORBIDDEN');
  });

  it('deletes an expense when requester is admin', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      ...activeParticipants[0],
      role: 'admin',
    });
    vi.mocked(expenseRepository.getExpenseById).mockResolvedValue({
      id: 'expense-1',
      title: 'Dinner',
      description: undefined,
      category: undefined,
      amount: 1000,
      currency: 'EUR',
      groupId: 'group-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      paidByParticipantId: 'participant-b',
      createdByParticipantId: 'participant-a',
    });
    vi.mocked(expenseRepository.deleteExpenseById).mockResolvedValue(true);

    const result = await deleteExpenseForGroup({
      groupId: 'group-1',
      expenseId: 'expense-1',
      userId: 'user-a',
    });

    expect(result).toEqual({ ok: true, data: { success: true } });
    expect(expenseRepository.deleteExpenseById).toHaveBeenCalledWith('expense-1');
  });

  it('rejects expense deletion for members', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      ...activeParticipants[1],
      role: 'member',
    });

    const result = await deleteExpenseForGroup({
      groupId: 'group-1',
      expenseId: 'expense-1',
      userId: 'user-b',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected deletion to fail for member');
    }

    expect(result.error.code).toBe('FORBIDDEN');
    expect(expenseRepository.deleteExpenseById).not.toHaveBeenCalled();
  });

  it('rejects expense deletion for viewers', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      ...activeParticipants[1],
      role: 'viewer',
    });

    const result = await deleteExpenseForGroup({
      groupId: 'group-1',
      expenseId: 'expense-1',
      userId: 'user-b',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected deletion to fail for viewer');
    }

    expect(result.error.code).toBe('FORBIDDEN');
    expect(expenseRepository.deleteExpenseById).not.toHaveBeenCalled();
  });

  it('returns not found when deleting a missing expense', async () => {
    vi.mocked(participantRepository.getParticipantByGroupAndUserId).mockResolvedValue({
      ...activeParticipants[0],
      role: 'owner',
    });
    vi.mocked(expenseRepository.getExpenseById).mockResolvedValue(null);

    const result = await deleteExpenseForGroup({
      groupId: 'group-1',
      expenseId: 'expense-404',
      userId: 'user-a',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected missing expense deletion to fail');
    }

    expect(result.error.code).toBe('NOT_FOUND');
    expect(expenseRepository.deleteExpenseById).not.toHaveBeenCalled();
  });
});
