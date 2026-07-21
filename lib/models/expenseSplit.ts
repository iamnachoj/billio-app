export type ExpenseSplit = {
  id: string;
  expenseId: string;
  participantId: string;
  amount: number; // cents (ej: 1234 = 12.34€)
  owedToParticipantId: string;
  createdAt: Date;
  updatedAt: Date;
};
