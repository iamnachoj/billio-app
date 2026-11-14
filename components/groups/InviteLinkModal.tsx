'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatGroupDate } from './groupTotalsUtils';

type InviteLinkModalProps = {
  open: boolean;
  onClose: () => void;
  inviteUrl: string;
  email?: string;
  expiresAt?: string;
};

function formatExpiry(value: string | undefined, locale: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatGroupDate(date, locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function InviteLinkModal({
  open,
  onClose,
  inviteUrl,
  email,
  expiresAt,
}: InviteLinkModalProps) {
  const t = useTranslations('GROUPS');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  function handleClose() {
    setCopied(false);
    onClose();
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const formattedExpiry = formatExpiry(expiresAt, locale);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('INVITE.TITLE')}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          {t('INVITE.SHARE_DESCRIPTION')}
        </p>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            {t('INVITE.URL')}
          </label>
          <input
            readOnly
            value={inviteUrl}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>

        {email ? (
          <p className="text-sm text-slate-600">
            {t('INVITE.LOCKED_TO', { email })}
          </p>
        ) : (
          <p className="text-sm text-slate-600">{t('INVITE.REUSABLE')}</p>
        )}

        {formattedExpiry ? (
          <p className="text-xs text-slate-500">
            {t('INVITE.VALID_UNTIL', { date: formattedExpiry })}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t('INVITE.CLOSE')}
          </Button>
          <Button type="button" onClick={copyInviteLink}>
            {copied ? t('INVITE.COPIED') : t('INVITE.COPY')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
