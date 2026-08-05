import { ExpenseDetailsData } from '@/frontend-services/expenses.service';

type SplitSummaryRow = {
  participantId: string;
  amount: number;
};

type ExpenseDetailsViewProps = {
  details: ExpenseDetailsData;
  splitSummaryRows: SplitSummaryRow[];
  participantNameById: Map<string, string>;
};

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function prettifyCategory(category: string) {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function ExpenseDetailsView({
  details,
  splitSummaryRows,
  participantNameById,
}: ExpenseDetailsViewProps) {
  return (
    <>
      <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">
            {details.expense.title}
          </h3>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
            {prettifyCategory(details.expense.category)}
          </span>
        </div>

        <p className="text-sm text-slate-700">
          {formatMoney(details.expense.amount, details.expense.currency)} paid
          by{' '}
          {participantNameById.get(details.expense.paidByParticipantId) ??
            'Unknown participant'}
        </p>

        <p className="text-xs text-slate-500">
          Created {formatDate(details.expense.createdAt)}
          {details.expense.lastEditedAt
            ? ` | Edited ${formatDate(details.expense.lastEditedAt)}`
            : ''}
        </p>

        <p className="text-sm text-slate-700">
          {details.expense.description?.trim()
            ? details.expense.description
            : 'No description.'}
        </p>
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-900">
          Split breakdown
        </h4>
        {splitSummaryRows.length === 0 ? (
          <p className="text-sm text-slate-500">
            No one owes for this expense.
          </p>
        ) : (
          <ul className="space-y-2">
            {splitSummaryRows.map((row) => {
              const percentage =
                details.expense.amount > 0
                  ? ((row.amount / details.expense.amount) * 100).toFixed(2)
                  : '0.00';

              return (
                <li
                  key={row.participantId}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="text-slate-700">
                    {participantNameById.get(row.participantId) ??
                      'Unknown participant'}
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatMoney(row.amount, details.expense.currency)} (
                    {percentage}%)
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
