'use client';

import { useLogout } from '../auth/hooks/useLogout';
import { useTranslations } from 'next-intl';

export function LogoutButton() {
  const t = useTranslations('LAYOUT');
  const { handleLogout } = useLogout();

  return (
    <button
      className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap hover:text-red-500 cursor-pointer sm:gap-2"
      onClick={handleLogout}
    >
      <span aria-hidden="true">🚪</span>
      {t('LOG_OUT')}
    </button>
  );
}
