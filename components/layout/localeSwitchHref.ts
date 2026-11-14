import { safeNextPath } from '@/components/auth/safeNextPath';

type Locale = 'en' | 'es' | 'fr';

function localizeNext(value: string, locale: Locale) {
  const { href } = safeNextPath(value);
  const pathname = href.split(/[?#]/, 1)[0];

  try {
    const decoded = decodeURIComponent(pathname);
    if (
      /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f|25)/i.test(pathname) ||
      decoded
        .split('/')
        .some((segment) => segment === '.' || segment === '..') ||
      /^\/(?:en|es|fr)(?:\/|$)/.test(decoded)
    ) {
      return `/${locale}/dashboard`;
    }
  } catch {
    return `/${locale}/dashboard`;
  }

  return `/${locale}${href}`;
}

function localizeLoginSearch(search: string, locale: Locale) {
  let foundNext = false;
  const parts = search
    .slice(1)
    .split('&')
    .filter((part) => {
      const key = new URLSearchParams(part).keys().next().value;
      if (key !== 'next') return true;
      if (foundNext) return false;
      foundNext = true;
      return true;
    });

  if (!foundNext) return search;

  return (
    '?' +
    parts
      .map((part) => {
        const params = new URLSearchParams(part);
        if (params.keys().next().value !== 'next') return part;
        return `next=${encodeURIComponent(localizeNext(params.get('next') ?? '', locale))}`;
      })
      .join('&')
  );
}

export function localeSwitchHref(
  pathname: string | null,
  search: string,
  hash: string,
  nextLocale: Locale
) {
  const safePathname =
    pathname?.startsWith('/') &&
    !pathname.startsWith('//') &&
    !/[\\?#\u0000-\u001f\u007f]/.test(pathname)
      ? pathname
      : '/';

  const safeSearch = search.startsWith('?') ? search : '';
  return `${safePathname}${
    safePathname === '/login' && safeSearch
      ? localizeLoginSearch(safeSearch, nextLocale)
      : safeSearch
  }${hash.startsWith('#') ? hash : ''}`;
}
