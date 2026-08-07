import UserAccountSettings from '@/components/dashboard/settings/UserAccountSettings';
import { getCurrentUser } from '@/lib/services/authService';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
    // later redirect('/login')
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-white">
        Manage your account settings and preferences.
      </p>

      <UserAccountSettings
        initialUser={{
          id: user.id,
          name: user.name,
          email: user.email,
        }}
      />
    </div>
  );
}
