'use client';

import { useLogout } from '../auth/hooks/useLogout';
import { useTranslations } from 'next-intl';

export function LogoutButton() {
  const t = useTranslations('LAYOUT');
  const { handleLogout } = useLogout();

  return (
    <button
      className="inline-flex items-center gap-2 hover:text-red-500 cursor-pointer"
      onClick={handleLogout}
    >
      <span aria-hidden="true">🚪</span>
      {t('LOG_OUT')}
    </button>
  );
}
