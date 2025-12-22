import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface AppSettings {
  appName: string;
  parokiName: string;
  headerText: string;
  footerText: string;
  logoBase64?: string;
  iconBase64?: string;
  faviconBase64?: string;
  primaryColor: string;
  secondaryColor: string;
  updatedAt: any;
}

const SETTINGS_DOC_ID = 'app_settings';
const MASS_SCHEDULE_HERO_DOC_ID = 'hero';

export type MassScheduleHeroTargetType = 'none' | 'page' | 'url';

export interface MassScheduleHeroConfig {
  title: string;
  value: string;
  targetType: MassScheduleHeroTargetType;
  targetPageSlug?: string;
  targetUrl?: string;
  updatedAt: any;
}

// Get app settings
export const getAppSettings = async (): Promise<AppSettings | null> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', SETTINGS_DOC_ID));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as AppSettings;
    }
    return null;
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
  }
};

// Update app settings
export const updateAppSettings = async (settings: Partial<AppSettings>) => {
  try {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Initialize default settings
export const initializeDefaultSettings = async () => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', SETTINGS_DOC_ID));
    
    if (!settingsDoc.exists()) {
      const defaultSettings: AppSettings = {
        appName: 'Paroki Tomang',
        parokiName: 'Paroki Santa Maria Bunda Karmel (MBK)',
        headerText: 'Paroki Tomang',
        footerText: 'Paroki Santa Maria Bunda Karmel (MBK)\nTomang - Jakarta Barat',
        primaryColor: '#8B4513',
        secondaryColor: '#D2691E',
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), defaultSettings);
      console.log('Default settings initialized');
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
};

export const getMassScheduleHeroConfig = async (): Promise<MassScheduleHeroConfig | null> => {
  try {
    const ref = doc(db, 'mass_schedule_hero', MASS_SCHEDULE_HERO_DOC_ID);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as MassScheduleHeroConfig;
  } catch (error) {
    console.error('Error getting mass schedule hero config:', error);
    return null;
  }
};

export const upsertMassScheduleHeroConfig = async (
  config: Omit<MassScheduleHeroConfig, 'updatedAt'>,
) => {
  try {
    const ref = doc(db, 'mass_schedule_hero', MASS_SCHEDULE_HERO_DOC_ID);
    const payload: Partial<MassScheduleHeroConfig> = {
      ...config,
      updatedAt: serverTimestamp(),
    };
    Object.keys(payload).forEach((key) => {
      if ((payload as any)[key] === undefined) {
        delete (payload as any)[key];
      }
    });
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    console.error('Error upserting mass schedule hero config:', error);
    throw error;
  }
};
