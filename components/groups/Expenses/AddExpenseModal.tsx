'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  createExpense,
  type ExpenseDetailsData,
  type CreateExpenseSplitInput,
} from '@/frontend-services/expenses.service';
import { ExpenseCategories } from '@/lib/models/expense';
import { GroupParticipant } from '@/lib/models/groupParticipant';
import { type GroupPageUser } from '@/components/groups/GroupPage';

type AddExpenseModalProps = {
  open: boolean;
  onClose: () => void;
  user: GroupPageUser;
  groupId: string;
  participants: GroupParticipant[];
  currencies: string[];
  defaultCurrency: string;
  onExpenseCreated?: (details: ExpenseDetailsData) => void;
};

type SplitMode = 'equal' | 'selected' | 'percentage';

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

export default function AddExpenseModal({
  open,
  onClose,
  user,
  groupId,
  participants,
  currencies,
  defaultCurrency,
  onExpenseCreated,
}: AddExpenseModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Add expense" size="md">
      {open ? (
        <AddExpenseModalForm
          user={user}
          groupId={groupId}
          participants={participants}
          currencies={currencies}
          defaultCurrency={defaultCurrency}
          onExpenseCreated={onExpenseCreated}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

type AddExpenseModalFormProps = {
  user: GroupPageUser;
  groupId: string;
  participants: GroupParticipant[];
  currencies: string[];
  defaultCurrency: string;
  onExpenseCreated?: (details: ExpenseDetailsData) => void;
  onClose: () => void;
};

function AddExpenseModalForm({
  user,
  groupId,
  participants,
  currencies,
  defaultCurrency,
  onExpenseCreated,
  onClose,
}: AddExpenseModalFormProps) {
  const router = useRouter();

  const currencyOptions = useMemo(() => {
    const base = currencies.length > 0 ? currencies : [defaultCurrency, 'EUR'];
    return Array.from(new Set(base.filter(Boolean))).sort();
  }, [currencies, defaultCurrency]);

  const defaultPaidByParticipantId = useMemo(() => {
    const ownParticipant = participants.find(
      (participant) => participant.userId === user.id
    );

    return ownParticipant?.id ?? participants[0]?.id ?? '';
  }, [participants, user.id]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(ExpenseCategories[0]);
  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState(
    () => defaultCurrency || currencyOptions[0] || 'EUR'
  );
  const [paidByParticipantId, setPaidByParticipantId] = useState(
    () => defaultPaidByParticipantId
  );
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >(() => participants.map((participant) => participant.id));
  const [percentageByParticipantId, setPercentageByParticipantId] = useState<
    Record<string, string>
  >(() => buildEqualPercentageMap(participants));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paidByParticipantIdValue = participants.some(
    (participant) => participant.id === paidByParticipantId
  )
    ? paidByParticipantId
    : defaultPaidByParticipantId;

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
    | {
        ok: false;
        message: string;
      } {
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

    const shares = participants.map((participant) => {
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

    if (!paidByParticipantIdValue) {
      setError('Please select who paid.');
      return;
    }

    if (participants.length === 0) {
      setError('No participants are available to split this expense.');
      return;
    }

    const splitInputResult = buildSplitInput();
    if (!splitInputResult.ok) {
      setError(splitInputResult.message);
      return;
    }

    try {
      setLoading(true);

      const response = await createExpense(groupId, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        amount: amountCents,
        currency,
        paidByParticipantId: paidByParticipantIdValue,
        split: splitInputResult.split,
      });

      if (!response.success) {
        setError(response.error?.message ?? 'Unable to create expense.');
        return;
      }

      onExpenseCreated?.(response.data);
      onClose();
      router.refresh();
    } catch {
      setError('Something went wrong while creating the expense.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder="Dinner in Madrid"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Optional details"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 h-22"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            placeholder="12.34"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Currency
          </label>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          >
            {currencyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          >
            {ExpenseCategories.map((expenseCategory) => (
              <option key={expenseCategory} value={expenseCategory}>
                {expenseCategory}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Paid by
          </label>
          <select
            value={paidByParticipantIdValue}
            onChange={(event) => setPaidByParticipantId(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          >
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Split mode
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setSplitMode('equal')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                splitMode === 'equal'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Equal
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('selected')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                splitMode === 'selected'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Selected people
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('percentage')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                splitMode === 'percentage'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Percentage
            </button>
          </div>
        </div>

        {splitMode === 'equal' ? (
          <p className="text-xs text-slate-600">
            The amount will be split equally across all participants.
          </p>
        ) : null}

        {splitMode === 'selected' ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-600">
              Choose who shares this expense.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {participants.map((participant) => {
                const checked = selectedParticipantIds.includes(participant.id);

                return (
                  <label
                    key={participant.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelectedParticipant(participant.id)}
                    />
                    <span>{participant.displayName}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {splitMode === 'percentage' ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-600">
              Set the percentage for each participant. Total must be exactly
              100.
            </p>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    {participant.displayName}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={percentageByParticipantId[participant.id] ?? ''}
                    onChange={(event) =>
                      updatePercentage(participant.id, event.target.value)
                    }
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right text-sm text-slate-900"
                  />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Add expense
        </Button>
      </div>
    </form>
  );
}
