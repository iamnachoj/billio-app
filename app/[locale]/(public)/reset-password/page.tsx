import ResetPassword from '@/components/auth/ResetPassword';
import { publicAlternates } from '@/i18n/metadata';

export const metadata = {
  alternates: publicAlternates('/reset-password'),
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <ResetPassword token={token ?? null} />;
}
