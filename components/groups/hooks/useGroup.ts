import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { updateGroupName } from '@/frontend-services/groups.service';

import type { GroupPageProps } from '../GroupPage';

function byNewestExpenseFirst(a: { createdAt: Date }, b: { createdAt: Date }) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function useGroup(props: GroupPageProps) {
  const router = useRouter();

  const [showArchived, setShowArchived] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState(props.group.name);
  const [groupNameDraft, setGroupNameDraft] = useState(props.group.name);
  const [settingsCurrencyDraft, setSettingsCurrencyDraft] =
    useState<string>('EUR');
  const [settingsError, setSettingsError] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setGroupName(props.group.name);
    setGroupNameDraft(props.group.name);
  }, [props.group.id, props.group.name]);

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

  function openSettingsModal() {
    setGroupNameDraft(groupName);
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
    const shouldUpdateCurrency = nextCurrency !== selectedCurrency;

    if (!shouldUpdateName && !shouldUpdateCurrency) {
      setIsSettingsModalOpen(false);
      return;
    }

    try {
      setIsSavingSettings(true);

      if (shouldUpdateName) {
        const response = await updateGroupName(props.group.id, {
          name: nextName,
        });

        if (!response.success) {
          setSettingsError(
            response.error?.message ?? 'Unable to update group settings.'
          );
          return;
        }

        setGroupName(nextName);
      }

      if (shouldUpdateCurrency) {
        setSelectedCurrency(nextCurrency);
      }

      setGroupNameDraft(nextName);
      setIsSettingsModalOpen(false);
      setSettingsError('');

      if (shouldUpdateName) {
        router.refresh();
      }
    } finally {
      setIsSavingSettings(false);
    }
  }

  return {
    ...props,
    showArchived,
    isParticipantsModalOpen,
    isSettingsModalOpen,
    isSavingSettings,
    groupName,
    groupNameDraft,
    settingsCurrencyDraft,
    settingsError,
    canEditGroupName,
    selectedCurrency,
    availableCurrencies,
    myNetBalanceCents,
    summaryLabel,
    expensesSorted,
    participantNameById,
    setSelectedCurrency,
    setGroupNameDraft,
    setSettingsCurrencyDraft,
    openSettingsModal,
    closeSettingsModal,
    submitSettings,
    openParticipantsModal: () => setIsParticipantsModalOpen(true),
    closeParticipantsModal: () => setIsParticipantsModalOpen(false),
    toggleArchived: () => setShowArchived((v) => !v),
  };
}
