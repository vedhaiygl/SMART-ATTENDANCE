import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StudentAttendancePage from './StudentAttendancePage';
import StudentScanPage from './StudentScanPage';
import LeaderboardPage from './LeaderboardPage';
import AttendanceCalendarPage from './AttendanceCalendarPage';
import StudyBuddyPage from './StudyBuddyPage';
import StudentLiveClassView from './StudentLiveClassView';
import StudentLiveClassPage from './StudentLiveClassPage';
import StudentFeesPage from './StudentFeesPage';
import type { User, MarkAttendanceResult, Course, PendingAttendanceRecord, StudentViewType, LiveClass, Student } from '../types';
import { useTheme } from '../App';
import { ICONS } from '../constants';

interface StudentViewProps {
    user: User;
    onLogout: () => void;
    markAttendance: (code: string, studentId: string, selfieData?: string) => MarkAttendanceResult;
    courses: Course[];
    allStudents: Student[];
    studentJoinsLiveClass: (courseId: string, liveClassId: string, studentId: string) => void;
    studentLeavesLiveClass: (courseId: string, liveClassId: string, studentId: string) => void;
}

// --- Reusable Nav Item for Sidebar ---
const StudentNavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-2 rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98] ${
      isActive
        ? 'bg-sky-600 text-white shadow-lg'
        : 'text-zinc-500 dark:text-zinc-300 hover:bg-sky-100 dark:hover:bg-blue-700 hover:text-zinc-800 dark:hover:text-zinc-200'
    }`}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </li>
);

// --- Student Sidebar Component ---
const StudentSidebar: React.FC<{
    view: StudentViewType;
    setView: (view: StudentViewType) => void;
    isOpen: boolean;
    onClose: () => void;
}> = ({ view, setView, isOpen, onClose }) => {
    const handleSetView = (newView: StudentViewType) => {
        setView(newView);
        onClose();
    };
    
    const navItems: { id: StudentViewType; label: string; icon: React.ReactNode; }[] = [
        { id: 'liveClasses', label: 'Live Classes', icon: ICONS.live },
        { id: 'attendance', label: 'Attendance', icon: ICONS.calendar },
        { id: 'scan', label: 'Scan Code', icon: ICONS.qrcode },
        { id: 'leaderboard', label: 'Leaderboard', icon: ICONS.leaderboard },
        { id: 'calendar', label: 'Calendar', icon: ICONS.calendar },
        { id: 'studyBuddy', label: 'Study Buddy', icon: ICONS.studyBuddy },
        { id: 'fees', label: 'Fees', icon: ICONS.fees },
    ];

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-blue-900 p-4 flex flex-col border-r border-sky-100 dark:border-blue-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button onClick={onClose} className="lg:hidden absolute top-4 right-4 text-zinc-500 dark:text-zinc-300" aria-label="Close menu">
                    {ICONS.close}
                </button>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-10 flex items-center justify-center py-4">
                    <span className="bg-sky-600 p-2 rounded-lg mr-2 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                    </span>
                    Student Portal
                </div>
                <nav>
                    <ul>
                       {navItems.map(item => (
                           <StudentNavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={view === item.id}
                                onClick={() => handleSetView(item.id)}
                            />
                       ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

// --- Student Header Component ---
const StudentHeader: React.FC<{
    view: StudentViewType;
    user: User;
    onLogout: () => void;
    onMenuClick: () => void;
}> = ({ view, user, onLogout, onMenuClick }) => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const title = useMemo(() => {
        // Creates a display-friendly title from the view name (e.g., 'liveClasses' -> 'Live Classes')
        return view.charAt(0).toUpperCase() + view.slice(1).replace(/([A-Z])/g, ' $1');
    }, [view]);

    return (
        <header className="bg-white/80 dark:bg-blue-900/80 backdrop-blur-sm p-4 border-b border-sky-100 dark:border-blue-800 flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center">
                <button onClick={onMenuClick} className="text-zinc-800 dark:text-zinc-200 mr-4 lg:hidden" aria-label="Open menu">
                    {ICONS.menu}
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-gray-600 dark:text-gray-300 hidden sm:inline">Welcome, {user.name}</span>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-500 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-blue-800 transition-all active:scale-90"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? ICONS.moon : ICONS.sun}
                </button>
                <button onClick={onLogout} className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-500 transition-all active:scale-95 text-sm">
                    Logout
                </button>
            </div>
        </header>
    );
};


// --- Main Student View Component ---
const StudentView: React.FC<StudentViewProps> = ({ user, onLogout, markAttendance, courses, allStudents, studentJoinsLiveClass, studentLeavesLiveClass }) => {
    const [view, setView] = useState<StudentViewType>('liveClasses');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
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
        try { records = JSON.parse(pendingRaw); } catch (e) { localStorage.removeItem('pendingAttendance'); return; }
        if (records.length === 0) return;
        setSyncStatus('syncing');
        let successCount = 0;
        for (const record of records) {
            const result = markAttendance(record.code, record.studentId, record.selfieData);
            if (result === 'success' || result === 'already_marked') successCount++;
        }
        localStorage.removeItem('pendingAttendance');
        setSyncStatus(successCount > 0 ? 'synced' : 'idle');
        if (successCount > 0) setTimeout(() => setSyncStatus('idle'), 5000);
    }, [markAttendance]);

    useEffect(() => {
        if (navigator.onLine) syncPendingAttendance();
        window.addEventListener('online', syncPendingAttendance);
        return () => window.removeEventListener('online', syncPendingAttendance);
    }, [syncPendingAttendance]);

    const renderContent = () => {
        switch (view) {
            case 'liveClasses': return <StudentLiveClassPage user={user} courses={courses} onJoinClass={setJoinedLiveClassInfo} />;
            case 'attendance': return <StudentAttendancePage user={user} courses={courses} />;
            case 'scan': return <StudentScanPage user={user} markAttendance={markAttendance} />;
            case 'leaderboard': return <LeaderboardPage user={user} courses={courses} />;
            case 'calendar': return <AttendanceCalendarPage user={user} courses={courses} />;
            case 'studyBuddy': return <StudyBuddyPage user={user} courses={courses} />;
            case 'fees': return <StudentFeesPage user={user} allStudents={allStudents} />;
            default: return null;
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
        );
    }

    return (
        <div className="flex h-screen bg-sky-50 dark:bg-blue-950 text-gray-800 dark:text-gray-200 font-sans">
            <StudentSidebar
                view={view}
                setView={setView}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <StudentHeader
                    view={view}
                    user={user}
                    onLogout={onLogout}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                
                {activeLiveClasses.length > 0 && !joinedLiveClassInfo && (
                    <div className="sticky top-[73px] z-10">
                        {activeLiveClasses.map(({ course, liveClass }) => (
                            <div key={liveClass.id} className="bg-red-600 text-white p-3 flex flex-col sm:flex-row justify-between items-center animate-fade-in gap-2">
                                <div className="flex items-center">
                                    <span className="relative flex h-3 w-3 mr-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                    </span>
                                    <p><span className="font-bold">LIVE:</span> A class for <span className="font-semibold">{course.name}</span> has started.</p>
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
                    <div className={`p-3 text-center text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${syncStatus === 'syncing' ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'bg-green-500/20 text-green-700 dark:text-green-300'}`}>
                        <span className={syncStatus === 'syncing' ? 'animate-pulse' : ''}>{ICONS.cloudUpload}</span>
                        {syncStatus === 'syncing' ? 'Syncing offline attendance...' : 'Offline attendance synced successfully!'}
                    </div>
                )}

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default StudentView;
