export type Group = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  createdBy: string; // user ID of the creator
};
