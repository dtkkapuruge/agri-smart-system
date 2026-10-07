'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, UserRole, UserProfile } from '@/lib/supabase';

// ─── Debug logger ─────────────────────────────────────────────────────────────
const log = (...args: unknown[]) =>
  console.log('[AuthContext]', ...args);

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    fullName?: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null; role?: UserRole }>;
  signOut: () => Promise<void>;
  devRole?: UserRole | null;
  setDevRole?: (role: UserRole | null) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createMockDevData(role: UserRole) {
  const email = `dev.${role}@agrismart.local`;
  const fullName = `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`;
  const id = `dev-${role}-id`;

  const mockUser: User = {
    id,
    app_metadata: { provider: 'email' },
    user_metadata: { role, full_name: fullName, phone: '+94 77 123 4567' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email,
    phone: '+94 77 123 4567',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  } as unknown as User;

  const mockSession: Session = {
    access_token: 'dev-mock-access-token',
    refresh_token: 'dev-mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser,
  };

  const mockProfile: UserProfile = {
    id,
    user_id: id,
    profile_id: id,
    email,
    role,
    full_name: fullName,
    phone: '+94 77 123 4567',
    created_at: new Date().toISOString(),
  };

  return { mockUser, mockSession, mockProfile };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [devRole, setDevRoleState] = useState<UserRole | null>(null);

  const applyDevRole = (role: UserRole | null) => {
    if (typeof window === 'undefined') return;
    if (role) {
      localStorage.setItem('agri_dev_role', role);
      document.cookie = `agri_dev_role=${role}; path=/; max-age=86400; SameSite=Lax`;
      const { mockUser, mockSession, mockProfile } = createMockDevData(role);
      setUser(mockUser);
      setSession(mockSession);
      setProfile(mockProfile);
      setDevRoleState(role);
    } else {
      localStorage.removeItem('agri_dev_role');
      document.cookie = 'agri_dev_role=; path=/; max-age=0; SameSite=Lax';
      setDevRoleState(null);
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const setDevRole = (role: UserRole | null) => {
    applyDevRole(role);
  };

  async function fetchProfile(userId: string): Promise<UserProfile | null> {
    log('Building profile from auth session for userId:', userId);

    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;
    
    if (!authUser || authUser.id !== userId) return null;

    // Extract role from user metadata, default to 'farmer' if missing
    const rawRole = (authUser.user_metadata?.role as string) ?? 'farmer';
    const role = rawRole.toLowerCase() as UserRole;
    const fullName = (authUser.user_metadata?.full_name as string) ?? '';

    let profileId = authUser.id;

    // Sync profile with backend to ensure User + FarmerProfile/BuyerProfile exist in Prisma DB
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const token = sessionData?.session?.access_token;
      
      const res = await fetch(`${API}/auth/sync-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role: role.toUpperCase(),
          farm_name: fullName || 'My Farm',
          delivery_address: 'Not Provided',
          latitude: 6.9271,
          longitude: 79.8612,
        }),
      });

      if (res.ok) {
        const syncData = await res.json();
        if (syncData.profile_id) {
          profileId = syncData.profile_id;
        }
        log('Backend sync successful, profile_id:', profileId);
      }
    } catch (err) {
      console.error('[AuthContext] Profile sync error:', err);
    }

    const profile: UserProfile = {
      id: profileId,
      user_id: authUser.id,
      profile_id: profileId,
      email: authUser.email || '',
      role,
      full_name: fullName,
      phone: (authUser.user_metadata?.phone as string) ?? null,
      created_at: authUser.created_at,
    };

    setProfile(profile);
    return profile;
  }

  useEffect(() => {
    // Check if in development and a dev role was previously set
    const storedDevRole = typeof window !== 'undefined'
      ? (localStorage.getItem('agri_dev_role') as UserRole | null)
      : null;

    // Get current session on mount
    log('Initializing auth — checking existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      log('getSession result:', session ? `user=${session.user.email}` : 'no session');
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id);
      } else if (process.env.NODE_ENV === 'development' && storedDevRole) {
        log('Restoring dev role from localStorage:', storedDevRole);
        applyDevRole(storedDevRole);
      }
      setLoading(false);
    });

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      log('onAuthStateChange event:', event, '| user:', session?.user?.email ?? 'none');
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        const devRoleCurrent = typeof window !== 'undefined'
          ? (localStorage.getItem('agri_dev_role') as UserRole | null)
          : null;
        if (process.env.NODE_ENV === 'development' && devRoleCurrent) {
          applyDevRole(devRoleCurrent);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Auth Actions ────────────────────────────────────────────────────────────

  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    fullName?: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName ?? '' },
      },
    });

    // Backend (orders.service.ts or ai-grading.service.ts) will auto-create
    // the User row in Prisma when the user performs their first action,
    // avoiding RLS permission errors here.

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    log('signIn called for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[AuthContext] signIn error:', error.message);
      return { error };
    }

    log('Supabase signIn success — user id:', data.user?.id);

    // Fetch profile immediately so caller can read the role for redirect
    let role: UserRole | undefined;
    if (data.user) {
      const fetchedProfile = await fetchProfile(data.user.id);
      role = fetchedProfile?.role;
      log('Role from profile:', role);
    }

    return { error: null, role };
  };

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agri_dev_role');
      document.cookie = 'agri_dev_role=; path=/; max-age=0; SameSite=Lax';
      setDevRoleState(null);
    }
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signUp, signIn, signOut, devRole, setDevRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
