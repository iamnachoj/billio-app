import { ExpenseCategories } from '@/lib/models/expense';

import {
  emptyExpenseFilters,
  type ExpenseFilters,
} from './hooks/useExpensesPaginated';

type ExpenseFilterPanelProps = {
  filters: ExpenseFilters;
  onChange: (next: ExpenseFilters) => void;
};

function prettifyCategory(category: string) {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function ExpenseFilterPanel({
  filters,
  onChange,
}: ExpenseFilterPanelProps) {
  function update<K extends keyof ExpenseFilters>(
    key: K,
    value: ExpenseFilters[K]
  ) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value !== emptyExpenseFilters[key as keyof ExpenseFilters]
  );

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label htmlFor="expense-search" className="sr-only">
          Search expenses by name
        </label>
        <input
          id="expense-search"
          type="text"
          value={filters.search}
          onChange={(event) => update('search', event.target.value)}
          placeholder="Search by expense name"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="expense-category" className="sr-only">
          Filter by category
        </label>
        <select
          id="expense-category"
          value={filters.category}
          onChange={(event) =>
            update('category', event.target.value as ExpenseFilters['category'])
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {ExpenseCategories.map((category) => (
            <option key={category} value={category}>
              {prettifyCategory(category)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="expense-date-from" className="sr-only">
            From date
          </label>
          <input
            id="expense-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => update('dateFrom', event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="expense-date-to" className="sr-only">
            To date
          </label>
          <input
            id="expense-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(event) => update('dateTo', event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1">
        <div>
          <label htmlFor="expense-min-amount" className="sr-only">
            Minimum amount
          </label>
          <input
            id="expense-min-amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={filters.minAmount}
            onChange={(event) => update('minAmount', event.target.value)}
            placeholder="Min amount"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="expense-max-amount" className="sr-only">
            Maximum amount
          </label>
          <input
            id="expense-max-amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={filters.maxAmount}
            onChange={(event) => update('maxAmount', event.target.value)}
            placeholder="Max amount"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <button
          type="button"
          onClick={() => onChange(emptyExpenseFilters)}
          disabled={!hasActiveFilters}
          className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900 hover:decoration-slate-500 disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
        >
          Clear all filters
        </button>
      </div>
    </div>
  );
}
