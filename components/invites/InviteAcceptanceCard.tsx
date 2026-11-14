'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import {
  acceptInvite,
  type InvitePreview,
} from '@/frontend-services/invites.service';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useApiError } from '@/i18n/errors';
import { Link, useRouter } from '@/i18n/navigation';

type InviteAcceptanceCardProps = {
  token: string;
  preview: InvitePreview;
  currentUser: {
    id: string;
    name: string;
    email: string;
  } | null;
};

function formatDate(value: string | Date, locale: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function InviteAcceptanceCard({
  token,
  preview,
  currentUser,
}: InviteAcceptanceCardProps) {
  const router = useRouter();
  const t = useTranslations('INVITES');
  const locale = useLocale();
  const apiError = useApiError();

  const defaultMode =
    preview.claimableParticipants.length > 0 ? 'claim' : 'create';
  const [mode, setMode] = useState<'claim' | 'create'>(defaultMode);
  const [selectedParticipantId, setSelectedParticipantId] = useState(
    preview.claimableParticipants[0]?.id ?? ''
  );
  const [displayName, setDisplayName] = useState(currentUser?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    variant: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const nextPath = `/invites/${token}`;
  const signInHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const registerHref = `/login?register=true&next=${encodeURIComponent(nextPath)}`;

  const emailMismatch =
    !!preview.invite.email &&
    !!currentUser?.email &&
    preview.invite.email.toLowerCase() !== currentUser.email.toLowerCase();

  async function handleAccept() {
    if (!currentUser) {
      return;
    }

    setAlert(null);

    if (emailMismatch) {
      setAlert({
        variant: 'error',
        title: t('ERRORS.EMAIL_MISMATCH_TITLE'),
        message: t('ERRORS.EMAIL_MISMATCH_MESSAGE', {
          email: preview.invite.email ?? '',
        }),
      });
      return;
    }

    if (mode === 'claim' && !selectedParticipantId) {
      setAlert({
        variant: 'error',
        title: t('ERRORS.CHOOSE_PARTICIPANT_TITLE'),
        message: t('ERRORS.CHOOSE_PARTICIPANT_MESSAGE'),
      });
      return;
    }

    if (mode === 'create' && !displayName.trim()) {
      setAlert({
        variant: 'error',
        title: t('ERRORS.NAME_REQUIRED_TITLE'),
        message: t('ERRORS.NAME_REQUIRED_MESSAGE'),
      });
      return;
    }

    try {
      setLoading(true);

      const response = await acceptInvite(
        token,
        mode === 'claim'
          ? { participantId: selectedParticipantId }
          : { displayName: displayName.trim() }
      );

      if (!response.success) {
        setAlert({
          variant: 'error',
          title: t('ERRORS.JOIN_TITLE'),
          message: apiError(response.error),
        });
        return;
      }

      router.push(`/dashboard/groups/${preview.group.id}`);
      router.refresh();
    } catch {
      setAlert({
        variant: 'error',
        title: t('ERRORS.UNEXPECTED_TITLE'),
        message: t('ERRORS.UNEXPECTED_MESSAGE'),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center px-6 py-12">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-700">
            {t('GROUP_INVITE')}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {t('JOIN_NAMED_GROUP', { name: preview.group.name })}
          </h1>
          <p className="text-sm text-slate-600">
            {preview.group.description?.trim() || t('DEFAULT_DESCRIPTION')}
          </p>
          <p className="text-xs text-slate-500">
            {t('VALID_UNTIL', {
              date: formatDate(preview.invite.expiresAt, locale),
            })}
          </p>
          {preview.invite.email ? (
            <p className="text-sm text-slate-600">
              {t.rich('LOCKED_TO', {
                email: preview.invite.email,
                strong: (chunks) => (
                  <span className="font-medium text-slate-900">{chunks}</span>
                ),
              })}
            </p>
          ) : (
            <p className="text-sm text-slate-600">{t('REUSABLE')}</p>
          )}
        </div>

        <div className="mt-8 space-y-5">
          {!currentUser ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                {t('SIGN_IN_DESCRIPTION')}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={signInHref}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-teal-500 px-4 py-3 font-semibold text-white transition-colors duration-200 hover:bg-teal-600"
                >
                  {t('SIGN_IN')}
                </Link>
                <Link
                  href={registerHref}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-800 transition-colors duration-200 hover:bg-gray-100"
                >
                  {t('CREATE_ACCOUNT')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {t.rich('ACCEPTING_AS', {
                  email: currentUser.email,
                  strong: (chunks) => (
                    <span className="font-medium text-slate-900">{chunks}</span>
                  ),
                })}
              </div>

              {preview.claimableParticipants.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('claim')}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        mode === 'claim'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t('CLAIM_PARTICIPANT')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('create')}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        mode === 'create'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t('CREATE_PARTICIPANT')}
                    </button>
                  </div>

                  {mode === 'claim' ? (
                    <div className="space-y-2">
                      {preview.claimableParticipants.map((participant) => (
                        <label
                          key={participant.id}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                        >
                          <input
                            type="radio"
                            name="claimable-participant"
                            checked={selectedParticipantId === participant.id}
                            onChange={() =>
                              setSelectedParticipantId(participant.id)
                            }
                          />
                          <span className="space-y-1 text-sm text-slate-700">
                            <span className="block font-medium text-slate-900">
                              {participant.displayName}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {t(
                                `ROLES.${participant.role.toUpperCase() as Uppercase<typeof participant.role>}`
                              )}{' '}
                              |{' '}
                              {t(
                                `STATUSES.${participant.status.toUpperCase() as Uppercase<typeof participant.status>}`
                              )}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {mode === 'create' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {t('DISPLAY_NAME')}
                  </label>
                  <Input
                    value={displayName}
                    maxLength={80}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder={t('DISPLAY_NAME_PLACEHOLDER')}
                  />
                </div>
              ) : null}

              {alert ? (
                <Alert variant={alert.variant} title={alert.title}>
                  {alert.message}
                </Alert>
              ) : null}

              <div className="flex justify-end">
                <Button onClick={handleAccept} loading={loading}>
                  {t('JOIN_GROUP')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
