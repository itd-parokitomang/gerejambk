import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/utils/role-check';

type UserProfile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  signIn: (payload: { email: string; password: string }) => Promise<{ error: any }>;
  signUp: (payload: { email: string; password: string; fullName: string; role?: UserRole }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createUserAsAdmin: (payload: { email: string; password: string; fullName: string; role: UserRole }) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadComplete = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }
      
      if (data) {
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!mounted) return;

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
          return;
        }
        
        if (data) {
          setProfile(data as UserProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error fetching profile:', error);
        setProfile(null);
      }
    };

    const completeInitialLoad = () => {
      if (mounted && !initialLoadComplete.current) {
        initialLoadComplete.current = true;
        setIsLoading(false);
      }
    };

    // Get initial session - hanya set isLoading false setelah initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => {
          completeInitialLoad();
        });
      } else {
        completeInitialLoad();
      }
    });

    // Listen for auth changes - JANGAN set isLoading di sini
    // karena ini dipanggil setiap kali ada perubahan auth state (termasuk navigasi)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      // Update session dan user tanpa mengubah isLoading
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      // Hanya set isLoading false jika initial load belum selesai
      // Ini untuk handle edge case jika onAuthStateChange dipanggil sebelum getSession selesai
      completeInitialLoad();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove fetchProfile from dependencies

  const signIn = useCallback(async (payload: { email: string; password: string }) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  }, []);

  const signUp = useCallback(async (payload: { email: string; password: string; fullName: string; role?: UserRole }) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
      });

      if (signUpError) return { error: signUpError };
      if (!data.user) return { error: new Error('User creation failed') };

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: data.user.id,
          full_name: payload.fullName,
          role: payload.role || 'sales',
          phone: null,
          email: payload.email,
        });

      if (profileError) {
        // If profile creation fails, log error (user will need manual cleanup)
        console.error('Profile creation failed:', profileError);
        return { error: profileError };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Clear local state
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // For web production (static export), ensure localStorage is cleared
      if (typeof window !== 'undefined') {
        // Clear all Supabase-related localStorage items
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith('sb-') || key.startsWith('supabase.auth.token')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('Error in signOut:', error);
      // Even if there's an error, clear local state
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const createUserAsAdmin = useCallback(async (payload: { email: string; password: string; fullName: string; role: UserRole }) => {
    try {
      // Simpan session owner saat ini
      const currentSession = session;
      const currentUser = user;
      const currentProfile = profile;

      if (!currentSession) {
        return { error: new Error('Tidak ada session aktif') };
      }

      // Simpan access_token dan refresh_token untuk restore
      const ownerAccessToken = currentSession.access_token;
      const ownerRefreshToken = currentSession.refresh_token;

      // Coba gunakan admin API jika tersedia
      try {
        const { data: newUser, error: adminError } = await supabase.auth.admin.createUser({
          email: payload.email,
          password: payload.password,
          email_confirm: true, // Auto-confirm email
        });

        if (adminError) {
          // Jika admin API tidak tersedia, gunakan pendekatan signUp + restore session
          throw adminError;
        }

        if (!newUser.user) {
          return { error: new Error('User creation failed') };
        }

        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: newUser.user.id,
            full_name: payload.fullName,
            role: payload.role,
            phone: null,
            email: payload.email,
          });

        if (profileError) {
          console.error('Profile creation failed:', profileError);
          return { error: profileError };
        }

        // Pastikan session owner masih aktif (admin API tidak mengubah session)
        return { error: null };
      } catch (adminError) {
        // Fallback: gunakan signUp lalu restore session owner
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
        });

        if (signUpError) return { error: signUpError };
        if (!signUpData.user) return { error: new Error('User creation failed') };

        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: signUpData.user.id,
            full_name: payload.fullName,
            role: payload.role,
            phone: null,
            email: payload.email,
          });

        if (profileError) {
          console.error('Profile creation failed:', profileError);
          return { error: profileError };
        }

        // Restore session owner segera setelah membuat user
        if (ownerAccessToken && ownerRefreshToken) {
          const { data: restoredSession, error: restoreError } = await supabase.auth.setSession({
            access_token: ownerAccessToken,
            refresh_token: ownerRefreshToken,
          });

          if (restoreError) {
            console.error('Error restoring session:', restoreError);
            return { error: new Error('Gagal mengembalikan session. Silakan login ulang.') };
          }

          // Update state dengan session yang di-restore
          if (restoredSession.session) {
            setSession(restoredSession.session);
            setUser(restoredSession.user);
            // Reload profile owner
            if (restoredSession.user) {
              await fetchProfile(restoredSession.user.id);
            }
          }
        } else {
          return { error: new Error('Tidak dapat mengembalikan session') };
        }

        return { error: null };
      }
    } catch (error) {
      return { error };
    }
  }, [session, user, profile, fetchProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session && user),
      isLoading,
      user,
      session,
      profile,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      createUserAsAdmin,
    }),
    [session, user, profile, isLoading, signIn, signUp, signOut, refreshProfile, createUserAsAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}


