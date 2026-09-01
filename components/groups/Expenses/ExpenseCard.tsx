'use client';

import {
  Expense,
  getExpenseCategoryEmoji,
  getExpenseCategoryLabel,
} from '@/lib/models/expense';

type ExpenseCardProps = {
  expense: Expense;
  payerName: string;
  onOpenDetails: () => void;
};

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function ExpenseCard({
  expense,
  payerName,
  onOpenDetails,
}: ExpenseCardProps) {
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
                {getExpenseCategoryLabel(expense.category)}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Paid by {payerName} | {formatDate(expense.createdAt)}
            </p>

            {expense.description ? (
              <p className="line-clamp-2 border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-600">
                {expense.description}
              </p>
            ) : null}
          </div>

          <div className="text-left md:text-right">
            <p className="text-xl font-semibold tracking-tight text-slate-900">
              {formatMoney(expense.amount, expense.currency)}
            </p>
            {expense.lastEditedAt ? (
              <p className="mt-1 text-xs text-slate-500">
                Edited {formatDate(expense.lastEditedAt)}
              </p>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}
