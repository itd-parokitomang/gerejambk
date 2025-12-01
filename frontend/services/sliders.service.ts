import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type SliderTargetType = 'none' | 'page' | 'url';

export interface SliderItem {
  id: string;
  title: string;
  description?: string;
  icon?: string; // Ionicons name
  imageBase64?: string;
  order: number;
  active: boolean;
  /**
   * Tujuan saat slider diklik.
   * - 'page'  -> buka halaman internal berdasarkan slug
   * - 'url'   -> buka URL internal (route) kustom di aplikasi
   * - 'none'  -> tidak ada aksi khusus saat diklik
   */
  targetType?: SliderTargetType;
  /** Slug halaman internal yang akan dibuka, misal: "misa" (akan diarahkan ke /pages/misa) */
  targetPageSlug?: string;
  /** URL/route internal penuh, misal: "/pages/misa" atau "/adm" */
  targetUrl?: string;
  createdAt: any;
  updatedAt: any;
}

const SLIDERS_COLLECTION = 'sliders';

// Get all sliders (for admin)
export const getAllSliders = async (): Promise<SliderItem[]> => {
  try {
    const slidersQuery = query(
      collection(db, SLIDERS_COLLECTION),
      orderBy('order', 'asc'),
    );
    const snapshot = await getDocs(slidersQuery);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as SliderItem) }));
  } catch (error) {
    console.error('Error getting sliders:', error);
    return [];
  }
};

// Get active sliders (for homepage)
export const getActiveSliders = async (): Promise<SliderItem[]> => {
  try {
    const slidersQuery = query(
      collection(db, SLIDERS_COLLECTION),
      where('active', '==', true),
      orderBy('order', 'asc'),
    );
    const snapshot = await getDocs(slidersQuery);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as SliderItem) }));
  } catch (error) {
    console.error('Error getting active sliders:', error);
    return [];
  }
};

// Create new slider item
export const createSlider = async (
  data: Omit<SliderItem, 'id' | 'createdAt' | 'updatedAt'>,
) => {
  try {
    const ref = doc(collection(db, SLIDERS_COLLECTION));
    const payload = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
    return ref.id;
  } catch (error) {
    console.error('Error creating slider:', error);
    throw error;
  }
};

// Update slider item
export const updateSlider = async (
  id: string,
  data: Partial<Omit<SliderItem, 'id'>>,
) => {
  try {
    const ref = doc(db, SLIDERS_COLLECTION, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating slider:', error);
    throw error;
  }
};

// Delete slider item
export const deleteSlider = async (id: string) => {
  try {
    await deleteDoc(doc(db, SLIDERS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting slider:', error);
    throw error;
  }
};


