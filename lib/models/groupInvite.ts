export type GroupInvite = {
  id: string;
  groupId: string;
  participantId?: string;
  token: string;
  email?: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: Date;
  acceptedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
};
