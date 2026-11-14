'use client';

import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getSelectedLocale } from './localePreference';
import { localeSwitchHref } from './localeSwitchHref';

function syncHistoryLocale(event?: PopStateEvent) {
  const selectedLocale = getSelectedLocale();
  if (!selectedLocale) return;

  const { pathname, search, hash } = window.location;
  const previousLocale = routing.locales.find(
    (value) => pathname === `/${value}` || pathname.startsWith(`/${value}/`)
  );
  if (!previousLocale || previousLocale === selectedLocale) return;

  const unprefixedPath = pathname.slice(previousLocale.length + 1) || '/';
  const href = localeSwitchHref(unprefixedPath, search, hash, selectedLocale);
  event?.stopImmediatePropagation();
  window.location.replace(getPathname({ href, locale: selectedLocale }));
}

if (typeof window !== 'undefined') {
  // Register before the App Router so it cannot restore a stale locale first.
  window.addEventListener('popstate', syncHistoryLocale);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) syncHistoryLocale();
  });
  const navigation = performance.getEntriesByType('navigation')[0];
  if (
    navigation &&
    'type' in navigation &&
    navigation.type === 'back_forward'
  ) {
    syncHistoryLocale();
  }
}

export default function LocaleHistorySync() {
  return null;
}
