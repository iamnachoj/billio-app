'use client';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

import { useCreateGroup } from './hooks/useCreateGroup';

type Props = {
  onSuccess?: () => void;
};

export default function CreateGroupForm({ onSuccess }: Props) {
  const {
    name,
    description,
    loading,
    error,
    setName,
    setDescription,
    handleSubmit,
  } = useCreateGroup(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Group name"
        placeholder="Summer Holidays"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        label="Description"
        placeholder="Optional description..."
        value={description}
        maxLength={200}
        onChange={(e) => setDescription(e.target.value)}
      />

      {error && (
        <Alert variant="error" title="Unable to create group">
          {error}
        </Alert>
      )}

      <Button type="submit" loading={loading} fullWidth>
        Create group
      </Button>
    </form>
  );
}
