import { Link } from '@/i18n/navigation';
import BillioLogo from '@/components/layout/BillioLogo';
import { getTranslations } from 'next-intl/server';

export default async function Header() {
  const t = await getTranslations('LAYOUT');
  return (
    <header className="bg-gray-800 text-white p-4 lg:py-4 lg:px-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-3xl text-center">
          {t('WELCOME')} <BillioLogo />
        </Link>
      </div>
    </header>
  );
}
