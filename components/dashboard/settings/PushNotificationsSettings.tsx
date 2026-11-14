'use client';

import { useEffect, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import {
  disablePushNotifications,
  enablePushNotifications,
  getCurrentPushSubscription,
  getPushSupport,
  type PushSupport,
} from '@/frontend-services/push.service';
import { useTranslations } from 'next-intl';

export default function PushNotificationsSettings() {
  const t = useTranslations('DASHBOARD.SETTINGS.NOTIFICATIONS');
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const current = getPushSupport();
      setSupport(current);

      if (current === 'supported' && Notification.permission === 'granted') {
        try {
          setIsEnabled(Boolean(await getCurrentPushSubscription()));
        } catch {
          setIsEnabled(false);
        }
      }
    }

    void init();
  }, []);

  async function handleToggle() {
    setError(null);
    setIsLoading(true);

    try {
      if (isEnabled) {
        await disablePushNotifications();
        setIsEnabled(false);
        return;
      }

      const result = await enablePushNotifications();

      if (result.ok) {
        setIsEnabled(true);
      } else if (result.reason === 'permission-denied') {
        setError(t('PERMISSION_DENIED'));
      } else {
        setError(t('ENABLE_ERROR'));
      }
    } catch {
      setError(t('UPDATE_ERROR'));
    } finally {
      setIsLoading(false);
    }
  }

  if (!support) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{t('TITLE')}</h2>
      <p className="mt-2 text-sm text-gray-600">{t('DESCRIPTION')}</p>

      <div className="mt-5 space-y-4">
        {support === 'ios-needs-install' && (
          <Alert variant="info" title={t('INSTALL_TITLE')}>
            {t('INSTALL_INSTRUCTIONS')}
          </Alert>
        )}

        {support === 'unsupported' && (
          <Alert variant="warning" title={t('UNSUPPORTED_TITLE')}>
            {t('UNSUPPORTED_DESCRIPTION')}
          </Alert>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        {support === 'supported' && (
          <Button
            variant={isEnabled ? 'secondary' : 'primary'}
            loading={isLoading}
            onClick={handleToggle}
          >
            {isEnabled ? t('DISABLE') : t('ENABLE')}
          </Button>
        )}
      </div>
    </section>
  );
}
