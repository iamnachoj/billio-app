'use client';

import { useState } from 'react';

import Button from '@/components/ui/Button';
import { Expense } from '@/lib/models/expense';

import ExpenseCard from './ExpenseCard';
import ExpenseFilterPanel from './ExpenseFilterPanel';
import LoadMoreSentinel from './LoadMoreSentinel';
import type { ExpenseFilters } from './hooks/useExpensesPaginated';

type ExpenseListProps = {
  expenses: Expense[];
  participantNameById: Map<string, string>;
  onOpenAddExpenseModal: () => void;
  onOpenExpenseDetailsModal: (expenseId: string) => void;
  canCreateExpense: boolean;
  filters: ExpenseFilters;
  onFiltersChange: (next: ExpenseFilters) => void;
  hasMore: boolean;
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  loadError: string;
  onLoadMore: () => void;
};

export default function ExpenseList({
  expenses,
  participantNameById,
  onOpenAddExpenseModal,
  onOpenExpenseDetailsModal,
  canCreateExpense,
  filters,
  onFiltersChange,
  hasMore,
  isLoadingInitial,
  isLoadingMore,
  loadError,
  onLoadMore,
}: ExpenseListProps) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Expenses
          </h2>
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen((open) => !open)}
            className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900 hover:decoration-slate-500"
          >
            {isFilterPanelOpen ? '🔎 Close filters' : '🔎 Search & filter'}
          </button>
        </div>

        {canCreateExpense ? (
          <Button
            onClick={onOpenAddExpenseModal}
            className="px-4 py-2 text-sm shadow-sm"
          >
            Add expense
          </Button>
        ) : null}
      </div>

      {isFilterPanelOpen ? (
        <ExpenseFilterPanel filters={filters} onChange={onFiltersChange} />
      ) : null}

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}

      {isLoadingInitial ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 animate-pulse">
          Loading expenses…
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No expenses match your filters.
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {expenses.map((expense) => {
              const payerName =
                participantNameById.get(expense.paidByParticipantId) ??
                'Unknown participant';

              return (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  payerName={payerName}
                  onOpenDetails={() => onOpenExpenseDetailsModal(expense.id)}
                />
              );
            })}
          </ul>

          <LoadMoreSentinel
            enabled={hasMore}
            isLoading={isLoadingMore}
            onIntersect={onLoadMore}
          />
        </>
      )}
    </section>
  );
}
