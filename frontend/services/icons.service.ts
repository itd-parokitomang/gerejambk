import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import * as firebaseConfig from '../config/firebase';

const db = firebaseConfig.db as Firestore;
const auth = firebaseConfig.auth as Auth;

export type CustomIconRef = `custom:${string}`;

export interface CustomIconDoc {
  id: string;
  icon: string;
  originalFileName: string;
  uploadedAt: any;
  uploadedBy: string;
}

const ICONS_COLLECTION = 'icons';

export const isCustomIconRef = (value?: string): value is CustomIconRef =>
  Boolean(value && value.startsWith('custom:') && value.length > 'custom:'.length);

export const getCustomIconId = (ref: CustomIconRef): string => ref.slice('custom:'.length);

export const createCustomIcon = async (input: {
  icon: string;
  originalFileName: string;
}) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Anda harus login untuk mengunggah icon.');
  }

  const iconRef = doc(collection(db, ICONS_COLLECTION));
  const payload = {
    icon: input.icon,
    originalFileName: input.originalFileName,
    uploadedAt: serverTimestamp(),
    uploadedBy: currentUser.uid,
  };

  await setDoc(iconRef, payload);
  return { id: iconRef.id, ...payload } as CustomIconDoc;
};

export const getAllCustomIcons = async (): Promise<CustomIconDoc[]> => {
  try {
    const q = query(collection(db, ICONS_COLLECTION), orderBy('uploadedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CustomIconDoc[];
  } catch (error) {
    console.error('Error getting icons:', error);
    return [];
  }
};

export const getCustomIconById = async (id: string): Promise<CustomIconDoc | null> => {
  try {
    const snap = await getDoc(doc(db, ICONS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as any) } as CustomIconDoc;
  } catch (error) {
    console.error('Error getting icon:', error);
    return null;
  }
};

