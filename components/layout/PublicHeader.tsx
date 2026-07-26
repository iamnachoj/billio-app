import Link from 'next/link';
import BillioLogo from '@/components/layout/BillioLogo';

export default async function Header() {
  return (
    <header className="bg-gray-800 text-white p-4 lg:py-4 lg:px-16">
      <Link href="/" className="text-3xl text-center">
        Welcome to <BillioLogo />
      </Link>
    </header>
  );
}
