'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';

import { resetPassword } from '@/frontend-services/auth.service';
import { useApiError } from '@/i18n/errors';
import { useRouter } from '@/i18n/navigation';

type AlertState = {
  variant: 'success' | 'error';
  title: string;
  message: string;
};

export function useResetPassword(token: string | null) {
  const router = useRouter();
  const t = useTranslations('AUTH');
  const apiError = useApiError();

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<AlertState | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setAlert(null);

    if (!token) {
      return setAlert({
        variant: 'error',
        title: t('RESET.INVALID_LINK_TITLE'),
        message: t('RESET.INVALID_LINK_MESSAGE'),
      });
    }

    if (password.length < 6) {
      return setAlert({
        variant: 'error',
        title: t('RESET.WEAK_PASSWORD_TITLE'),
        message: t('RESET.WEAK_PASSWORD_MESSAGE'),
      });
    }

    if (password !== confirmPassword) {
      return setAlert({
        variant: 'error',
        title: t('RESET.MISMATCH_TITLE'),
        message: t('RESET.MISMATCH_MESSAGE'),
      });
    }

    try {
      setLoading(true);

      const response = await resetPassword({
        token,
        password,
      });

      if (!response.success) {
        return setAlert({
          variant: 'error',
          title: t('RESET.FAILURE_TITLE'),
          message: apiError(response.error),
        });
      }

      setAlert({
        variant: 'success',
        title: t('RESET.SUCCESS_TITLE'),
        message: t('RESET.SUCCESS_MESSAGE'),
      });

      setTimeout(() => {
        router.push('/login');
      }, 2500);
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

  return {
    password,
    confirmPassword,
    loading,
    alert,

    setPassword,
    setConfirmPassword,

    handleSubmit,
  };
}
