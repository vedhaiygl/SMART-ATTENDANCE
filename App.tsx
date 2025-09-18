
import React, { useState, createContext, useContext, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CourseManager from './components/CourseManager';
import Analytics from './components/Analytics';
import Login from './components/Login';
import StudentView from './components/StudentView';
import { useAttendanceData } from './hooks/useAttendanceData';
import type { ViewType, User, UserRole } from './types';
import { supabase } from './lib/supabaseClient';

// THEME MANAGEMENT
type Theme = 'light' | 'dark';
interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const value = useMemo(() => ({ theme, setTheme }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [facultyView, setFacultyView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const attendanceData = useAttendanceData();

  useEffect(() => {
    setAuthLoading(true);
    // Align with Supabase v2 API for onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUser({
            id: session.user.id,
            name: profile.name,
            role: profile.role,
            email: session.user.email!,
          });
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (name: string, email: string, password: string, role: UserRole): Promise<string | null> => {
    // Align with Supabase v2 API for signUp.
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        return error.message;
    }
    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, name, role });
        if (profileError) {
            return profileError.message;
        }
        return null;
    }
    return 'An unknown error occurred during sign up.';
  };

  const handleLogin = async (email: string, password: string, role: UserRole): Promise<string | null> => {
    // Align with Supabase v2 API for signIn (`signInWithPassword`).
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return error.message;
    }
    if (data.user) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            await supabase.auth.signOut();
            return "Could not retrieve user profile.";
        }

        if (profile) {
            if (profile.role === role) {
                // User state is set by onAuthStateChange, so we don't need to call setUser here.
                return null;
            } else {
                await supabase.auth.signOut();
                return 'Your account role does not match this login portal. Please use the other portal.';
            }
        }
    }
    return 'Invalid email or password.';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    attendanceData.resetData();
    setFacultyView('dashboard');
  };

  const handleForgotPassword = async (email: string): Promise<string | null> => {
    // Align with Supabase v2 API for resetPasswordForEmail.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    });
    return error ? error.message : null;
  };

  const renderFacultyView = () => {
    switch (facultyView) {
      case 'dashboard':
        return <Dashboard courses={attendanceData.courses} />;
      case 'courses':
        return <CourseManager {...attendanceData} />;
      case 'analytics':
        return <Analytics courses={attendanceData.courses} />;
      default:
        return <Dashboard courses={attendanceData.courses} />;
    }
  };

  if (authLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
        </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} onSignUp={handleSignUp} onForgotPassword={handleForgotPassword} />;
  }
  
  if (user.role === 'faculty') {
      return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
          <Sidebar 
            view={facultyView} 
            setView={setFacultyView} 
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
                view={facultyView} 
                user={user} 
                onLogout={handleLogout} 
                onMenuClick={() => setSidebarOpen(true)}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6 lg:p-8">
              {renderFacultyView()}
            </main>
          </div>
        </div>
      );
  }

  if (user.role === 'student') {
      return <StudentView 
        user={user} 
        onLogout={handleLogout} 
        markAttendance={attendanceData.markAttendance}
        courses={attendanceData.courses}
     />;
  }

  return null;
}

function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    )
}

export default App;
