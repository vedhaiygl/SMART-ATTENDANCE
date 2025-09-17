import React, { useState } from 'react';
import StudentAttendancePage from './StudentAttendancePage';
import StudentScanPage from './StudentScanPage';
import type { User, MarkAttendanceResult, Course } from '../types';

interface StudentViewProps {
    user: User;
    onLogout: () => void;
    markAttendance: (studentId: string, qrCodeValue: string) => MarkAttendanceResult;
    courses: Course[];
}

type StudentPortalView = 'attendance' | 'scan';

const StudentView: React.FC<StudentViewProps> = ({ user, onLogout, markAttendance, courses }) => {
    const [view, setView] = useState<StudentPortalView>('attendance');

    return (
        <div className="flex flex-col min-h-screen bg-slate-900 text-slate-200 font-sans">
            <header className="bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-700 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Student Portal</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-slate-300">Welcome, {user.name}</span>
                    <button
                        onClick={onLogout}
                        className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-500 transition-colors text-sm"
                    >
                        Logout
                    </button>
                </div>
            </header>
            
            <main className="flex-1 flex flex-col items-center p-6">
                <div className="w-full max-w-4xl">
                    <div className="flex space-x-2 p-1 bg-slate-800 rounded-lg max-w-xs">
                        <button
                            onClick={() => setView('attendance')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-colors ${view === 'attendance' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                            My Attendance
                        </button>
                        <button
                            onClick={() => setView('scan')}
                            className={`w-full text-center font-medium p-2 rounded-md transition-colors ${view === 'scan' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                            Scan Code
                        </button>
                    </div>

                     {view === 'attendance' ? (
                        <StudentAttendancePage user={user} courses={courses} />
                     ) : (
                        <StudentScanPage user={user} markAttendance={markAttendance} />
                     )}
                </div>
            </main>
        </div>
    );
};

export default StudentView;