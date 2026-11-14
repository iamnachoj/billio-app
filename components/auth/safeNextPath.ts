export function safeNextPath(path?: string): {
  href: string;
  locale?: 'en' | 'es' | 'fr';
} {
  if (
    !path?.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(path)
  ) {
    return { href: '/dashboard' };
  }

  const localeMatch = path.match(/^\/(en|es|fr)(?=\/|[?#]|$)/);
  const unprefixed = localeMatch ? path.slice(localeMatch[0].length) : path;
  if (unprefixed.startsWith('//')) return { href: '/dashboard' };

  return {
    href: unprefixed.startsWith('/') ? unprefixed : `/${unprefixed}`,
    ...(localeMatch && { locale: localeMatch[1] as 'en' | 'es' | 'fr' }),
  };
}
