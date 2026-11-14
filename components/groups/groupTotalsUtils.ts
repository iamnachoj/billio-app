import {
  type ExpenseCategory,
  getExpenseCategoryLabel,
} from '@/lib/models/expense';

const categoryTranslationKeys: Record<ExpenseCategory, string> = {
  eating_out: 'CATEGORIES.EATING_OUT',
  groceries: 'CATEGORIES.GROCERIES',
  drinks: 'CATEGORIES.DRINKS',
  home: 'CATEGORIES.HOME',
  transport: 'CATEGORIES.TRANSPORT',
  travel: 'CATEGORIES.TRAVEL',
  entertainment: 'CATEGORIES.ENTERTAINMENT',
  shopping: 'CATEGORIES.SHOPPING',
  health: 'CATEGORIES.HEALTH',
  personal_care: 'CATEGORIES.PERSONAL_CARE',
  services: 'CATEGORIES.SERVICES',
  gifts: 'CATEGORIES.GIFTS',
  miscellaneous: 'CATEGORIES.MISCELLANEOUS',
};

export function formatMoney(
  amountCents: number,
  currency: string,
  locale = 'en-US'
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function formatGroupDate(
  date: Date | string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  }
) {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

export function formatGroupNumber(
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
  }
) {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function getGroupCategoryLabel(
  category: string,
  translate: (key: string) => string
) {
  const translationKey = categoryTranslationKeys[category as ExpenseCategory];
  return translationKey
    ? translate(translationKey)
    : getExpenseCategoryLabel(category);
}

export function getMonthPeriod(
  now: Date,
  monthOffset: number,
  locale = 'en-GB',
  thisMonthLabel = 'This month'
) {
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end =
    monthOffset === 0
      ? now
      : new Date(start.getFullYear(), start.getMonth() + 1, 1, 0, 0, 0, -1);

  return {
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
    label:
      monthOffset === 0
        ? thisMonthLabel
        : new Intl.DateTimeFormat(locale, {
            month: 'long',
            year: 'numeric',
          }).format(start),
  };
}
