import { describe, expect, it } from 'vitest';

import { safeNextPath } from '../safeNextPath';

describe('safeNextPath', () => {
  it('preserves local paths, query strings and fragments', () => {
    expect(safeNextPath('/invites/token?source=link#details')).toEqual({
      href: '/invites/token?source=link#details',
    });
  });

  it('preserves an explicit locale without duplicating its prefix', () => {
    expect(safeNextPath('/es/invites/token?source=link')).toEqual({
      href: '/invites/token?source=link',
      locale: 'es',
    });
    expect(safeNextPath('/en?tab=1')).toEqual({
      href: '/?tab=1',
      locale: 'en',
    });
  });

  it.each([
    undefined,
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/en//example.com',
    '/\n/example.com',
  ])('rejects unsafe next path %s', (path) => {
    expect(safeNextPath(path)).toEqual({ href: '/dashboard' });
  });
});
