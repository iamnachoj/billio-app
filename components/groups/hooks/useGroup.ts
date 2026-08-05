import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
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
    isLeaveConfirmModalOpen,
    isSavingSettings,
    isLeavingGroup,
    groupName,
    groupDescription,
    groupNameDraft,
    groupDescriptionDraft,
    settingsCurrencyDraft,
    settingsError,
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
    openSettingsModal,
    closeSettingsModal,
    submitSettings,
    requestLeaveGroup,
    cancelLeaveGroup,
    confirmLeaveGroup,
    openAddExpenseModal: () => setIsAddExpenseModalOpen(true),
    closeAddExpenseModal: () => setIsAddExpenseModalOpen(false),
    openParticipantsModal: () => setIsParticipantsModalOpen(true),
    closeParticipantsModal: () => setIsParticipantsModalOpen(false),
    toggleArchived: () => setShowArchived((v) => !v),
  };
}
