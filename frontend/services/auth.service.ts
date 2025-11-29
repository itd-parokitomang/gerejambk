import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'superadmin' | 'admin';
  createdAt: any;
  updatedAt: any;
}

// Superadmin credentials
const SUPERADMIN_EMAIL = 'joni@email.com';
const SUPERADMIN_PASSWORD = 'joni2#Marjoni';

// Login
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    return {
      user,
      profile: userDoc.data() as UserProfile
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
  createdBy: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
    
    return { user, profile: userProfile };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Logout
export const logoutUser = async () => {
  await signOut(auth);
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

// Seed superadmin account
export const seedSuperAdmin = async () => {
  try {
    // Check if superadmin already exists in Firestore
    const usersSnapshot = await getDoc(doc(db, 'users', 'superadmin'));
    
    if (!usersSnapshot.exists()) {
      console.log('Seeding superadmin account...');
      
      // Create superadmin in Firestore with fixed UID
      const superadminProfile: UserProfile = {
        uid: 'superadmin',
        email: SUPERADMIN_EMAIL,
        displayName: 'Super Admin',
        role: 'superadmin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', 'superadmin'), superadminProfile);
      console.log('Superadmin seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding superadmin:', error);
  }
};
