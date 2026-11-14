'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  deletePayment,
  getPayments,
  type PaymentData,
} from '@/frontend-services/payments.service';
import { formatMoney } from './groupTotalsUtils';

const PAGE_SIZE = 5;

type Props = {
  groupId: string;
  currency: string;
  participantNameById: Map<string, string>;
  refreshKey: number;
};

export default function GroupPaymentHistory({
  groupId,
  currency,
  participantNameById,
  refreshKey,
}: Props) {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [undoRefreshKey, setUndoRefreshKey] = useState(0);
  const [undoingPaymentId, setUndoingPaymentId] = useState<string | null>(null);

  const historyKey = JSON.stringify([
    groupId,
    currency,
    refreshKey,
    undoRefreshKey,
  ]);
  const isLoading = loadedKey !== historyKey;

  useEffect(() => {
    let cancelled = false;

    getPayments(groupId, { currency, limit: PAGE_SIZE }).then((result) => {
      if (cancelled) {
        return;
      }

      setLoadedKey(historyKey);

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setError('');
      setPayments(result.data.payments);
      setCursor(result.data.nextCursor);
    });

    return () => {
      cancelled = true;
    };
  }, [groupId, currency, historyKey]);

  async function loadMore() {
    if (!cursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError('');
    const result = await getPayments(groupId, {
      currency,
      limit: PAGE_SIZE,
      cursor,
    });
    setIsLoadingMore(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setPayments((current) => [...current, ...result.data.payments]);
    setCursor(result.data.nextCursor);
  }

  async function handleUndo(paymentId: string) {
    setUndoingPaymentId(paymentId);
    setError('');
    const result = await deletePayment(groupId, paymentId);
    setUndoingPaymentId(null);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setUndoRefreshKey((key) => key + 1);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900">Payment history</h3>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading payments…</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-slate-600">No payments recorded yet.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {payments.map((payment) => {
              const fromName =
                participantNameById.get(payment.fromParticipantId) ??
                'Unknown participant';
              const toName =
                participantNameById.get(payment.toParticipantId) ??
                'Unknown participant';

              return (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800"
                >
                  <p>
                    <span className="font-medium">{fromName}</span> paid{' '}
                    <span className="font-medium">{toName}</span>{' '}
                    <span className="font-semibold">
                      {formatMoney(payment.amount, payment.currency)}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {new Intl.DateTimeFormat('en-GB', {
                        dateStyle: 'medium',
                      }).format(new Date(payment.createdAt))}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleUndo(payment.id)}
                    disabled={undoingPaymentId === payment.id}
                    className="shrink-0 text-xs text-slate-400 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {undoingPaymentId === payment.id ? 'Undoing…' : 'Undo'}
                  </button>
                </li>
              );
            })}
          </ul>

          {cursor ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900 hover:decoration-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? 'Loading…' : 'View more'}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
