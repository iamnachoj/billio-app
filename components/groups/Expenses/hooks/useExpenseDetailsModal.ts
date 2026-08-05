import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  deleteExpense,
  getExpenseById,
  updateExpense,
  type CreateExpenseSplitInput,
  type ExpenseDetailsData,
} from '@/frontend-services/expenses.service';
import { ExpenseCategories } from '@/lib/models/expense';
import { GroupParticipant } from '@/lib/models/groupParticipant';

export type SplitMode = 'equal' | 'selected' | 'percentage';

type SplitSummaryRow = {
  participantId: string;
  amount: number;
};

type InitialFormSnapshot = {
  title: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  paidByParticipantId: string;
  split: CreateExpenseSplitInput;
};

type UseExpenseDetailsModalParams = {
  open: boolean;
  onClose: () => void;
  groupId: string;
  expenseId: string | null;
  participants: GroupParticipant[];
  currencies: string[];
  canEdit: boolean;
};

function buildEqualPercentageMap(participants: GroupParticipant[]) {
  const count = participants.length;
  if (count === 0) {
    return {} as Record<string, string>;
  }

  const basisPointsBase = Math.floor(10000 / count);
  let remainder = 10000 - basisPointsBase * count;

  const entries = participants.map((participant) => {
    const basisPoints =
      basisPointsBase + (remainder > 0 ? ((remainder -= 1), 1) : 0);

    return [participant.id, (basisPoints / 100).toFixed(2)] as const;
  });

  return Object.fromEntries(entries);
}

function areNumbersClose(a: number, b: number, epsilon = 0.0001) {
  return Math.abs(a - b) <= epsilon;
}

function areSplitInputsEqual(
  a: CreateExpenseSplitInput,
  b: CreateExpenseSplitInput
) {
  if (a.mode !== b.mode) {
    return false;
  }

  if (a.mode === 'equal' && b.mode === 'equal') {
    return true;
  }

  if (a.mode === 'selected' && b.mode === 'selected') {
    const left = [...new Set(a.participantIds)].sort();
    const right = [...new Set(b.participantIds)].sort();

    if (left.length !== right.length) {
      return false;
    }

    return left.every((id, index) => id === right[index]);
  }

  if (a.mode === 'percentage' && b.mode === 'percentage') {
    const left = [...a.shares].sort((x, y) =>
      x.participantId.localeCompare(y.participantId)
    );
    const right = [...b.shares].sort((x, y) =>
      x.participantId.localeCompare(y.participantId)
    );

    if (left.length !== right.length) {
      return false;
    }

    return left.every((share, index) => {
      return (
        share.participantId === right[index].participantId &&
        areNumbersClose(share.percentage, right[index].percentage)
      );
    });
  }

  return false;
}

