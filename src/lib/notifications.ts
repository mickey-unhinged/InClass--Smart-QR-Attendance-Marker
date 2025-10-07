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

export const sendNotification = async (title: string, options?: NotificationOptions) => {
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('Service worker not supported in this browser');
    return;
  }

  try {
    // Wait for service worker to be ready with a timeout
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout')), 3000)
      )
    ]);

    await registration.showNotification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  } catch (error) {
    console.warn('Service worker not ready; skipping notification:', error);
  }
};

export const notifySessionActive = (className: string, duration: number) => {
  sendNotification('Attendance Session Active', {
    body: `${className} - Session expires in ${duration} minutes`,
    tag: 'session-active',
    requireInteraction: true,
  });
};
