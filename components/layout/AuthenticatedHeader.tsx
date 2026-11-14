import { Link } from '@/i18n/navigation';
import BillioLogo from '@/components/layout/BillioLogo';
import { LogoutButton } from '@/components/layout/LogoutButton';
import { getCurrentUser } from '@/lib/services/authService';
import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from './LanguageSwitcher';

export default async function Header() {
  const t = await getTranslations('LAYOUT');
  const user = await getCurrentUser();

  return (
    <header className="bg-gray-800 text-white p-4 lg:py-4 lg:px-16">
      {user ? (
        <div className="flex justify-between">
          <Link href="/">
            <BillioLogo />
          </Link>
          <nav
            aria-label={t('NAVIGATION')}
            className="mt-2 flex items-center gap-6"
          >
            <LanguageSwitcher authenticated />
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 hover:text-teal-400"
            >
              <span aria-hidden="true">⚙️</span>
              {t('SETTINGS')}
            </Link>
            <LogoutButton />
          </nav>
        </div>
      ) : (
        <Link href="/" className="text-3xl text-center">
          {t('WELCOME')} <BillioLogo />
        </Link>
      )}
    </header>
  );
}