function inferSplitState({
  details,
  activeParticipants,
}: {
  details: ExpenseDetailsData;
  activeParticipants: GroupParticipant[];
}) {
  const amountByParticipantId: Record<string, number> = {};
  for (const participant of activeParticipants) {
    amountByParticipantId[participant.id] = 0;
  }

  for (const split of details.splits) {
    if (split.owedToParticipantId !== details.expense.paidByParticipantId) {
      continue;
    }

    if (amountByParticipantId[split.participantId] === undefined) {
      continue;
    }

    amountByParticipantId[split.participantId] += split.amount;
  }

  const assignedToOthers = Object.values(amountByParticipantId).reduce(
    (sum, value) => sum + value,
    0
  );

  const payerId = details.expense.paidByParticipantId;
  if (amountByParticipantId[payerId] !== undefined) {
    const payerShare = Math.max(details.expense.amount - assignedToOthers, 0);
    amountByParticipantId[payerId] += payerShare;
  }

  const selectedParticipantIds = activeParticipants
    .filter((participant) => (amountByParticipantId[participant.id] ?? 0) > 0)
    .map((participant) => participant.id);

  const selectedAmounts = selectedParticipantIds.map(
    (participantId) => amountByParticipantId[participantId]
  );

  const isEqualAmongSelected =
    selectedAmounts.length > 0 &&
    Math.max(...selectedAmounts) - Math.min(...selectedAmounts) <= 1;

  let mode: SplitMode = 'percentage';
  if (
    isEqualAmongSelected &&
    selectedParticipantIds.length === activeParticipants.length
  ) {
    mode = 'equal';
  } else if (isEqualAmongSelected) {
    mode = 'selected';
  }

  const totalAmount = details.expense.amount;
  let basisPointsByParticipantId: Record<string, number> = {};

  if (totalAmount > 0) {
    const withFloor = activeParticipants.map((participant) => {
      const amount = amountByParticipantId[participant.id] ?? 0;
      const raw = (amount * 10000) / totalAmount;
      const floored = Math.floor(raw);

      return {
        participantId: participant.id,
        basisPoints: floored,
        fraction: raw - floored,
      };
    });

    const sumFloor = withFloor.reduce((sum, item) => sum + item.basisPoints, 0);
    let remainder = 10000 - sumFloor;

    const byFraction = [...withFloor].sort((a, b) => b.fraction - a.fraction);
    for (let i = 0; i < byFraction.length && remainder > 0; i += 1) {
      byFraction[i].basisPoints += 1;
      remainder -= 1;
    }

    basisPointsByParticipantId = Object.fromEntries(
      byFraction.map((item) => [item.participantId, item.basisPoints])
    );
  }

  const percentageByParticipantId =
    totalAmount > 0
      ? Object.fromEntries(
          activeParticipants.map((participant) => {
            const basisPoints = basisPointsByParticipantId[participant.id] ?? 0;
            return [participant.id, (basisPoints / 100).toFixed(2)] as const;
          })
        )
      : buildEqualPercentageMap(activeParticipants);

  return {
    mode,
    selectedParticipantIds,
    percentageByParticipantId,
    amountByParticipantId,
  };
}

