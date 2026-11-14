export type AppLocale = 'en' | 'es';

export function resolveLocale(locale: unknown): AppLocale {
  return locale === 'es' ? 'es' : 'en';
}
