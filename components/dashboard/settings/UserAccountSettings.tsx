'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';

import { logout } from '@/frontend-services/auth.service';
import { deleteMe, updateMe } from '@/frontend-services/me.service';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useApiError } from '@/i18n/errors';
import { Link, useRouter } from '@/i18n/navigation';
import type { AppLocale } from '@/lib/locale';

type UserAccountSettingsProps = {
  initialUser: {
    id: string;
    name: string;
    email: string;
  };
};

type AlertState = {
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
};

export default function UserAccountSettings({
  initialUser,
}: UserAccountSettingsProps) {
  const t = useTranslations('DASHBOARD.SETTINGS.ACCOUNT');
  const language = useTranslations('DASHBOARD.SETTINGS.LANGUAGE');
  const apiError = useApiError();
  const format = useFormatter();
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const confirmationWord = t('DELETE_CONFIRMATION_WORD');

  const [savedProfile, setSavedProfile] = useState({
    name: initialUser.name,
    email: initialUser.email,
  });
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [alert, setAlert] = useState<AlertState | null>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  const hasChanges = useMemo(() => {
    return (
      trimmedName !== savedProfile.name || trimmedEmail !== savedProfile.email
    );
  }, [savedProfile.email, savedProfile.name, trimmedEmail, trimmedName]);

  function resetDraft() {
    setName(savedProfile.name);
    setEmail(savedProfile.email);
    setPassword('');
    setAlert(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlert(null);

    if (!trimmedName || trimmedName.length > 30) {
      setAlert({
        variant: 'error',
        title: t('ALERTS.INVALID_NAME_TITLE'),
        message: t('ALERTS.NAME_LENGTH', {
          min: format.number(1),
          max: format.number(30),
        }),
      });
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setAlert({
        variant: 'error',
        title: t('ALERTS.INVALID_EMAIL_TITLE'),
        message: trimmedEmail
          ? t('ALERTS.EMAIL_INVALID')
          : t('ALERTS.EMAIL_REQUIRED'),
      });
      return;
    }

    if (!hasChanges) {
      setAlert({
        variant: 'info',
        title: t('ALERTS.NO_CHANGES_TITLE'),
        message: t('ALERTS.NO_CHANGES'),
      });
      return;
    }

    if (!password) {
      setAlert({
        variant: 'error',
        title: t('ALERTS.PASSWORD_REQUIRED_TITLE'),
        message: t('ALERTS.PASSWORD_REQUIRED'),
      });
      return;
    }

    try {
      setIsSaving(true);

      const response = await updateMe({
        name: trimmedName,
        email: trimmedEmail,
        password,
        locale,
      });

      if (!response.success) {
        setAlert({
          variant: 'error',
          title: t('ALERTS.UPDATE_FAILED_TITLE'),
          message: apiError(response.error),
        });
        return;
      }

      setSavedProfile({
        name: response.data.name,
        email: response.data.email,
      });
      setName(response.data.name);
      setEmail(response.data.email);

      setPassword('');
      setAlert({
        variant: 'success',
        title: t('ALERTS.PROFILE_UPDATED_TITLE'),
        message: t('ALERTS.PROFILE_UPDATED'),
      });

      router.refresh();
    } catch {
      setAlert({
        variant: 'error',
        title: t('ALERTS.UNEXPECTED_TITLE'),
        message: t('ALERTS.UNEXPECTED'),
      });
    } finally {
      setIsSaving(false);
    }
  }

  function openDeleteModal() {
    setDeleteConfirmation('');
    setAlert(null);
    setIsDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
    setDeleteConfirmation('');
  }

  async function handleDeleteAccount() {
    setAlert(null);

    if (deleteConfirmation !== confirmationWord) {
      setAlert({
        variant: 'warning',
        title: t('ALERTS.CONFIRMATION_REQUIRED_TITLE'),
        message: t('ALERTS.CONFIRMATION_REQUIRED', {
          confirmation: confirmationWord,
        }),
      });
      return;
    }

    try {
      setIsDeleting(true);

      const response = await deleteMe();

      if (!response.success) {
        setAlert({
          variant: 'error',
          title: t('ALERTS.DELETE_FAILED_TITLE'),
          message: apiError(response.error),
        });
        return;
      }

      await logout().catch(() => null);

      router.replace('/login');
      router.refresh();
    } catch {
      setAlert({
        variant: 'error',
        title: t('ALERTS.UNEXPECTED_TITLE'),
        message: t('ALERTS.UNEXPECTED'),
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{t('TITLE')}</h2>
      <p className="mt-2 text-sm text-gray-600">{t('DESCRIPTION')}</p>

      <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
        <p>
          <span className="font-medium">{t('USER_ID')}:</span> {initialUser.id}
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          label={t('NAME')}
          autoComplete="name"
          required
          maxLength={30}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSaving || isDeleting}
        />

        <Input
          type="email"
          label={t('EMAIL')}
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSaving || isDeleting}
        />

        <Input
          type="password"
          label={t('CURRENT_PASSWORD')}
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t('PASSWORD_PLACEHOLDER')}
          disabled={isSaving || isDeleting}
        />

        {alert ? (
          <Alert variant={alert.variant} title={alert.title}>
            {alert.message}
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" loading={isSaving}>
            {t('SAVE')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={resetDraft}
            disabled={isSaving || isDeleting}
          >
            {t('RESET')}
          </Button>
        </div>
      </form>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-base font-semibold text-gray-900">
          {language('TITLE')}
        </h3>
        <div className="mt-5">
          <LanguageSwitcher authenticated />
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-base font-semibold text-red-600">
          {t('DANGER_TITLE')}
        </h3>
        <p className="mt-2 text-sm text-gray-600">{t('DELETE_DESCRIPTION')}</p>

        <div className="mt-4">
          <Button
            type="button"
            variant="danger"
            onClick={openDeleteModal}
            disabled={isSaving || isDeleting}
          >
            {t('DELETE')}
          </Button>
        </div>
      </div>

      <div className="mt-6 pt-6 space-x-4 border-t border-gray-200">
        <Link
          href="/terms-and-conditions"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:underline"
        >
          {t('TERMS')}
        </Link>
        <span className="text-gray-500">|</span>
        <Link
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:underline"
        >
          {t('PRIVACY')}
        </Link>
      </div>

      <Modal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title={t('DELETE_TITLE')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {t('DELETE_WARNING', { confirmation: confirmationWord })}
          </p>

          <Input
            label={t('DELETE_CONFIRMATION_LABEL')}
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder={t('DELETE_PLACEHOLDER', {
              confirmation: confirmationWord,
            })}
            disabled={isDeleting}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={closeDeleteModal}
              disabled={isDeleting}
            >
              {t('CANCEL')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteAccount}
              loading={isDeleting}
              disabled={deleteConfirmation !== 'DELETE'}
            >
              {t('DELETE_PERMANENTLY')}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
