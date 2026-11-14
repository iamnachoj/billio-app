'use client';

import { logout } from '@/frontend-services/auth.service';
import { useRouter } from '@/i18n/navigation';

export function useLogout() {
  const router = useRouter();

  async function handleLogout() {
    await logout();

    router.replace('/');

    router.refresh();
  }

  return {
    handleLogout,
  };
}
