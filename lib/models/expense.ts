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
  paidByParticipantId: string; // participant ID of the person who paid the expense
  createdByParticipantId: string; // participant ID of the creator
};
