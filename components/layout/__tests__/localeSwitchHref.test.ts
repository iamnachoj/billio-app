import { describe, expect, it } from 'vitest';

import { getPathname } from '@/i18n/navigation';
import { localeSwitchHref } from '../localeSwitchHref';

describe('localeSwitchHref', () => {
  it('preserves reset tokens and fragments when changing locale', () => {
    const href = localeSwitchHref(
      '/reset-password',
      '?token=a%2Bb%2Fc%3D&token=another',
      '#reset',
      'es'
    );

    expect(getPathname({ href, locale: 'es' })).toBe(
      '/es/reset-password?token=a%2Bb%2Fc%3D&token=another#reset'
    );
  });

  it('switches to French without losing the current path', () => {
    const href = localeSwitchHref('/dashboard', '', '', 'fr');
    expect(getPathname({ href, locale: 'fr' })).toBe('/fr/dashboard');
  });

  it('updates the locale in the login return path while preserving its query and fragment', () => {
    const href = localeSwitchHref(
      '/login',
      '?next=%2Fen%2Fdashboard%2Fgroups%2F123%3Ftab%3Dexpenses%23item',
      '',
      'es'
    );

    expect(getPathname({ href, locale: 'es' })).toBe(
      '/es/login?next=%2Fes%2Fdashboard%2Fgroups%2F123%3Ftab%3Dexpenses%23item'
    );
  });

  it('preserves arbitrary parameters, duplicates, empty values and hashes', () => {
    const href = localeSwitchHref(
      '/dashboard',
      '?a=1&a=2&empty=&nested=https%3A%2F%2Fexample.com',
      '#details%20here',
      'en'
    );
    expect(getPathname({ href, locale: 'en' })).toBe(
      '/en/dashboard?a=1&a=2&empty=&nested=https%3A%2F%2Fexample.com#details%20here'
    );
    expect(localeSwitchHref('/', '', '', 'en')).toBe('/');
  });

  it.each([
    null,
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/login?next=//example.com',
    '/login#fragment',
    '/\n/example.com',
  ])('does not use an unsafe pathname: %s', (pathname) => {
    expect(
      localeSwitchHref(pathname, '?next=%2Fdashboard', '#section', 'en')
    ).toBe('/?next=%2Fdashboard#section');
  });

  it.each([
    ['/es/dashboard', 'en', '/en/dashboard'],
    ['/en/dashboard?tab=1#detail', 'es', '/es/dashboard?tab=1#detail'],
    ['/dashboard', 'es', '/es/dashboard'],
    ['/es', 'en', '/en/'],
    ['https://evil.example', 'en', '/en/dashboard'],
    ['//evil.example', 'en', '/en/dashboard'],
    ['/es//evil.example', 'en', '/en/dashboard'],
    ['/\\evil.example', 'en', '/en/dashboard'],
    ['/es/%2f%2fevil.example', 'en', '/en/dashboard'],
    ['/es/%2e%2e/dashboard', 'en', '/en/dashboard'],
    ['/es/%252f%252fevil.example', 'en', '/en/dashboard'],
    ['/es/en/dashboard', 'en', '/en/dashboard'],
  ] as const)(
    'localizes or rejects login destination %s',
    (destination, locale, expected) => {
      const search = `?register=true&next=${encodeURIComponent(destination)}&next=%2Fes%2Fignored&token=a%2Bb`;
      const result = localeSwitchHref('/login', search, '#top', locale);
      const url = new URL(result, 'https://billio.example');
      expect(url.searchParams.getAll('next')).toEqual([expected]);
      expect(url.searchParams.get('register')).toBe('true');
      expect(url.searchParams.get('token')).toBe('a+b');
      expect(url.hash).toBe('#top');
    }
  );
});
