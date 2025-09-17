import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '../types';

// =================================================================================
// IMPORTANT: ACTION REQUIRED
//
// You must replace these placeholder values with your actual Supabase project URL
// and public anon key. You can find these in your Supabase project dashboard
// under Project Settings > API.
// =================================================================================
// FIX: Explicitly type as string to avoid literal type comparison error.
const supabaseUrl: string = 'https://tlbqiecteyqcryhcjfmq.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYnFpZWN0ZXlxY3J5aGNqZm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzQ3MjYsImV4cCI6MjA3MzYxMDcyNn0.qkEhilpVlcb_fVCvn1Lmz8vdSdWEUVFJtSpPyIT6mg8';

interface Profile {
    id: string;
    name: string;
    role: UserRole;
}

interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Profile
        Update: Partial<Profile>
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

let supabaseClient: any = null;

// Only initialize the client if the placeholders have been replaced.
if (supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;
