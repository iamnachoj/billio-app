import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  updateMe: vi.fn(),
  setState: vi.fn(),
}));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: (initial: unknown) => [initial, mocks.setState],
  useId: () => 'language-selector',
}));
vi.mock('next-intl', () => ({
  hasLocale: (locales: string[], locale: string) => locales.includes(locale),
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

function selectLanguage(value: string, authenticated = false) {
  const element = LanguageSwitcher({ authenticated });
  const select = element.props.children[1].props.children[0];
  select.props.onChange({ currentTarget: { value } });
  return element;
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
    selectLanguage('es');
    expect(mocks.replace).toHaveBeenCalledWith(
      '/login?next=%2Fes%2Fdashboard#section',
      { locale: 'es' }
    );
    expect(mocks.updateMe).not.toHaveBeenCalled();
  });

  it('saves an authenticated preference before switching', async () => {
    mocks.updateMe.mockResolvedValue({ success: true });
    selectLanguage('es', true);
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
    selectLanguage('es', true);
    await vi.waitFor(() =>
      expect(mocks.setState).toHaveBeenCalledWith('translated error')
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('labels the selector and offers every configured language', () => {
    const element = LanguageSwitcher({});
    const label = element.props.children[0];
    const select = element.props.children[1].props.children[0];
    expect(label.props.htmlFor).toBe(select.props.id);
    expect(label.props.children).toBe('LABEL');
    expect(select.props.value).toBe('en');
    expect(
      select.props.children.map(
        (option: { props: { value: string } }) => option.props.value
      )
    ).toEqual(['en', 'es', 'fr']);
  });

  it.each(['en', 'invalid'])('does not navigate for %s', (locale) => {
    selectLanguage(locale, true);
    expect(mocks.updateMe).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('does not navigate when saving throws', async () => {
    mocks.updateMe.mockRejectedValue(new Error('Network error'));
    selectLanguage('es', true);
    await vi.waitFor(() =>
      expect(mocks.setState).toHaveBeenCalledWith('SAVE_ERROR')
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
