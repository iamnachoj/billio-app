import { useCallback, useEffect, useRef, useState } from 'react';

import { Expense, ExpenseCategory } from '@/lib/models/expense';
import { getExpenses } from '@/frontend-services/expenses.service';

export type ExpenseFilters = {
  search: string;
  category: ExpenseCategory | '';
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
};

export const emptyExpenseFilters: ExpenseFilters = {
  search: '',
  category: '',
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
};

const FILTERS_DEBOUNCE_MS = 350;

function toCentsOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.round(parsed * 100);
}

export function useExpensesPaginated({
  groupId,
  initialExpenses,
  initialNextCursor,
}: {
  groupId: string;
  initialExpenses: Expense[];
  initialNextCursor: string | null;
}) {
  const [filters, setFilters] = useState<ExpenseFilters>(emptyExpenseFilters);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor
  );
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const isFirstRender = useRef(true);
  const latestRequestId = useRef(0);

  const buildParams = useCallback(
    (cursor: string | null) => ({
      cursor: cursor ?? undefined,
      search: filters.search.trim() || undefined,
      category: filters.category || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      minAmountCents: toCentsOrUndefined(filters.minAmount),
      maxAmountCents: toCentsOrUndefined(filters.maxAmount),
    }),
    [filters]
  );

  // Skip the first run so we keep the server-rendered first page instead of re-fetching it.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const requestId = ++latestRequestId.current;
    setIsLoadingInitial(true);
    setError('');

    const timeoutId = setTimeout(async () => {
      const result = await getExpenses(groupId, buildParams(null));

      if (latestRequestId.current !== requestId) {
        return;
      }

      setIsLoadingInitial(false);

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setExpenses(result.data.expenses);
      setNextCursor(result.data.nextCursor);
    }, FILTERS_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, filters]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore || isLoadingInitial) {
      return;
    }

    setIsLoadingMore(true);
    setError('');

    const result = await getExpenses(groupId, buildParams(nextCursor));

    setIsLoadingMore(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setExpenses((current) => [...current, ...result.data.expenses]);
    setNextCursor(result.data.nextCursor);
  }, [groupId, nextCursor, isLoadingMore, isLoadingInitial, buildParams]);

  return {
    expenses,
    filters,
    setFilters,
    hasMore: nextCursor !== null,
    isLoadingInitial,
    isLoadingMore,
    error,
    loadMore,
  };
}
