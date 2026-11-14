'use client';

import { FormEvent } from 'react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('GROUPS');

  return (
    <Modal open={open} onClose={onClose} title={t('SETTINGS.TITLE')} size="md">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {t('SETTINGS.NAME')}
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
              {t('SETTINGS.PERMISSION_NAME')}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {t('SETTINGS.DESCRIPTION')}
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
              {t('SETTINGS.PERMISSION_DESCRIPTION')}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {t('SETTINGS.CURRENCY')}
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

        <div className="flex items-start sm:items-center justify-between gap-2">
          {canLeaveGroup ? (
            <button
              type="button"
              onClick={onRequestLeaveGroup}
              disabled={isSaving || isLeavingGroup}
              className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLeavingGroup ? t('SETTINGS.LEAVING') : t('SETTINGS.LEAVE')}
            </button>
          ) : (
            <div />
          )}

          <div className="flex flex-col items-end sm:flex-row sm:items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isLeavingGroup}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('SETTINGS.CANCEL')}
            </button>
            <button
              type="submit"
              disabled={isSaving || isLeavingGroup}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? t('SETTINGS.SAVING') : t('SETTINGS.SAVE')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
