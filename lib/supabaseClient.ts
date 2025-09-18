import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '../types';

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// FIX: Replaced the local Profile interface with an inline definition inside the Database interface.
// This resolves a TypeScript issue where the `profile` object was being inferred as type `never`,
// causing property access errors. This change ensures Supabase correctly types database interactions.
interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          role: UserRole;
        }
        Insert: {
          id: string;
          name: string;
          role: UserRole;
        }
        Update: {
          id?: string;
          name?: string;
          role?: UserRole;
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Initialize the Supabase client with the provided credentials.
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabase = supabaseClient;