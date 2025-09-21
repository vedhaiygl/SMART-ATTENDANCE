import React, { useState, useEffect, useMemo } from 'react';
import type { LiveClass, Course, Student } from '../types';
import { ICONS } from '../constants';

interface FacultyLiveClassModalProps {
    liveClass: LiveClass;
    course: Course;
    onClose: () => void;
    endLiveClass: (courseId: string, liveClassId: string) => void;
}

const formatDuration = (minutes: number) => {
    if (minutes < 1) {
        return `${Math.floor(minutes * 60)}s`;
    }
    return `${Math.floor(minutes)}m ${Math.floor((minutes % 1) * 60)}s`;
};

const FacultyLiveClassModal: React.FC<FacultyLiveClassModalProps> = ({ liveClass, course, onClose, endLiveClass }) => {
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setTick(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const { activeAttendees, pastAttendees } = useMemo(() => {
        const active: any[] = [];
        const past: any[] = [];

        liveClass.attendees.forEach(attendee => {
            const student = course.students.find(s => s.id === attendee.studentId);
            if (!student) return;

            const augmentedAttendee = { ...attendee, studentName: student.name };

            if (attendee.leaveTime) {
                past.push(augmentedAttendee);
            } else {
                active.push(augmentedAttendee);
            }
        });
        return { activeAttendees: active, pastAttendees: past };
    }, [liveClass.attendees, course.students]);
    
    const handleEndClass = () => {
        if (window.confirm('Are you sure you want to end this live class for all students?')) {
            endLiveClass(course.id, liveClass.id);
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white dark:bg-blue-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-sky-100 dark:border-blue-800 animate-slide-in-top flex flex-col"
                style={{ height: 'min(600px, 90vh)' }}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                             <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Class Monitor</h2>
                        </div>
                        <p className="text-gray-500 dark:text-sky-200 mt-1">
                            Course: <strong className="text-gray-700 dark:text-gray-200">{course.name}</strong>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 dark:text-sky-200 hover:text-gray-900 dark:hover:text-white transition-transform active:scale-90">
                        {ICONS.close}
                    </button>
                </div>

                <div className="mt-6 flex-1 overflow-y-auto pr-2 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">Active Participants ({activeAttendees.length})</h3>
                        <div className="space-y-2">
                             {activeAttendees.length > 0 ? activeAttendees.map(attendee => {
                                const durationMs = Date.now() - new Date(attendee.joinTime).getTime();
                                const durationMinutes = durationMs / (1000 * 60);
                                return (
                                    <div key={attendee.studentId} className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                                        <p className="font-semibold text-green-800 dark:text-green-300">{attendee.studentName}</p>
                                        <p className="text-sm text-green-700 dark:text-green-400 font-mono">
                                            {formatDuration(durationMinutes)}
                                        </p>
                                    </div>
                                );
                            }) : <p className="text-sm text-gray-500 dark:text-sky-200 italic">No students have joined yet.</p>}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">Participation History ({pastAttendees.length})</h3>
                        <div className="space-y-2">
                            {pastAttendees.length > 0 ? pastAttendees.map(attendee => (
                                <div key={attendee.studentId} className="flex justify-between items-center p-3 bg-sky-100 dark:bg-blue-800/50 rounded-lg">
                                    <p className="font-semibold text-gray-600 dark:text-gray-300">{attendee.studentName}</p>
                                    <p className="text-sm text-gray-500 dark:text-sky-200">
                                        Stayed for {formatDuration(attendee.durationMinutes)}
                                    </p>
                                </div>
                            )) : <p className="text-sm text-gray-500 dark:text-sky-200 italic">No students have left the session yet.</p>}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-sky-100 dark:border-blue-800">
                    <button
                        onClick={handleEndClass}
                        className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-500 transition-all active:scale-95"
                    >
                        End Class for All
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FacultyLiveClassModal;