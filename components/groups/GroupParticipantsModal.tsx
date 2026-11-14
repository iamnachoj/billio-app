'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import Modal from '@/components/ui/Modal';
import { GroupParticipant } from '@/lib/models/groupParticipant';
import Button from '../ui/Button';
import { formatGroupDate } from './groupTotalsUtils';

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
  const t = useTranslations('GROUPS');
  const locale = useLocale();
  const sortedParticipants = [...participants].sort(byRoleThenName);
  const statusLabels: Record<GroupParticipant['status'], string> = {
    active: t('PARTICIPANTS.STATUS_ACTIVE'),
    invited: t('PARTICIPANTS.STATUS_INVITED'),
    left: t('PARTICIPANTS.STATUS_LEFT'),
  };
  const roleLabels: Record<GroupParticipant['role'], string> = {
    owner: t('PARTICIPANTS.ROLE_OWNER'),
    admin: t('PARTICIPANTS.ROLE_ADMIN'),
    member: t('PARTICIPANTS.ROLE_MEMBER'),
    viewer: t('PARTICIPANTS.ROLE_VIEWER'),
  };
  const [isAddParticipantOpenManually, setIsAddParticipantOpenManually] =
    useState(false);
  const [isGenerateInviteOpenManually, setIsGenerateInviteOpenManually] =
    useState(false);
  const [pendingRemovalParticipantId, setPendingRemovalParticipantId] =
    useState<string | null>(null);

  const isAddParticipantOpen =
    isAddParticipantOpenManually || Boolean(addParticipantError);
  const isGenerateInviteOpen =
    isGenerateInviteOpenManually || Boolean(inviteError);

  const handleClose = () => {
    setIsAddParticipantOpenManually(false);
    setIsGenerateInviteOpenManually(false);
    setPendingRemovalParticipantId(null);
    onClose();
  };

  const handleToggleInviteOpen = () => {
    setIsGenerateInviteOpenManually((current) => !current);
  };

  const handleToggleAddParticipantOpen = () => {
    setIsAddParticipantOpenManually((current) => !current);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('PARTICIPANTS.TITLE')}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            {t('PARTICIPANTS.TOTAL', { count: participants.length })}
          </p>
          <Button
            onClick={handleToggleInviteOpen}
            variant="secondary"
            className="px-3 py-2 text-sm"
          >
            {isGenerateInviteOpen
              ? t('PARTICIPANTS.CLOSE_INVITE')
              : t('PARTICIPANTS.GENERATE_INVITE')}
          </Button>
        </div>

        {isGenerateInviteOpen ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">
              {t('PARTICIPANTS.GENERATE_INVITE')}
            </p>
            <div className="space-y-2">
              <input
                type="email"
                value={inviteEmailDraft}
                onChange={(event) => setInviteEmailDraft(event.target.value)}
                maxLength={120}
                placeholder={t('PARTICIPANTS.EMAIL_PLACEHOLDER')}
                disabled={!canAddParticipants || isGeneratingInvite}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <p className="text-xs text-slate-500">
                {t('PARTICIPANTS.INVITE_EMPTY_HELP')}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              {!canAddParticipants ? (
                <p className="text-xs text-slate-500">
                  {t('PARTICIPANTS.PERMISSION_INVITE')}
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
                {isGeneratingInvite
                  ? t('PARTICIPANTS.GENERATING')
                  : t('PARTICIPANTS.GENERATE_LINK')}
              </button>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                <th className="px-3 py-2 font-semibold">
                  {t('PARTICIPANTS.NAME')}
                </th>
                <th className="px-3 py-2 font-semibold">
                  {t('PARTICIPANTS.ROLE')}
                </th>
                <th className="px-3 py-2 font-semibold">
                  {t('PARTICIPANTS.STATUS')}
                </th>
                <th className="px-3 py-2 font-semibold">
                  {t('PARTICIPANTS.LINKED_USER')}
                </th>
                <th className="px-3 py-2 font-semibold">
                  {t('PARTICIPANTS.JOINED')}
                </th>
                {canAddParticipants ? (
                  <th className="px-3 py-2 font-semibold text-right">
                    {t('PARTICIPANTS.ACTIONS')}
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
                  pendingRemovalParticipantId === participant.id &&
                  !removeParticipantError;
                const isRemovingParticipant =
                  removingParticipantId === participant.id;

                return (
                  <tr key={participant.id}>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {participant.displayName}
                      {isCurrentUser ? (
                        <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                          {t('PARTICIPANTS.YOU')}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      {roleLabels[participant.role]}
                    </td>
                    <td className="px-3 py-3">
                      {statusLabels[participant.status]}
                    </td>
                    <td className="px-3 py-3">
                      {participant.userId
                        ? t('PARTICIPANTS.LINKED')
                        : t('PARTICIPANTS.UNLINKED')}
                    </td>
                    <td className="px-3 py-3">
                      {formatGroupDate(participant.joinedAt, locale, {
                        dateStyle: 'medium',
                      })}
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
                                {t('PARTICIPANTS.CANCEL')}
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
                                  ? t('PARTICIPANTS.REMOVING')
                                  : t('PARTICIPANTS.CONFIRM_REMOVE')}
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
                              {t('PARTICIPANTS.REMOVE')}
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
            onClick={handleToggleAddParticipantOpen}
            className="text-sm my-4"
          >
            {isAddParticipantOpen
              ? t('PARTICIPANTS.CLOSE_ADD')
              : t('PARTICIPANTS.ADD_NEW')}
          </Button>
        </div>
        {isAddParticipantOpen ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">
              {t('PARTICIPANTS.ADD_TITLE')}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={newParticipantNameDraft}
                onChange={(event) =>
                  setNewParticipantNameDraft(event.target.value)
                }
                maxLength={80}
                placeholder={t('PARTICIPANTS.NAME_PLACEHOLDER')}
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
                <option value="member">{t('PARTICIPANTS.MEMBER')}</option>
                <option value="viewer">{t('PARTICIPANTS.VIEWER')}</option>
                <option value="admin">{t('PARTICIPANTS.ADMIN')}</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              {!canAddParticipants ? (
                <p className="text-xs text-slate-500">
                  {t('PARTICIPANTS.PERMISSION_ADD')}
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
                {isAddingParticipant
                  ? t('PARTICIPANTS.ADDING')
                  : t('PARTICIPANTS.ADD')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
