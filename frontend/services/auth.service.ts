import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import * as firebaseConfig from '../config/firebase';

const auth = firebaseConfig.auth as Auth;
const db = firebaseConfig.db as Firestore;
const SUPERADMIN_EMAIL = 'joni@email.com';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'superadmin' | 'admin' | 'user';
  createdAt: any;
  updatedAt: any;
}

// Login
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      if (user.email && user.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
        const bootstrapProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Super Admin',
          role: 'superadmin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', user.uid), bootstrapProfile);
        return { user, profile: bootstrapProfile };
      }

      await signOut(auth);
      throw new Error('Akun belum terdaftar sebagai admin. Hubungi superadmin.');
    }
    
    const profileData = userDoc.data() as UserProfile;
    
    return {
      user,
      profile: profileData
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Register new admin user (only by superadmin or admin)
export const registerAdmin = async (
  email: string,
  password: string,
  displayName: string,
  _createdBy: string
) => {
  try {
    const secondaryAuth = firebaseConfig.getSecondaryAuth();
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, { displayName });
    
    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      role: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    await signOut(secondaryAuth);
    
    return { user, profile: userProfile };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const registerPublicAdmin = async (
  email: string,
  password: string,
  displayName: string,
) => {
  let createdUser: User | null = null;
  try {
    console.log('[registerPublicAdmin] Starting registration for:', email);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    createdUser = user;
    
    console.log('[registerPublicAdmin] User created successfully:', user.uid);

    await updateProfile(user, { displayName });
    console.log('[registerPublicAdmin] Profile updated with displayName:', displayName);

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('[registerPublicAdmin] Creating user profile in Firestore...');
    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('[registerPublicAdmin] User profile created successfully');
    
    return { user, profile: userProfile };
  } catch (error: any) {
    console.error('[registerPublicAdmin] Error during registration:', error);
    
    if (createdUser) {
      try {
        console.log('[registerPublicAdmin] Cleaning up created user...');
        await deleteUser(createdUser);
        console.log('[registerPublicAdmin] User cleanup successful');
      } catch (cleanupError) {
        console.error('[registerPublicAdmin] Error during cleanup:', cleanupError);
      }
    }
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  try {
    console.log('[Auth Service] Signing out user...');
    console.log('[Auth Service] Current auth user:', auth.currentUser?.email);
    
    if (!auth.currentUser) {
      console.log('[Auth Service] No user currently signed in');
      return;
    }
    
    await signOut(auth);
    console.log('[Auth Service] User signed out successfully');
    console.log('[Auth Service] Auth user after signout:', auth.currentUser);
  } catch (error) {
    console.error('[Auth Service] Sign out error:', error);
    throw error;
  }
};

// Force logout on app start (optional)
export const clearAuthOnStart = async () => {
  try {
    if (auth.currentUser) {
      console.log('[Auth Service] Clearing auth state on app start');
      await signOut(auth);
    }
  } catch (error) {
    console.error('[Auth Service] Error clearing auth on start:', error);
  }
};

// Get current user profile
export const getCurrentUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Auth state listener
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
