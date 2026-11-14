'use client';

import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

type LeaveGroupConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLeavingGroup: boolean;
  groupName: string;
};

export default function LeaveGroupConfirmModal({
  open,
  onClose,
  onConfirm,
  isLeavingGroup,
  groupName,
}: LeaveGroupConfirmModalProps) {
  const t = useTranslations('GROUPS');

  return (
    <Modal open={open} onClose={onClose} title={t('LEAVE.TITLE')} size="sm">
      <div className="space-y-5">
        <p className="text-sm leading-6 text-slate-700">
          {t.rich('LEAVE.CONFIRMATION', {
            groupName: () => <strong>{groupName}</strong>,
          })}
        </p>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {t('LEAVE.WARNING')}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLeavingGroup}
          >
            {t('LEAVE.CANCEL')}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={isLeavingGroup}
          >
            {t('LEAVE.CONFIRM')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
