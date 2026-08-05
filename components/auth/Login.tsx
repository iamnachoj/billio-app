'use client';

import Link from 'next/link';

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
            Track shared expenses, split bills fairly and settle debts
            effortlessly.
          </p>
        </div>

        <div className="space-y-6">
          <Feature text="Unlimited groups" />
          <Feature text="Automatic balances" />
          <Feature text="Smart settlements" />
          <Feature text="Privacy first" />
        </div>
      </section>

      <section className="flex items-center justify-center bg-gray-50 px-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-800">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>

          <p className="mt-2 text-gray-500">
            {mode === 'login'
              ? 'Sign in to continue.'
              : 'Join Billio for free.'}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <Input
                placeholder="Full name"
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {mode === 'register' && (
              <>
                <Input
                  type="password"
                  placeholder="Repeat password"
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
                    I accept the{' '}
                    <Link
                      href="/privacy"
                      className="text-teal-600 hover:underline"
                    >
                      Terms of Service
                    </Link>{' '}
                    and Privacy Policy.
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
                  Forgot password?
                </Link>
              </div>
            )}

            <Button loading={loading} fullWidth>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            {mode === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}{' '}
            <Button type="button" variant="secondary" onClick={toggleMode}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
