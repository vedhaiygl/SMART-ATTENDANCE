import React, { useState, createContext, useContext, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CourseManager from './components/CourseManager';
import Analytics from './components/Analytics';
import Login from './components/Login';
import StudentView from './components/StudentView';
import { useAttendanceData } from './hooks/useAttendanceData';
import type { FacultyViewType, User, UserRole } from './types';
import LoadingScreen from './components/LoadingScreen';
import SplashScreen from './components/SplashScreen';

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

const MOCK_USERS: User[] = [
    { id: 'faculty-1', name: 'Dr. Admin', email: 'faculty@university.edu', role: 'faculty' },
    { id: 'student-1', name: 'Vedhan', email: 'vedhanmail@gmail.com', role: 'student' },
    { id: 'student-2', name: 'Mithun', email: 'mithunk@gmail.com', role: 'student' },
    { id: 'student-3', name: 'Sanjeevi', email: 'sanjeevi@gmail.com', role: 'student' },
];

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [facultyView, setFacultyView] = useState<FacultyViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const attendanceData = useAttendanceData(user);

  useEffect(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
        try {
            const savedUser: User = JSON.parse(savedSession);
            setUser(savedUser);
            setShowSplashScreen(false); // If logged in, don't show splash screen
        } catch (error) {
            console.error("Error parsing user session from localStorage:", error);
            localStorage.removeItem('userSession');
        }
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (email: string, password: string, role: UserRole, rememberMe: boolean): string | null => {
    // Find user by email first
    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    // If no user is found, or password is incorrect, return a generic error
    if (!foundUser || password !== 'password123') {
        return 'Invalid email or password.';
    }

    // If credentials are correct, check if the role matches the portal
    if (foundUser.role !== role) {
        return 'Your account role does not match this login portal. Please use the other portal.';
    }

    // If everything is correct, log the user in
    setUser(foundUser);
    if (rememberMe) {
        localStorage.setItem('userSession', JSON.stringify(foundUser));
    } else {
        localStorage.removeItem('userSession');
    }
    return null;
  };

  const handleLogout = () => {
    setUser(null);
    setShowSplashScreen(true);
    localStorage.removeItem('userSession');
    attendanceData.resetData();
    setFacultyView('dashboard');
  };

  const handleForgotPassword = (email: string): string | null => {
    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
        return `Password reset is not available in this demo. Your password is 'password123'.`;
    }
    return 'If an account existed for this email, a reset link would be sent.';
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

  if (isInitializing || attendanceData.loading) {
    return <LoadingScreen />;
  }

  if (showSplashScreen) {
    return <SplashScreen onEnter={() => setShowSplashScreen(false)} />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} onForgotPassword={handleForgotPassword} />;
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
        studentJoinsLiveClass={attendanceData.studentJoinsLiveClass}
        studentLeavesLiveClass={attendanceData.studentLeavesLiveClass}
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