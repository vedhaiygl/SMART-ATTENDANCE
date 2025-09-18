


import React, { useMemo, useState } from 'react';
import type { User, Course, Session } from '../types';
import { getAIAssistedCatchUpPlan } from '../lib/gemini';
import CatchUpPlanModal from './CatchUpPlanModal';
import { ICONS } from '../constants';

interface StudentAttendancePageProps {
    user: User;
    courses: Course[];
}

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const sqSize = 112;
    const strokeWidth = 10;
    const radius = (sqSize - strokeWidth) / 2;
    const viewBox = `0 0 ${sqSize} ${sqSize}`;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (percentage / 100) * circumference;

    const colorClass = percentage < 75 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400';
    const strokeColorClass = percentage < 75 ? 'stroke-red-500' : 'stroke-green-500';

    return (
        <div className="relative w-28 h-28 flex-shrink-0">
            <svg width={sqSize} height={sqSize} viewBox={viewBox}>
                <circle
                    className="stroke-slate-200 dark:stroke-slate-700"
                    cx={sqSize / 2}
                    cy={sqSize / 2}
                    r={radius}
                    strokeWidth={`${strokeWidth}px`}
                    fill="transparent"
                />
                <circle
                    className={`${strokeColorClass} transition-all duration-700 ease-in-out`}
                    cx={sqSize / 2}
                    cy={sqSize / 2}
                    r={radius}
                    strokeWidth={`${strokeWidth}px`}
                    transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: dashOffset,
                    }}
                />
                <text
                    className={`text-3xl font-bold ${colorClass} fill-current`}
                    x="50%"
                    y="50%"
                    dy=".3em"
                    textAnchor="middle">
                    {`${percentage}%`}
                </text>
            </svg>
        </div>
    );
};


