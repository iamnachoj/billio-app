'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createGroup } from '@/frontend-services/groups.service';

export function useCreateGroup(onSuccess?: () => void) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError('');

    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }

    try {
      setLoading(true);

      const response = await createGroup({
        name,
        description,
      });

      if (!response.success) {
        setError(response.error.message);
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
