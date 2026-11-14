'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

import { useForgotPassword } from '@/components/auth/hooks/useForgotPassword';

export default function ForgotPassword() {
  const t = useTranslations('AUTH');
  const { email, loading, message, error, setEmail, handleSubmit } =
    useForgotPassword();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-gray-100 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800">
          {t('FORGOT.TITLE')}
        </h1>

        <p className="mt-3 text-gray-500">{t('FORGOT.DESCRIPTION')}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            label={t('EMAIL')}
            type="email"
            name="email"
            required
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {message && (
            <Alert variant="success" title={t('FORGOT.SUCCESS_TITLE')}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert variant="error" title={t('FORGOT.FAILURE_TITLE')}>
              {error}
            </Alert>
          )}

          <Button loading={loading} type="submit" fullWidth>
            {t('FORGOT.SUBMIT')}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {t('FORGOT.REMEMBER')}{' '}
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
