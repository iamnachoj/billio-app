'use client';

import { FormEvent, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { login, register } from '@/frontend-services/auth.service';
import { useApiError } from '@/i18n/errors';
import { useRouter } from '@/i18n/navigation';
import { safeNextPath } from '@/components/auth/safeNextPath';
import type { AppLocale } from '@/lib/locale';

type AlertState = {
  variant: 'success' | 'error';
  title: string;
  message: string;
};

export function useLogin(
  initialMode: 'login' | 'register',
  redirectTo?: string
) {
  const router = useRouter();
  const t = useTranslations('AUTH');
  const apiError = useApiError();
  const locale = useLocale() as AppLocale;

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [acceptTerms, setAcceptTerms] = useState(false);

  const [alert, setAlert] = useState<AlertState | null>(null);

  function toggleMode() {
    setAlert(null);

    setMode((current) => (current === 'login' ? 'register' : 'login'));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setAlert(null);

    if (mode === 'register') {
      if (name.length === 0 || name.length > 30) {
        return setAlert({
          variant: 'error',
          title: t('LOGIN.INVALID_NAME_TITLE'),
          message: t('LOGIN.INVALID_NAME_MESSAGE'),
        });
      }

      if (password !== confirmPassword) {
        return setAlert({
          variant: 'error',
          title: t('LOGIN.MISMATCH_TITLE'),
          message: t('LOGIN.MISMATCH_MESSAGE'),
        });
      }

      if (!acceptTerms) {
        return setAlert({
          variant: 'error',
          title: t('LOGIN.TERMS_TITLE'),
          message: t('LOGIN.TERMS_MESSAGE'),
        });
      }
    }

    try {
      setLoading(true);

      const response =
        mode === 'login'
          ? await login(email, password, locale)
          : await register({
              name,
              email,
              password,
              locale,
            });

      if (!response.success) {
        setAlert({
          variant: 'error',
          title: t('LOGIN.FAILURE_TITLE'),
          message: apiError(response.error),
        });

        return;
      }

      if (mode === 'register') {
        const loginResponse = await login(email, password, locale);

        if (!loginResponse.success) {
          setAlert({
            variant: 'error',
            title: t('LOGIN.ACCOUNT_CREATED_TITLE'),
            message: loginResponse.error
              ? apiError(loginResponse.error)
              : t('LOGIN.AUTO_LOGIN_FAILED'),
          });

          return;
        }
      }

      const next = safeNextPath(redirectTo);
      router.push(next.href, next.locale ? { locale: next.locale } : undefined);
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
    mode,
    loading,
    name,
    email,
    password,
    confirmPassword,
    acceptTerms,
    alert,

    setName,
    setEmail,
    setPassword,
    setConfirmPassword,
    setAcceptTerms,

    toggleMode,
    handleSubmit,
  };
}
