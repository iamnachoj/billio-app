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
  'rent',
  'utilities',
  'internet',
  'fuel',
  'car',
  'public_transport',
  'travel',
  'mobility',
  'entertainment',
  'gaming',
  'shopping',
  'healthcare',
  'fitness',
  'education',
  'pets',
  'gifts',
  'kids',
  'work',
  'taxes',
  'financial',
  'insurance',
  'home',
  'personal_care',
  'subscriptions',
  'technology',
  'other',
] as const;

export type ExpenseCategory = (typeof ExpenseCategories)[number];
