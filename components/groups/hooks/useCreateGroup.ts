'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

import { createGroup } from '@/frontend-services/groups.service';
import { useApiError } from '@/i18n/errors';

export function useCreateGroup(onSuccess?: () => void) {
  const t = useTranslations('GROUPS');
  const apiError = useApiError();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError('');

    if (!name.trim()) {
      setError(t('ERRORS.GROUP_NAME_REQUIRED'));
      return;
    }

    try {
      setLoading(true);

      const response = await createGroup({
        name,
        description,
      });

      if (!response.success) {
        setError(apiError(response.error));
        return;
      }

      onSuccess?.();

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return {
    name,
    description,
    loading,
    error,

    setName,
    setDescription,

    handleSubmit,
  };
}
