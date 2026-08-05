'use client';

import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

type InviteLinkModalProps = {
  open: boolean;
  onClose: () => void;
  inviteUrl: string;
  email?: string;
  expiresAt?: string;
};

function formatExpiry(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function InviteLinkModal({
  open,
  onClose,
  inviteUrl,
  email,
  expiresAt,
}: InviteLinkModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const formattedExpiry = formatExpiry(expiresAt);

  return (
    <Modal open={open} onClose={onClose} title="Invite link" size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Share this link so someone can join and link themselves to the group.
        </p>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            Invite URL
          </label>
          <input
            readOnly
            value={inviteUrl}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>

        {email ? (
          <p className="text-sm text-slate-600">
            This link is locked to{' '}
            <span className="font-medium text-slate-900">{email}</span>.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            This is a reusable invite link and is not locked to one email.
          </p>
        )}

        {formattedExpiry ? (
          <p className="text-xs text-slate-500">
            Valid until {formattedExpiry}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={copyInviteLink}>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
