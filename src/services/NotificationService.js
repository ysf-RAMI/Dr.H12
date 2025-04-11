import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.setupForegroundHandler();
    this.setupBackgroundHandler();
  }

  // Request permission for notifications
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted');
        return this.getFCMToken();
      }
    } catch (error) {
      console.log('Permission rejected', error);
    }
    return null;
  }


  // Get FCM token (unique device ID for notifications)
  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.log('Error getting FCM token', error);
      return null;
    }
  }

  // Handle notifications when app is OPEN
  setupForegroundHandler() {
    messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification.title,
        remoteMessage.notification.body
      );
    });
  }

  // Handle notifications when app is in BACKGROUND
  setupBackgroundHandler() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background notification:', remoteMessage);
    });
  }

  // Check if app was opened from a notification
  async checkInitialNotification() {
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      Alert.alert(
        'Opened from notification',
        initialNotification.notification.body
      );
    }
  }


  async sendAnnouncementNotification({ title, body }) {
    try {
      // Simulate sending to all users (client-side only)
      await messaging().sendMessage({
        data: {
          title,
          body,
          type: 'announcement',
        },
      });
      console.log('Notification sent!');
    } catch (error) {
      console.log('Error sending notification:', error);
    }
  }
  
}

export default new NotificationService();