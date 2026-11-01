'use client';

import { useLogout } from '../auth/hooks/useLogout';

export function LogoutButton() {
  const { handleLogout } = useLogout();

  return (
    <button
      className="inline-flex items-center gap-2 hover:text-red-500 cursor-pointer"
      onClick={handleLogout}
    >
      <span aria-hidden="true">🚪</span>
      Log out
    </button>
  );
}
