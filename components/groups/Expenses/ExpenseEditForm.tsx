import { FormEvent } from 'react';

import Button from '@/components/ui/Button';
import { ExpenseCategories } from '@/lib/models/expense';
import { GroupParticipant } from '@/lib/models/groupParticipant';

type SplitMode = 'equal' | 'selected' | 'percentage';

type ExpenseEditFormProps = {
  title: string;
  description: string;
  category: string;
  amountInput: string;
  currency: string;
  paidByParticipantId: string;
  splitMode: SplitMode;
  selectedParticipantIds: string[];
  percentageByParticipantId: Record<string, string>;
  activeParticipants: GroupParticipant[];
  currencyOptions: string[];
  error: string;
  isSaving: boolean;
  onSubmit: (event: FormEvent) => Promise<void>;
  onCancel: () => void;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setCategory: (value: string) => void;
  setAmountInput: (value: string) => void;
  setCurrency: (value: string) => void;
  setPaidByParticipantId: (value: string) => void;
  setSplitMode: (mode: SplitMode) => void;
  toggleSelectedParticipant: (participantId: string) => void;
  updatePercentage: (participantId: string, value: string) => void;
};

export default function ExpenseEditForm({
  title,
  description,
  category,
  amountInput,
  currency,
  paidByParticipantId,
  splitMode,
  selectedParticipantIds,
  percentageByParticipantId,
  activeParticipants,
  currencyOptions,
  error,
  isSaving,
  onSubmit,
  onCancel,
  setTitle,
  setDescription,
  setCategory,
  setAmountInput,
  setCurrency,
  setPaidByParticipantId,
  setSplitMode,
  toggleSelectedParticipant,
  updatePercentage,
}: ExpenseEditFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Optional details"
            className="h-22 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>

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
            value={paidByParticipantId}
            onChange={(event) => setPaidByParticipantId(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          >
            {activeParticipants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
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
            The amount will be split equally across all active participants.
          </p>
        ) : null}

        {splitMode === 'selected' ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-600">
              Choose who shares this expense.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activeParticipants.map((participant) => {
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
              {activeParticipants.map((participant) => (
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
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel edit
        </Button>
        <Button type="submit" loading={isSaving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
