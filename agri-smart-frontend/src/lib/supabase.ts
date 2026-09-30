import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'farmer' | 'buyer' | 'admin';

export interface UserProfile {
  /** Primary key in the 'User' table */
  user_id: string;
  /** Primary key in FarmerProfile or BuyerProfile */
  profile_id?: string;
  /** Alias so any existing code using .id continues to work */
  id?: string;
  email: string;
  role: UserRole;
  /** Optional full name */
  full_name?: string;
  created_at?: string;
  /** Optional phone number */
  phone?: string | null;
}
