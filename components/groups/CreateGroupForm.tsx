'use client';

import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

import { useCreateGroup } from './hooks/useCreateGroup';

type Props = {
  onSuccess?: () => void;
};

export default function CreateGroupForm({ onSuccess }: Props) {
  const t = useTranslations('GROUPS');
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
        label={t('CREATE_GROUP.NAME_LABEL')}
        placeholder={t('CREATE_GROUP.NAME_PLACEHOLDER')}
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        label={t('CREATE_GROUP.DESCRIPTION_LABEL')}
        placeholder={t('CREATE_GROUP.DESCRIPTION_PLACEHOLDER')}
        value={description}
        maxLength={200}
        onChange={(e) => setDescription(e.target.value)}
      />

      {error && (
        <Alert variant="error" title={t('CREATE_GROUP.ERROR_TITLE')}>
          {error}
        </Alert>
      )}

      <Button type="submit" loading={loading} fullWidth>
        {t('CREATE_GROUP.SUBMIT')}
      </Button>
    </form>
  );
}
