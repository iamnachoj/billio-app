'use client';

import { FormEvent } from 'react';

import Modal from '@/components/ui/Modal';

type GroupSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  isSaving: boolean;
  isLeavingGroup: boolean;
  error: string;
  canEditGroupName: boolean;
  canLeaveGroup: boolean;
  groupNameDraft: string;
  setGroupNameDraft: (value: string) => void;
  groupDescriptionDraft: string;
  setGroupDescriptionDraft: (value: string) => void;
  currencyDraft: string;
  setCurrencyDraft: (value: string) => void;
  currencies: string[];
  onRequestLeaveGroup: () => void;
};

export default function GroupSettingsModal({
  open,
  onClose,
  onSubmit,
  isSaving,
  isLeavingGroup,
  error,
  canEditGroupName,
  canLeaveGroup,
  groupNameDraft,
  setGroupNameDraft,
  groupDescriptionDraft,
  setGroupDescriptionDraft,
  currencyDraft,
  setCurrencyDraft,
  currencies,
  onRequestLeaveGroup,
}: GroupSettingsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Group settings" size="md">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            value={groupNameDraft}
            onChange={(event) => setGroupNameDraft(event.target.value)}
            maxLength={60}
            disabled={!canEditGroupName || isSaving}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          {!canEditGroupName ? (
            <p className="text-xs text-slate-500">
              Only owners and admins can change the group name.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            value={groupDescriptionDraft}
            onChange={(event) => setGroupDescriptionDraft(event.target.value)}
            maxLength={200}
            rows={3}
            disabled={!canEditGroupName || isSaving || isLeavingGroup}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          {!canEditGroupName ? (
            <p className="text-xs text-slate-500">
              Only owners and admins can change the group description.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Currency
          </label>
          <select
            value={currencyDraft}
            onChange={(event) => setCurrencyDraft(event.target.value)}
            disabled={isSaving || isLeavingGroup || currencies.length === 0}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

        <div className="flex items-center justify-between gap-2">
          {canLeaveGroup ? (
            <button
              type="button"
              onClick={onRequestLeaveGroup}
              disabled={isSaving || isLeavingGroup}
              className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLeavingGroup ? 'Leaving...' : 'Leave group'}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isLeavingGroup}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isLeavingGroup}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
