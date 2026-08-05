import Link from 'next/link';
import BillioLogo from '@/components/layout/BillioLogo';
import { LogoutButton } from '@/components/layout/LogoutButton';
import { getCurrentUser } from '@/lib/services/authService';

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="bg-gray-800 text-white p-4 lg:py-4 lg:px-16">
      {user ? (
        <div className="flex justify-between">
          <Link href="/">
            <BillioLogo />
          </Link>
          <nav className="mt-2 flex lg:gap-4">
            <Link href="/settings" className="mr-4 hover:text-teal-400">
              Settings
            </Link>
            <LogoutButton />
          </nav>
        </div>
      ) : (
        <Link href="/" className="text-3xl text-center">
          Welcome to <BillioLogo />
        </Link>
      )}
    </header>
  );
}
