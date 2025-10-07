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

  try {
    // Use service worker registration if available (required for PWA)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } else {
      // Fallback for browsers without service worker support
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

export const notifySessionActive = (className: string, duration: number) => {
  sendNotification('Attendance Session Active', {
    body: `${className} - Session expires in ${duration} minutes`,
    tag: 'session-active',
    requireInteraction: true,
  });
};
