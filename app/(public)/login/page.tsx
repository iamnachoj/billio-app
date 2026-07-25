'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { login, register } from '@/frontend-services/auth.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = useMemo(
    () => (searchParams.get('register') === 'true' ? 'register' : 'login'),
    [searchParams]
  );

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError('');

    if (mode === 'register') {
      if (name.length === 0 || name.length > 30) {
        return setError('Name must contain between 1 and 30 characters.');
      }

      if (password !== confirmPassword) {
        return setError('Passwords do not match.');
      }

      if (!acceptTerms) {
        return setError('You must accept the Terms of Service.');
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
        setError(response.error.message);
        return;
      }

      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left side */}
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

      {/* Right side */}

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

            {error && (
              <Alert variant="error" title="Error">
                {error}
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

            <Button disabled={loading} loading={loading}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            {mode === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}{' '}
            <Button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              variant="secondary"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-lg">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
        ✓
      </div>

      <span>{text}</span>
    </div>
  );
}