export function useExpenseDetailsModal({
  open,
  onClose,
  groupId,
  expenseId,
  participants,
  currencies,
  canEdit,
}: UseExpenseDetailsModalParams) {
  const router = useRouter();

  const activeParticipants = useMemo(() => {
    return participants.filter(
      (participant) => participant.status === 'active'
    );
  }, [participants]);

  const participantNameById = useMemo(() => {
    return new Map(
      participants.map((participant) => [
        participant.id,
        participant.displayName,
      ])
    );
  }, [participants]);

  const [details, setDetails] = useState<ExpenseDetailsData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(ExpenseCategories[0]);
  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [paidByParticipantId, setPaidByParticipantId] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >([]);
  const [percentageByParticipantId, setPercentageByParticipantId] = useState<
    Record<string, string>
  >({});
  const [splitSummaryRows, setSplitSummaryRows] = useState<SplitSummaryRow[]>(
    []
  );

  const [initialSnapshot, setInitialSnapshot] =
    useState<InitialFormSnapshot | null>(null);

  const currencyOptions = useMemo(() => {
    const base = [
      ...currencies,
      currency,
      details?.expense.currency,
      'EUR',
    ].filter(Boolean) as string[];

    return Array.from(new Set(base)).sort();
  }, [currencies, currency, details?.expense.currency]);

  function resetTransientState() {
    setError('');
    setIsEditing(false);
    setIsFetching(false);
    setIsSaving(false);
    setIsDeleting(false);
    setIsDeleteConfirmOpen(false);
    setDetails(null);
    setInitialSnapshot(null);
    setSplitSummaryRows([]);
  }

  function hydrateFormFromDetails(nextDetails: ExpenseDetailsData) {
    setDetails(nextDetails);

    const expense = nextDetails.expense;
    setTitle(expense.title ?? '');
    setDescription(expense.description ?? '');
    setCategory(expense.category);
    setAmountInput((expense.amount / 100).toFixed(2));
    setCurrency(expense.currency);
    setPaidByParticipantId(expense.paidByParticipantId);

    const inferred = inferSplitState({
      details: nextDetails,
      activeParticipants,
    });

    setSplitMode(inferred.mode);
    setSelectedParticipantIds(inferred.selectedParticipantIds);
    setPercentageByParticipantId(inferred.percentageByParticipantId);

    const summaryRows = activeParticipants
      .map((participant) => ({
        participantId: participant.id,
        amount: inferred.amountByParticipantId[participant.id] ?? 0,
      }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    setSplitSummaryRows(summaryRows);

    const initialSplit: CreateExpenseSplitInput =
      inferred.mode === 'equal'
        ? { mode: 'equal' }
        : inferred.mode === 'selected'
          ? {
              mode: 'selected',
              participantIds: inferred.selectedParticipantIds,
            }
          : {
              mode: 'percentage',
              shares: activeParticipants.map((participant) => ({
                participantId: participant.id,
                percentage: Number(
                  inferred.percentageByParticipantId[participant.id] ?? '0'
                ),
              })),
            };

    setInitialSnapshot({
      title: expense.title ?? '',
      description: expense.description ?? '',
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      paidByParticipantId: expense.paidByParticipantId,
      split: initialSplit,
    });
  }

  useEffect(() => {
    if (!open || !expenseId) {
      resetTransientState();
      return;
    }

    const targetExpenseId = expenseId;
    let cancelled = false;

    async function loadExpenseDetails() {
      try {
        setError('');
        setIsFetching(true);

        const response = await getExpenseById(groupId, targetExpenseId);

        if (cancelled) {
          return;
        }

        if (!response.success) {
          setError(
            response.error?.message ?? 'Unable to load expense details.'
          );
          return;
        }

        hydrateFormFromDetails(response.data);
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    }

    loadExpenseDetails();

    return () => {
      cancelled = true;
    };
  }, [open, expenseId, groupId, activeParticipants]);

  function closeModal() {
    if (isSaving || isDeleting) {
      return;
    }

    onClose();
  }

  function startEditing() {
    if (!canEdit || !details || isDeleting) {
      return;
    }

    setError('');
    setIsDeleteConfirmOpen(false);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!details || isSaving) {
      return;
    }

    hydrateFormFromDetails(details);
    setError('');
    setIsEditing(false);
  }

  function openDeleteConfirm() {
    if (!canEdit || !details || isEditing || isDeleting) {
      return;
    }

    setError('');
    setIsDeleteConfirmOpen(true);
  }

  function cancelDeleteConfirm() {
    if (isDeleting) {
      return;
    }

    setIsDeleteConfirmOpen(false);
  }

  function toggleSelectedParticipant(participantId: string) {
    setSelectedParticipantIds((current) => {
      if (current.includes(participantId)) {
        return current.filter((id) => id !== participantId);
      }

      return [...current, participantId];
    });
  }

  function updatePercentage(participantId: string, value: string) {
    setPercentageByParticipantId((current) => ({
      ...current,
      [participantId]: value,
    }));
  }

  function buildSplitInput():
    | { ok: true; split: CreateExpenseSplitInput }
    | { ok: false; message: string } {
    if (splitMode === 'equal') {
      return { ok: true, split: { mode: 'equal' } };
    }

    if (splitMode === 'selected') {
      const participantIds = Array.from(new Set(selectedParticipantIds));
      if (participantIds.length === 0) {
        return {
          ok: false,
          message: 'Select at least one participant for selected split.',
        };
      }

      return {
        ok: true,
        split: {
          mode: 'selected',
          participantIds,
        },
      };
    }

    const shares = activeParticipants.map((participant) => {
      const raw = percentageByParticipantId[participant.id] ?? '0';
      const percentage = Number(raw);

      return {
        participantId: participant.id,
        percentage,
      };
    });

    if (
      shares.some(
        (share) => !Number.isFinite(share.percentage) || share.percentage < 0
      )
    ) {
      return {
        ok: false,
        message:
          'All percentages must be valid numbers greater than or equal to 0.',
      };
    }

    const percentageSum = shares.reduce(
      (sum, share) => sum + share.percentage,
      0
    );

    if (Math.abs(percentageSum - 100) > 0.0001) {
      return {
        ok: false,
        message: 'Percentage split must sum exactly 100.',
      };
    }

    return {
      ok: true,
      split: {
        mode: 'percentage',
        shares,
      },
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!expenseId || !details || !initialSnapshot || !canEdit) {
      return;
    }

    const targetExpenseId = expenseId;

    setError('');

    const amount = Number(amountInput);
    const amountCents = Math.round(amount * 100);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    if (!currency) {
      setError('Currency is required.');
      return;
    }

    if (!paidByParticipantId) {
      setError('Please select who paid.');
      return;
    }

    if (activeParticipants.length === 0) {
      setError('No active participants are available to split this expense.');
      return;
    }

    const splitInputResult = buildSplitInput();
    if (!splitInputResult.ok) {
      setError(splitInputResult.message);
      return;
    }

    const nextTitle = title.trim();
    const nextDescription = description.trim();
    const nextCategory = category;
    const nextAmount = amountCents;
    const nextCurrency = currency;
    const nextPaidBy = paidByParticipantId;

    const titleChanged = nextTitle !== initialSnapshot.title;
    const descriptionChanged = nextDescription !== initialSnapshot.description;
    const categoryChanged = nextCategory !== initialSnapshot.category;
    const amountChanged = nextAmount !== initialSnapshot.amount;
    const currencyChanged = nextCurrency !== initialSnapshot.currency;
    const payerChanged = nextPaidBy !== initialSnapshot.paidByParticipantId;
    const splitChanged = !areSplitInputsEqual(
      initialSnapshot.split,
      splitInputResult.split
    );

    const shouldIncludeSplit = splitChanged || amountChanged || payerChanged;

    const body: {
      title?: string;
      description?: string;
      category?: string;
      amount?: number;
      currency?: string;
      paidByParticipantId?: string;
      split?: CreateExpenseSplitInput;
    } = {};

    if (titleChanged) {
      body.title = nextTitle;
    }

    if (descriptionChanged) {
      body.description = nextDescription;
    }

    if (categoryChanged) {
      body.category = nextCategory;
    }

    if (amountChanged) {
      body.amount = nextAmount;
    }

    if (currencyChanged) {
      body.currency = nextCurrency;
    }

    if (payerChanged) {
      body.paidByParticipantId = nextPaidBy;
    }

    if (shouldIncludeSplit) {
      body.split = splitInputResult.split;
    }

    if (Object.keys(body).length === 0) {
      setError('No changes to save.');
      return;
    }

    try {
      setIsSaving(true);

      const response = await updateExpense(groupId, targetExpenseId, body);

      if (!response.success) {
        setError(response.error?.message ?? 'Unable to update expense.');
        return;
      }

      hydrateFormFromDetails(response.data);
      setIsEditing(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteExpense() {
    if (!expenseId || !details || !canEdit || isDeleting || isSaving) {
      return;
    }

    try {
      setError('');
      setIsDeleting(true);

      const response = await deleteExpense(groupId, expenseId);

      if (!response.success) {
        setError(response.error?.message ?? 'Unable to delete expense.');
        return;
      }

      setIsDeleteConfirmOpen(false);
      onClose();
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    details,
    isFetching,
    isSaving,
    isDeleting,
    isEditing,
    isDeleteConfirmOpen,
    error,
    title,
    description,
    category,
    amountInput,
    currency,
    paidByParticipantId,
    splitMode,
    selectedParticipantIds,
    percentageByParticipantId,
    splitSummaryRows,
    activeParticipants,
    participantNameById,
    currencyOptions,
    setTitle,
    setDescription,
    setCategory,
    setAmountInput,
    setCurrency,
    setPaidByParticipantId,
    setSplitMode,
    toggleSelectedParticipant,
    updatePercentage,
    closeModal,
    startEditing,
    cancelEditing,
    openDeleteConfirm,
    cancelDeleteConfirm,
    confirmDeleteExpense,
    handleSubmit,
  };
}
