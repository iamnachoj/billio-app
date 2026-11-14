import { routing } from './routing';

export function publicAlternates(path: string) {
  return {
    languages: Object.fromEntries(
      routing.locales.map((locale) => [locale, `/${locale}${path}`])
    ),
  };
}
