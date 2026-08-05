'use client';

import { useEffect, useState } from 'react';

import Modal from '@/components/ui/Modal';
import { GroupParticipant } from '@/lib/models/groupParticipant';
import Button from '../ui/Button';

type GroupParticipantsModalProps = {
  open: boolean;
  onClose: () => void;
  participants: GroupParticipant[];
  currentUserId: string;
  canAddParticipants: boolean;
  isAddingParticipant: boolean;
  addParticipantError: string;
  newParticipantNameDraft: string;
  setNewParticipantNameDraft: (value: string) => void;
  newParticipantRoleDraft: 'owner' | 'admin' | 'member' | 'viewer';
  setNewParticipantRoleDraft: (
    value: 'owner' | 'admin' | 'member' | 'viewer'
  ) => void;
  onAddParticipant: () => void;
  inviteEmailDraft: string;
  setInviteEmailDraft: (value: string) => void;
  inviteError: string;
  isGeneratingInvite: boolean;
  onGenerateInvite: () => void;
  removeParticipantError: string;
  removingParticipantId: string | null;
  onRemoveParticipant: (participantId: string) => void;
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
  canAddParticipants,
  isAddingParticipant,
  addParticipantError,
  newParticipantNameDraft,
  setNewParticipantNameDraft,
  newParticipantRoleDraft,
  setNewParticipantRoleDraft,
  onAddParticipant,
  inviteEmailDraft,
  setInviteEmailDraft,
  inviteError,
  isGeneratingInvite,
  onGenerateInvite,
  removeParticipantError,
  removingParticipantId,
  onRemoveParticipant,
}: GroupParticipantsModalProps) {
  const sortedParticipants = [...participants].sort(byRoleThenName);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isGenerateInviteOpen, setIsGenerateInviteOpen] = useState(false);
  const [pendingRemovalParticipantId, setPendingRemovalParticipantId] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setIsAddParticipantOpen(false);
      setIsGenerateInviteOpen(false);
      setPendingRemovalParticipantId(null);
    }
  }, [open]);

  useEffect(() => {
    if (addParticipantError) {
      setIsAddParticipantOpen(true);
    }
  }, [addParticipantError]);

  useEffect(() => {
    if (inviteError) {
      setIsGenerateInviteOpen(true);
    }
  }, [inviteError]);

  useEffect(() => {
    if (removeParticipantError) {
      setPendingRemovalParticipantId(null);
    }
  }, [removeParticipantError]);

  return (
    <Modal open={open} onClose={onClose} title="Participants" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            {participants.length} total participants
          </p>
          <Button
            onClick={() => setIsGenerateInviteOpen((current) => !current)}
            variant="secondary"
            className="px-3 py-2 text-sm"
          >
            {isGenerateInviteOpen
              ? 'Close invite link'
              : 'Generate invite link'}
          </Button>
        </div>

        {isGenerateInviteOpen ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">
              Generate invite link
            </p>
            <div className="space-y-2">
              <input
                type="email"
                value={inviteEmailDraft}
                onChange={(event) => setInviteEmailDraft(event.target.value)}
                maxLength={120}
                placeholder="friend@example.com (optional)"
                disabled={!canAddParticipants || isGeneratingInvite}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <p className="text-xs text-slate-500">
                Leave empty to create a reusable link for anyone.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              {!canAddParticipants ? (
                <p className="text-xs text-slate-500">
                  Only owners and admins can generate invite links.
                </p>
              ) : (
                <div />
              )}

              {inviteError ? (
                <p className="text-sm text-rose-700">{inviteError}</p>
              ) : null}

              <button
                type="button"
                onClick={onGenerateInvite}
                disabled={!canAddParticipants || isGeneratingInvite}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingInvite ? 'Generating...' : 'Generate link'}
              </button>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Role</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Linked User</th>
                <th className="px-3 py-2 font-semibold">Joined</th>
                {canAddParticipants ? (
                  <th className="px-3 py-2 font-semibold text-right">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {sortedParticipants.map((participant) => {
                const isCurrentUser = participant.userId === currentUserId;
                const canRemoveParticipant =
                  canAddParticipants &&
                  participant.role !== 'owner' &&
                  participant.role !== 'admin';
                const isConfirmingRemoval =
                  pendingRemovalParticipantId === participant.id;
                const isRemovingParticipant =
                  removingParticipantId === participant.id;

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
                    {canAddParticipants ? (
                      <td className="px-3 py-3 text-right">
                        {canRemoveParticipant ? (
                          isConfirmingRemoval ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingRemovalParticipantId(null)
                                }
                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onRemoveParticipant(participant.id)
                                }
                                disabled={!!removingParticipantId}
                                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isRemovingParticipant
                                  ? 'Removing...'
                                  : 'Confirm remove'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setPendingRemovalParticipantId(participant.id)
                              }
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                            >
                              Remove
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {removeParticipantError ? (
            <p className="mt-3 text-sm text-rose-700">
              {removeParticipantError}
            </p>
          ) : null}

          <Button
            onClick={() => setIsAddParticipantOpen((current) => !current)}
            className="text-sm my-4"
          >
            {isAddParticipantOpen
              ? 'Close add participant'
              : 'Add new participant'}
          </Button>
        </div>
        {isAddParticipantOpen ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">
              Add participant
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={newParticipantNameDraft}
                onChange={(event) =>
                  setNewParticipantNameDraft(event.target.value)
                }
                maxLength={80}
                placeholder="Participant name"
                disabled={!canAddParticipants || isAddingParticipant}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <select
                value={newParticipantRoleDraft}
                onChange={(event) =>
                  setNewParticipantRoleDraft(
                    event.target.value as
                      | 'owner'
                      | 'admin'
                      | 'member'
                      | 'viewer'
                  )
                }
                disabled={!canAddParticipants || isAddingParticipant}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              {!canAddParticipants ? (
                <p className="text-xs text-slate-500">
                  Only owners and admins can add participants.
                </p>
              ) : (
                <div />
              )}

              {addParticipantError ? (
                <p className="text-sm text-rose-700">{addParticipantError}</p>
              ) : null}

              <button
                type="button"
                onClick={onAddParticipant}
                disabled={!canAddParticipants || isAddingParticipant}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAddingParticipant ? 'Adding...' : 'Add participant'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
