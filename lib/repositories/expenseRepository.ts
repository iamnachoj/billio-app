import { randomUUID } from 'crypto';

import { db } from '@/lib/db/db';
import { Expense } from '@/lib/models/expense';
import { ExpenseSplit } from '@/lib/models/expenseSplit';

type CreateExpenseInput = {
  title: string;
  description?: string;
  amount: number;
  category?: string;
  currency: string;
  groupId: string;
  paidByParticipantId: string;
  createdByParticipantId: string;
};

type CreateExpenseSplitInput = {
  participantId: string;
  owedToParticipantId: string;
  amount: number;
};

type UpdateExpenseInput = {
  title: string;
  description?: string;
  amount: number;
  category?: string;
  currency: string;
  paidByParticipantId: string;
};

function mapExpenseRow(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    category: row.category as string | undefined,
    amount: row.amount as number,
    currency: row.currency as string,
    groupId: row.group_id as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    paidByParticipantId: row.paid_by_participant_id as string,
    createdByParticipantId: row.created_by_participant_id as string,
  };
}

function mapExpenseSplitRow(row: Record<string, unknown>): ExpenseSplit {
  return {
    id: row.id as string,
    expenseId: row.expense_id as string,
    participantId: row.participant_id as string,
    amount: row.amount as number,
    owedToParticipantId: row.owed_to_participant_id as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function createExpenseWithSplits({
  expense,
  splits,
}: {
  expense: CreateExpenseInput;
  splits: CreateExpenseSplitInput[];
}) {
  const expenseId = randomUUID();
  const now = new Date().toISOString();

  await db.execute('BEGIN');

  try {
    await db.execute({
      sql: `
        INSERT INTO expenses (
          id,
          title,
          description,
          amount,
          category,
          currency,
          group_id,
          paid_by_participant_id,
          created_by_participant_id,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        expenseId,
        expense.title,
        expense.description ?? null,
        expense.amount,
        expense.category ?? null,
        expense.currency,
        expense.groupId,
        expense.paidByParticipantId,
        expense.createdByParticipantId,
        now,
        now,
      ],
    });

    for (const split of splits) {
      await db.execute({
        sql: `
          INSERT INTO expense_splits (
            id,
            expense_id,
            participant_id,
            owed_to_participant_id,
            amount,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          randomUUID(),
          expenseId,
          split.participantId,
          split.owedToParticipantId,
          split.amount,
          now,
          now,
        ],
      });
    }

    await db.execute('COMMIT');
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }

  const createdExpense: Expense = {
    id: expenseId,
    title: expense.title,
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    currency: expense.currency,
    groupId: expense.groupId,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    paidByParticipantId: expense.paidByParticipantId,
    createdByParticipantId: expense.createdByParticipantId,
  };

  return createdExpense;
}

export async function getExpensesByGroupId(groupId: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM expenses
      WHERE group_id = ?
      ORDER BY created_at DESC
    `,
    args: [groupId],
  });

  return result.rows.map((row) => mapExpenseRow(row as Record<string, unknown>));
}

export async function getExpenseById(expenseId: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM expenses
      WHERE id = ?
      LIMIT 1
    `,
    args: [expenseId],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }

  return mapExpenseRow(row);
}

export async function getExpenseSplitsByExpenseId(expenseId: string) {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM expense_splits
      WHERE expense_id = ?
      ORDER BY created_at ASC
    `,
    args: [expenseId],
  });

  return result.rows.map((row) => mapExpenseSplitRow(row as Record<string, unknown>));
}

export async function deleteExpenseById(expenseId: string) {
  await db.execute('BEGIN');

  try {
    await db.execute({
      sql: `
        DELETE FROM expense_splits
        WHERE expense_id = ?
      `,
      args: [expenseId],
    });

    const deletedExpense = await db.execute({
      sql: `
        DELETE FROM expenses
        WHERE id = ?
      `,
      args: [expenseId],
    });

    await db.execute('COMMIT');

    return deletedExpense.rowsAffected > 0;
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
}

export async function updateExpenseById({
  expenseId,
  expense,
}: {
  expenseId: string;
  expense: UpdateExpenseInput;
}) {
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      UPDATE expenses
      SET title = ?,
          description = ?,
          amount = ?,
          category = ?,
          currency = ?,
          paid_by_participant_id = ?,
          updated_at = ?
      WHERE id = ?
    `,
    args: [
      expense.title,
      expense.description ?? null,
      expense.amount,
      expense.category ?? null,
      expense.currency,
      expense.paidByParticipantId,
      now,
      expenseId,
    ],
  });

  return now;
}

export async function updateExpenseWithSplits({
  expenseId,
  expense,
  splits,
}: {
  expenseId: string;
  expense: UpdateExpenseInput;
  splits: CreateExpenseSplitInput[];
}) {
  const now = new Date().toISOString();

  await db.execute('BEGIN');

  try {
    await db.execute({
      sql: `
        UPDATE expenses
        SET title = ?,
            description = ?,
            amount = ?,
            category = ?,
            currency = ?,
            paid_by_participant_id = ?,
            updated_at = ?
        WHERE id = ?
      `,
      args: [
        expense.title,
        expense.description ?? null,
        expense.amount,
        expense.category ?? null,
        expense.currency,
        expense.paidByParticipantId,
        now,
        expenseId,
      ],
    });

    await db.execute({
      sql: `
        DELETE FROM expense_splits
        WHERE expense_id = ?
      `,
      args: [expenseId],
    });

    for (const split of splits) {
      await db.execute({
        sql: `
          INSERT INTO expense_splits (
            id,
            expense_id,
            participant_id,
            owed_to_participant_id,
            amount,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          randomUUID(),
          expenseId,
          split.participantId,
          split.owedToParticipantId,
          split.amount,
          now,
          now,
        ],
      });
    }

    await db.execute('COMMIT');
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }

  return now;
}