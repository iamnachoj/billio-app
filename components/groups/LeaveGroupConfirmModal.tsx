'use client';

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
  return (
    <Modal open={open} onClose={onClose} title="Leave group" size="sm">
      <div className="space-y-5">
        <p className="text-sm leading-6 text-slate-700">
          You are about to leave <strong>{groupName}</strong>. You will lose
          access to this group unless you are invited again.
        </p>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          This action is intended to be permanent for your current membership.
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLeavingGroup}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={isLeavingGroup}
          >
            Leave group
          </Button>
        </div>
      </div>
    </Modal>
  );
}
