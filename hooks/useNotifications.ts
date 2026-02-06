
import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useApp } from '../context/AppContext';
import { Platform } from 'react-native';

export const useNotifications = () => {
  const { settings } = useApp();
  const [permission, setPermission] = useState<Notifications.PermissionStatus | 'default'>('default');

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermission(status);
    });
  }, []);

  const requestPermission = useCallback(async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermission(status);
    return status === 'granted';
  }, []);

  const sendNotification = useCallback(async (title: string, body?: string, data?: any) => {
    if (permission !== 'granted' || !settings.notificationsEnabled) {
      return;
    }

    try {
      await Notifications.presentNotificationAsync({
        title,
        body,
        data,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [permission, settings.notificationsEnabled]);

  const scheduleNotification = useCallback(async (title: string, body: string, delaySeconds: number, data?: any) => {
    if (permission !== 'granted' || !settings.notificationsEnabled) {
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: {
        seconds: delaySeconds,
      },
    });

    return id;
  }, [permission, settings.notificationsEnabled]);

  const cancelNotification = useCallback(async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
  }, []);

  return {
    permission,
    requestPermission,
    sendNotification,
    scheduleNotification,
    cancelNotification
  };
};

// Hook for workout reminders
export const useWorkoutReminders = () => {
  const { scheduleNotification, cancelNotification } = useNotifications();
  const [activeReminders, setActiveReminders] = useState<Map<string, string>>(new Map());

  const setWorkoutReminder = useCallback(async (time: Date, message?: string) => {
    const now = new Date();
    let delay = (time.getTime() - now.getTime()) / 1000;

    // If time has passed for today, schedule for tomorrow
    if (delay < 0) {
      delay += 24 * 60 * 60;
    }

    const id = await scheduleNotification(
      message || 'Time to workout! 💪',
      'Your scheduled workout time has arrived. Let\'s crush it!',
      delay
    );

    if (id) {
        const localId = Date.now().toString();
        setActiveReminders(prev => new Map(prev).set(localId, id));
        return {
          id: localId,
          cancel: () => {
            cancelNotification(id);
            setActiveReminders(prev => {
              const next = new Map(prev);
              next.delete(localId);
              return next;
            });
          }
        };
    }
    return null;
  }, [scheduleNotification, cancelNotification]);

  const setRestTimer = useCallback(async (durationSeconds: number) => {
    const id = await scheduleNotification(
      'Rest time over! ⏱️',
      'Your rest period is complete. Ready for the next set?',
      durationSeconds
    );

    if (id) {
        const localId = `rest-${Date.now()}`;
        setActiveReminders(prev => new Map(prev).set(localId, id));

        return {
          id: localId,
          cancel: () => {
            cancelNotification(id);
            setActiveReminders(prev => {
              const next = new Map(prev);
              next.delete(localId);
              return next;
            });
          }
        };
    }
    return null;
  }, [scheduleNotification, cancelNotification]);

  const clearAllReminders = useCallback(() => {
    activeReminders.forEach((id) => {
        cancelNotification(id);
    });
    setActiveReminders(new Map());
  }, [activeReminders, cancelNotification]);

  return {
    setWorkoutReminder,
    setRestTimer,
    clearAllReminders,
    activeReminderCount: activeReminders.size
  };
};

// Hook for meal reminders
export const useMealReminders = () => {
  const { scheduleNotification } = useNotifications();

  const setMealReminder = useCallback(async (mealType: 'breakfast' | 'lunch' | 'dinner', time: Date) => {
    const now = new Date();
    let delay = (time.getTime() - now.getTime()) / 1000;

    if (delay < 0) {
      delay += 24 * 60 * 60;
    }

    const messages: Record<string, string> = {
      breakfast: 'Time for breakfast! 🍳',
      lunch: 'Lunch time! 🥗',
      dinner: 'Dinner time! 🍽️'
    };

    return scheduleNotification(
      messages[mealType],
      `Don't forget to log your ${mealType} and track your macros!`,
      delay
    );
  }, [scheduleNotification]);

  return { setMealReminder };
};
