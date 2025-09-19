
import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '../types';

const supabaseUrl: string = 'https://ldibwpnxzkkdrwmuzizt.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaWJ3cG54emttZHJ3bXV6aXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTU1MTgsImV4cCI6MjA3Mzc5MTUxOH0.svzbstHGu7jLWUaWk0Hx8NEYO9jaKPWzpF6iguMCgSU';

// FIX: Added a comprehensive Database interface to provide strong typing for the Supabase client.
// This resolves numerous TypeScript errors where data types were inferred as `never`,
// by correctly defining the schema for all tables used in the application.
// FIX: Corrected column names to use snake_case to match database schema conventions.
export interface Database {
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
      },
      courses: {
        Row: { id: string; name: string; code: string; };
        Insert: { id: string; name: string; code: string; };
        Update: { name?: string; code?: string; };
      },
      students: {
        Row: { id: string; name: string; anonymized_name: string; };
        Insert: { id: string; name: string; anonymized_name: string; };
        Update: { name?: string; anonymized_name?: string; };
      },
      enrollments: {
        Row: { course_id: string; student_id: string; };
        Insert: { course_id: string; student_id: string; };
        Update: {};
      },
      sessions: {
        Row: { id: string; course_id: string; date: string; type: 'Online' | 'Offline'; limit: number | null; scanned_count: number | null; qr_code_value: string | null; short_code: string | null; liveness_check: boolean | null; };
        Insert: { id: string; course_id: string; date: string; type: 'Online' | 'Offline'; limit?: number | null; scanned_count?: number | null; qr_code_value?: string | null; short_code?: string | null; liveness_check?: boolean | null; };
        Update: { date?: string; type?: 'Online' | 'Offline'; limit?: number | null; scanned_count?: number | null; qr_code_value?: string | null; short_code?: string | null; liveness_check?: boolean | null; };
      },
      attendance_records: {
        Row: { student_id: string; session_id: string; status: 'Present' | 'Absent'; liveness_data: string | null; };
        Insert: { student_id: string; session_id: string; status: 'Present' | 'Absent'; liveness_data?: string | null; };
        Update: { status?: 'Present' | 'Absent'; liveness_data?: string | null; };
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

// Initialize the Supabase client with the provided credentials and strong types.
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabase = supabaseClient;
