import { NextIntlClientProvider } from 'next-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import dashboardMessages from '@/messages/en/DASHBOARD.json';
import uiMessages from '@/messages/en/UI.json';
import type { DashboardGroup } from '../hooks/useDashboard';
import Dashboard from '../Dashboard';

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
  useRouter: () => ({ refresh: vi.fn() }),
}));

const user = { id: 'user', name: 'Alex', email: 'alex@example.com' };
const now = new Date('2026-01-01T00:00:00Z');

function renderDashboard(groups: DashboardGroup[]) {
  return renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      messages={{ DASHBOARD: dashboardMessages, UI: uiMessages }}
    >
      <Dashboard user={user} groups={groups} />
    </NextIntlClientProvider>
  );
}

describe('Dashboard', () => {
  it('offers a clear way to create a group when there are no active groups', () => {
    const markup = renderDashboard([]);

    expect(markup).toContain('Hello Alex');
    expect(markup).toContain('No active groups yet');
    expect(markup).toContain('Create a group to start sharing expenses.');
    expect(markup.match(/Add new group/g)).toHaveLength(1);
    expect(markup.indexOf('No active groups yet')).toBeLessThan(
      markup.indexOf('Add new group')
    );
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('id="archived-groups" class="hidden"');
  });

  it('renders active and archived groups in their respective sections', () => {
    const base = { createdBy: 'user', createdAt: now, updatedAt: now };
    const markup = renderDashboard([
      { ...base, id: 'active', name: 'Weekend trip', archivedAt: null },
      { ...base, id: 'archived', name: 'Old trip', archivedAt: now },
    ]);

    expect(markup).not.toContain('No active groups yet');
    expect(markup).toContain('href="/dashboard/groups/active"');
    expect(markup).toContain('aria-label="Reorder Weekend trip"');
    expect(markup).toContain('id="archived-groups" class="hidden"');
    expect(markup).toContain('href="/dashboard/groups/archived"');
    expect(markup.match(/Add new group/g)).toHaveLength(1);
    expect(markup.indexOf('href="/dashboard/groups/archived"')).toBeLessThan(
      markup.indexOf('Add new group')
    );
  });
});
