'use client';

import { useRouter } from 'next/navigation';

import { logout } from '@/frontend-services/auth.service';

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
