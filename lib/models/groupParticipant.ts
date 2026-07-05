export type GroupParticipant = {
  id: string;
  groupId: string;
  displayName: string;
  userId?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'left';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
