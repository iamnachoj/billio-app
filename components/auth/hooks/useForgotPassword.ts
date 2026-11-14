'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';

import { requestPasswordReset } from '@/frontend-services/auth.service';
import { useApiError } from '@/i18n/errors';

export function useForgotPassword() {
  const t = useTranslations('AUTH');
  const apiError = useApiError();
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');

  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage('');
    setError('');

    try {
      setLoading(true);

      const response = await requestPasswordReset(email);

      if (!response.success) {
        setError(apiError(response.error));
        return;
      }

      setMessage(t('FORGOT.SUCCESS_MESSAGE'));
    } catch {
      setError(t('ERRORS.UNEXPECTED_MESSAGE'));
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    loading,
    message,
    error,
    setEmail,
    handleSubmit,
  };
}
