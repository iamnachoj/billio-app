'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { login, register } from '@/frontend-services/auth.service';

type AlertState = {
  variant: 'success' | 'error';
  title: string;
  message: string;
};

export function useLogin(initialMode: 'login' | 'register') {
  const router = useRouter();

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
          title: 'Invalid name',
          message: 'Name must contain between 1 and 30 characters.',
        });
      }

      if (password !== confirmPassword) {
        return setAlert({
          variant: 'error',
          title: 'Passwords',
          message: 'Passwords do not match.',
        });
      }

      if (!acceptTerms) {
        return setAlert({
          variant: 'error',
          title: 'Terms of Service',
          message: 'You must accept the Terms of Service.',
        });
      }
    }

    try {
      setLoading(true);

      const response =
        mode === 'login'
          ? await login(email, password)
          : await register({
              name,
              email,
              password,
            });

      if (!response.success) {
        setAlert({
          variant: 'error',
          title: 'Authentication failed',
          message: response.error.message,
        });

        return;
      }

      router.push('/dashboard');
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
