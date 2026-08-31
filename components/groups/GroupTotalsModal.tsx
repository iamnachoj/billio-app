'use client';

import { useEffect, useState } from 'react';

import Modal from '@/components/ui/Modal';
import { GroupBalances } from '@/lib/services/balanceService';
import {
  getCategoryStats,
  type GroupCategoryStats,
} from '@/frontend-services/stats.service';

type GroupTotalsModalProps = {
  open: boolean;
  onClose: () => void;
  groupId: string;
  balances: GroupBalances;
  selectedCurrency: string;
  participantNameById: Map<string, string>;
};

type StatsPeriod = 'month' | 'all';

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function prettifyCategory(category: string) {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    dateFrom: start.toISOString(),
    dateTo: now.toISOString(),
  };
}

export default function GroupTotalsModal({
  open,
  onClose,
  groupId,
  balances,
  selectedCurrency,
  participantNameById,
}: GroupTotalsModalProps) {
  const currencySummary =
    balances.currencies.find(
      (currency) => currency.currency === selectedCurrency
    ) ?? balances.currencies[0];

  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [stats, setStats] = useState<GroupCategoryStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    if (!open || !currencySummary) {
      return;
    }

    let cancelled = false;
    const { dateFrom, dateTo } =
      period === 'month' ? getCurrentMonthRange() : {};

    setIsLoadingStats(true);
    setStatsError('');

    getCategoryStats(groupId, {
      currency: currencySummary.currency,
      dateFrom,
      dateTo,
    }).then((result) => {
      if (cancelled) {
        return;
      }

      setIsLoadingStats(false);

      if (!result.success) {
        setStatsError(result.error.message);
        return;
      }

      setStats(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [open, groupId, currencySummary, period]);

  if (!currencySummary) {
    return (
      <Modal open={open} onClose={onClose} title="Totals" size="lg">
        <p className="text-sm text-slate-600">No totals yet for this group.</p>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Totals" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
              Total spent
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatMoney(
                currencySummary.totals.totalSpentCents,
                currencySummary.currency
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Participant balances
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-2 py-2 font-semibold">Participant</th>
                  <th className="px-2 py-2 font-semibold">Spent</th>
                  <th className="px-2 py-2 font-semibold">Lent</th>
                  <th className="px-2 py-2 font-semibold">Borrowed</th>
                  <th className="px-2 py-2 font-semibold text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currencySummary.participantBalances.map((balance) => {
                  const participantName =
                    participantNameById.get(balance.participantId) ??
                    'Unknown participant';

                  return (
                    <tr key={balance.participantId}>
                      <td className="px-2 py-2 text-slate-900">
                        {participantName}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {formatMoney(
                          balance.totalSpentCents,
                          currencySummary.currency
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {formatMoney(
                          balance.totalLentCents,
                          currencySummary.currency
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {formatMoney(
                          balance.totalBorrowedCents,
                          currencySummary.currency
                        )}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-semibold ${
                          balance.netBalanceCents > 0
                            ? 'text-emerald-700'
                            : balance.netBalanceCents < 0
                              ? 'text-rose-700'
                              : 'text-slate-900'
                        }`}
                      >
                        {formatMoney(
                          balance.netBalanceCents,
                          currencySummary.currency
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Who owes whom
          </h3>
          {currencySummary.settlements.length === 0 ? (
            <p className="text-sm text-slate-600">Everyone is settled.</p>
          ) : (
            <ul className="space-y-2">
              {currencySummary.settlements.map((settlement, index) => {
                const fromName =
                  participantNameById.get(settlement.fromParticipantId) ??
                  'Unknown participant';
                const toName =
                  participantNameById.get(settlement.toParticipantId) ??
                  'Unknown participant';

                return (
                  <li
                    key={`${settlement.fromParticipantId}-${settlement.toParticipantId}-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800"
                  >
                    <span className="font-medium">{fromName}</span> owes{' '}
                    <span className="font-medium">{toName}</span>{' '}
                    <span className="font-semibold">
                      {formatMoney(
                        settlement.amountCents,
                        currencySummary.currency
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Spending by category
            </h3>
            <div className="flex gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`rounded-full px-3 py-1 transition ${
                  period === 'month'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This month
              </button>
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className={`rounded-full px-3 py-1 transition ${
                  period === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All time
              </button>
            </div>
          </div>

          {isLoadingStats ? (
            <p className="text-sm text-slate-600">Loading stats…</p>
          ) : statsError ? (
            <p className="text-sm text-rose-700">{statsError}</p>
          ) : !stats || stats.categories.length === 0 ? (
            <p className="text-sm text-slate-600">
              No expenses in this period.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.topCategory ? (
                <p className="text-sm text-slate-700">
                  Top category:{' '}
                  <span className="font-semibold text-slate-900">
                    {prettifyCategory(stats.topCategory.category)}
                  </span>{' '}
                  ({formatMoney(stats.topCategory.totalCents, stats.currency)})
                </p>
              ) : null}

              <ul className="space-y-2">
                {stats.categories.map((categoryStat) => (
                  <li key={categoryStat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-800">
                        {prettifyCategory(categoryStat.category)}{' '}
                        <span className="text-slate-400">
                          ({categoryStat.expenseCount})
                        </span>
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(categoryStat.totalCents, stats.currency)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{
                          width: `${categoryStat.percentageOfTotal}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
