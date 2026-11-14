import Login from '@/components/auth/Login';
import { publicAlternates } from '@/i18n/metadata';

export const metadata = { alternates: publicAlternates('/login') };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ register?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <Login
      initialMode={params.register === 'true' ? 'register' : 'login'}
      redirectTo={params.next}
    />
  );
}
