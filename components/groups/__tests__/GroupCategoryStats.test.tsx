import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import GroupCategoryStats from '../GroupCategoryStats';

describe('GroupCategoryStats controls', () => {
  const callbacks = {
    onSelectMonth: vi.fn(),
    onSelectAll: vi.fn(),
    onChangeMonth: vi.fn(),
  };

  it('disables the next arrow for the current month', () => {
    const html = renderToStaticMarkup(
      <GroupCategoryStats
        groupId="group"
        currency="EUR"
        period="month"
        monthOffset={0}
        {...callbacks}
      />
    );

    expect(html).toContain('This month');
    expect(html).toMatch(/aria-label="Next month"[^>]*\sdisabled=""/);
    expect(html).toMatch(/aria-pressed="true"[^>]*>This month/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>All time/);
    expect(html).toContain(
      '<div class="min-h-48"><p role="status" class="text-sm text-slate-600 animate-pulse">Loading stats…</p></div>'
    );
  });

  it('enables the next arrow for a past month and shows all-time selection', () => {
    const html = renderToStaticMarkup(
      <GroupCategoryStats
        groupId="group"
        currency="EUR"
        period="all"
        monthOffset={-1}
        {...callbacks}
      />
    );

    expect(html).toMatch(/aria-label="Next month"(?![^>]*\sdisabled="")/);
    expect(html).toMatch(/aria-pressed="true"[^>]*>All time/);
    expect(html).not.toContain('This month');
  });
});
