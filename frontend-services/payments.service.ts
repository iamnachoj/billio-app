import { parseApiResult } from './expenses.service';

export type CreatePaymentInput = {
  fromParticipantId: string;
  toParticipantId: string;
  amountCents: number;
  currency: string;
};

export type PaymentData = {
  id: string;
  groupId: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  currency: string;
  createdByParticipantId: string;
  createdAt: string;
};

export async function createPayment(groupId: string, body: CreatePaymentInput) {
  const response = await fetch(`/api/groups/${groupId}/payments`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseApiResult<PaymentData>(response);
}

export type PaymentListParams = {
  currency?: string;
  limit?: number;
  cursor?: string;
};

export type PaymentListData = {
  payments: PaymentData[];
  nextCursor: string | null;
};

export async function getPayments(
  groupId: string,
  params: PaymentListParams = {}
) {
  const searchParams = new URLSearchParams();

  if (params.currency) searchParams.set('currency', params.currency);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.cursor) searchParams.set('cursor', params.cursor);

  const query = searchParams.toString();

  const response = await fetch(
    `/api/groups/${groupId}/payments${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  return parseApiResult<PaymentListData>(response);
}

export async function deletePayment(groupId: string, paymentId: string) {
  const response = await fetch(`/api/groups/${groupId}/payments/${paymentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return parseApiResult<{ deleted: true }>(response, {
    successFallbackData: { deleted: true },
  });
}
