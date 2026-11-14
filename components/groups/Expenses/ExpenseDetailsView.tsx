'use client';

import { useLocale, useTranslations } from 'next-intl';

import { ExpenseDetailsData } from '@/frontend-services/expenses.service';
import { getExpenseCategoryEmoji } from '@/lib/models/expense';
import {
  formatGroupDate,
  formatGroupNumber,
  formatMoney,
  getGroupCategoryLabel,
} from '@/components/groups/groupTotalsUtils';

type SplitSummaryRow = {
  participantId: string;
  amount: number;
};

type ExpenseDetailsViewProps = {
  details: ExpenseDetailsData;
  splitSummaryRows: SplitSummaryRow[];
  participantNameById: Map<string, string>;
};

export default function ExpenseDetailsView({
  details,
  splitSummaryRows,
  participantNameById,
}: ExpenseDetailsViewProps) {
  const t = useTranslations('GROUPS');
  const locale = useLocale();

  return (
    <>
      <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">
            {details.expense.title}
          </h3>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
            {getExpenseCategoryEmoji(details.expense.category)}{' '}
            {getGroupCategoryLabel(
              details.expense.category,
              t as (key: string) => string
            )}
          </span>
        </div>

        <p className="text-sm text-slate-700">
          {t('EXPENSE_DETAILS.PAID_BY', {
            amount: formatMoney(
              details.expense.amount,
              details.expense.currency,
              locale
            ),
            name:
              participantNameById.get(details.expense.paidByParticipantId) ??
              t('EXPENSE_DETAILS.UNKNOWN_PARTICIPANT'),
          })}
        </p>

        <p className="text-xs text-slate-500">
          {t('EXPENSE_DETAILS.CREATED', {
            date: formatGroupDate(details.expense.createdAt, locale),
          })}
          {details.expense.lastEditedAt
            ? ` | ${t('EXPENSE_DETAILS.EDITED', {
                date: formatGroupDate(details.expense.lastEditedAt, locale),
              })}`
            : ''}
        </p>

        <p className="text-sm text-slate-700">
          {details.expense.description?.trim()
            ? details.expense.description
            : t('EXPENSE_DETAILS.NO_DESCRIPTION')}
        </p>
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-900">
          {t('EXPENSE_DETAILS.SPLIT_BREAKDOWN')}
        </h4>
        {splitSummaryRows.length === 0 ? (
          <p className="text-sm text-slate-500">
            {t('EXPENSE_DETAILS.NO_OWES')}
          </p>
        ) : (
          <ul className="space-y-2">
            {splitSummaryRows.map((row) => {
              const percentage =
                details.expense.amount > 0
                  ? (row.amount / details.expense.amount) * 100
                  : 0;
              const formattedAmount = formatMoney(
                row.amount,
                details.expense.currency,
                locale
              );
              const formattedPercentage = `${formatGroupNumber(
                percentage,
                locale,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}%`;

              return (
                <li
                  key={row.participantId}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="text-slate-700">
                    {participantNameById.get(row.participantId) ??
                      t('EXPENSE_DETAILS.UNKNOWN_PARTICIPANT')}
                  </span>
                  <span className="font-medium text-slate-900">
                    {formattedAmount} ({formattedPercentage})
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
