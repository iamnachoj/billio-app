import { hasLocale } from 'next-intl';

import { routing } from '@/i18n/routing';

const storageKey = 'billio.selectedLocale';

export function saveSelectedLocale(locale: (typeof routing.locales)[number]) {
  window.sessionStorage.setItem(storageKey, locale);
}

export function getSelectedLocale() {
  try {
    const locale = window.sessionStorage.getItem(storageKey);
    return hasLocale(routing.locales, locale) ? locale : null;
  } catch (error) {
    console.error(
      'Unable to read the selected language from session storage',
      error
    );
    return null;
  }
}
