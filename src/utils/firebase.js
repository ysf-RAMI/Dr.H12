import { initializeApp, getApp } from '@react-native-firebase/app';
import { getMessaging } from '@react-native-firebase/messaging';

// Initialize Firebase
const firebaseConfig = {
  // Your firebase config from google-services.json
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Firebase Messaging instance
const messaging = getMessaging(getApp());

export { app, messaging };