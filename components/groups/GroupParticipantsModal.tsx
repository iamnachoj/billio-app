'use client';

import Modal from '@/components/ui/Modal';
import { GroupParticipant } from '@/lib/models/groupParticipant';

type GroupParticipantsModalProps = {
  open: boolean;
  onClose: () => void;
  participants: GroupParticipant[];
  currentUserId: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
  }).format(new Date(date));
}

function statusLabel(status: GroupParticipant['status']) {
  if (status === 'active') return 'Active';
  if (status === 'invited') return 'Invited';
  return 'Left';
}

function roleLabel(role: GroupParticipant['role']) {
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  if (role === 'viewer') return 'Viewer';
  return 'Member';
}

function byRoleThenName(a: GroupParticipant, b: GroupParticipant) {
  const roleWeight: Record<GroupParticipant['role'], number> = {
    owner: 0,
    admin: 1,
    member: 2,
    viewer: 3,
  };

  if (roleWeight[a.role] !== roleWeight[b.role]) {
    return roleWeight[a.role] - roleWeight[b.role];
  }

  return a.displayName.localeCompare(b.displayName);
}

export default function GroupParticipantsModal({
  open,
  onClose,
  participants,
  currentUserId,
}: GroupParticipantsModalProps) {
  const sortedParticipants = [...participants].sort(byRoleThenName);

  return (
    <Modal open={open} onClose={onClose} title="Participants" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          {participants.length} total participants
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Role</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Linked User</th>
                <th className="px-3 py-2 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {sortedParticipants.map((participant) => {
                const isCurrentUser = participant.userId === currentUserId;

                return (
                  <tr key={participant.id}>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {participant.displayName}
                      {isCurrentUser ? (
                        <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                          You
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">{roleLabel(participant.role)}</td>
                    <td className="px-3 py-3">
                      {statusLabel(participant.status)}
                    </td>
                    <td className="px-3 py-3">
                      {participant.userId ? 'Linked' : 'Unlinked'}
                    </td>
                    <td className="px-3 py-3">
                      {formatDate(participant.joinedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
