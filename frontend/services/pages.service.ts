import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type PageType = 'static' | 'webview' | 'youtube_video' | 'youtube_channel' | 'data_table';

export interface PageContent {
  id: string;
  title: string;
  slug: string;
  icon: string;
  type: PageType;
  order: number;
  active: boolean;
  
  // For static pages
  richTextContent?: string;
  
  // For webview
  webviewUrl?: string;
  
  // For youtube videos
  youtubeVideos?: Array<{
    id: string;
    title: string;
    videoId: string;
    thumbnailUrl?: string;
  }>;
  
  // For youtube channel
  youtubeChannelId?: string;
  youtubeChannelName?: string;
  
  // For data table
  tableTitle?: string;
  tableColumns?: Array<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'date';
  }>;
  tableData?: Array<Record<string, any>>;
  
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

const PAGES_COLLECTION = 'pages';

// Get all pages
export const getAllPages = async (): Promise<PageContent[]> => {
  try {
    const pagesQuery = query(
      collection(db, PAGES_COLLECTION),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(pagesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PageContent));
  } catch (error) {
    console.error('Error getting pages:', error);
    return [];
  }
};

// Get active pages only
export const getActivePages = async (): Promise<PageContent[]> => {
  try {
    const pagesQuery = query(
      collection(db, PAGES_COLLECTION),
      where('active', '==', true),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(pagesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PageContent));
  } catch (error) {
    console.error('Error getting active pages:', error);
    return [];
  }
};

// Get page by slug
export const getPageBySlug = async (slug: string): Promise<PageContent | null> => {
  try {
    const pagesQuery = query(
      collection(db, PAGES_COLLECTION),
      where('slug', '==', slug)
    );
    const snapshot = await getDocs(pagesQuery);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as PageContent;
    }
    return null;
  } catch (error) {
    console.error('Error getting page by slug:', error);
    return null;
  }
};

// Create new page
export const createPage = async (pageData: Omit<PageContent, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const pageRef = doc(collection(db, PAGES_COLLECTION));
    const newPage = {
      ...pageData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(pageRef, newPage);
    return pageRef.id;
  } catch (error) {
    console.error('Error creating page:', error);
    throw error;
  }
};

// Update page
export const updatePage = async (pageId: string, pageData: Partial<PageContent>) => {
  try {
    const pageRef = doc(db, PAGES_COLLECTION, pageId);
    await updateDoc(pageRef, {
      ...pageData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating page:', error);
    throw error;
  }
};

// Delete page
export const deletePage = async (pageId: string) => {
  try {
    await deleteDoc(doc(db, PAGES_COLLECTION, pageId));
  } catch (error) {
    console.error('Error deleting page:', error);
    throw error;
  }
};
