'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { resetPassword } from '@/frontend-services/auth.service';

type AlertState = {
  variant: 'success' | 'error';
  title: string;
  message: string;
};

export function useResetPassword() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const token = searchParams.get('token') ?? '';

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
        title: 'Invalid link',
        message: 'The password reset link is invalid or missing.',
      });
    }

    if (password.length < 6) {
      return setAlert({
        variant: 'error',
        title: 'Weak password',
        message: 'Password must contain at least 6 characters.',
      });
    }

    if (password !== confirmPassword) {
      return setAlert({
        variant: 'error',
        title: 'Passwords do not match',
        message: 'Please make sure both passwords are identical.',
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
          title: 'Unable to reset password',
          message: response.error.message,
        });
      }

      setAlert({
        variant: 'success',
        title: 'Password updated',
        message:
          'Your password has been updated successfully. Redirecting to login...',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch {
      setAlert({
        variant: 'error',
        title: 'Unexpected error',
        message: 'Something went wrong. Please try again.',
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
