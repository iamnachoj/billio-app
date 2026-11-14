'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { useApiError } from '@/i18n/errors';
import { usePathname, useRouter } from '@/i18n/navigation';
import { updateMe } from '@/frontend-services/me.service';
import { localeSwitchHref } from './localeSwitchHref';

type Locale = 'en' | 'es';

type Props = {
  authenticated?: boolean;
};

export default function LanguageSwitcher({ authenticated = false }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('LAYOUT.LANGUAGE_SWITCHER');
  const apiError = useApiError();
  const pathname = usePathname();
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeLocale(nextLocale: Locale) {
    if (nextLocale === locale || isChanging) {
      return;
    }

    const href = localeSwitchHref(
      pathname,
      window.location.search,
      window.location.hash,
      nextLocale
    );
    setError(null);
    setIsChanging(true);

    if (authenticated) {
      try {
        const result = await updateMe({ locale: nextLocale });
        if (!result.success) {
          setError(apiError(result.error));
          setIsChanging(false);
          return;
        }
      } catch {
        setError(t('SAVE_ERROR'));
        setIsChanging(false);
        return;
      }
    }

    router.replace(href, { locale: nextLocale });
  }

  return (
    <div>
      <div
        role="group"
        aria-label={t('LABEL')}
        className="inline-flex items-center gap-2"
      >
        {(['en', 'es'] as const).map((option) => {
          const label = option === 'en' ? t('ENGLISH') : t('SPANISH');

          return (
            <button
              key={option}
              type="button"
              aria-label={t('CHANGE_TO', { language: label })}
              aria-pressed={option === locale}
              disabled={isChanging}
              onClick={() => void changeLocale(option)}
              className="rounded px-1 py-1 text-sm font-medium hover:text-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:opacity-60"
            >
              {option.toUpperCase()}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
