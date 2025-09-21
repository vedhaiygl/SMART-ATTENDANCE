

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StudentAttendancePage from './StudentAttendancePage';
import StudentScanPage from './StudentScanPage';
import LeaderboardPage from './LeaderboardPage';
import AttendanceCalendarPage from './AttendanceCalendarPage';
import StudyBuddyPage from './StudyBuddyPage';
import StudentLiveClassView from './StudentLiveClassView';
import StudentLiveClassPage from './StudentLiveClassPage';
import type { User, MarkAttendanceResult, Course, PendingAttendanceRecord, StudentViewType, LiveClass } from '../types';
import { useTheme } from '../App';
import { ICONS } from '../constants';

interface StudentViewProps {
    user: User;
    onLogout: () => void;
    markAttendance: (code: string, studentId: string, selfieData?: string) => MarkAttendanceResult;
    courses: Course[];
    studentJoinsLiveClass: (courseId: string, liveClassId: string, studentId: string) => void;
    studentLeavesLiveClass: (courseId: string, liveClassId: string, studentId: string) => void;
}

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-blue-800 transition-all active:scale-90"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? ICONS.moon : ICONS.sun}
        </button>
    );
};


const StudentView: React.FC<StudentViewProps> = ({ user, onLogout, markAttendance, courses, studentJoinsLiveClass, studentLeavesLiveClass }) => {
    const [view, setView] = useState<StudentViewType>('liveClasses');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
    const [joinedLiveClassInfo, setJoinedLiveClassInfo] = useState<{ courseId: string, liveClassId: string } | null>(null);

    const activeLiveClasses = useMemo(() => {
        const liveClasses: { course: Course, liveClass: LiveClass }[] = [];
        const enrolledCourses = courses.filter(c => c.students.some(s => s.id === user.id));
        for (const course of enrolledCourses) {
            const liveSession = course.liveClasses?.find(lc => lc.status === 'live');
            if (liveSession) {
                liveClasses.push({ course, liveClass: liveSession });
            }
        }
        return liveClasses;
    }, [courses, user.id]);

    const currentLiveClassData = useMemo(() => {
        if (!joinedLiveClassInfo) return null;
        const course = courses.find(c => c.id === joinedLiveClassInfo.courseId);
        if (!course) return null;
        const liveClass = course.liveClasses.find(lc => lc.id === joinedLiveClassInfo.liveClassId);
        if (!liveClass) return null;
        return { course, liveClass };
    }, [courses, joinedLiveClassInfo]);


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
        for (const record of records) {
            const result = markAttendance(record.code, record.studentId, record.selfieData);
            if (result === 'success' || result === 'already_marked') {
                successCount++;
            }
        }

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
            case 'liveClasses':
                return <StudentLiveClassPage user={user} courses={courses} onJoinClass={setJoinedLiveClassInfo} />;
            case 'attendance':
                return <StudentAttendancePage user={user} courses={courses} />;
            case 'scan':
                return <StudentScanPage user={user} markAttendance={markAttendance} />;
            case 'leaderboard':
                return <LeaderboardPage user={user} courses={courses} />;
            case 'calendar':
                return <AttendanceCalendarPage user={user} courses={courses} />;
            case 'studyBuddy':
                return <StudyBuddyPage user={user} courses={courses} />;
            default:
                return null;
        }
    };

    if (currentLiveClassData) {
        return (
             <StudentLiveClassView
                user={user}
                course={currentLiveClassData.course}
                liveClass={currentLiveClassData.liveClass}
                onLeave={() => setJoinedLiveClassInfo(null)}
                studentJoinsLiveClass={studentJoinsLiveClass}
                studentLeavesLiveClass={studentLeavesLiveClass}
            />
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-sky-50 dark:bg-blue-950 text-gray-800 dark:text-gray-200 font-sans">
            <header className="bg-white/80 dark:bg-blue-900/80 backdrop-blur-sm p-4 border-b border-sky-100 dark:border-blue-800 flex justify-between items-center sticky top-0 z-20">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Portal</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-gray-600 dark:text-gray-300 hidden sm:inline">Welcome, {user.name}</span>
                    <ThemeToggle />
                    <button
                        onClick={onLogout}
                        className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-500 transition-all active:scale-95 text-sm"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {activeLiveClasses.length > 0 && !joinedLiveClassInfo && (
                <div className="sticky top-[73px] z-10">
                    {activeLiveClasses.map(({ course, liveClass }) => (
                        <div key={liveClass.id} className="bg-red-600 text-white p-3 flex flex-col sm:flex-row justify-between items-center animate-fade-in gap-2">
                            <div className="flex items-center">
                                <span className="relative flex h-3 w-3 mr-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                                <p>
                                    <span className="font-bold">LIVE:</span> A class for <span className="font-semibold">{course.name}</span> has started.
                                </p>
                            </div>
                            <button
                                onClick={() => setJoinedLiveClassInfo({ courseId: course.id, liveClassId: liveClass.id })}
                                className="bg-white text-red-600 font-bold py-1 px-4 rounded-lg hover:bg-red-100 transition-all active:scale-95 text-sm w-full sm:w-auto"
                            >
                                Join Now
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {syncStatus !== 'idle' && (
                <div className={`p-3 text-center text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 sticky top-0 z-10 ${syncStatus === 'syncing' ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'bg-green-500/20 text-green-700 dark:text-green-300'}`}>
                    <span className={syncStatus === 'syncing' ? 'animate-pulse' : ''}>{ICONS.cloudUpload}</span>
                    {syncStatus === 'syncing' ? 'Syncing offline attendance...' : 'Offline attendance synced successfully!'}
                </div>
            )}
            
            <main className="flex-1 flex flex-col items-center p-4 sm:p-6">
                <div className="w-full max-w-4xl">
                    <div className="flex space-x-2 p-1 bg-sky-100 dark:bg-blue-800 rounded-lg overflow-x-auto">
                        <button
                            onClick={() => setView('liveClasses')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-all active:scale-95 ${view === 'liveClasses' ? 'bg-sky-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-sky-200 dark:hover:bg-blue-700'}`}
                        >
                            Live Classes
                        </button>
                        <button
                            onClick={() => setView('attendance')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-all active:scale-95 ${view === 'attendance' ? 'bg-sky-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-sky-200 dark:hover:bg-blue-700'}`}
                        >
                            My Attendance
                        </button>
                        <button
                            onClick={() => setView('scan')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-all active:scale-95 ${view === 'scan' ? 'bg-sky-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-sky-200 dark:hover:bg-blue-700'}`}
                        >
                            Scan Code
                        </button>
                        <button
                            onClick={() => setView('leaderboard')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-all active:scale-95 ${view === 'leaderboard' ? 'bg-sky-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-sky-200 dark:hover:bg-blue-700'}`}
                        >
                            Leaderboard
                        </button>
                         <button
                            onClick={() => setView('calendar')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-all active:scale-95 ${view === 'calendar' ? 'bg-sky-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-sky-200 dark:hover:bg-blue-700'}`}
                        >
                            Calendar
                        </button>
                         <button
                            onClick={() => setView('studyBuddy')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-all active:scale-95 ${view === 'studyBuddy' ? 'bg-sky-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-sky-200 dark:hover:bg-blue-700'}`}
                        >
                            Study Buddy
                        </button>
                    </div>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default StudentView;