import { User } from '@/lib/models/user';

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  is_active: number;
  created_at: string;
  updated_at: string | null;
};

export function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    avatarUrl: row.avatar_url ?? undefined,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at
      ? new Date(row.updated_at)
      : new Date(row.created_at),
  };
}
