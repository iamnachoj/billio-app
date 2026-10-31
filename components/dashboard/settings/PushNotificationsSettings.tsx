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

export default function PushNotificationsSettings() {
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
        setError(
          'Notifications are blocked. Allow them for Billio in your device settings and try again.'
        );
      } else {
        setError('Could not enable notifications. Please try again.');
      }
    } catch {
      setError('Could not update notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!support) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
      <p className="mt-2 text-sm text-gray-600">
        Get notified on this device when someone adds a new expense to one of
        your groups.
      </p>

      <div className="mt-5 space-y-4">
        {support === 'ios-needs-install' && (
          <Alert variant="info" title="Install Billio first">
            On iPhone and iPad, tap Share and choose “Add to Home Screen”, then
            open Billio from your Home Screen to enable notifications.
          </Alert>
        )}

        {support === 'unsupported' && (
          <Alert variant="warning" title="Not supported">
            This browser does not support push notifications.
          </Alert>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        {support === 'supported' && (
          <Button
            variant={isEnabled ? 'secondary' : 'primary'}
            loading={isLoading}
            onClick={handleToggle}
          >
            {isEnabled ? 'Disable notifications' : 'Enable notifications'}
          </Button>
        )}
      </div>
    </section>
  );
}
