'use client';

import Link from 'next/link';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

import { useResetPassword } from './hooks/useResetPassword';

export default function ResetPassword({ token }: { token: string | null }) {
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
        <h1 className="text-3xl font-bold text-gray-800">
          Create a new password
        </h1>

        <p className="mt-3 text-gray-500">
          Your new password must be different from the previous one.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            placeholder="Enter your new password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            placeholder="Repeat your new password"
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
            Reset password
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Remembered your password?{' '}
          <Link
            href="/login"
            className="font-medium text-teal-600 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
