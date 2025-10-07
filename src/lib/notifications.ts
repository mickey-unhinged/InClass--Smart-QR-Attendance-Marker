export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Internal helper to verify notification capability and get a ready registration
const canNotify = async (): Promise<{
  ok: boolean;
  reason?: string;
  registration?: ServiceWorkerRegistration;
}> => {
  if (!('Notification' in window)) return { ok: false, reason: 'no_notification_api' };
  if (Notification.permission !== 'granted') return { ok: false, reason: 'permission_not_granted' };
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'no_service_worker' };

  try {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('sw_timeout')), 3000)),
    ]);
    if (typeof registration.showNotification !== 'function') {
      return { ok: false, reason: 'showNotification_missing' };
    }
    return { ok: true, registration };
  } catch (e) {
    return { ok: false, reason: 'sw_not_ready' };
  }
};

export const sendNotification = async (title: string, options?: NotificationOptions) => {
  const capability = await canNotify();
  if (!capability.ok || !capability.registration) {
    console.warn('Cannot send notification:', capability.reason);
    return;
  }

  try {
    await capability.registration.showNotification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  } catch (error) {
    console.warn('showNotification failed:', error);
  }
};

export const notifySessionActive = (className: string, duration: number) => {
  sendNotification('Attendance Session Active', {
    body: `${className} - Session expires in ${duration} minutes`,
    tag: 'session-active',
    requireInteraction: true,
  });
};
