import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/messages/fr/LAYOUT.json';

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/services/authService', () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: keyof typeof messages) => messages[key],
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: keyof typeof messages) => messages[key],
}));
vi.mock('@/components/auth/hooks/useLogout', () => ({
  useLogout: () => ({ handleLogout: vi.fn() }),
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import Header from '../AuthenticatedHeader';

describe('AuthenticatedHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps French action labels visible with responsive navigation', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 1 });

    const markup = renderToStaticMarkup(await Header());

    expect(markup).toContain('aria-label="Navigation principale"');
    expect(markup).toContain('href="/dashboard/settings"');
    expect(markup).toContain('Paramètres');
    expect(markup).toContain('Se déconnecter');
    expect(markup).toContain('flex items-center justify-between gap-2');
    expect(markup).not.toContain('flex-col');
    expect(markup).toContain('<span aria-hidden="true">⚙️</span>');
    expect(markup).toContain('<span aria-hidden="true">🚪</span>');
    expect(markup).toContain('alt=""');
  });

  it('shows the welcome header without account navigation when signed out', async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const markup = renderToStaticMarkup(await Header());

    expect(markup).toContain('Bienvenue sur');
    expect(markup).not.toContain('Navigation principale');
    expect(markup).not.toContain('Se déconnecter');
  });
});
