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
