import React, { useState } from 'react';
import StudentAttendancePage from './StudentAttendancePage';
import StudentScanPage from './StudentScanPage';
import LeaderboardPage from './LeaderboardPage';
import type { User, MarkAttendanceResult, Course } from '../types';
import { useTheme } from '../App';
import { ICONS } from '../constants';

interface StudentViewProps {
    user: User;
    onLogout: () => void;
    markAttendance: (studentId: string, qrCodeValue: string) => MarkAttendanceResult;
    courses: Course[];
}

type StudentPortalView = 'attendance' | 'scan' | 'leaderboard';

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? ICONS.moon : ICONS.sun}
        </button>
    );
};


const StudentView: React.FC<StudentViewProps> = ({ user, onLogout, markAttendance, courses }) => {
    const [view, setView] = useState<StudentPortalView>('attendance');

    const renderContent = () => {
        switch (view) {
            case 'attendance':
                return <StudentAttendancePage user={user} courses={courses} />;
            case 'scan':
                return <StudentScanPage user={user} markAttendance={markAttendance} />;
            case 'leaderboard':
                return <LeaderboardPage user={user} courses={courses} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Portal</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-slate-600 dark:text-slate-300 hidden sm:inline">Welcome, {user.name}</span>
                    <ThemeToggle />
                    <button
                        onClick={onLogout}
                        className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-500 transition-colors text-sm"
                    >
                        Logout
                    </button>
                </div>
            </header>
            
            <main className="flex-1 flex flex-col items-center p-4 sm:p-6">
                <div className="w-full max-w-4xl">
                    <div className="flex space-x-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-md">
                        <button
                            onClick={() => setView('attendance')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-colors ${view === 'attendance' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            My Attendance
                        </button>
                        <button
                            onClick={() => setView('scan')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-colors ${view === 'scan' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            Scan Code
                        </button>
                        <button
                            onClick={() => setView('leaderboard')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-colors ${view === 'leaderboard' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            Leaderboard
                        </button>
                    </div>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default StudentView;