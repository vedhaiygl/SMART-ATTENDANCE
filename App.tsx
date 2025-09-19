
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
import LoadingScreen from './components/LoadingScreen';
import SplashScreen from './components/SplashScreen';
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

const anonymizeName = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
        return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    }
    return name;
};

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [facultyView, setFacultyView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const attendanceData = useAttendanceData(user);

  useEffect(() => {
    // onAuthStateChange is called upon subscription with current session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            // User is logged in
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('name, role')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    name: profile.name,
                    role: profile.role,
                });
                setShowSplashScreen(false); // A user is logged in, hide splash
            } else {
                console.error('Profile not found for authenticated user:', session.user.id, error);
                await supabase.auth.signOut();
                setUser(null);
            }
        } else {
            // User is logged out, or no session
            setUser(null);
        }
        setIsInitializing(false);
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (email: string, password: string, role: UserRole): Promise<string | null> => {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return signInError.message;

    if (signInData.user) {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .single();

        if (profileError || !profileData) return 'Could not retrieve user profile.';
        if (profileData.role !== role) {
            await supabase.auth.signOut(); // Sign out the user
            return 'Your account role does not match this login portal. Please use the other portal.';
        }
        // The onAuthStateChange listener will handle setting the user state.
        return null;
    }
    return 'An unexpected error occurred during login.';
  };

  const handleSignUp = async (name: string, email: string, password: string, role: UserRole): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;

    if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            name,
            role
        });
        if (profileError) {
            console.error("Error creating profile:", profileError);
            return `Account created, but profile could not be saved. Please contact support. Error: ${profileError.message}`;
        }
        if (role === 'student') {
            const { error: studentError } = await supabase.from('students').insert({
                id: data.user.id,
                name,
                anonymized_name: anonymizeName(name)
            });
            if (studentError) {
                 console.error("Error creating student record:", studentError);
                 return `Account created, but student record could not be saved. Please contact support. Error: ${studentError.message}`;
            }
        }
        return null;
    }
    return 'An unexpected error occurred during sign up.';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowSplashScreen(true);
    attendanceData.resetData();
    setFacultyView('dashboard');
  };

  const handleForgotPassword = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
        if (error.message.includes('not find user')) {
             return 'If an account existed for this email, a reset link would be sent.';
        }
        return error.message;
    }
    return 'If an account existed for this email, a reset link has been sent.';
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

  if (isInitializing || (user && attendanceData.loading)) {
    return <LoadingScreen />;
  }

  if (!user && showSplashScreen) {
    return <SplashScreen onEnter={() => setShowSplashScreen(false)} />;
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
