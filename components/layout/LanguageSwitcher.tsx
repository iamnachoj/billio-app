'use client';

import { hasLocale, useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { useApiError } from '@/i18n/errors';
import { usePathname, useRouter } from '@/i18n/navigation';
import { updateMe } from '@/frontend-services/me.service';
import { routing } from '@/i18n/routing';
import { localeSwitchHref } from './localeSwitchHref';

type Locale = (typeof routing.locales)[number];

const languageKeys: Record<Locale, 'ENGLISH' | 'SPANISH'> = {
  en: 'ENGLISH',
  es: 'SPANISH',
};

type Props = {
  authenticated?: boolean;
};

export default function LanguageSwitcher({ authenticated = false }: Props) {
  const locale = useLocale();
  const t = useTranslations('LAYOUT.LANGUAGE_SWITCHER');
  const apiError = useApiError();
  const pathname = usePathname();
  const router = useRouter();
  const id = useId();
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
    <div className="w-full max-w-xs">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {t('LABEL')}
      </label>
      <div className="relative mt-2">
        <select
          id={id}
          value={locale}
          disabled={isChanging}
          onChange={(event) => {
            const nextLocale = event.currentTarget.value;
            if (hasLocale(routing.locales, nextLocale)) {
              void changeLocale(nextLocale);
            }
          }}
          className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-gray-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-60"
        >
          {routing.locales.map((option) => (
            <option key={option} value={option}>
              {t(languageKeys[option])}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
