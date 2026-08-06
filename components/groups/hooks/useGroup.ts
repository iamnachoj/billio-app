import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  leaveGroup,
  updateGroupName,
} from '@/frontend-services/groups.service';
import { ExpenseDetailsData } from '@/frontend-services/expenses.service';

import type { GroupPageProps } from '../GroupPage';
import { useGroupParticipantsSection } from './useGroupParticipantsSection';
import { useOptimisticCollection } from './useOptimisticCollection';

function byNewestExpenseFirst(a: { createdAt: Date }, b: { createdAt: Date }) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

type PendingBalanceAdjustment = {
  expenseId: string;
  currency: string;
  deltaCents: number;
  kind: 'create' | 'update' | 'delete';
  targetUpdatedAtMs?: number;
};

function parseDateToMs(value: unknown) {
  const timestamp = new Date(value as string | number | Date).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function computeMyExpenseNetDeltaCents(
  details: ExpenseDetailsData,
  myParticipantId: string
) {
  let deltaCents = 0;

  for (const split of details.splits) {
    if (
      split.owedToParticipantId === myParticipantId &&
      split.participantId !== myParticipantId
    ) {
      deltaCents += split.amount;
    }

    if (
      split.participantId === myParticipantId &&
      split.owedToParticipantId !== myParticipantId
    ) {
      deltaCents -= split.amount;
    }
  }

  return deltaCents;
}

export function useGroup(props: GroupPageProps) {
  const router = useRouter();

  const [showArchived, setShowArchived] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isExpenseDetailsModalOpen, setIsExpenseDetailsModalOpen] =
    useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null
  );
  const [isLeaveConfirmModalOpen, setIsLeaveConfirmModalOpen] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState(props.group.name);
  const [groupDescriptionDraft, setGroupDescriptionDraft] = useState(
    props.group.description ?? ''
  );
  const [settingsCurrencyDraft, setSettingsCurrencyDraft] =
    useState<string>('EUR');
  const [
    pendingBalanceAdjustmentsByExpenseId,
    setPendingBalanceAdjustmentsByExpenseId,
  ] = useState<Record<string, PendingBalanceAdjustment>>({});
  const [settingsError, setSettingsError] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);

  const groupName = props.group.name;
  const groupDescription = props.group.description ?? '';

  const optimisticExpenses = useOptimisticCollection(props.expenses);
  const expenses = optimisticExpenses.items;

  const optimisticParticipants = useOptimisticCollection(props.participants);
  const participants = optimisticParticipants.items;

  const participantNameById = useMemo(() => {
    return new Map(
      participants.map((participant) => [
        participant.id,
        participant.displayName,
      ])
    );
  }, [participants]);

  const availableCurrencies = useMemo(() => {
    const fromBalances = props.balances.currencies.map(
      (currencySummary) => currencySummary.currency
    );

    if (fromBalances.length > 0) {
      return fromBalances;
    }

    return Array.from(
      new Set(expenses.map((expense) => expense.currency))
    ).sort();
  }, [props.balances.currencies, expenses]);

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

    const baseNetCents = myBalance?.netBalanceCents ?? 0;

    const optimisticDeltaCents = Object.values(
      pendingBalanceAdjustmentsByExpenseId
    ).reduce((sum, adjustment) => {
      if (adjustment.currency !== selectedCurrency) {
        return sum;
      }

      const serverExpense = props.expenses.find(
        (expense) => expense.id === adjustment.expenseId
      );

      if (adjustment.kind === 'create') {
        return serverExpense ? sum : sum + adjustment.deltaCents;
      }

      if (adjustment.kind === 'delete') {
        return serverExpense ? sum + adjustment.deltaCents : sum;
      }

      if (!serverExpense) {
        return sum;
      }

      const serverUpdatedAtMs = parseDateToMs(serverExpense.updatedAt);
      if (serverUpdatedAtMs === null) {
        return sum;
      }

      if (
        adjustment.targetUpdatedAtMs !== undefined &&
        serverUpdatedAtMs >= adjustment.targetUpdatedAtMs
      ) {
        return sum;
      }

      return sum + adjustment.deltaCents;
    }, 0);

    return baseNetCents + optimisticDeltaCents;
  }, [
    activeCurrencySummary,
    pendingBalanceAdjustmentsByExpenseId,
    props.balances.myParticipantId,
    props.expenses,
    selectedCurrency,
  ]);

  const summaryLabel =
    myNetBalanceCents > 0
      ? 'You are owed'
      : myNetBalanceCents < 0
        ? 'You owe'
        : 'You are settled';

  const expensesSorted = useMemo(() => {
    return [...expenses].sort(byNewestExpenseFirst);
  }, [expenses]);

  const myParticipant = useMemo(() => {
    return participants.find(
      (participant) => participant.userId === props.user.id
    );
  }, [participants, props.user.id]);

  const canEditGroupName =
    myParticipant?.role === 'owner' || myParticipant?.role === 'admin';
  const canCreateExpense = !!myParticipant && myParticipant.role !== 'viewer';
  const canLeaveGroup = !!myParticipant;

  const participantsSection = useGroupParticipantsSection({
    groupId: props.group.id,
    canEditGroupName,
    isSavingSettings,
    onParticipantCreated: optimisticParticipants.upsert,
    onParticipantDeleted: optimisticParticipants.remove,
  });

  function onExpenseCreated(nextDetails: ExpenseDetailsData) {
    optimisticExpenses.upsert(nextDetails.expense);

    const myParticipantId = props.balances.myParticipantId;
    if (!myParticipantId) {
      return;
    }

    const deltaCents = computeMyExpenseNetDeltaCents(
      nextDetails,
      myParticipantId
    );

    if (deltaCents === 0) {
      return;
    }

    setPendingBalanceAdjustmentsByExpenseId((current) => ({
      ...current,
      [nextDetails.expense.id]: {
        expenseId: nextDetails.expense.id,
        currency: nextDetails.expense.currency,
        deltaCents,
        kind: 'create',
      },
    }));
  }

  function onExpenseUpdated(payload: {
    previous: ExpenseDetailsData;
    next: ExpenseDetailsData;
  }) {
    optimisticExpenses.upsert(payload.next.expense);

    const myParticipantId = props.balances.myParticipantId;
    if (!myParticipantId) {
      return;
    }

    const previousDeltaCents = computeMyExpenseNetDeltaCents(
      payload.previous,
      myParticipantId
    );
    const nextDeltaCents = computeMyExpenseNetDeltaCents(
      payload.next,
      myParticipantId
    );
    const deltaCents = nextDeltaCents - previousDeltaCents;

    setPendingBalanceAdjustmentsByExpenseId((current) => {
      const next = { ...current };

      if (deltaCents === 0) {
        delete next[payload.next.expense.id];
        return next;
      }

      next[payload.next.expense.id] = {
        expenseId: payload.next.expense.id,
        currency: payload.next.expense.currency,
        deltaCents,
        kind: 'update',
        targetUpdatedAtMs:
          parseDateToMs(payload.next.expense.updatedAt) ?? undefined,
      };

      return next;
    });
  }

  function onExpenseDeleted(details: ExpenseDetailsData) {
    optimisticExpenses.remove(details.expense.id);

    const myParticipantId = props.balances.myParticipantId;
    if (!myParticipantId) {
      return;
    }

    const deltaCents = -computeMyExpenseNetDeltaCents(details, myParticipantId);

    if (deltaCents === 0) {
      return;
    }

    setPendingBalanceAdjustmentsByExpenseId((current) => ({
      ...current,
      [details.expense.id]: {
        expenseId: details.expense.id,
        currency: details.expense.currency,
        deltaCents,
        kind: 'delete',
      },
    }));
  }

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
    participants,
    expenses,
    ...participantsSection,
    showArchived,
    isSettingsModalOpen,
    isAddExpenseModalOpen,
    isExpenseDetailsModalOpen,
    selectedExpenseId,
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
    onExpenseCreated,
    onExpenseUpdated,
    onExpenseDeleted,
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
    toggleArchived: () => setShowArchived((value) => !value),
  };
}
