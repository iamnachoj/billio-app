'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Expense, getExpenseCategoryEmoji } from '@/lib/models/expense';
import {
  formatGroupDate,
  formatMoney,
  getGroupCategoryLabel,
} from '@/components/groups/groupTotalsUtils';

type ExpenseCardProps = {
  expense: Expense;
  payerName: string;
  onOpenDetails: () => void;
};

export default function ExpenseCard({
  expense,
  payerName,
  onOpenDetails,
}: ExpenseCardProps) {
  const t = useTranslations('GROUPS');
  const locale = useLocale();

  return (
    <li>
      <button
        type="button"
        onClick={onOpenDetails}
        className="group w-full rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="text-base font-semibold tracking-tight text-slate-900">
                {expense.title}
              </h3>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                {getExpenseCategoryEmoji(expense.category)}{' '}
                {getGroupCategoryLabel(
                  expense.category,
                  t as (key: string) => string
                )}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {t('EXPENSES.PAID_BY', {
                name: payerName,
                date: formatGroupDate(expense.createdAt, locale),
              })}
            </p>

            {expense.description ? (
              <p className="line-clamp-2 border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-600">
                {expense.description}
              </p>
            ) : null}
          </div>

          <div className="text-left md:text-right">
            <p className="text-xl font-semibold tracking-tight text-slate-900">
              {formatMoney(expense.amount, expense.currency, locale)}
            </p>
            {expense.lastEditedAt ? (
              <p className="mt-1 text-xs text-slate-500">
                {t('EXPENSES.EDITED', {
                  date: formatGroupDate(expense.lastEditedAt, locale),
                })}
              </p>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}
