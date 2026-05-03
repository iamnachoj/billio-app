export type Expense = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  amount: number; // cents (ej: 1234 = 12.34€)
  currency: string;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  paidBy: string; // user ID of the person who paid the expense
  createdBy: string; // user ID of the creator
};
