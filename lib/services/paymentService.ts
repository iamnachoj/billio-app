import {
  createPayment,
  deletePaymentById,
  getPaymentById,
  getPaymentsByGroupId,
  type PaymentListCursor,
} from '@/lib/repositories/paymentRepository';
import {
  getParticipantById,
  getParticipantByGroupAndUserId,
} from '@/lib/repositories/participantRepository';
import { getGroupById } from '@/lib/repositories/groupRepository';
import { Payment } from '@/lib/models/payment';

export type PaymentServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status: number } };

const DEFAULT_PAYMENT_PAGE_SIZE = 5;
const MAX_PAYMENT_PAGE_SIZE = 50;

function encodePaymentCursor(cursor: PaymentListCursor): string {
  return Buffer.from(`${cursor.createdAt}|${cursor.id}`, 'utf8').toString(
    'base64url'
  );
}

function decodePaymentCursor(raw: string): PaymentListCursor | null {
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const separatorIndex = decoded.indexOf('|');
    if (separatorIndex === -1) {
      return null;
    }

    const createdAt = decoded.slice(0, separatorIndex);
    const id = decoded.slice(separatorIndex + 1);

    if (!createdAt || !id || Number.isNaN(Date.parse(createdAt))) {
      return null;
    }

    return { createdAt, id };
  } catch {
    return null;
  }
}

export async function createSettlementPayment({
  groupId,
  userId,
  fromParticipantId,
  toParticipantId,
  amountCents,
  currency,
}: {
  groupId: string;
  userId: string;
  fromParticipantId: string;
  toParticipantId: string;
  amountCents: number;
  currency: string;
}): Promise<PaymentServiceResult<Payment>> {
  if (
    !groupId ||
    !userId ||
    !fromParticipantId ||
    !toParticipantId ||
    !currency?.trim()
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID, user ID, participants and currency are required',
        status: 400,
      },
    };
  }

  if (fromParticipantId === toParticipantId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'A participant cannot pay themselves',
        status: 400,
      },
    };
  }

  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'amountCents must be a positive integer',
        status: 400,
      },
    };
  }

  const membership = await getParticipantByGroupAndUserId(groupId, userId);
  if (!membership) {
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
          status: 404,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  const [fromParticipant, toParticipant] = await Promise.all([
    getParticipantById(fromParticipantId),
    getParticipantById(toParticipantId),
  ]);

  if (
    !fromParticipant ||
    !toParticipant ||
    fromParticipant.groupId !== groupId ||
    toParticipant.groupId !== groupId
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Both participants must belong to this group',
        status: 400,
      },
    };
  }

  const payment = await createPayment({
    groupId,
    fromParticipantId,
    toParticipantId,
    amount: amountCents,
    currency: currency.trim().toUpperCase(),
    createdByParticipantId: membership.id,
  });

  return { ok: true, data: payment };
}

export async function getGroupPayments({
  groupId,
  userId,
  currency,
  limit,
  cursor,
}: {
  groupId: string;
  userId: string;
  currency?: string;
  limit?: number;
  cursor?: string;
}): Promise<
  PaymentServiceResult<{ payments: Payment[]; nextCursor: string | null }>
> {
  if (!groupId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID and user ID are required',
        status: 400,
      },
    };
  }

  const membership = await getParticipantByGroupAndUserId(groupId, userId);
  if (!membership) {
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
          status: 404,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  const pageSize = limit ?? DEFAULT_PAYMENT_PAGE_SIZE;
  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_PAYMENT_PAGE_SIZE
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: `limit must be an integer between 1 and ${MAX_PAYMENT_PAGE_SIZE}`,
        status: 400,
      },
    };
  }

  let decodedCursor: PaymentListCursor | undefined;
  if (cursor) {
    decodedCursor = decodePaymentCursor(cursor) ?? undefined;
    if (!decodedCursor) {
      return {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'cursor is invalid',
          status: 400,
        },
      };
    }
  }

  const { payments, hasMore } = await getPaymentsByGroupId({
    groupId,
    currency,
    limit: pageSize,
    cursor: decodedCursor,
  });

  const lastPayment = payments[payments.length - 1];
  const nextCursor =
    hasMore && lastPayment
      ? encodePaymentCursor({
          createdAt: lastPayment.createdAt.toISOString(),
          id: lastPayment.id,
        })
      : null;

  return {
    ok: true,
    data: { payments, nextCursor },
  };
}

export async function deleteSettlementPayment({
  groupId,
  paymentId,
  userId,
}: {
  groupId: string;
  paymentId: string;
  userId: string;
}): Promise<PaymentServiceResult<{ deleted: true }>> {
  if (!groupId || !paymentId || !userId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Group ID, payment ID and user ID are required',
        status: 400,
      },
    };
  }

  const membership = await getParticipantByGroupAndUserId(groupId, userId);
  if (!membership) {
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
          status: 404,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not a member of this group',
        status: 403,
      },
    };
  }

  const payment = await getPaymentById(paymentId);
  if (!payment || payment.groupId !== groupId) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Payment not found',
        status: 404,
      },
    };
  }

  await deletePaymentById(paymentId);

  return { ok: true, data: { deleted: true } };
}
