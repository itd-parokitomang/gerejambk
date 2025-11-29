import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDgLPrzXq7uHNSv5KdBXRRWVQgRWDiKsrU",
  authDomain: "parokitomang-4f136.firebaseapp.com",
  projectId: "parokitomang-4f136",
  storageBucket: "parokitomang-4f136.firebasestorage.app",
  messagingSenderId: "717277110880",
  appId: "1:717277110880:web:01b6c2c687901071d79905"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
