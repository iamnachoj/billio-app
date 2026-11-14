import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  updateMe: vi.fn(),
  setState: vi.fn(),
}));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: (initial: unknown) => [initial, mocks.setState],
}));
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/login',
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/i18n/errors', () => ({
  useApiError: () => () => 'translated error',
}));
vi.mock('@/frontend-services/me.service', () => ({
  updateMe: mocks.updateMe,
}));

import LanguageSwitcher from '../LanguageSwitcher';

function clickSpanish(authenticated = false) {
  const element = LanguageSwitcher({ authenticated });
  const languageGroup = element.props.children[0];
  const spanishButton = languageGroup.props.children[1];
  spanishButton.props.onClick();
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', {
      location: { search: '?next=%2Fen%2Fdashboard', hash: '#section' },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('switches the locale without losing the query or fragment', () => {
    clickSpanish();
    expect(mocks.replace).toHaveBeenCalledWith(
      '/login?next=%2Fes%2Fdashboard#section',
      { locale: 'es' }
    );
    expect(mocks.updateMe).not.toHaveBeenCalled();
  });

  it('saves an authenticated preference before switching', async () => {
    mocks.updateMe.mockResolvedValue({ success: true });
    clickSpanish(true);
    expect(mocks.updateMe).toHaveBeenCalledWith({ locale: 'es' });
    await vi.waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        '/login?next=%2Fes%2Fdashboard#section',
        { locale: 'es' }
      )
    );
  });

  it('does not navigate when saving fails', async () => {
    mocks.updateMe.mockResolvedValue({
      success: false,
      error: { code: 'ERROR', message: 'server error' },
    });
    clickSpanish(true);
    await vi.waitFor(() =>
      expect(mocks.setState).toHaveBeenCalledWith('translated error')
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
