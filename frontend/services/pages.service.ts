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

export type PageType =
  | 'static'
  | 'webview'
  | 'youtube_video'
  | 'youtube_channel'
  | 'data_table'
  | 'parent';

export interface PageContent {
  id: string;
  title: string;
  slug: string;
  icon: string;
  type: PageType;
  order: number;
  active: boolean;
  // Optional parent page id (untuk struktur halaman induk / sub halaman)
  parentId?: string;
  
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
  youtubeChannelUrl?: string;
  
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

const DEFAULT_PAGES: Array<Omit<PageContent, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    title: 'Misa Gereja & Intensi Misa',
    slug: 'misa',
    icon: 'calendar',
    type: 'static',
    order: 0,
    active: true,
    richTextContent: '',
    createdBy: 'system',
  },
  {
    title: 'Paroki Tomang - Gereja MBK',
    slug: 'paroki',
    icon: 'home',
    type: 'static',
    order: 1,
    active: true,
    richTextContent: '',
    createdBy: 'system',
  },
  {
    title: 'Pelayanan Gereja MBK',
    slug: 'pelayanan',
    icon: 'hand-left',
    type: 'static',
    order: 2,
    active: true,
    richTextContent: '',
    createdBy: 'system',
  },
  {
    title: 'Renungan Harian Katolik',
    slug: 'renungan',
    icon: 'book',
    type: 'static',
    order: 3,
    active: true,
    richTextContent: '',
    createdBy: 'system',
  },
  {
    title: 'Kegiatan MBK Akan Datang',
    slug: 'kegiatan',
    icon: 'calendar-outline',
    type: 'static',
    order: 4,
    active: true,
    richTextContent: '',
    createdBy: 'system',
  },
  {
    title: 'Kontak & Informasi',
    slug: 'kontak',
    icon: 'call',
    type: 'static',
    order: 5,
    active: true,
    richTextContent: '',
    createdBy: 'system',
  },
];

// Get all pages (termasuk sub halaman) untuk admin
export const getAllPages = async (): Promise<PageContent[]> => {
  try {
    const pagesQuery = query(
      collection(db, PAGES_COLLECTION),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(pagesQuery);
    return snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<PageContent, 'id'>;
      return { ...data, id: doc.id };
    });
  } catch (error) {
    console.error('Error getting pages:', error);
    return [];
  }
};

// Get active top-level pages only (untuk beranda)
export const getActivePages = async (): Promise<PageContent[]> => {
  try {
    const pagesQuery = query(
      collection(db, PAGES_COLLECTION),
      where('active', '==', true),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(pagesQuery);
    const docs = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<PageContent, 'id'>;
      return { ...data, id: doc.id };
    });
    // Hanya ambil halaman yang bukan sub halaman (tanpa parentId)
    return docs.filter((page) => !page.parentId);
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

// Get child pages of a parent (used for "halaman induk")
export const getChildPages = async (parentId: string): Promise<PageContent[]> => {
  try {
    const pagesQuery = query(
      collection(db, PAGES_COLLECTION),
      where('parentId', '==', parentId),
      where('active', '==', true),
      orderBy('order', 'asc'),
    );
    const snapshot = await getDocs(pagesQuery);
    return snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<PageContent, 'id'>;
      return { ...data, id: doc.id };
    });
  } catch (error) {
    console.error('Error getting child pages:', error);
    return [];
  }
};

// Create new page
export const createPage = async (pageData: Omit<PageContent, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const pageRef = doc(collection(db, PAGES_COLLECTION));
    const newPage: any = {
      ...pageData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    // Hapus field undefined sebelum dikirim ke Firestore
    Object.keys(newPage).forEach((key) => {
      if (newPage[key] === undefined) {
        delete newPage[key];
      }
    });
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

    // Firestore tidak mengizinkan nilai undefined di updateDoc.
    // Bersihkan field undefined agar tidak dikirim.
    const cleanData: Record<string, any> = {};
    Object.entries(pageData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });

    await updateDoc(pageRef, {
      ...cleanData,
      updatedAt: serverTimestamp(),
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

// Initialize default pages based on main menu configuration.
// Dipanggil saat admin pertama kali login supaya halaman-halaman dasar
// langsung muncul di /adm (Kelola Halaman).
export const initializeDefaultPages = async () => {
  try {
    for (const page of DEFAULT_PAGES) {
      const pagesQuery = query(
        collection(db, PAGES_COLLECTION),
        where('slug', '==', page.slug),
      );
      const snapshot = await getDocs(pagesQuery);

      if (snapshot.empty) {
        const ref = doc(collection(db, PAGES_COLLECTION));
        const payload = {
          ...page,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(ref, payload);
      }
    }
  } catch (error) {
    console.error('Error initializing default pages:', error);
  }
};
