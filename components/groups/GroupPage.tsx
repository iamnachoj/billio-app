'use client';

import { Expense } from '@/lib/models/expense';
import { Group } from '@/lib/models/group';
import { GroupParticipant } from '@/lib/models/groupParticipant';
import { GroupBalances } from '@/lib/services/balanceService';

import GroupParticipantsModal from '@/components/groups/GroupParticipantsModal';
import GroupSettingsModal from './GroupSettingsModal';
import { useGroup } from './hooks/useGroup';

export type GroupPageUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  avatarUrl?: string;
};

export type GroupPageProps = {
  user: GroupPageUser;
  group: Group;
  participants: GroupParticipant[];
  expenses: Expense[];
  balances: GroupBalances;
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

function prettifyCategory(category: string) {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function GroupPage(props: GroupPageProps) {
  const group = useGroup(props);

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-8 space-y-8">
      <header className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 md:p-8 shadow-sm">
        <button
          type="button"
          aria-label="Open group settings"
          onClick={group.openSettingsModal}
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
              {group.groupName}
            </h1>
            {group.group.description ? (
              <p className="max-w-2xl text-slate-600">
                {group.group.description}
              </p>
            ) : null}
            <p className="text-sm text-slate-500">
              <button
                type="button"
                onClick={group.openParticipantsModal}
                className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900 hover:decoration-slate-500"
              >
                {group.participants.length} participants
              </button>{' '}
              · {group.expenses.length} expenses
            </p>
          </div>

          <div className="min-w-[260px] rounded-2xl border border-slate-200 bg-white p-4 lg:mr-6">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
              {group.selectedCurrency}
            </p>
            <p className="mt-3 text-sm text-slate-600">{group.summaryLabel}</p>
            <p
              className={`text-2xl font-semibold ${
                group.myNetBalanceCents > 0
                  ? 'text-emerald-700'
                  : group.myNetBalanceCents < 0
                    ? 'text-rose-700'
                    : 'text-slate-900'
              }`}
            >
              {formatMoney(
                Math.abs(group.myNetBalanceCents),
                group.selectedCurrency
              )}
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Expenses</h2>
          <p className="text-sm text-slate-100">Newest first</p>
        </div>

        {group.expensesSorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No expenses yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {group.expensesSorted.map((expense) => {
              const payerName =
                group.participantNameById.get(expense.paidByParticipantId) ??
                'Unknown participant';

              return (
                <li
                  key={expense.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-base font-medium text-slate-900">
                        {expense.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                          {prettifyCategory(expense.category)}
                        </span>
                        <span>Paid by {payerName}</span>
                        <span>•</span>
                        <span>{formatDate(expense.createdAt)}</span>
                      </div>
                      {expense.description ? (
                        <p className="text-sm text-slate-600">
                          {expense.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">
                        {formatMoney(expense.amount, expense.currency)}
                      </p>
                      {expense.lastEditedAt ? (
                        <p className="text-xs text-slate-500">
                          Edited {formatDate(expense.lastEditedAt)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <GroupParticipantsModal
        open={group.isParticipantsModalOpen}
        onClose={group.closeParticipantsModal}
        participants={group.participants}
        currentUserId={group.user.id}
      />

      <GroupSettingsModal
        open={group.isSettingsModalOpen}
        onClose={group.closeSettingsModal}
        onSubmit={group.submitSettings}
        isSaving={group.isSavingSettings}
        error={group.settingsError}
        canEditGroupName={group.canEditGroupName}
        groupNameDraft={group.groupNameDraft}
        setGroupNameDraft={group.setGroupNameDraft}
        currencyDraft={group.settingsCurrencyDraft}
        setCurrencyDraft={group.setSettingsCurrencyDraft}
        currencies={group.availableCurrencies}
      />
    </main>
  );
}
