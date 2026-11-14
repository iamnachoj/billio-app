'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

import Feature from './Feature';
import { useLogin } from './hooks/useLogin';

type Props = {
  initialMode: 'login' | 'register';
  redirectTo?: string;
};

export default function Login({ initialMode, redirectTo }: Props) {
  const t = useTranslations('AUTH');
  const {
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
  } = useLogin(initialMode, redirectTo);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-gradient-to-br from-teal-500 to-teal-700 p-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <h1 className="text-5xl font-bold">Billio</h1>

          <p className="mt-6 max-w-md text-xl leading-9 text-teal-50">
            {t('LOGIN.TAGLINE')}
          </p>
        </div>

        <div className="space-y-6">
          <Feature text={t('LOGIN.FEATURE_GROUPS')} />
          <Feature text={t('LOGIN.FEATURE_BALANCES')} />
          <Feature text={t('LOGIN.FEATURE_SETTLEMENTS')} />
          <Feature text={t('LOGIN.FEATURE_PRIVACY')} />
        </div>
      </section>

      <section className="flex items-center justify-center bg-gray-50 px-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-800">
            {mode === 'login' ? t('LOGIN.WELCOME') : t('LOGIN.CREATE_TITLE')}
          </h2>

          <p className="mt-2 text-gray-500">
            {mode === 'login'
              ? t('LOGIN.SIGN_IN_DESCRIPTION')
              : t('LOGIN.REGISTER_DESCRIPTION')}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <Input
                placeholder={t('LOGIN.NAME')}
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <Input
              type="email"
              placeholder={t('EMAIL')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              type="password"
              placeholder={t('LOGIN.PASSWORD')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {mode === 'register' && (
              <>
                <Input
                  type="password"
                  placeholder={t('LOGIN.REPEAT_PASSWORD')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <label className="flex items-start gap-3 text-sm text-gray-600">
                  <Input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />

                  <span>
                    {t.rich('LOGIN.ACCEPT_TERMS', {
                      terms: (chunks) => (
                        <Link
                          href="/terms-and-conditions"
                          target="_blank"
                          className="text-teal-600 hover:underline"
                        >
                          {chunks}
                        </Link>
                      ),
                      privacy: (chunks) => (
                        <Link
                          href="/privacy-policy"
                          target="_blank"
                          className="text-teal-600 hover:underline"
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </span>
                </label>
              </>
            )}

            {alert && (
              <Alert variant={alert.variant} title={alert.title}>
                {alert.message}
              </Alert>
            )}

            {mode === 'login' && (
              <div className="text-right text-sm">
                <Link
                  href="/forgot-password"
                  className="text-teal-600 hover:underline"
                >
                  {t('LOGIN.FORGOT_PASSWORD')}
                </Link>
              </div>
            )}

            <Button loading={loading} fullWidth>
              {mode === 'login' ? t('SIGN_IN') : t('LOGIN.CREATE_ACCOUNT')}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            {mode === 'login' ? t('LOGIN.NO_ACCOUNT') : t('LOGIN.HAVE_ACCOUNT')}{' '}
            <Button type="button" variant="secondary" onClick={toggleMode}>
              {mode === 'login' ? t('LOGIN.REGISTER') : t('SIGN_IN')}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
