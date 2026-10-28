export const notificationsSupported = (): boolean => 'Notification' in window && 'serviceWorker' in navigator;

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Shows a system notification through the service worker (the only way that works on Android). */
export async function showNotification(title: string, body: string, tag: string): Promise<boolean> {
  try {
    if (!notificationsSupported() || Notification.permission !== 'granted') return false;
    const reg = await navigator.serviceWorker.ready;
    const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
    await reg.showNotification(title, { body, tag, icon, badge: icon });
    return true;
  } catch {
    return false;
  }
}
