'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

import { useResetPassword } from './hooks/useResetPassword';

export default function ResetPassword({ token }: { token: string | null }) {
  const t = useTranslations('AUTH');
  const {
    password,
    confirmPassword,
    loading,
    alert,
    setPassword,
    setConfirmPassword,
    handleSubmit,
  } = useResetPassword(token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-gray-100 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800">{t('RESET.TITLE')}</h1>

        <p className="mt-3 text-gray-500">{t('RESET.DESCRIPTION')}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            placeholder={t('RESET.PASSWORD')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            placeholder={t('RESET.REPEAT_PASSWORD')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {alert && (
            <Alert variant={alert.variant} title={alert.title}>
              {alert.message}
            </Alert>
          )}

          <Button loading={loading} fullWidth>
            {t('RESET.SUBMIT')}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {t('RESET.REMEMBER')}{' '}
          <Link
            href="/login"
            className="font-medium text-teal-600 hover:underline"
          >
            {t('SIGN_IN')}
          </Link>
        </div>
      </div>
    </main>
  );
}
