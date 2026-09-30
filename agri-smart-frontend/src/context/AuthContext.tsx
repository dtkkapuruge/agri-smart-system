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
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
    // Get current session on mount
    log('Initializing auth — checking existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      log('getSession result:', session ? `user=${session.user.email}` : 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      log('onAuthStateChange event:', event, '| user:', session?.user?.email ?? 'none');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
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
    const { data, error } = await supabase.auth.signUp({
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
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signUp, signIn, signOut }}
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
