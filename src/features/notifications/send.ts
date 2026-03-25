import * as Notifications from 'expo-notifications';

export async function send(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { body, title },
    trigger: null,
  });
}
