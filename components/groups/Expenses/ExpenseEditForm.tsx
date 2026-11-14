'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button';
import {
  ExpenseCategories,
  getExpenseCategoryEmoji,
} from '@/lib/models/expense';
import { GroupParticipant } from '@/lib/models/groupParticipant';
import { getGroupCategoryLabel } from '@/components/groups/groupTotalsUtils';

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
  participants: GroupParticipant[];
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
  participants,
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
  const t = useTranslations('GROUPS');
  const [isSplitOptionsOpen, setIsSplitOptionsOpen] = useState(false);

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {t('EXPENSE_EDIT.TITLE')}
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {t('EXPENSE_EDIT.DESCRIPTION')}
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={300}
            rows={3}
            placeholder={t('EXPENSE_EDIT.DESCRIPTION_PLACEHOLDER')}
            className="h-22 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>

        <div className="grid grid-cols-12 gap-1 space-y-2">
          <div className="col-span-8">
            <label className="block text-sm font-medium text-slate-700">
              {t('EXPENSE_EDIT.AMOUNT')}
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
          <div className="col-span-4">
            <label className="block text-sm font-medium text-slate-700">
              {t('EXPENSE_EDIT.CURRENCY')}
            </label>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="w-full h-10.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              {currencyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {t('EXPENSE_EDIT.CATEGORY')}
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
          >
            {ExpenseCategories.map((expenseCategory) => (
              <option key={expenseCategory} value={expenseCategory}>
                {getExpenseCategoryEmoji(expenseCategory)}{' '}
                {getGroupCategoryLabel(
                  expenseCategory,
                  t as (key: string) => string
                )}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {t('EXPENSE_EDIT.PAID_BY')}
          </label>
          <select
            value={paidByParticipantId}
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

      <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="block text-sm font-medium text-slate-700">
            {t('EXPENSE_EDIT.SPLIT')}
          </span>
          <button
            type="button"
            onClick={() => setIsSplitOptionsOpen((open) => !open)}
            className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900 hover:decoration-slate-500"
          >
            {isSplitOptionsOpen
              ? t('EXPENSE_EDIT.HIDE_SPLIT_OPTIONS')
              : t('EXPENSE_EDIT.SPLIT_OPTIONS')}
          </button>
        </div>

        {!isSplitOptionsOpen ? (
          <p className="text-xs text-slate-600">
            {t('EXPENSE_EDIT.EQUAL_DESCRIPTION')}
          </p>
        ) : (
          <>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                {t('EXPENSE_EDIT.SPLIT_MODE')}
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
                  {t('EXPENSE_EDIT.EQUAL')}
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
                  {t('EXPENSE_EDIT.SELECTED')}
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
                  {t('EXPENSE_EDIT.PERCENTAGE')}
                </button>
              </div>
            </div>

            {splitMode === 'equal' ? (
              <p className="text-xs text-slate-600">
                {t('EXPENSE_EDIT.EQUAL_DESCRIPTION')}
              </p>
            ) : null}

            {splitMode === 'selected' ? (
              <div className="space-y-1">
                <p className="text-xs text-slate-600">
                  {t('EXPENSE_EDIT.SELECTED_DESCRIPTION')}
                </p>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {participants.map((participant) => {
                    const checked = selectedParticipantIds.includes(
                      participant.id
                    );

                    return (
                      <label
                        key={participant.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleSelectedParticipant(participant.id)
                          }
                        />
                        <span>{participant.displayName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {splitMode === 'percentage' ? (
              <div className="space-y-1">
                <p className="text-xs text-slate-600">
                  {t('EXPENSE_EDIT.PERCENTAGE_DESCRIPTION')}
                </p>
                <div className="space-y-1">
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
          </>
        )}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          {t('EXPENSE_EDIT.CANCEL')}
        </Button>
        <Button type="submit" loading={isSaving}>
          {t('EXPENSE_EDIT.SAVE')}
        </Button>
      </div>
    </form>
  );
}
