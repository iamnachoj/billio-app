'use client';

import Button from '@/components/ui/Button';
import { Expense } from '@/lib/models/expense';

import ExpenseCard from './ExpenseCard';
import ExpenseSearchPanel from './ExpenseSearchPanel';
import { useExpenseSearch } from './hooks/useExpenseSearch';

type ExpenseListProps = {
  expenses: Expense[];
  participantNameById: Map<string, string>;
  onOpenAddExpenseModal: () => void;
  onOpenExpenseDetailsModal: (expenseId: string) => void;
  canCreateExpense: boolean;
};

export default function ExpenseList({
  expenses,
  participantNameById,
  onOpenAddExpenseModal,
  onOpenExpenseDetailsModal,
  canCreateExpense,
}: ExpenseListProps) {
  const {
    isSearchOpen,
    searchQuery,
    filteredExpenses,
    setSearchQuery,
    toggleSearch,
  } = useExpenseSearch(expenses);

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Expenses
          </h2>
          <button
            type="button"
            onClick={toggleSearch}
            className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900 hover:decoration-slate-500"
          >
            {isSearchOpen ? '🔎 Close search' : '🔎 Search'}
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

      {isSearchOpen ? (
        <ExpenseSearchPanel value={searchQuery} onChange={setSearchQuery} />
      ) : null}

      {filteredExpenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          {expenses.length === 0
            ? 'No expenses yet.'
            : 'No expenses match your search.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredExpenses.map((expense) => {
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
      )}
    </section>
  );
}
