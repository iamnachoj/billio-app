export type Expense = {
  id: string;
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number; // cents (ej: 1234 = 12.34€)
  currency: string;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  paidByParticipantId: string; // participant ID of the person who paid the expense
  createdByParticipantId: string; // participant ID of the creator
  lastEditedAt?: Date;
  lastEditedByParticipantId?: string;
};

export const ExpenseCategories = [
  'eating_out',
  'groceries',
  'drinks',
  'home',
  'transport',
  'travel',
  'entertainment',
  'shopping',
  'health',
  'personal_care',
  'services',
  'gifts',
  'miscellaneous',
] as const;

export type ExpenseCategory = (typeof ExpenseCategories)[number];

export const ExpenseCategoryMeta: Record<
  ExpenseCategory,
  { label: string; emoji: string }
> = {
  eating_out: { label: 'Eating Out', emoji: '🍴' },
  groceries: { label: 'Groceries', emoji: '🛒' },
  drinks: { label: 'Drinks', emoji: '🍻' },
  home: { label: 'Home', emoji: '🏠' },
  transport: { label: 'Transport', emoji: '🚇' },
  travel: { label: 'Travel', emoji: '✈️' },
  entertainment: { label: 'Entertainment', emoji: '🪁' },
  shopping: { label: 'Shopping', emoji: '🛍️' },
  health: { label: 'Health', emoji: '❤️' },
  personal_care: { label: 'Personal Care', emoji: '🛁' },
  services: { label: 'Services', emoji: '📱' },
  gifts: { label: 'Gifts', emoji: '🎁' },
  miscellaneous: { label: 'Miscellaneous', emoji: '🗂️' },
};

// Falls back to a readable label for categories outside the current taxonomy (e.g. legacy data).
export function getExpenseCategoryLabel(category: string): string {
  const meta = ExpenseCategoryMeta[category as ExpenseCategory];
  if (meta) {
    return meta.label;
  }

  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getExpenseCategoryEmoji(category: string): string {
  return ExpenseCategoryMeta[category as ExpenseCategory]?.emoji ?? '🗂️';
}
