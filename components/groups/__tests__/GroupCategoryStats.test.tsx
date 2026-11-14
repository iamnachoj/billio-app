import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

import GroupCategoryStats from '../GroupCategoryStats';
import messages from '../../../messages/en/GROUPS.json';

describe('GroupCategoryStats controls', () => {
  const render = (props: ComponentProps<typeof GroupCategoryStats>) =>
    renderToStaticMarkup(
      <NextIntlClientProvider locale="en" messages={{ GROUPS: messages }}>
        <GroupCategoryStats {...props} />
      </NextIntlClientProvider>
    );

  const callbacks = {
    onSelectMonth: vi.fn(),
    onSelectAll: vi.fn(),
    onChangeMonth: vi.fn(),
  };

  it('disables the next arrow for the current month', () => {
    const html = render({
      groupId: 'group',
      currency: 'EUR',
      period: 'month',
      monthOffset: 0,
      ...callbacks,
    });

    expect(html).toContain('This month');
    expect(html).toMatch(/aria-label="Next month"[^>]*\sdisabled=""/);
    expect(html).toMatch(/aria-pressed="true"[^>]*>This month/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>All time/);
    expect(html).toMatch(
      /role="region" aria-label="Category spending results" tabindex="0" class="[^"]*\bh-80\b[^"]*\boverflow-y-auto\b[^"]*\bborder\b/
    );
    expect(html).toContain(
      '<div class="flex min-h-full items-center justify-center"><p role="status"'
    );
  });

  it('enables the next arrow for a past month and shows all-time selection', () => {
    const html = render({
      groupId: 'group',
      currency: 'EUR',
      period: 'all',
      monthOffset: -1,
      ...callbacks,
    });

    expect(html).toMatch(/aria-label="Next month"(?![^>]*\sdisabled="")/);
    expect(html).toMatch(/aria-pressed="true"[^>]*>All time/);
    expect(html).not.toContain('This month');
  });
});
