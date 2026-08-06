import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  addParticipantToGroup,
  deleteParticipantFromGroup,
} from '@/frontend-services/groups.service';
import { createGroupInvite } from '@/frontend-services/invites.service';
import { GroupParticipant } from '@/lib/models/groupParticipant';

type UseGroupParticipantsSectionParams = {
  groupId: string;
  canEditGroupName: boolean;
  isSavingSettings: boolean;
  onParticipantCreated: (participant: GroupParticipant) => void;
  onParticipantDeleted: (participantId: string) => void;
};

function normalizeParticipantDates(
  participant: GroupParticipant
): GroupParticipant {
  return {
    ...participant,
    joinedAt: new Date(participant.joinedAt),
    createdAt: new Date(participant.createdAt),
    updatedAt: new Date(participant.updatedAt),
  };
}

export function useGroupParticipantsSection({
  groupId,
  canEditGroupName,
  isSavingSettings,
  onParticipantCreated,
  onParticipantDeleted,
}: UseGroupParticipantsSectionParams) {
  const router = useRouter();

  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [newParticipantNameDraft, setNewParticipantNameDraft] = useState('');
  const [newParticipantRoleDraft, setNewParticipantRoleDraft] = useState<
    'owner' | 'admin' | 'member' | 'viewer'
  >('member');
  const [addParticipantError, setAddParticipantError] = useState('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [removeParticipantError, setRemoveParticipantError] = useState('');
  const [removingParticipantId, setRemovingParticipantId] = useState<
    string | null
  >(null);
  const [inviteEmailDraft, setInviteEmailDraft] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [isInviteLinkModalOpen, setIsInviteLinkModalOpen] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [generatedInviteEmail, setGeneratedInviteEmail] = useState('');
  const [generatedInviteExpiresAt, setGeneratedInviteExpiresAt] = useState('');

  function resetParticipantsModalState() {
    setAddParticipantError('');
    setRemoveParticipantError('');
    setInviteError('');
    setNewParticipantNameDraft('');
    setNewParticipantRoleDraft('member');
    setInviteEmailDraft('');
  }

  function openParticipantsModal() {
    resetParticipantsModalState();
    setIsParticipantsModalOpen(true);
  }

  function closeParticipantsModal() {
    resetParticipantsModalState();
    setIsParticipantsModalOpen(false);
  }

  async function addParticipantFromParticipantsModal() {
    if (!canEditGroupName || isAddingParticipant || isSavingSettings) {
      return;
    }

    const nextDisplayName = newParticipantNameDraft.trim();
    if (!nextDisplayName) {
      setAddParticipantError('Participant name is required.');
      return;
    }

    try {
      setAddParticipantError('');
      setIsAddingParticipant(true);

      const response = await addParticipantToGroup(groupId, {
        displayName: nextDisplayName,
        role: newParticipantRoleDraft,
        status: 'active',
      });

      if (!response.success) {
        setAddParticipantError(
          response.error?.message ?? 'Unable to add participant.'
        );
        return;
      }

      if (response.data) {
        onParticipantCreated(
          normalizeParticipantDates(response.data as GroupParticipant)
        );
      }

      setNewParticipantNameDraft('');
      setNewParticipantRoleDraft('member');
      router.refresh();
    } finally {
      setIsAddingParticipant(false);
    }
  }

  async function removeParticipantFromParticipantsModal(participantId: string) {
    if (!canEditGroupName || !participantId || removingParticipantId) {
      return;
    }

    try {
      setRemoveParticipantError('');
      setRemovingParticipantId(participantId);

      const response = await deleteParticipantFromGroup(groupId, participantId);

      if (!response.success) {
        setRemoveParticipantError(
          response.error?.message ?? 'Unable to remove participant.'
        );
        return;
      }

      onParticipantDeleted(participantId);
      router.refresh();
    } finally {
      setRemovingParticipantId(null);
    }
  }

  async function generateInviteFromParticipantsModal() {
    if (!canEditGroupName || isGeneratingInvite) {
      return;
    }

    try {
      setInviteError('');
      setIsGeneratingInvite(true);

      const email = inviteEmailDraft.trim();
      const response = await createGroupInvite(groupId, {
        email: email || undefined,
      });

      if (!response.success) {
        setInviteError(response.error?.message ?? 'Unable to generate invite.');
        return;
      }

      const invitePath = `/invites/${response.data.token}`;
      const inviteUrl =
        typeof window === 'undefined'
          ? invitePath
          : `${window.location.origin}${invitePath}`;

      setGeneratedInviteLink(inviteUrl);
      setGeneratedInviteEmail(response.data.email ?? email);
      setGeneratedInviteExpiresAt(String(response.data.expiresAt));
      setInviteEmailDraft('');
      setInviteError('');
      closeParticipantsModal();
      setIsInviteLinkModalOpen(true);
    } finally {
      setIsGeneratingInvite(false);
    }
  }

  function closeInviteLinkModal() {
    setIsInviteLinkModalOpen(false);
    setGeneratedInviteLink('');
    setGeneratedInviteEmail('');
    setGeneratedInviteExpiresAt('');
  }

  return {
    isParticipantsModalOpen,
    newParticipantNameDraft,
    newParticipantRoleDraft,
    addParticipantError,
    isAddingParticipant,
    removeParticipantError,
    removingParticipantId,
    inviteEmailDraft,
    inviteError,
    isGeneratingInvite,
    isInviteLinkModalOpen,
    generatedInviteLink,
    generatedInviteEmail,
    generatedInviteExpiresAt,
    setNewParticipantNameDraft,
    setNewParticipantRoleDraft,
    setInviteEmailDraft,
    openParticipantsModal,
    closeParticipantsModal,
    addParticipantFromParticipantsModal,
    removeParticipantFromParticipantsModal,
    generateInviteFromParticipantsModal,
    closeInviteLinkModal,
  };
}
