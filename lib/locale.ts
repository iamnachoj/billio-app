export type AppLocale = 'en' | 'es' | 'fr';

export function resolveLocale(locale: unknown): AppLocale {
  return locale === 'es' || locale === 'fr' ? locale : 'en';
}

export function isAppLocale(locale: unknown): locale is AppLocale {
  return locale === 'en' || locale === 'es' || locale === 'fr';
}
