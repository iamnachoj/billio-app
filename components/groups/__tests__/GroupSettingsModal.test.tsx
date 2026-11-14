import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

import GroupSettingsModal from '../GroupSettingsModal';
import groups from '@/messages/en/GROUPS.json';
import ui from '@/messages/en/UI.json';

const props: ComponentProps<typeof GroupSettingsModal> = {
  open: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  isSaving: false,
  isLeavingGroup: false,
  isChangingArchive: false,
  isArchived: false,
  canManageArchive: true,
  onChangeArchiveStatus: vi.fn(),
  error: '',
  canEditGroupName: true,
  canLeaveGroup: true,
  groupNameDraft: 'Trip',
  setGroupNameDraft: vi.fn(),
  groupDescriptionDraft: '',
  setGroupDescriptionDraft: vi.fn(),
  currencyDraft: 'EUR',
  setCurrencyDraft: vi.fn(),
  currencies: ['EUR'],
  onRequestLeaveGroup: vi.fn(),
};

function render(overrides: Partial<typeof props> = {}) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={{ GROUPS: groups, UI: ui }}>
      <GroupSettingsModal {...props} {...overrides} />
    </NextIntlClientProvider>
  );
}

describe('group archive settings', () => {
  it('explains shared archiving and settlement requirements to admins', () => {
    const html = render();
    expect(html).toContain('Archive group');
    expect(html).toContain('All balances in every currency must be settled');
    expect(html).not.toContain('Restore group');
  });

  it('offers restore instead of archive for archived groups', () => {
    const html = render({
      isArchived: true,
      canEditGroupName: false,
      canLeaveGroup: false,
    });
    expect(html).toContain('Restore group');
    expect(html).not.toContain('Archive group');
    expect(html).not.toContain('Leave group');
  });

  it('does not offer archive controls to non-admins', () => {
    const html = render({ canManageArchive: false });
    expect(html).not.toContain('Archive group');
    expect(html).not.toContain('Restore group');
  });
});
