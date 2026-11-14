import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils/jwt', () => ({
  verifyToken: (token: string) => {
    if (token !== 'valid') throw new Error('Invalid token');
    return { userId: 'user' };
  },
}));

import { proxy, resolveSafeNextPath } from '@/proxy';
import { GET as legacyManifest } from '@/app/manifest.webmanifest/route';

function request(path: string, headers?: Record<string, string>) {
  return new NextRequest(`https://billio.test${path}`, { headers });
}

describe('locale and authentication proxy', () => {
  it('negotiates locale from the cookie before Accept-Language', () => {
    const response = proxy(
      request('/dashboard?tab=expenses', {
        cookie: 'NEXT_LOCALE=es',
        'accept-language': 'en',
      })
    );
    expect(response.headers.get('location')).toBe(
      'https://billio.test/es/dashboard?tab=expenses'
    );
  });

  it('negotiates Accept-Language for old invite links', () => {
    const response = proxy(
      request('/invites/token', { 'accept-language': 'es-ES,es;q=0.9' })
    );
    expect(response.headers.get('location')).toBe(
      'https://billio.test/es/invites/token'
    );
  });

  it.each(['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr-LU', 'fr-HT'])(
    'negotiates French from the browser language %s',
    (language) => {
      const response = proxy(
        request('/invites/token', { 'accept-language': `${language},fr;q=0.9` })
      );
      expect(response.headers.get('location')).toBe(
        'https://billio.test/fr/invites/token'
      );
    }
  );

  it('negotiates the locale for the legacy manifest URL', () => {
    const response = legacyManifest(
      request('/manifest.webmanifest', { cookie: 'NEXT_LOCALE=es' })
    );
    expect(response.headers.get('location')).toBe(
      'https://billio.test/es/manifest.webmanifest'
    );
  });

  it('falls back to English when no supported language is requested', () => {
    const response = proxy(
      request('/login', { 'accept-language': 'zh-CN,zh;q=0.9' })
    );
    expect(response.headers.get('location')).toBe(
      'https://billio.test/en/login'
    );
  });

  it('redirects unauthenticated users to localized login with their destination', () => {
    const response = proxy(request('/es/dashboard/groups/123?view=expenses'));
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/es/login');
    expect(location.searchParams.get('next')).toBe(
      '/es/dashboard/groups/123?view=expenses'
    );
  });

  it('redirects authenticated users to a safe destination without double prefixing', () => {
    const response = proxy(
      request('/es/login?next=%2Fes%2Fdashboard%3Ftab%3Dgroups', {
        cookie: 'token=valid',
      })
    );
    expect(response.headers.get('location')).toBe(
      'https://billio.test/es/dashboard?tab=groups'
    );
  });

  it('treats invalid tokens as unauthenticated', () => {
    const response = proxy(
      request('/en/dashboard', { cookie: 'token=invalid' })
    );
    expect(new URL(response.headers.get('location')!).pathname).toBe(
      '/en/login'
    );
  });

  it('does not protect similarly named public routes', () => {
    const response = proxy(request('/es/dashboarding'));
    expect(response.headers.get('location')).toBeNull();
  });

  it('rejects external and malformed next destinations', () => {
    for (const next of ['//evil.test', '/\\evil.test', 'https://evil.test']) {
      expect(
        resolveSafeNextPath(
          request(`/en/login?next=${encodeURIComponent(next)}`),
          'en'
        )
      ).toBeNull();
    }
    expect(
      resolveSafeNextPath(request('/es/login?next=%2Fdashboard%3Fa%3D1'), 'es')
    ).toBe('/es/dashboard?a=1');
  });
});
