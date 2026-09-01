export type Payment = {
  id: string;
  groupId: string;
  fromParticipantId: string; // participant who paid
  toParticipantId: string; // participant who received the payment
  amount: number; // cents
  currency: string;
  createdByParticipantId: string;
  createdAt: Date;
};
