'use client';

type GroupHeaderProps = {
  groupName: string;
  description?: string;
  participantsCount: number;
  expensesCount: number;
  selectedCurrency: string;
  summaryLabel: string;
  myNetBalanceCents: number;
  onOpenParticipantsModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenTotalsModal: () => void;
};

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export default function GroupHeader({
  groupName,
  description,
  participantsCount,
  expensesCount,
  selectedCurrency,
  summaryLabel,
  myNetBalanceCents,
  onOpenParticipantsModal,
  onOpenSettingsModal,
  onOpenTotalsModal,
}: GroupHeaderProps) {
  return (
    <header className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 md:p-8 shadow-sm">
      <button
        type="button"
        aria-label="Open group settings"
        onClick={onOpenSettingsModal}
        className="cursor-pointer md:inline-flex absolute right-4 top-4 h-9 w-9 items-center justify-center rounded-lg text-xl leading-none text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
      >
        ⠇
      </button>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Group Overview
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            {groupName}
          </h1>
          {description ? (
            <p className="max-w-2xl text-slate-600">{description}</p>
          ) : null}
          <p className="text-sm text-slate-500">
            <button
              type="button"
              onClick={onOpenParticipantsModal}
              className="cursor-pointer font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900 hover:decoration-slate-500"
            >
              👥 {participantsCount} participants (+ add more)
            </button>{' '}
            · {expensesCount} expenses
          </p>
          <p className="text-sm text-slate-500">
            <button
              type="button"
              onClick={onOpenTotalsModal}
              className="cursor-pointer font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900 hover:decoration-slate-500"
            >
              📓 View totals and settlements
            </button>
          </p>
        </div>

        <div className="min-w-[260px] rounded-2xl border border-slate-200 bg-white p-4 lg:mr-6">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            {selectedCurrency}
          </p>
          <p className="mt-3 text-sm text-slate-600">{summaryLabel}</p>
          <p
            className={`text-2xl font-semibold ${
              myNetBalanceCents > 0
                ? 'text-emerald-700'
                : myNetBalanceCents < 0
                  ? 'text-rose-700'
                  : 'text-slate-900'
            }`}
          >
            {formatMoney(Math.abs(myNetBalanceCents), selectedCurrency)}
          </p>
        </div>
      </div>
    </header>
  );
}
