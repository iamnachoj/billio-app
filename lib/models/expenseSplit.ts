export type ExpenseSplit = {
  id: string;
  expenseId: string;
  userId: string;
  amount: number; // cents (ej: 1234 = 12.34€)
  owedToUserId: string;
  createdAt: Date;
  updatedAt: Date;
};
