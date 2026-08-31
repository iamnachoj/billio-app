import { randomUUID } from 'crypto';

import { db } from '@/lib/db/db';
import { Expense, ExpenseCategory } from '@/lib/models/expense';
import { ExpenseSplit } from '@/lib/models/expenseSplit';

type CreateExpenseInput = {
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
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
  category: ExpenseCategory;
  currency: string;
  paidByParticipantId: string;
};

function mapExpenseRow(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    category: row.category as ExpenseCategory,
    amount: row.amount as number,
    currency: row.currency as string,
    groupId: row.group_id as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    paidByParticipantId: row.paid_by_participant_id as string,
    createdByParticipantId: row.created_by_participant_id as string,
    lastEditedAt: row.last_edited_at
      ? new Date(row.last_edited_at as string)
      : undefined,
    lastEditedByParticipantId:
      (row.last_edited_by_participant_id as string | null) ?? undefined,
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

  await db.batch(
    [
      {
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
            last_edited_at,
            last_edited_by_participant_id,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          null,
          null,
          now,
          now,
        ],
      },
      ...splits.map((split) => ({
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
      })),
    ],
    'write'
  );

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

  return result.rows.map((row) =>
    mapExpenseRow(row as Record<string, unknown>)
  );
}

export type ExpenseListCursor = {
  createdAt: string;
  id: string;
};

export type ExpenseListFilters = {
  category?: ExpenseCategory;
  dateFromIso?: string;
  dateToIso?: string;
  minAmountCents?: number;
  maxAmountCents?: number;
  searchTitle?: string;
};

export async function getExpensesByGroupIdPaginated({
  groupId,
  limit,
  cursor,
  filters,
}: {
  groupId: string;
  limit: number;
  cursor?: ExpenseListCursor;
  filters?: ExpenseListFilters;
}): Promise<{ expenses: Expense[]; hasMore: boolean }> {
  const conditions = ['group_id = ?'];
  const args: Array<string | number> = [groupId];

  if (filters?.category) {
    conditions.push('category = ?');
    args.push(filters.category);
  }

  if (filters?.dateFromIso) {
    conditions.push('created_at >= ?');
    args.push(filters.dateFromIso);
  }

  if (filters?.dateToIso) {
    conditions.push('created_at <= ?');
    args.push(filters.dateToIso);
  }

  if (filters?.minAmountCents !== undefined) {
    conditions.push('amount >= ?');
    args.push(filters.minAmountCents);
  }

  if (filters?.maxAmountCents !== undefined) {
    conditions.push('amount <= ?');
    args.push(filters.maxAmountCents);
  }

  if (filters?.searchTitle) {
    conditions.push('LOWER(title) LIKE ?');
    args.push(`%${filters.searchTitle.toLowerCase()}%`);
  }

  // Keyset pagination: strictly-before the last row of the previous page.
  if (cursor) {
    conditions.push('(created_at < ? OR (created_at = ? AND id < ?))');
    args.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }

  // Fetch one extra row to know whether another page exists without a COUNT query.
  args.push(limit + 1);

  const result = await db.execute({
    sql: `
      SELECT *
      FROM expenses
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `,
    args,
  });

  const rows = result.rows.map((row) =>
    mapExpenseRow(row as Record<string, unknown>)
  );

  const hasMore = rows.length > limit;

  return {
    expenses: hasMore ? rows.slice(0, limit) : rows,
    hasMore,
  };
}

export async function countExpensesByGroupId(groupId: string): Promise<number> {
  const result = await db.execute({
    sql: `SELECT COUNT(*) AS total FROM expenses WHERE group_id = ?`,
    args: [groupId],
  });

  return Number(
    (result.rows[0] as Record<string, unknown> | undefined)?.total ?? 0
  );
}

export type CategoryTotal = {
  category: ExpenseCategory;
  totalCents: number;
  expenseCount: number;
};

// Category breakdown for a single currency, computed in SQL so it stays cheap regardless of expense volume.
export async function getExpenseCategoryTotals({
  groupId,
  currency,
  dateFromIso,
  dateToIso,
}: {
  groupId: string;
  currency: string;
  dateFromIso?: string;
  dateToIso?: string;
}): Promise<CategoryTotal[]> {
  const conditions = ['group_id = ?', 'currency = ?'];
  const args: Array<string> = [groupId, currency];

  if (dateFromIso) {
    conditions.push('created_at >= ?');
    args.push(dateFromIso);
  }

  if (dateToIso) {
    conditions.push('created_at <= ?');
    args.push(dateToIso);
  }

  const result = await db.execute({
    sql: `
      SELECT category, SUM(amount) AS total_cents, COUNT(*) AS expense_count
      FROM expenses
      WHERE ${conditions.join(' AND ')}
      GROUP BY category
      ORDER BY total_cents DESC
    `,
    args,
  });

  return result.rows.map((row) => {
    const typedRow = row as Record<string, unknown>;

    return {
      category: typedRow.category as ExpenseCategory,
      totalCents: Number(typedRow.total_cents),
      expenseCount: Number(typedRow.expense_count),
    };
  });
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

  return result.rows.map((row) =>
    mapExpenseSplitRow(row as Record<string, unknown>)
  );
}

