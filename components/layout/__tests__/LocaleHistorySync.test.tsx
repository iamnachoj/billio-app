import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPathname: vi.fn(
    ({ href, locale }: { href: string; locale: string }) => `/${locale}${href}`
  ),
}));

vi.mock('@/i18n/navigation', () => ({
  getPathname: mocks.getPathname,
}));

describe('LocaleHistorySync', () => {
  let onPopState: (event: { stopImmediatePropagation: () => void }) => void;
  let onPageShow: (event: { persisted: boolean }) => void;
  const addEventListener = vi.fn((event: string, handler) => {
    if (event === 'popstate') onPopState = handler;
    if (event === 'pageshow') onPageShow = handler;
  });
  const getItem = vi.fn(() => 'es');
  const getEntriesByType = vi.fn(() => [{ type: 'navigate' }]);
  const replace = vi.fn();
  const stopImmediatePropagation = vi.fn();
  const location = {
    pathname: '/en/dashboard',
    search: '',
    hash: '',
    replace,
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    getItem.mockReturnValue('es');
    getEntriesByType.mockReturnValue([{ type: 'navigate' }]);
    Object.assign(location, {
      pathname: '/en/dashboard',
      search: '',
      hash: '',
    });
    vi.stubGlobal('window', {
      location,
      addEventListener,
      sessionStorage: { getItem },
    });
    vi.stubGlobal('performance', { getEntriesByType });
    await import('../LocaleHistorySync');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the active locale on back and forward navigation', () => {
    Object.assign(location, {
      pathname: '/en/dashboard/groups/123',
      search: '?tab=expenses',
      hash: '#item',
    });
    onPopState({ stopImmediatePropagation });
    expect(stopImmediatePropagation).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith(
      '/es/dashboard/groups/123?tab=expenses#item'
    );

    location.pathname = '/fr/dashboard';
    onPopState({ stopImmediatePropagation });
    expect(replace).toHaveBeenLastCalledWith('/es/dashboard?tab=expenses#item');
  });

  it('updates localized login destinations', () => {
    Object.assign(location, {
      pathname: '/en/login',
      search: '?next=%2Fen%2Fdashboard',
    });
    onPopState({ stopImmediatePropagation });
    expect(replace).toHaveBeenCalledWith('/es/login?next=%2Fes%2Fdashboard');
  });

  it.each(['/es/dashboard', '/dashboard', '/enough'])(
    'does not redirect %s',
    (pathname) => {
      location.pathname = pathname;
      onPopState({ stopImmediatePropagation });
      expect(replace).not.toHaveBeenCalled();
      expect(stopImmediatePropagation).not.toHaveBeenCalled();
    }
  );

  it('restores the selected locale when a cached document is shown', () => {
    onPageShow({ persisted: true });
    expect(replace).toHaveBeenCalledWith('/es/dashboard');
  });

  it('does not redirect a newly opened explicit locale URL', () => {
    onPageShow({ persisted: false });
    expect(replace).not.toHaveBeenCalled();
  });

  it('restores the selected locale after a history reload', async () => {
    vi.resetModules();
    getEntriesByType.mockReturnValue([{ type: 'back_forward' }]);
    await import('../LocaleHistorySync');
    expect(replace).toHaveBeenCalledWith('/es/dashboard');
  });

  it('does not redirect when no language was selected in this tab', () => {
    getItem.mockReturnValue('');
    onPopState({ stopImmediatePropagation });
    expect(replace).not.toHaveBeenCalled();
  });
});
