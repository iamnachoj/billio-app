import Link from 'next/link';
import BillioLogo from '@/components/layout/BillioLogo';

export default function Header({ user }: { user: any }) {
  return (
    <header className="bg-gray-800 text-white p-4">
      {user ? (
        <>
          <BillioLogo />
          <nav>
            <Link href="/settings" className="mr-4">
              Account Settings
            </Link>
          </nav>
        </>
      ) : (
        <Link href="/" className="text-3xl text-center">
          Welcome to <BillioLogo />
        </Link>
      )}
    </header>
  );
}
