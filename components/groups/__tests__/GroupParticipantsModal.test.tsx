import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import GroupParticipantsModal from '../GroupParticipantsModal';
import groups from '@/messages/en/GROUPS.json';
import ui from '@/messages/en/UI.json';

const props: ComponentProps<typeof GroupParticipantsModal> = {
  open: true,
  onClose: vi.fn(),
  participants: [],
  currentUserId: 'user',
  canAddParticipants: false,
  readOnly: true,
  isAddingParticipant: false,
  addParticipantError: '',
  newParticipantNameDraft: '',
  setNewParticipantNameDraft: vi.fn(),
  newParticipantRoleDraft: 'member',
  setNewParticipantRoleDraft: vi.fn(),
  onAddParticipant: vi.fn(),
  inviteEmailDraft: '',
  setInviteEmailDraft: vi.fn(),
  inviteError: '',
  isGeneratingInvite: false,
  onGenerateInvite: vi.fn(),
  removeParticipantError: '',
  removingParticipantId: null,
  onRemoveParticipant: vi.fn(),
};

function render(overrides: Partial<typeof props> = {}) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={{ GROUPS: groups, UI: ui }}>
      <GroupParticipantsModal {...props} {...overrides} />
    </NextIntlClientProvider>
  );
}

describe('group participant controls', () => {
  it('hides invite and participant changes for archived groups', () => {
    const html = render();
    expect(html).not.toContain('Generate invite link');
    expect(html).not.toContain('Add new participant');
  });

  it('preserves participant controls for active groups', () => {
    const html = render({ readOnly: false, canAddParticipants: true });
    expect(html).toContain('Generate invite link');
    expect(html).toContain('Add new participant');
  });
});
