import ResetPassword from '@/components/auth/ResetPassword';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <ResetPassword token={token ?? null} />;
}
