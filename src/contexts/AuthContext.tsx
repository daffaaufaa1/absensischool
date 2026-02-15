import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, UserRole, UserProfile } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authUser: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  schoolId: string | null;
  loginWithNisNit: (nisNit: string, password: string) => Promise<{ error: string | null; isAdmin?: boolean }>;
  loginAsSuperAdmin: (username: string, password: string) => Promise<{ error: string | null; success?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching role:', roleError);
      }

      const { data: userData } = await supabase.auth.getUser();

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
      }
      
      return {
        id: userId,
        email: userData?.user?.email || '',
        profile: profile as UserProfile | null,
        role: (roleData?.role as UserRole) || null,
        school_id: profile?.school_id || null,
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const authUserData = await fetchUserProfile(user.id);
      setAuthUser(authUserData);
    }
  };

  useEffect(() => {
    // Check if admin session exists
    const adminSession = sessionStorage.getItem('admin_session');
    if (adminSession) {
      const parsed = JSON.parse(adminSession);
      setIsAdmin(true);
      setSchoolId(parsed.school_id || null);
    }

    const superAdminSession = sessionStorage.getItem('super_admin_session');
    if (superAdminSession) {
      setIsSuperAdmin(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const authUserData = await fetchUserProfile(session.user.id);
            setAuthUser(authUserData);
            setLoading(false);
          }, 0);
        } else {
          setAuthUser(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then(authUserData => {
          setAuthUser(authUserData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithNisNit = async (nisNit: string, password: string): Promise<{ error: string | null; isAdmin?: boolean }> => {
    try {
      // First check if it's an admin login (401 is expected for non-admin users)
      const adminRes = await supabase.functions.invoke('admin-login', {
        body: { username: nisNit, password },
      });

      if (adminRes.data?.success) {
        sessionStorage.setItem('admin_session', JSON.stringify(adminRes.data));
        setIsAdmin(true);
        setSchoolId(adminRes.data.school_id || null);
        return { error: null, isAdmin: true };
      }

      // Try user login (student/teacher)
      const userRes = await supabase.functions.invoke('user-login', {
        body: { nis_nit: nisNit, password },
      });

      if (userRes.data?.error) {
        return { error: userRes.data.error };
      }

      if (userRes.error) {
        return { error: 'NIS/NIT atau password salah' };
      }

      if (userRes.data?.success) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userRes.data.email,
          password: password,
        });

        if (signInError) {
          return { error: 'Gagal membuat sesi login' };
        }

        setSchoolId(userRes.data.school_id || null);
        return { error: null, isAdmin: false };
      }

      return { error: 'NIS/NIT atau password salah' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: 'Terjadi kesalahan saat login' };
    }
  };

  const loginAsSuperAdmin = async (username: string, password: string): Promise<{ error: string | null; success?: boolean }> => {
    try {
      const res = await supabase.functions.invoke('super-admin', {
        body: { username, password },
        headers: { 'x-action': 'login' },
      });

      // Use query param approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-admin?action=login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (data?.success) {
        sessionStorage.setItem('super_admin_session', JSON.stringify(data));
        setIsSuperAdmin(true);
        return { error: null, success: true };
      }

      return { error: 'Username atau password salah' };
    } catch (error: any) {
      console.error('Super admin login error:', error);
      return { error: 'Terjadi kesalahan saat login' };
    }
  };

  const signOut = async () => {
    sessionStorage.removeItem('admin_session');
    sessionStorage.removeItem('super_admin_session');
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setSchoolId(null);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        authUser,
        loading,
        isAdmin,
        isSuperAdmin,
        schoolId,
        loginWithNisNit,
        loginAsSuperAdmin,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
