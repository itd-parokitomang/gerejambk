import { 
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from './auth.service';

const USERS_COLLECTION = 'users';

// Get all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersQuery = query(
      collection(db, USERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map((doc) => ({
      ...(doc.data() as UserProfile),
      uid: doc.id,
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Get user by UID
export const getUserByUid = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Update user role (only superadmin can change roles)
export const updateUserRole = async (uid: string, role: 'admin' | 'superadmin') => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Delete user (cannot delete superadmin)
export const deleteUser = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      if (userData.role === 'superadmin') {
        throw new Error('Cannot delete superadmin account');
      }
    }
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
