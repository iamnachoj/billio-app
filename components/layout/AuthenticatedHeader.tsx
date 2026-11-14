import { Link } from '@/i18n/navigation';
import BillioLogo from '@/components/layout/BillioLogo';
import { LogoutButton } from '@/components/layout/LogoutButton';
import { getCurrentUser } from '@/lib/services/authService';
import { getTranslations } from 'next-intl/server';

export default async function Header() {
  const t = await getTranslations('LAYOUT');
  const user = await getCurrentUser();

  return (
    <header className="bg-gray-800 text-white px-4 py-4">
      {user ? (
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="shrink-0 whitespace-nowrap [&_h1]:text-xl [&_img]:h-6 [&_img]:w-6 sm:[&_h1]:text-3xl sm:[&_img]:h-8 sm:[&_img]:w-8"
          >
            <BillioLogo />
          </Link>
          <nav
            aria-label={t('NAVIGATION')}
            className="flex shrink-0 items-center gap-2 text-xs sm:gap-6 sm:text-base"
          >
            <Link
              href="/dashboard/settings"
              className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap hover:text-teal-400 sm:gap-2"
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
