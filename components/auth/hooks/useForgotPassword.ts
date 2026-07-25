'use client';

import { FormEvent, useState } from 'react';

import { requestPasswordReset } from '@/frontend-services/auth.service';

export function useForgotPassword() {
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
        setError(response.error.message);
        return;
      }

      setMessage(
        'If an account with that email exists, we have sent password reset instructions.'
      );
    } catch {
      setError('Something went wrong. Please try again.');
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
