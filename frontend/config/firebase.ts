import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
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
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with persistence
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  let getReactNativePersistence:
    | ((storage: typeof AsyncStorage) => Persistence)
    | null = null;
  try {
    const rnAuth = (0, eval)('require')('firebase/auth/react-native') as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
    };
    getReactNativePersistence = rnAuth.getReactNativePersistence;
  } catch {
    getReactNativePersistence = null;
  }
  try {
    if (!getReactNativePersistence) {
      throw new Error('react-native persistence unavailable');
    }
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    auth = getAuth(app);
  }
}

// Initialize Firestore
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  ...(Platform.OS === 'web' ? { useFetchStreams: false } : {}),
});

let secondaryApp: FirebaseApp | null = null;
let secondaryAuth: Auth | null = null;

export const getSecondaryAuth = (): Auth => {
  if (secondaryAuth) return secondaryAuth;

  if (!secondaryApp) {
    try {
      secondaryApp = getApp('secondary');
    } catch {
      secondaryApp = initializeApp(firebaseConfig, 'secondary');
    }
  }

  if (Platform.OS === 'web') {
    secondaryAuth = getAuth(secondaryApp);
    return secondaryAuth;
  }

  let getReactNativePersistence:
    | ((storage: typeof AsyncStorage) => Persistence)
    | null = null;
  try {
    const rnAuth = (0, eval)('require')('firebase/auth/react-native') as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
    };
    getReactNativePersistence = rnAuth.getReactNativePersistence;
  } catch {
    getReactNativePersistence = null;
  }
  try {
    if (!getReactNativePersistence) {
      throw new Error('react-native persistence unavailable');
    }
    secondaryAuth = initializeAuth(secondaryApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    secondaryAuth = getAuth(secondaryApp);
  }
  return secondaryAuth;
};

export { app, auth, db };
