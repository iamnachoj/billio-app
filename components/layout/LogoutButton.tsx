'use client';

import { useLogout } from '../auth/hooks/useLogout';

export function LogoutButton() {
  const { handleLogout } = useLogout();

  return (
    <button
      className="mb-2 hover:text-red-500 cursor-pointer"
      onClick={handleLogout}
    >
      Log out
    </button>
  );
}
