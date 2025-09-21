import React, { useState, useMemo, useEffect } from 'react';
import type { Course, Student, Session, LiveClass } from '../types';
import QRCodeModal from './QRCodeModal';
import EnrollStudentModal from './EnrollStudentModal';
import FacultyLiveClassModal from './FacultyLiveClassModal';
import GenerateBannerModal from './GenerateBannerModal';
import { ICONS } from '../constants';
import { QR_CODE_VALIDITY_SECONDS } from '../hooks/useAttendanceData';

interface CourseManagerProps {
    courses: Course[];
    allStudents: Student[];
    createNewSession: (courseId: string, type: 'Online' | 'Offline', limit: number, livenessCheck: boolean) => { sessionId: string; qrCodeValue: string; shortCode?: string };
    toggleAttendance: (studentId: string, sessionId: string, courseId: string) => void;
    regenerateQrCode: (sessionId: string) => void;
    enrollStudent: (courseId: string, studentId: string) => void;
    deleteSession: (courseId: string, sessionId: string) => void;
    startLiveClass: (courseId: string) => LiveClass;
    endLiveClass: (courseId: string, liveClassId: string) => void;
    updateCourseBanner: (courseId: string, bannerUrl: string) => void;
}

const CourseManager: React.FC<CourseManagerProps> = ({ courses, allStudents, createNewSession, toggleAttendance, regenerateQrCode, enrollStudent, deleteSession, startLiveClass, endLiveClass, updateCourseBanner }) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses.length > 0 ? courses[0].id : null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [courseForBanner, setCourseForBanner] = useState<Course | null>(null);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [limit, setLimit] = useState(50);
    const [sessionType, setSessionType] = useState<'Online' | 'Offline'>('Offline');
    const [livenessCheckEnabled, setLivenessCheckEnabled] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
    const [activeLiveClass, setActiveLiveClass] = useState<LiveClass | null>(null);

    const selectedCourse = useMemo(() => {
        return courses.find(c => c.id === selectedCourseId);
    }, [courses, selectedCourseId]);
    
    // Refresh activeLiveClass data from the main courses state
    useEffect(() => {
        if (activeLiveClass && selectedCourse) {
            const updatedLiveClass = selectedCourse.liveClasses.find(lc => lc.id === activeLiveClass.id);
            if (updatedLiveClass) {
                setActiveLiveClass(updatedLiveClass);
            } else {
                // The class might have been removed or ended elsewhere
                setActiveLiveClass(null);
            }
        }
    }, [courses, selectedCourse, activeLiveClass]);


    const activeSession = useMemo(() => {
        return selectedCourse?.sessions.find(s => s.id === activeSessionId);
    }, [selectedCourse, activeSessionId]);

    const studentStats = useMemo(() => {
        if (!selectedCourse) return [];

        return selectedCourse.students.map(student => {
            const totalSessions = selectedCourse.sessions.length;
            const presentCount = selectedCourse.attendance.filter(
                a => a.studentId === student.id && a.status === 'Present'
            ).length;
            const attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
            
            return {
                ...student,
                totalSessions,
                presentCount,
                attendancePercentage
            };
        });
    }, [selectedCourse]);

    useEffect(() => {
        if (selectedCourse) {
            setLimit(selectedCourse.students.length);
        }
    }, [selectedCourse]);

    useEffect(() => {
        if (isModalOpen && activeSessionId) {
            const interval = setInterval(() => {
                regenerateQrCode(activeSessionId);
            }, QR_CODE_VALIDITY_SECONDS * 1000);

            return () => clearInterval(interval);
        }
    }, [isModalOpen, activeSessionId, regenerateQrCode]);


    const handleStartSession = () => {
        if (selectedCourseId) {
            if (limit <= 0) {
                alert('Please enter a valid limit greater than 0.');
                return;
            }
            const isLivenessActive = sessionType === 'Online' && livenessCheckEnabled;
            const { sessionId } = createNewSession(selectedCourseId, sessionType, limit, isLivenessActive);
            setActiveSessionId(sessionId);
            setIsModalOpen(true);
        }
    };

    const handleStartLiveClass = () => {
        if (selectedCourseId) {
            const newLiveClass = startLiveClass(selectedCourseId);
            setActiveLiveClass(newLiveClass);
        }
    };

    const handleOpenBannerModal = (course: Course) => {
        setCourseForBanner(course);
        setIsBannerModalOpen(true);
    };

    const handleExportCSV = () => {
        if (!selectedCourse) {
            alert('Please select a course to export.');
            return;
        }

        let csvContent = "Student Name,Session Date,Status\n";

        selectedCourse.students.forEach(student => {
            selectedCourse.sessions.forEach(session => {
                const record = selectedCourse.attendance.find(
                    a => a.studentId === student.id && a.sessionId === session.id
                );
                const status = record ? record.status : 'Absent';
                const sessionDate = new Date(session.date).toLocaleDateString();
                // Escape commas in names if any
                const studentName = `"${student.name.replace(/"/g, '""')}"`;
                const row = [studentName, sessionDate, status].join(',');
                csvContent += row + "\n";
            });
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const fileName = `${selectedCourse.code}_Attendance_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportStudentsCSV = () => {
        if (!selectedCourse) {
            alert('Please select a course to export.');
            return;
        }

        let csvContent = "Student ID,Student Name,Anonymized Name\n";

        selectedCourse.students.forEach(student => {
            const studentId = `"${student.id.replace(/"/g, '""')}"`;
            const studentName = `"${student.name.replace(/"/g, '""')}"`;
            const anonymizedName = `"${student.anonymizedName.replace(/"/g, '""')}"`;
            const row = [studentId, studentName, anonymizedName].join(',');
            csvContent += row + "\n";
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const fileName = `${selectedCourse.code}_Students_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const AttendanceCell: React.FC<{ studentId: string; sessionId: string }> = ({ studentId, sessionId }) => {
        const record = selectedCourse?.attendance.find(a => a.studentId === studentId && a.sessionId === sessionId);
        if (!record) return <td className="p-3 text-center">-</td>;
        
        const handleToggle = () => {
            if (selectedCourseId) {
                toggleAttendance(studentId, sessionId, selectedCourseId);
            }
        };

        const sessionDate = selectedCourse?.sessions.find(s => s.id === sessionId)?.date;
        const formattedDate = sessionDate ? new Date(sessionDate).toLocaleDateString() : 'this session';
        const currentStatus = record.status;
        const nextStatus = currentStatus === 'Present' ? 'Absent' : 'Present';

        return (
            <td className="p-3 text-center">
                <button
                    onClick={handleToggle}
                    className="group w-5 h-5 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-800 focus:ring-amber-500"
                    aria-label={`Change attendance for ${formattedDate}. Current status: ${currentStatus}. Click to mark as ${nextStatus}.`}
                    title={`Click to mark as ${nextStatus}`}
                >
                    <span className={`block w-full h-full rounded-full transition-all duration-200 transform group-hover:scale-125 ${currentStatus === 'Present' ? 'bg-green-500 group-hover:bg-green-400' : 'bg-red-500 group-hover:bg-red-400'}`}></span>
                </button>
            </td>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Course Management</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Select a course to view attendance and start new sessions.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="limit-input" className="text-zinc-600 dark:text-zinc-300 font-medium text-sm whitespace-nowrap">Scan Limit:</label>
                        <input
                            id="limit-input"
                            type="number"
                            value={limit}
                            onChange={e => setLimit(parseInt(e.target.value, 10) || 0)}
                            className="bg-zinc-100 dark:bg-zinc-700 w-full sm:w-24 text-zinc-900 dark:text-white rounded-md py-2 px-3 border border-zinc-200 dark:border-zinc-600 focus:ring-amber-500 focus:border-amber-500"
                            min="1"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="session-type-select" className="text-zinc-600 dark:text-zinc-300 font-medium text-sm whitespace-nowrap">Session Type:</label>
                        <select
                            id="session-type-select"
                            value={sessionType}
                            onChange={e => setSessionType(e.target.value as 'Online' | 'Offline')}
                            className="bg-zinc-100 dark:bg-zinc-700 w-full sm:w-28 text-zinc-900 dark:text-white rounded-md py-2 px-3 border border-zinc-200 dark:border-zinc-600 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="Offline">Offline</option>
                            <option value="Online">Online</option>
                        </select>
                    </div>
                     <div className={`flex items-center space-x-2 transition-opacity duration-300 ${sessionType === 'Online' ? 'opacity-100' : 'opacity-50'}`}>
                        <input
                            id="liveness-check"
                            type="checkbox"
                            checked={livenessCheckEnabled}
                            onChange={e => setLivenessCheckEnabled(e.target.checked)}
                            disabled={sessionType !== 'Online'}
                            className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-zinc-200 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 disabled:cursor-not-allowed"
                        />
                        <label htmlFor="liveness-check" className={`text-zinc-600 dark:text-zinc-300 font-medium text-sm whitespace-nowrap ${sessionType !== 'Online' ? 'cursor-not-allowed' : ''}`}>Enable Liveness Check</label>
                    </div>
                     <button
                        onClick={handleExportStudentsCSV}
                        disabled={!selectedCourseId}
                        className="flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-4 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        {ICONS.users}
                        <span className="ml-2">Export Students</span>
                    </button>
                     <button
                        onClick={handleExportCSV}
                        disabled={!selectedCourseId}
                        className="flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-4 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        {ICONS.export}
                        <span className="ml-2">Export Attendance</span>
                    </button>
                    <button
                        onClick={handleStartSession}
                        disabled={!selectedCourseId}
                        className="bg-amber-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-all active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        Start New Session
                    </button>
                    <button
                        onClick={handleStartLiveClass}
                        disabled={!selectedCourseId}
                        className="flex items-center justify-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500 transition-all active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        <span className="relative flex h-3 w-3 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </span>
                        Start Live Class
                    </button>
                </div>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`relative group bg-white dark:bg-zinc-800 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 ${selectedCourseId === course.id ? 'border-amber-500' : 'border-zinc-200 dark:border-zinc-700 hover:border-amber-400'}`}
                    >
                        <img src={course.bannerUrl} alt={`${course.name} banner`} className="h-40 w-full object-cover" />
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white truncate">{course.name}</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{course.code}</p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenBannerModal(course); }}
                            className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-amber-500 active:scale-90"
                            title="Generate AI Banner"
                        >
                            {ICONS.magicWand}
                        </button>
                    </div>
                ))}
            </div>

            {selectedCourse ? (
                <div className="space-y-6">
                    {/* Attendance Grid Card */}
                    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Sessions Attendance</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">A grid view of the last 5 sessions. You can manually toggle attendance status by clicking the dots.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-300">
                                <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-700/50">
                                    <tr>
                                        <th scope="col" className="p-3 font-semibold tracking-wider">Student Name</th>
                                        {selectedCourse.sessions.slice(-5).map(session => (
                                            <th key={session.id} scope="col" className="p-3 font-semibold tracking-wider text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>{new Date(session.date).toLocaleDateString()}</span>
                                                    <button
                                                        onClick={() => setSessionToDelete(session)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-500/10"
                                                        title={`Delete session on ${new Date(session.date).toLocaleDateString()}`}
                                                        aria-label={`Delete session on ${new Date(session.date).toLocaleDateString()}`}
                                                    >
                                                        {ICONS.trash}
                                                    </button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedCourse.students.map(student => (
                                        <tr key={student.id} className="border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 hover:bg-zinc-100 dark:hover:bg-zinc-700/30">
                                            <td className="p-3 font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-100">{student.name}</td>
                                            {selectedCourse.sessions.slice(-5).map(session => (
                                                <AttendanceCell key={session.id} studentId={student.id} sessionId={session.id} />
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Enrolled Students Card */}
                    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Enrolled Students ({studentStats.length})</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">A complete list of students in this course and their overall attendance summary.</p>
                            </div>
                            <button
                                onClick={() => setIsEnrollModalOpen(true)}
                                className="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 font-bold py-2 px-4 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition-all active:scale-95 text-sm whitespace-nowrap"
                            >
                                Enroll Student
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[400px]">
                            <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-300">
                                <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-700/50 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="p-3 font-semibold tracking-wider">Student Name</th>
                                        <th scope="col" className="p-3 font-semibold tracking-wider">Anonymized Name</th>
                                        <th scope="col" className="p-3 font-semibold tracking-wider text-right">Attendance Summary</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentStats.length > 0 ? (
                                        studentStats.map(student => (
                                            <tr key={student.id} className="border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 hover:bg-zinc-100 dark:hover:bg-zinc-700/30">
                                                <td className="p-3 font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-100">{student.name}</td>
                                                <td className="p-3 whitespace-nowrap">{student.anonymizedName}</td>
                                                <td className="p-3 text-right font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <span className="font-semibold text-zinc-700 dark:text-zinc-200 w-20 text-center">{`${student.presentCount} / ${student.totalSessions}`}</span>
                                                        <div className="w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                                                            <div className={`h-2 rounded-full ${
                                                                student.attendancePercentage >= 90 ? 'bg-green-500' :
                                                                student.attendancePercentage >= 70 ? 'bg-amber-500' :
                                                                'bg-red-500'
                                                            }`} style={{ width: `${student.attendancePercentage}%` }}></div>
                                                        </div>
                                                        <span className="w-12 text-left text-zinc-700 dark:text-zinc-200">{student.attendancePercentage}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                                                No students are enrolled in this course.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            ) : (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-10">Select a course to see details.</p>
            )}

            {isModalOpen && activeSession && (
                <QRCodeModal
                    onClose={() => setIsModalOpen(false)}
                    session={activeSession}
                />
            )}
            
            {isEnrollModalOpen && selectedCourse && (
                <EnrollStudentModal
                    isOpen={isEnrollModalOpen}
                    onClose={() => setIsEnrollModalOpen(false)}
                    course={selectedCourse}
                    allStudents={allStudents}
                    enrollStudent={enrollStudent}
                />
            )}

            {sessionToDelete && selectedCourse && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
                    aria-modal="true"
                    role="dialog"
                >
                    <div 
                        className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-zinc-200 dark:border-zinc-700 animate-slide-in-top"
                    >
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Confirm Session Deletion</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                            Are you sure you want to delete the session from <strong className="text-zinc-700 dark:text-zinc-200">{new Date(sessionToDelete.date).toLocaleDateString()}</strong>?
                        </p>
                        <p className="text-sm bg-red-500/10 text-red-600 dark:text-red-400 mt-4 p-3 rounded-md">
                            <strong>Warning:</strong> This action is irreversible and will permanently remove the session along with all its attendance records.
                        </p>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={() => setSessionToDelete(null)}
                                className="bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-100 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    deleteSession(selectedCourse.id, sessionToDelete.id);
                                    setSessionToDelete(null);
                                }}
                                className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-500 transition-all active:scale-95"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
             {activeLiveClass && selectedCourse && (
                <FacultyLiveClassModal
                    liveClass={activeLiveClass}
                    course={selectedCourse}
                    onClose={() => setActiveLiveClass(null)}
                    endLiveClass={endLiveClass}
                />
            )}
            {isBannerModalOpen && courseForBanner && (
                <GenerateBannerModal
                    course={courseForBanner}
                    onClose={() => setIsBannerModalOpen(false)}
                    onUpdateBanner={updateCourseBanner}
                />
            )}
        </div>
    );
};

export default CourseManager;