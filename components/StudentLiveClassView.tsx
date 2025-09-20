import React, { useEffect, useState } from 'react';
import type { User, Course, LiveClass } from '../types';
import { ICONS } from '../constants';

interface StudentLiveClassViewProps {
    user: User;
    course: Course;
    liveClass: LiveClass;
    onLeave: () => void;
    studentJoinsLiveClass: (courseId: string, liveClassId: string, studentId: string) => void;
    studentLeavesLiveClass: (courseId: string, liveClassId: string, studentId: string) => void;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const StudentLiveClassView: React.FC<StudentLiveClassViewProps> = ({
    user,
    course,
    liveClass,
    onLeave,
    studentJoinsLiveClass,
    studentLeavesLiveClass
}) => {
    const [duration, setDuration] = useState(0);

    // Effect to handle automatic exit when faculty ends the class
    useEffect(() => {
        if (liveClass.status === 'ended') {
            onLeave();
        }
    }, [liveClass.status, onLeave]);

    // Effect to manage joining, leaving, and the session timer
    useEffect(() => {
        studentJoinsLiveClass(course.id, liveClass.id, user.id);

        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(timer);
            studentLeavesLiveClass(course.id, liveClass.id, user.id);
        };
    }, [course.id, liveClass.id, user.id, studentJoinsLiveClass, studentLeavesLiveClass]);

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-50 flex flex-col animate-fade-in">
            <header className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">{course.name} - Live Class</h1>
                </div>
                 <div className="font-mono text-sm bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-md text-slate-700 dark:text-slate-200">
                    {formatTime(duration)}
                </div>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                 <div className="w-full max-w-2xl aspect-video bg-black rounded-2xl flex flex-col items-center justify-center text-white border-4 border-slate-200 dark:border-slate-700">
                    <div className="text-indigo-400 mb-4 animate-pulse">{ICONS.live}</div>
                    <h2 className="text-3xl font-bold">You are in the live class</h2>
                    <p className="text-slate-400 mt-2">Your participation is being recorded. Please wait for the instructor to end the session.</p>
                </div>
            </main>
            <footer className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                    You cannot leave this session. It will end automatically when the faculty closes the class.
                </p>
            </footer>
        </div>
    );
};

export default StudentLiveClassView;