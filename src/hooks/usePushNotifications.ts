import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { requestNotificationPermission, subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/lib/pushNotifications';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = async () => {
    if (!user) return;
    
    const granted = await requestNotificationPermission();
    setPermission(Notification.permission);
    
    if (granted) {
      await subscribeToPushNotifications(user.id);
      setIsSubscribed(true);
    }
  };

  const unsubscribe = async () => {
    if (!user) return;
    
    await unsubscribeFromPushNotifications(user.id);
    setIsSubscribed(false);
  };

  return {
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
  };
};
