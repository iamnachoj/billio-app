'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import {
  getCategoryStats,
  type GroupCategoryStats,
} from '@/frontend-services/stats.service';
import { getExpenseCategoryEmoji } from '@/lib/models/expense';
import {
  formatMoney,
  getGroupCategoryLabel,
  formatGroupNumber,
  getMonthPeriod,
} from './groupTotalsUtils';
import { useApiError } from '@/i18n/errors';

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
  const t = useTranslations('GROUPS');
  const locale = useLocale();
  const apiError = useApiError();
  const [stats, setStats] = useState<GroupCategoryStats | null>(null);
  const [loadedStatsKey, setLoadedStatsKey] = useState<string | null>(null);
  const [statsError, setStatsError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const month = getMonthPeriod(
    new Date(),
    monthOffset,
    locale,
    t('TOTALS.MONTH')
  );
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
          setStatsError(apiError(result.error));
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
        setStatsError(t('ERRORS.LOAD_STATS_FAILED'));
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, currency, period, monthOffset, statsKey, apiError, t, locale]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h3 className="text-sm font-semibold text-slate-900">
          {t('CATEGORY_STATS.TITLE')}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <div
            role="group"
            aria-label={t('CATEGORY_STATS.MONTHLY_ARIA_LABEL')}
            className={`flex items-center rounded-full border border-slate-200 p-1 ${
              period === 'month'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600'
            }`}
          >
            <button
              type="button"
              aria-label={t('CATEGORY_STATS.PREVIOUS_MONTH')}
              onClick={() => onChangeMonth(-1)}
              className="rounded-full px-2 py-1 hover:opacity-70"
            >
              ←
            </button>
            <button
              type="button"
              aria-pressed={period === 'month'}
              onClick={onSelectMonth}
              className="min-w-28 px-1 py-1"
            >
              {month.label}
            </button>
            <button
              type="button"
              aria-label={t('CATEGORY_STATS.NEXT_MONTH')}
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
            {t('CATEGORY_STATS.ALL_TIME')}
          </button>
        </div>
      </div>

      <div
        role="region"
        aria-label={t('CATEGORY_STATS.RESULTS_ARIA_LABEL')}
        tabIndex={0}
        className="h-80 overflow-y-auto rounded-xl border border-slate-200 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 [scrollbar-gutter:stable]"
      >
        {isLoading ? (
          <div className="flex min-h-full items-center justify-center">
            <p role="status" className="text-sm text-slate-600 animate-pulse">
              {t('CATEGORY_STATS.LOADING')}
            </p>
          </div>
        ) : statsError ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm text-rose-700">{statsError}</p>
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
            >
              {t('CATEGORY_STATS.RETRY')}
            </button>
          </div>
        ) : !stats || stats.categories.length === 0 ? (
          <div className="flex min-h-full items-center justify-center text-center">
            <p className="text-sm text-slate-600">
              {t('CATEGORY_STATS.EMPTY')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.topCategory ? (
              <p className="text-sm text-slate-700">
                {t('CATEGORY_STATS.TOP_CATEGORY', {
                  category: `${getExpenseCategoryEmoji(stats.topCategory.category)} ${getGroupCategoryLabel(stats.topCategory.category, t as (key: string) => string)}`,
                  amount: formatMoney(
                    stats.topCategory.totalCents,
                    stats.currency,
                    locale
                  ),
                })}
              </p>
            ) : null}

            <ul className="space-y-2">
              {stats.categories.map((categoryStat) => (
                <li key={categoryStat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-800">
                      {getExpenseCategoryEmoji(categoryStat.category)}{' '}
                      {getGroupCategoryLabel(
                        categoryStat.category,
                        t as (key: string) => string
                      )}{' '}
                      <span className="text-slate-400">
                        (
                        {formatGroupNumber(
                          Math.round(categoryStat.percentageOfTotal * 100) /
                            100,
                          locale
                        )}
                        %)
                      </span>
                    </span>
                    <span className="font-medium text-slate-900">
                      {formatMoney(
                        categoryStat.totalCents,
                        stats.currency,
                        locale
                      )}
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
    </div>
  );
}
