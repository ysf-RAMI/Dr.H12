import { getMessaging, requestPermission } from '@react-native-firebase/messaging';

export async function registerForPushNotificationsAsync() {
  try {
    const messaging = getMessaging();
    const authStatus = await requestPermission();
    
    if (authStatus) {
      const token = await messaging.getToken();
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}