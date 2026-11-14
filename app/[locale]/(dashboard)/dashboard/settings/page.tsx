import PushNotificationsSettings from '@/components/dashboard/settings/PushNotificationsSettings';
import UserAccountSettings from '@/components/dashboard/settings/UserAccountSettings';
import { getCurrentUser } from '@/lib/services/authService';
import { getTranslations } from 'next-intl/server';

export default async function SettingsPage() {
  const t = await getTranslations('PAGES.SETTINGS');
  const user = await getCurrentUser();

  if (!user) {
    return null;
    // later redirect('/login')
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">{t('TITLE')}</h1>
      <p className="text-white">{t('DESCRIPTION')}</p>

      <UserAccountSettings
        initialUser={{
          id: user.id,
          name: user.name,
          email: user.email,
        }}
      />

      <PushNotificationsSettings />
    </div>
  );
}
