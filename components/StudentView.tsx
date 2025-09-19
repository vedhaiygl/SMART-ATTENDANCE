
import React, { useState, useEffect, useCallback } from 'react';
import StudentAttendancePage from './StudentAttendancePage';
import StudentScanPage from './StudentScanPage';
import LeaderboardPage from './LeaderboardPage';
import AttendanceCalendarPage from './AttendanceCalendarPage';
import type { User, MarkAttendanceResult, Course, PendingAttendanceRecord } from '../types';
import { useTheme } from '../App';
import { ICONS } from '../constants';

interface StudentViewProps {
    user: User;
    onLogout: () => void;
    markAttendance: (code: string, studentId: string, selfieData?: string) => MarkAttendanceResult;
    courses: Course[];
}

type StudentPortalView = 'attendance' | 'scan' | 'leaderboard' | 'calendar';

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? ICONS.moon : ICONS.sun}
        </button>
    );
};


const StudentView: React.FC<StudentViewProps> = ({ user, onLogout, markAttendance, courses }) => {
    const [view, setView] = useState<StudentPortalView>('attendance');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

    const syncPendingAttendance = useCallback(() => {
        const pendingRaw = localStorage.getItem('pendingAttendance');
        if (!pendingRaw) return;

        let records: PendingAttendanceRecord[];
        try {
            records = JSON.parse(pendingRaw);
        } catch (e) {
            console.error("Failed to parse pending attendance", e);
            localStorage.removeItem('pendingAttendance');
            return;
        }

        if (records.length === 0) return;

        setSyncStatus('syncing');

        let successCount = 0;
        records.forEach(record => {
            const result = markAttendance(record.code, record.studentId, record.selfieData);
            if (result === 'success' || result === 'already_marked') {
                successCount++;
            }
        });

        localStorage.removeItem('pendingAttendance');

        if (successCount > 0) {
            setSyncStatus('synced');
            setTimeout(() => setSyncStatus('idle'), 5000);
        } else {
            setSyncStatus('idle');
        }
    }, [markAttendance]);

    useEffect(() => {
        if (navigator.onLine) {
            syncPendingAttendance();
        }

        window.addEventListener('online', syncPendingAttendance);

        return () => {
            window.removeEventListener('online', syncPendingAttendance);
        };
    }, [syncPendingAttendance]);


    const renderContent = () => {
        switch (view) {
            case 'attendance':
                return <StudentAttendancePage user={user} courses={courses} />;
            case 'scan':
                return <StudentScanPage user={user} markAttendance={markAttendance} />;
            case 'leaderboard':
                return <LeaderboardPage user={user} courses={courses} />;
            case 'calendar':
                return <AttendanceCalendarPage user={user} courses={courses} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-20">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Portal</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-slate-600 dark:text-slate-300 hidden sm:inline">Welcome, {user.name}</span>
                    <ThemeToggle />
                    <button
                        onClick={onLogout}
                        className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-500 transition-all active:scale-95 text-sm"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {syncStatus !== 'idle' && (
                <div className={`p-3 text-center text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 sticky top-0 z-10 ${syncStatus === 'syncing' ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'bg-green-500/20 text-green-700 dark:text-green-300'}`}>
                    <span className={syncStatus === 'syncing' ? 'animate-pulse' : ''}>{ICONS.cloudUpload}</span>
                    {syncStatus === 'syncing' ? 'Syncing offline attendance...' : 'Offline attendance synced successfully!'}
                </div>
            )}
            
            <main className="flex-1 flex flex-col items-center p-4 sm:p-6">
                <div className="w-full max-w-4xl">
                    <div className="flex space-x-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-xl">
                        <button
                            onClick={() => setView('attendance')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-all active:scale-95 ${view === 'attendance' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            My Attendance
                        </button>
                        <button
                            onClick={() => setView('scan')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-all active:scale-95 ${view === 'scan' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            Scan Code
                        </button>
                        <button
                            onClick={() => setView('leaderboard')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-all active:scale-95 ${view === 'leaderboard' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            Leaderboard
                        </button>
                         <button
                            onClick={() => setView('calendar')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-all active:scale-95 ${view === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            Calendar
                        </button>
                    </div>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default StudentView;