const StudentAttendancePage: React.FC<StudentAttendancePageProps> = ({ user, courses }) => {
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
    const [isCatchUpModalOpen, setIsCatchUpModalOpen] = useState(false);
    const [catchUpPlanData, setCatchUpPlanData] = useState<{ courseName: string; sessionDate: string; plan: string | null; error: string | null; }>({
        courseName: '',
        sessionDate: '',
        plan: null,
        error: null,
    });
    const [isCatchUpLoading, setIsCatchUpLoading] = useState(false);


    const handleToggleDetails = (courseId: string) => {
        setExpandedCourseId(prevId => (prevId === courseId ? null : courseId));
    };

    const handleGetCatchUpPlan = async (course: Course, session: Session) => {
        setIsCatchUpModalOpen(true);
        setIsCatchUpLoading(true);
        setCatchUpPlanData({ courseName: course.name, sessionDate: session.date, plan: null, error: null });

        try {
            const result = await getAIAssistedCatchUpPlan(course.name, session.date);
            setCatchUpPlanData(prev => ({ ...prev, plan: result, error: null }));
        } catch (err: any) {
            setCatchUpPlanData(prev => ({ ...prev, plan: null, error: err.message || 'An unknown error occurred.' }));
        } finally {
            setIsCatchUpLoading(false);
        }
    };

    const enrolledCourses = useMemo(() => {
        return courses
            .filter(course => course.students.some(student => student.id === user.id))
            .map(course => {
                const sortedSessions = [...course.sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const totalSessions = sortedSessions.length;
                
                if (totalSessions === 0) {
                    return { ...course, sessions: sortedSessions, attendancePercentage: 100, presentCount: 0, totalSessions: 0, streak: 0, badges: [] };
                }

                const presentCount = course.attendance.filter(record => record.studentId === user.id && record.status === 'Present').length;
                const attendancePercentage = Math.round((presentCount / totalSessions) * 100);

                let streak = 0;
                for (const session of sortedSessions) {
                    const record = course.attendance.find(a => a.sessionId === session.id && a.studentId === user.id);
                    if (record?.status === 'Present') {
                        streak++;
                    } else {
                        break;
                    }
                }

                const badges: string[] = [];
                if (attendancePercentage === 100 && totalSessions > 5) {
                    badges.push('Course Champion');
                }

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                const sessionsThisMonth = sortedSessions.filter(s => {
                    const sessionDate = new Date(s.date);
                    return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
                });
                if (sessionsThisMonth.length > 3) {
                    const attendedAllThisMonth = sessionsThisMonth.every(s => 
                        course.attendance.some(a => a.sessionId === s.id && a.studentId === user.id && a.status === 'Present')
                    );
                    if (attendedAllThisMonth) {
                        badges.push('Perfect Month');
                    }
                }

                return { ...course, sessions: sortedSessions, attendancePercentage, presentCount, totalSessions, streak, badges };
            });
    }, [courses, user.id]);

    return (
        <div className="mt-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Your Attendance Summary</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Here is an overview of your attendance for each course.</p>
            
            {enrolledCourses.length > 0 ? (
                <div className="space-y-6">
                    {enrolledCourses.map(course => (
                        <div key={course.id} className={`bg-white dark:bg-slate-800 p-6 rounded-xl border-2 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:-translate-y-1 ${course.attendancePercentage < 75 ? 'border-red-500/50 bg-red-50 dark:bg-red-900/20 shadow-lg shadow-red-900/30' : 'border-slate-200 dark:border-slate-700'}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-2">
                                        {course.attendancePercentage < 75 && (
                                            <div className="text-red-500 dark:text-red-400 flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.031-1.742 3.031H4.42c-1.532 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                        <h3 className={`text-xl font-bold ${course.attendancePercentage < 75 ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                            {course.name}
                                        </h3>
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md whitespace-nowrap">{course.code}</span>
                                    </div>
                                    
                                    <div className="flex items-center flex-wrap gap-2 mt-4">
                                        {course.streak > 2 && (
                                            <div className="flex items-center text-sm font-semibold bg-orange-500/20 text-orange-600 dark:text-orange-300 px-3 py-1 rounded-full">
                                                {ICONS.flame}
                                                <span className="ml-1.5">{course.streak}-Session Streak!</span>
                                            </div>
                                        )}
                                        {course.badges.map(badge => (
                                            <div key={badge} className="flex items-center text-sm font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 px-3 py-1 rounded-full" title={badge}>
                                                {badge === 'Course Champion' && ICONS.trophy}
                                                {badge === 'Perfect Month' && ICONS.calendar}
                                                <span className="ml-1.5">{badge}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                               
                                <div className="flex flex-col items-center flex-shrink-0">
                                   <CircularProgress percentage={course.attendancePercentage} />
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        Attended: {course.presentCount} / {course.totalSessions}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={() => handleToggleDetails(course.id)}
                                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                                >
                                    {expandedCourseId === course.id ? 'Hide Details' : 'View Details'}
                                </button>
                            </div>

                            {expandedCourseId === course.id && (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                    <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-3">Session History</h4>
                                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                        {course.sessions.map(session => {
                                            const record = course.attendance.find(a => a.sessionId === session.id && a.studentId === user.id);
                                            const status = record?.status || 'Absent';
                                            return (
                                                <li key={session.id} className="flex justify-between items-center text-sm p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                                    <div className="flex items-center">
                                                        <span className="text-slate-500 dark:text-slate-400">{new Date(session.date).toLocaleDateString()}</span>
                                                        {status === 'Absent' && (
                                                            <button 
                                                                onClick={() => handleGetCatchUpPlan(course, session)}
                                                                className="ml-3 text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                                                                aria-label={`Get AI-assisted catch-up plan for session on ${new Date(session.date).toLocaleDateString()}`}
                                                                title="Get AI Catch-up Plan"
                                                            >
                                                                {ICONS.magicWand}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${status === 'Present' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                                                        {status}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 py-10">You are not enrolled in any courses yet.</p>
            )}

            {isCatchUpModalOpen && (
                <CatchUpPlanModal
                    onClose={() => setIsCatchUpModalOpen(false)}
                    isLoading={isCatchUpLoading}
                    error={catchUpPlanData.error}
                    plan={catchUpPlanData.plan}
                    courseName={catchUpPlanData.courseName}
                    sessionDate={catchUpPlanData.sessionDate}
                />
            )}
        </div>
    );
};

export default StudentAttendancePage;
