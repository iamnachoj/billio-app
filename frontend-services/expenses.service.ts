export type CreateExpenseSplitInput =
  | { mode: 'equal' }
  | { mode: 'selected'; participantIds: string[] }
  | {
      mode: 'percentage';
      shares: Array<{ participantId: string; percentage: number }>;
    };

export type CreateExpenseInput = {
  title: string;
  description?: string;
  category: string;
  amount: number;
  currency: string;
  paidByParticipantId: string;
  split: CreateExpenseSplitInput;
};

export async function createExpense(groupId: string, body: CreateExpenseInput) {
  const response = await fetch(`/api/groups/${groupId}/expenses`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json();
}