export async function getExpenseSplitsByGroupId(groupId: string) {
  const result = await db.execute({
    sql: `
      SELECT s.*
      FROM expense_splits s
      INNER JOIN expenses e ON e.id = s.expense_id
      WHERE e.group_id = ?
      ORDER BY s.created_at ASC
    `,
    args: [groupId],
  });

  return result.rows.map((row) =>
    mapExpenseSplitRow(row as Record<string, unknown>)
  );
}

export type CurrencyParticipantTotal = {
  currency: string;
  participantId: string;
  totalCents: number;
};

function mapCurrencyParticipantTotalRow(
  row: Record<string, unknown>
): CurrencyParticipantTotal {
  return {
    currency: row.currency as string,
    participantId: row.participant_id as string,
    totalCents: Number(row.total_cents),
  };
}

// Spent totals grouped by payer, computed in SQL so we never load every expense row into memory.
export async function getExpenseTotalsByPayer(
  groupId: string
): Promise<CurrencyParticipantTotal[]> {
  const result = await db.execute({
    sql: `
      SELECT currency, paid_by_participant_id AS participant_id, SUM(amount) AS total_cents
      FROM expenses
      WHERE group_id = ?
      GROUP BY currency, paid_by_participant_id
    `,
    args: [groupId],
  });

  return result.rows.map((row) =>
    mapCurrencyParticipantTotalRow(row as Record<string, unknown>)
  );
}

// Lent totals grouped by the participant who is owed money for each split.
export async function getExpenseSplitTotalsByOwedTo(
  groupId: string
): Promise<CurrencyParticipantTotal[]> {
  const result = await db.execute({
    sql: `
      SELECT e.currency AS currency, s.owed_to_participant_id AS participant_id, SUM(s.amount) AS total_cents
      FROM expense_splits s
      INNER JOIN expenses e ON e.id = s.expense_id
      WHERE e.group_id = ?
      GROUP BY e.currency, s.owed_to_participant_id
    `,
    args: [groupId],
  });

  return result.rows.map((row) =>
    mapCurrencyParticipantTotalRow(row as Record<string, unknown>)
  );
}

// Borrowed totals grouped by the participant who owes money for each split.
export async function getExpenseSplitTotalsByDebtor(
  groupId: string
): Promise<CurrencyParticipantTotal[]> {
  const result = await db.execute({
    sql: `
      SELECT e.currency AS currency, s.participant_id AS participant_id, SUM(s.amount) AS total_cents
      FROM expense_splits s
      INNER JOIN expenses e ON e.id = s.expense_id
      WHERE e.group_id = ?
      GROUP BY e.currency, s.participant_id
    `,
    args: [groupId],
  });

  return result.rows.map((row) =>
    mapCurrencyParticipantTotalRow(row as Record<string, unknown>)
  );
}

export async function deleteExpenseById(expenseId: string) {
  const [, deletedExpense] = await db.batch(
    [
      {
        sql: `
          DELETE FROM expense_splits
          WHERE expense_id = ?
        `,
        args: [expenseId],
      },
      {
        sql: `
          DELETE FROM expenses
          WHERE id = ?
        `,
        args: [expenseId],
      },
    ],
    'write'
  );

  return deletedExpense.rowsAffected > 0;
}

export async function updateExpenseById({
  expenseId,
  expense,
  editedByParticipantId,
}: {
  expenseId: string;
  expense: UpdateExpenseInput;
  editedByParticipantId: string;
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
          last_edited_at = ?,
          last_edited_by_participant_id = ?,
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
      editedByParticipantId,
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
  editedByParticipantId,
}: {
  expenseId: string;
  expense: UpdateExpenseInput;
  splits: CreateExpenseSplitInput[];
  editedByParticipantId: string;
}) {
  const now = new Date().toISOString();

  await db.batch(
    [
      {
        sql: `
          UPDATE expenses
          SET title = ?,
              description = ?,
              amount = ?,
              category = ?,
              currency = ?,
              paid_by_participant_id = ?,
              last_edited_at = ?,
              last_edited_by_participant_id = ?,
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
          editedByParticipantId,
          now,
          expenseId,
        ],
      },
      {
        sql: `
          DELETE FROM expense_splits
          WHERE expense_id = ?
        `,
        args: [expenseId],
      },
      ...splits.map((split) => ({
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
      })),
    ],
    'write'
  );

  return now;
}
