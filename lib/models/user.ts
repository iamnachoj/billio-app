import type { AppLocale } from '@/lib/locale';

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  locale: AppLocale;
  avatarUrl?: string;
};
