import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  addParticipantToGroup,
  leaveGroup,
  updateGroupName,
} from '@/frontend-services/groups.service';

import type { GroupPageProps } from '../GroupPage';

function byNewestExpenseFirst(a: { createdAt: Date }, b: { createdAt: Date }) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function useGroup(props: GroupPageProps) {
  const router = useRouter();

  const [showArchived, setShowArchived] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isExpenseDetailsModalOpen, setIsExpenseDetailsModalOpen] =
    useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null
  );
  const [isLeaveConfirmModalOpen, setIsLeaveConfirmModalOpen] = useState(false);
  const [groupName, setGroupName] = useState(props.group.name);
  const [groupDescription, setGroupDescription] = useState(
    props.group.description ?? ''
  );
  const [groupNameDraft, setGroupNameDraft] = useState(props.group.name);
  const [groupDescriptionDraft, setGroupDescriptionDraft] = useState(
    props.group.description ?? ''
  );
  const [settingsCurrencyDraft, setSettingsCurrencyDraft] =
    useState<string>('EUR');
  const [settingsError, setSettingsError] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [newParticipantNameDraft, setNewParticipantNameDraft] = useState('');
  const [newParticipantRoleDraft, setNewParticipantRoleDraft] = useState<
    'owner' | 'admin' | 'member' | 'viewer'
  >('member');
  const [addParticipantError, setAddParticipantError] = useState('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  useEffect(() => {
    setGroupName(props.group.name);
    setGroupDescription(props.group.description ?? '');
    setGroupNameDraft(props.group.name);
    setGroupDescriptionDraft(props.group.description ?? '');
  }, [props.group.id, props.group.name, props.group.description]);

  const participantNameById = useMemo(() => {
    return new Map(
      props.participants.map((participant) => [
        participant.id,
        participant.displayName,
      ])
    );
  }, [props.participants]);

  const availableCurrencies = useMemo(() => {
    const fromBalances = props.balances.currencies.map(
      (currencySummary) => currencySummary.currency
    );
    if (fromBalances.length > 0) {
      return fromBalances;
    }

    return Array.from(
      new Set(props.expenses.map((expense) => expense.currency))
    ).sort();
  }, [props.balances.currencies, props.expenses]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    availableCurrencies[0] ?? 'EUR'
  );

  const activeCurrencySummary = useMemo(() => {
    return props.balances.currencies.find(
      (currencySummary) => currencySummary.currency === selectedCurrency
    );
  }, [props.balances.currencies, selectedCurrency]);

  const myNetBalanceCents = useMemo(() => {
    if (!activeCurrencySummary) {
      return 0;
    }

    const myBalance = activeCurrencySummary.participantBalances.find(
      (participantBalance) =>
        participantBalance.participantId === props.balances.myParticipantId
    );

    return myBalance?.netBalanceCents ?? 0;
  }, [activeCurrencySummary, props.balances.myParticipantId]);

  const summaryLabel =
    myNetBalanceCents > 0
      ? 'You are owed'
      : myNetBalanceCents < 0
        ? 'You owe'
        : 'You are settled';

  const expensesSorted = useMemo(() => {
    return [...props.expenses].sort(byNewestExpenseFirst);
  }, [props.expenses]);

  const myParticipant = useMemo(() => {
    return props.participants.find(
      (participant) => participant.userId === props.user.id
    );
  }, [props.participants, props.user.id]);

  const canEditGroupName =
    myParticipant?.role === 'owner' || myParticipant?.role === 'admin';
  const canCreateExpense = !!myParticipant && myParticipant.role !== 'viewer';
  const canLeaveGroup = !!myParticipant;

  function openSettingsModal() {
    setGroupNameDraft(groupName);
    setGroupDescriptionDraft(groupDescription);
    setSettingsCurrencyDraft(selectedCurrency);
    setSettingsError('');
    setIsSettingsModalOpen(true);
  }

  function closeSettingsModal() {
    if (isSavingSettings) {
      return;
    }

    setIsSettingsModalOpen(false);
    setSettingsError('');
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

      const response = await addParticipantToGroup(props.group.id, {
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

      setNewParticipantNameDraft('');
      setNewParticipantRoleDraft('member');
      router.refresh();
    } finally {
      setIsAddingParticipant(false);
    }
  }

  async function submitSettings(event: FormEvent) {
    event.preventDefault();

    setSettingsError('');

    const nextName = groupNameDraft.trim();
    const nextDescription = groupDescriptionDraft.trim();
    const nextCurrency = settingsCurrencyDraft;

    if (!nextCurrency) {
      setSettingsError('Currency is required.');
      return;
    }

    if (canEditGroupName && !nextName) {
      setSettingsError('Group name is required.');
      return;
    }

    const shouldUpdateName = canEditGroupName && nextName !== groupName;
    const shouldUpdateDescription =
      canEditGroupName && nextDescription !== groupDescription;
    const shouldUpdateCurrency = nextCurrency !== selectedCurrency;

    if (
      !shouldUpdateName &&
      !shouldUpdateDescription &&
      !shouldUpdateCurrency
    ) {
      setIsSettingsModalOpen(false);
      return;
    }

    try {
      setIsSavingSettings(true);

      if (shouldUpdateName || shouldUpdateDescription) {
        const response = await updateGroupName(props.group.id, {
          name: nextName,
          description: nextDescription,
        });

        if (!response.success) {
          setSettingsError(
            response.error?.message ?? 'Unable to update group settings.'
          );
          return;
        }

        setGroupName(nextName);
        setGroupDescription(nextDescription);
      }

      if (shouldUpdateCurrency) {
        setSelectedCurrency(nextCurrency);
      }

      setGroupNameDraft(nextName);
      setGroupDescriptionDraft(nextDescription);
      setIsSettingsModalOpen(false);
      setSettingsError('');

      if (shouldUpdateName || shouldUpdateDescription) {
        router.refresh();
      }
    } finally {
      setIsSavingSettings(false);
    }
  }

  function requestLeaveGroup() {
    if (!canLeaveGroup || isLeavingGroup) {
      return;
    }

    setSettingsError('');
    setIsSettingsModalOpen(false);
    setIsLeaveConfirmModalOpen(true);
  }

  function cancelLeaveGroup() {
    if (isLeavingGroup) {
      return;
    }

    setIsLeaveConfirmModalOpen(false);
  }

  async function confirmLeaveGroup() {
    if (!canLeaveGroup || isLeavingGroup) {
      return;
    }

    try {
      setSettingsError('');
      setIsLeavingGroup(true);

      const response = await leaveGroup(props.group.id);

      if (!response.success) {
        setSettingsError(
          response.error?.message ?? 'Unable to leave the group.'
        );
        setIsLeaveConfirmModalOpen(false);
        setIsSettingsModalOpen(true);
        return;
      }

      setIsLeaveConfirmModalOpen(false);
      setIsSettingsModalOpen(false);
      router.push('/dashboard');
      router.refresh();
    } finally {
      setIsLeavingGroup(false);
    }
  }

  return {
    ...props,
    showArchived,
    isParticipantsModalOpen,
    isSettingsModalOpen,
    isAddExpenseModalOpen,
    isExpenseDetailsModalOpen,
    selectedExpenseId,
    isLeaveConfirmModalOpen,
    isSavingSettings,
    isLeavingGroup,
    isAddingParticipant,
    groupName,
    groupDescription,
    groupNameDraft,
    groupDescriptionDraft,
    settingsCurrencyDraft,
    settingsError,
    addParticipantError,
    newParticipantNameDraft,
    newParticipantRoleDraft,
    canEditGroupName,
    canCreateExpense,
    canLeaveGroup,
    selectedCurrency,
    availableCurrencies,
    myNetBalanceCents,
    summaryLabel,
    expensesSorted,
    participantNameById,
    setSelectedCurrency,
    setGroupNameDraft,
    setGroupDescriptionDraft,
    setSettingsCurrencyDraft,
    setNewParticipantNameDraft,
    setNewParticipantRoleDraft,
    openSettingsModal,
    closeSettingsModal,
    submitSettings,
    addParticipantFromParticipantsModal,
    requestLeaveGroup,
    cancelLeaveGroup,
    confirmLeaveGroup,
    openExpenseDetailsModal: (expenseId: string) => {
      setSelectedExpenseId(expenseId);
      setIsExpenseDetailsModalOpen(true);
    },
    closeExpenseDetailsModal: () => {
      setIsExpenseDetailsModalOpen(false);
      setSelectedExpenseId(null);
    },
    openAddExpenseModal: () => setIsAddExpenseModalOpen(true),
    closeAddExpenseModal: () => setIsAddExpenseModalOpen(false),
    openParticipantsModal: () => {
      setAddParticipantError('');
      setIsParticipantsModalOpen(true);
    },
    closeParticipantsModal: () => {
      setAddParticipantError('');
      setNewParticipantNameDraft('');
      setNewParticipantRoleDraft('member');
      setIsParticipantsModalOpen(false);
    },
    toggleArchived: () => setShowArchived((v) => !v),
  };
}
