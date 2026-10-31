export type PushSupport =
  | 'supported'
  | 'unsupported'
  | 'ios-needs-install';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));

  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export function getPushSupport(): PushSupport {
  if (typeof window === 'undefined') {
    return 'unsupported';
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (isIos && !isStandalone) {
    return 'ios-needs-install';
  }

  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return 'unsupported';
  }

  return 'supported';
}

async function getRegistration() {
  await navigator.serviceWorker.register('/sw.js');

  return navigator.serviceWorker.ready;
}

export async function getCurrentPushSubscription() {
  const registration = await getRegistration();

  return registration.pushManager.getSubscription();
}

export async function enablePushNotifications() {
  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    return { ok: false as const, reason: 'permission-denied' as const };
  }

  const registration = await getRegistration();
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    }));

  const response = await fetch('/api/me/push-subscription', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!response.ok) {
    return { ok: false as const, reason: 'server-error' as const };
  }

  return { ok: true as const };
}

export async function disablePushNotifications() {
  const subscription = await getCurrentPushSubscription();

  if (!subscription) {
    return;
  }

  await fetch('/api/me/push-subscription', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}
