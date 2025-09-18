import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '../types';

const supabaseUrl: string = 'https://ldibwpnxzkkdrwmuzizt.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaWJ3cG54emttZHJ3bXV6aXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTU1MTgsImV4cCI6MjA3Mzc5MTUxOH0.svzbstHGu7jLWUaWk0Hx8NEYO9jaKPWzpF6iguMCgSU';

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