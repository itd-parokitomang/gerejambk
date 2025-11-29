import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  loginUser, 
  logoutUser, 
  onAuthChange,
  getCurrentUserProfile,
  seedSuperAdmin
} from '../services/auth.service';
import { initializeDefaultSettings } from '../services/settings.service';
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

  useEffect(() => {
    // Initialize Firebase data
    const initialize = async () => {
      await seedSuperAdmin();
      await initializeDefaultSettings();
    };
    initialize();

    // Listen to auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Get user profile from Firestore
        const userProfile = await getCurrentUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
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
    await logoutUser();
    setUser(null);
    setProfile(null);
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
