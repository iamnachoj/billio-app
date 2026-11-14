import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  translate: (key: string) => `en:${key}`,
  previousTranslation: undefined as ((key: string) => string) | undefined,
  previousCallback: undefined as
    ((error: { code: string; message: string }) => string) | undefined,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => state.translate,
}));

vi.mock('react', () => ({
  useCallback: (
    callback: (error: { code: string; message: string }) => string,
    dependencies: [(key: string) => string]
  ) => {
    if (state.previousTranslation !== dependencies[0]) {
      state.previousTranslation = dependencies[0];
      state.previousCallback = callback;
    }
    return state.previousCallback;
  },
}));

import { useApiError } from '../errors';

describe('useApiError', () => {
  beforeEach(() => {
    state.translate = (key) => `en:${key}`;
    state.previousTranslation = undefined;
    state.previousCallback = undefined;
  });

  it('keeps the same callback between renders with the same translator', () => {
    const first = useApiError();
    expect(useApiError()).toBe(first);
    expect(first({ code: 'NOT_FOUND', message: 'Not found' })).toBe(
      'en:NOT_FOUND'
    );
    expect(first({ code: 'UNRECOGNIZED', message: 'Error' })).toBe(
      'en:UNKNOWN'
    );
  });

  it('updates the callback when the translator changes', () => {
    const first = useApiError();
    state.translate = (key) => `es:${key}`;
    const translated = useApiError();
    expect(translated).not.toBe(first);
    expect(translated({ code: 'NOT_FOUND', message: 'Not found' })).toBe(
      'es:NOT_FOUND'
    );
  });
});
