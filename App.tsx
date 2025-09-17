import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CourseManager from './components/CourseManager';
import Analytics from './components/Analytics';
import Login from './components/Login';
import StudentView from './components/StudentView';
import { useAttendanceData } from './hooks/useAttendanceData';
import type { ViewType, User, UserRole, MarkAttendanceResult } from './types';

// Mock user data and credentials for a version without a backend.
const MOCK_CREDENTIALS: Record<string, { password: string, user: User }> = {
    'faculty@university.edu': {
        password: 'password123',
        user: { id: 'user-faculty-1', name: 'Dr. Evelyn Reed', role: 'faculty' }
    },
    'student@university.edu': {
        password: 'password123',
        user: { id: 'student-1', name: 'Alex Johnson', role: 'student' }
    }
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [facultyView, setFacultyView] = useState<ViewType>('dashboard');
  const attendanceData = useAttendanceData();

  const handleLogin = async (email: string, password: string, role: UserRole): Promise<string | null> => {
    // Simulate an async API call for authentication.
    return new Promise(resolve => {
        setTimeout(() => {
            const account = MOCK_CREDENTIALS[email.toLowerCase()];

            if (account && account.password === password) {
                if (account.user.role === role) {
                    setUser(account.user);
                    resolve(null); // Success
                } else {
                    resolve('Your account role does not match this login portal. Please use the other portal.');
                }
            } else {
                resolve('Invalid email or password.');
            }
        }, 500);
    });
  };

  const handleLogout = () => {
    setUser(null);
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

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }
  
  if (user.role === 'faculty') {
      return (
        <div className="flex h-screen bg-slate-900 text-slate-200 font-sans">
          <Sidebar view={facultyView} setView={setFacultyView} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header view={facultyView} user={user} onLogout={handleLogout} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 p-6 lg:p-8">
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

export default App;