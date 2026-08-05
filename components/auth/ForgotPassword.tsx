'use client';

import Link from 'next/link';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

import { useForgotPassword } from '@/components/auth/hooks/useForgotPassword';

export default function ForgotPassword() {
  const { email, loading, message, error, setEmail, handleSubmit } =
    useForgotPassword();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-gray-100 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800">
          Forgot your password?
        </h1>

        <p className="mt-3 text-gray-500">
          Enter your email address and we'll send you instructions to reset your
          password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            label="Email"
            type="email"
            name="email"
            required
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {message && (
            <Alert variant="success" title="Email sent">
              {message}
            </Alert>
          )}

          {error && (
            <Alert variant="error" title="Unable to send email">
              {error}
            </Alert>
          )}

          <Button loading={loading} type="submit" fullWidth>
            Send reset link
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Remember your password?{' '}
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
