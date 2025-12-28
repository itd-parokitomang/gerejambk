import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { 
  loginUser, 
  logoutUser, 
  onAuthChange,
  getCurrentUserProfile,
  clearAuthOnStart
} from '../services/auth.service';
import { initializeDefaultSettings } from '../services/settings.service';
import { initializeDefaultPages } from '../services/pages.service';
import { UserProfile } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const didBootstrapRef = useRef(false);
  const didClearAuthRef = useRef(false);

  useEffect(() => {
    // Clear auth on app start (force logout on every app start)
    const clearAuthIfNeeded = async () => {
      if (!didClearAuthRef.current) {
        didClearAuthRef.current = true;
        // Force logout on app start - uncomment if you want this behavior
        await clearAuthOnStart();
      }
    };
    clearAuthIfNeeded();

    // Listen to auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log('[AuthContext] Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'User logged out');
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Get user profile from Firestore
        const userProfile = await getCurrentUserProfile(firebaseUser.uid);
        setProfile(userProfile);
        console.log('[AuthContext] User profile loaded:', userProfile?.role);

        if (
          userProfile &&
          !didBootstrapRef.current &&
          (userProfile.role === 'admin' || userProfile.role === 'superadmin')
        ) {
          didBootstrapRef.current = true;
          await initializeDefaultSettings();
          await initializeDefaultPages();
        }
      } else {
        console.log('[AuthContext] Clearing user profile and bootstrap flag');
        setProfile(null);
        didBootstrapRef.current = false;
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user: firebaseUser, profile: userProfile } = await loginUser(email, password);
      setUser(firebaseUser);
      setProfile(userProfile);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Starting logout process...');
      
      // Sign out from Firebase first (this will trigger onAuthChange)
      await logoutUser();
      
      console.log('[AuthContext] Firebase signOut completed');
      console.log('[AuthContext] Logout completed successfully');
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // If Firebase logout fails, manually clear local state
      setUser(null);
      setProfile(null);
      didBootstrapRef.current = false;
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
