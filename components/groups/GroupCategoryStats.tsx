'use client';

import { useEffect, useState } from 'react';

import {
  getCategoryStats,
  type GroupCategoryStats,
} from '@/frontend-services/stats.service';
import {
  getExpenseCategoryEmoji,
  getExpenseCategoryLabel,
} from '@/lib/models/expense';
import { formatMoney, getMonthPeriod } from './groupTotalsUtils';

type Props = {
  groupId: string;
  currency: string;
  period: 'month' | 'all';
  monthOffset: number;
  onSelectMonth: () => void;
  onSelectAll: () => void;
  onChangeMonth: (direction: -1 | 1) => void;
};

export default function GroupCategoryStats({
  groupId,
  currency,
  period,
  monthOffset,
  onSelectMonth,
  onSelectAll,
  onChangeMonth,
}: Props) {
  const [stats, setStats] = useState<GroupCategoryStats | null>(null);
  const [loadedStatsKey, setLoadedStatsKey] = useState<string | null>(null);
  const [statsError, setStatsError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const month = getMonthPeriod(new Date(), monthOffset);
  const statsKey = JSON.stringify([
    groupId,
    currency,
    period,
    period === 'month' ? month.dateFrom : null,
    retryKey,
  ]);
  const isLoading = loadedStatsKey !== statsKey;

  useEffect(() => {
    let cancelled = false;
    const range =
      period === 'month' ? getMonthPeriod(new Date(), monthOffset) : undefined;

    getCategoryStats(groupId, {
      currency,
      dateFrom: range?.dateFrom,
      dateTo: range?.dateTo,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setLoadedStatsKey(statsKey);

        if (!result.success) {
          setStatsError(result.error.message);
          return;
        }

        setStatsError('');
        setStats(result.data);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        console.error('Failed to load category statistics:', error);
        setLoadedStatsKey(statsKey);
        setStatsError('Unable to load statistics. Please try again.');
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, currency, period, monthOffset, statsKey]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Spending by category
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <div
            role="group"
            aria-label="Monthly statistics"
            className={`flex items-center rounded-full border border-slate-200 p-1 ${
              period === 'month'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600'
            }`}
          >
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => onChangeMonth(-1)}
              className="rounded-full px-2 py-1 hover:opacity-70"
            >
              ←
            </button>
            <button
              type="button"
              aria-pressed={period === 'month'}
              onClick={onSelectMonth}
              className="px-1 py-1"
            >
              {month.label}
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => onChangeMonth(1)}
              disabled={monthOffset === 0}
              className="rounded-full px-2 py-1 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              →
            </button>
          </div>
          <button
            type="button"
            aria-pressed={period === 'all'}
            onClick={onSelectAll}
            className={`rounded-full border border-slate-200 px-3 py-2 transition ${
              period === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900'
            }`}
          >
            All time
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600 animate-pulse">Loading stats…</p>
      ) : statsError ? (
        <div className="space-y-1">
          <p className="text-sm text-rose-700">{statsError}</p>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            className="text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
          >
            Retry
          </button>
        </div>
      ) : !stats || stats.categories.length === 0 ? (
        <p className="text-sm text-slate-600">No expenses in this period.</p>
      ) : (
        <div className="space-y-2">
          {stats.topCategory ? (
            <p className="text-sm text-slate-700">
              Top category:{' '}
              <span className="font-semibold text-slate-900">
                {getExpenseCategoryEmoji(stats.topCategory.category)}{' '}
                {getExpenseCategoryLabel(stats.topCategory.category)}
              </span>{' '}
              ({formatMoney(stats.topCategory.totalCents, stats.currency)})
            </p>
          ) : null}

          <ul className="space-y-2">
            {stats.categories.map((categoryStat) => (
              <li key={categoryStat.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-800">
                    {getExpenseCategoryEmoji(categoryStat.category)}{' '}
                    {getExpenseCategoryLabel(categoryStat.category)}{' '}
                    <span className="text-slate-400">
                      ({Math.round(categoryStat.percentageOfTotal * 100) / 100}
                      %)
                    </span>
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatMoney(categoryStat.totalCents, stats.currency)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900"
                    style={{ width: `${categoryStat.percentageOfTotal}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
