import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Course } from '../types';
import QRCodeModal from './QRCodeModal';

interface CourseManagerProps {
    courses: Course[];
    createNewSession: (courseId: string, type: 'Online' | 'Offline', limit: number) => { sessionId: string; qrCodeValue: string };
    simulateSingleScan: (courseId: string, sessionId: string) => void;
}

const CourseManager: React.FC<CourseManagerProps> = ({ courses, createNewSession, simulateSingleScan }) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses.length > 0 ? courses[0].id : null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [limit, setLimit] = useState(50);

    const selectedCourse = useMemo(() => {
        return courses.find(c => c.id === selectedCourseId);
    }, [courses, selectedCourseId]);
    
    const activeSession = useMemo(() => {
        return selectedCourse?.sessions.find(s => s.id === activeSessionId);
    }, [selectedCourse, activeSessionId]);

    // FIX: Moved `useRef` to the top level of the component as per Rules of Hooks,
    // and initialized it with `undefined` to fix the "Expected 1 arguments" error.
    const timerId = useRef<number | undefined>(undefined);

    useEffect(() => {
        const runSimulationStep = () => {
            const course = courses.find(c => c.id === selectedCourseId);
            const session = course?.sessions.find(s => s.id === activeSessionId);

            if (!course || !session || !isModalOpen) {
                return; 
            }

            const isLimitReached = session.limit !== undefined && (session.scannedCount ?? 0) >= session.limit;
            const isAbsentStudentAvailable = course.students.some(student => 
                course.attendance.find(att => att.sessionId === session.id && att.studentId === student.id && att.status === 'Absent')
            );
            
            if (isLimitReached || !isAbsentStudentAvailable) {
                return;
            }
            
            if (session.qrCodeValue === 'generating...') {
                 timerId.current = window.setTimeout(runSimulationStep, 500);
                 return;
            }

            simulateSingleScan(selectedCourseId!, activeSessionId!);
            
            timerId.current = window.setTimeout(runSimulationStep, 2000);
        };

        if (isModalOpen) {
            timerId.current = window.setTimeout(runSimulationStep, 1500); 
        }

        return () => {
            clearTimeout(timerId.current);
        };
    }, [isModalOpen, selectedCourseId, activeSessionId, courses, simulateSingleScan]);


    const handleStartSession = () => {
        if (selectedCourseId) {
            if (limit <= 0) {
                alert('Please enter a valid limit greater than 0.');
                return;
            }
            const { sessionId } = createNewSession(selectedCourseId, 'Offline', limit);
            setActiveSessionId(sessionId);
            setIsModalOpen(true);
        }
    };

    const AttendanceCell: React.FC<{ studentId: string; sessionId: string }> = ({ studentId, sessionId }) => {
        const record = selectedCourse?.attendance.find(a => a.studentId === studentId && a.sessionId === sessionId);
        if (!record) return <td className="p-3 text-center">-</td>;
        return (
            <td className="p-3 text-center">
                <span className={`w-5 h-5 inline-block rounded-full ${record.status === 'Present' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </td>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Course Management</h2>
                    <p className="text-slate-400 mt-1">Select a course to view attendance and start new sessions.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <label htmlFor="limit-input" className="text-slate-300 font-medium text-sm">Scan Limit:</label>
                        <input
                            id="limit-input"
                            type="number"
                            value={limit}
                            onChange={e => setLimit(parseInt(e.target.value, 10) || 0)}
                            className="bg-slate-700 w-20 sm:w-24 text-white rounded-md py-2 px-3 border border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                            min="1"
                        />
                    </div>
                    <button
                        onClick={handleStartSession}
                        disabled={!selectedCourseId}
                        className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        Start New Session
                    </button>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2 p-1 bg-slate-800 rounded-lg">
                {courses.map(course => (
                    <button
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`flex-1 min-w-0 text-center font-medium p-2 rounded-md transition-colors text-sm ${selectedCourseId === course.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                    >
                        {course.name}
                    </button>
                ))}
            </div>

            {selectedCourse ? (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="p-3 font-semibold tracking-wider">Student Name</th>
                                    {selectedCourse.sessions.slice(-5).map(session => (
                                        <th key={session.id} scope="col" className="p-3 font-semibold tracking-wider text-center">{new Date(session.date).toLocaleDateString()}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {selectedCourse.students.map(student => (
                                    <tr key={student.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                                        <td className="p-3 font-medium whitespace-nowrap">{student.name}</td>
                                        {selectedCourse.sessions.slice(-5).map(session => (
                                            <AttendanceCell key={session.id} studentId={student.id} sessionId={session.id} />
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <p className="text-center text-slate-400 py-10">Select a course to see details.</p>
            )}

            {isModalOpen && activeSession && (
                <QRCodeModal
                    onClose={() => setIsModalOpen(false)}
                    qrCodeValue={activeSession.qrCodeValue}
                    scannedCount={activeSession.scannedCount ?? 0}
                    limit={activeSession.limit ?? 0}
                />
            )}
        </div>
    );
};

export default CourseManager;