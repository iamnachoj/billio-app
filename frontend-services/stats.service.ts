import { parseApiResult } from './expenses.service';

export type CategoryStat = {
  category: string;
  totalCents: number;
  expenseCount: number;
  percentageOfTotal: number;
};

export type GroupCategoryStats = {
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  totalSpentCents: number;
  categories: CategoryStat[];
  topCategory: CategoryStat | null;
};

export async function getCategoryStats(
  groupId: string,
  params: { currency: string; dateFrom?: string; dateTo?: string }
) {
  const searchParams = new URLSearchParams({ currency: params.currency });

  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);

  const response = await fetch(
    `/api/groups/${groupId}/stats/categories?${searchParams.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  return parseApiResult<GroupCategoryStats>(response);
}
