import { useMemo, useState } from 'react';

import { Expense } from '@/lib/models/expense';

export function useExpenseSearch(expenses: Expense[]) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return expenses;
    }

    return expenses.filter((expense) =>
      expense.title.toLowerCase().includes(normalizedQuery)
    );
  }, [expenses, searchQuery]);

  function toggleSearch() {
    setIsSearchOpen((open) => {
      const nextOpen = !open;

      if (!nextOpen) {
        setSearchQuery('');
      }

      return nextOpen;
    });
  }

  return {
    isSearchOpen,
    searchQuery,
    filteredExpenses,
    setSearchQuery,
    toggleSearch,
  };
}
