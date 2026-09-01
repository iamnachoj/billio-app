import { randomUUID } from 'crypto';

import { db } from '@/lib/db/db';
import { Payment } from '@/lib/models/payment';
import { CurrencyParticipantTotal } from './expenseRepository';

function mapPaymentRow(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    fromParticipantId: row.from_participant_id as string,
    toParticipantId: row.to_participant_id as string,
    amount: row.amount as number,
    currency: row.currency as string,
    createdByParticipantId: row.created_by_participant_id as string,
    createdAt: new Date(row.created_at as string),
  };
}

export async function createPayment({
  groupId,
  fromParticipantId,
  toParticipantId,
  amount,
  currency,
  createdByParticipantId,
}: {
  groupId: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  currency: string;
  createdByParticipantId: string;
}): Promise<Payment> {
  const id = randomUUID();
  const now = new Date().toISOString();

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
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      groupId,
      fromParticipantId,
      toParticipantId,
      amount,
      currency,
      createdByParticipantId,
      now,
    ],
  });

  return {
    id,
    groupId,
    fromParticipantId,
    toParticipantId,
    amount,
    currency,
    createdByParticipantId,
    createdAt: new Date(now),
  };
}

// Amounts paid out, grouped by sender and currency (reduces the sender's debt).
export async function getPaymentTotalsBySender(
  groupId: string
): Promise<CurrencyParticipantTotal[]> {
  const result = await db.execute({
    sql: `
      SELECT currency, from_participant_id AS participant_id, SUM(amount) AS total_cents
      FROM payments
      WHERE group_id = ?
      GROUP BY currency, from_participant_id
    `,
    args: [groupId],
  });

  return result.rows.map((row) => {
    const typedRow = row as Record<string, unknown>;

    return {
      currency: typedRow.currency as string,
      participantId: typedRow.participant_id as string,
      totalCents: Number(typedRow.total_cents),
    };
  });
}

// Amounts received, grouped by recipient and currency (reduces what the recipient is owed).
export async function getPaymentTotalsByReceiver(
  groupId: string
): Promise<CurrencyParticipantTotal[]> {
  const result = await db.execute({
    sql: `
      SELECT currency, to_participant_id AS participant_id, SUM(amount) AS total_cents
      FROM payments
      WHERE group_id = ?
      GROUP BY currency, to_participant_id
    `,
    args: [groupId],
  });

  return result.rows.map((row) => {
    const typedRow = row as Record<string, unknown>;

    return {
      currency: typedRow.currency as string,
      participantId: typedRow.participant_id as string,
      totalCents: Number(typedRow.total_cents),
    };
  });
}

export type PaymentListCursor = {
  createdAt: string;
  id: string;
};

export async function getPaymentsByGroupId({
  groupId,
  currency,
  limit,
  cursor,
}: {
  groupId: string;
  currency?: string;
  limit: number;
  cursor?: PaymentListCursor;
}): Promise<{ payments: Payment[]; hasMore: boolean }> {
  const conditions = ['group_id = ?'];
  const args: Array<string | number> = [groupId];

  if (currency) {
    conditions.push('currency = ?');
    args.push(currency);
  }

  if (cursor) {
    conditions.push('(created_at < ? OR (created_at = ? AND id < ?))');
    args.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }

  // Fetch one extra row to know whether another page exists without a COUNT query.
  args.push(limit + 1);

  const result = await db.execute({
    sql: `
      SELECT *
      FROM payments
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `,
    args,
  });

  const rows = result.rows.map((row) =>
    mapPaymentRow(row as Record<string, unknown>)
  );

  const hasMore = rows.length > limit;

  return {
    payments: hasMore ? rows.slice(0, limit) : rows,
    hasMore,
  };
}

export async function getPaymentById(
  paymentId: string
): Promise<Payment | null> {
  const result = await db.execute({
    sql: `
      SELECT *
      FROM payments
      WHERE id = ?
      LIMIT 1
    `,
    args: [paymentId],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }

  return mapPaymentRow(row);
}

export async function deletePaymentById(paymentId: string): Promise<boolean> {
  const result = await db.execute({
    sql: `DELETE FROM payments WHERE id = ?`,
    args: [paymentId],
  });

  return result.rowsAffected > 0;
}
