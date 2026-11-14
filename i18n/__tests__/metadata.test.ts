import { describe, expect, it } from 'vitest';
import { publicAlternates } from '../metadata';

describe('public page language alternates', () => {
  it('uses the matching path for every locale', () => {
    expect(publicAlternates('/login')).toEqual({
      languages: { en: '/en/login', es: '/es/login' },
    });
    expect(publicAlternates('')).toEqual({
      languages: { en: '/en', es: '/es' },
    });
  });
});
