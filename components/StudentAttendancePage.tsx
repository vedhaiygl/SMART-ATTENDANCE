import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { User, Course, Session } from '../types';
import { getAIAssistedCatchUpPlan, generateLearningPath } from '../lib/gemini';
import CatchUpPlanModal from './CatchUpPlanModal';
import { ICONS } from '../constants';
import Confetti from './Confetti';

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

const PlanRenderer: React.FC<{ text: string }> = ({ text }) => {
    return (
        <div className="space-y-3 text-slate-600 dark:text-slate-300">
            {/* FIX: Refactored to first trim each line, then filter out empty lines. This is more robust and may fix a subtle runtime issue. */}
            {text.split('\n').map(line => line.trim()).filter(Boolean).map((line, index) => {
                if (line.startsWith('**') && line.includes('**')) {
                    const parts = line.split('**');
                    return (
                        <h4 key={index} className="text-md font-bold text-slate-800 dark:text-slate-200 mt-2">
                            {parts[1]}
                            <span className="font-normal text-slate-600 dark:text-slate-300">{parts[2]}</span>
                        </h4>
                    );
                }
                return <p key={index}>{line}</p>;
            })}
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
    const [newlyAwardedBadgeCourseId, setNewlyAwardedBadgeCourseId] = useState<string | null>(null);
    const [learningPaths, setLearningPaths] = useState<Record<string, { plan: string | null; isLoading: boolean; error: string | null }>>({});


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

    // FIX: Provided an initial null value to useRef. The hook expects an initial value, and calling it with no arguments was causing an error.
    const prevEnrolledCoursesRef = useRef<typeof enrolledCourses | null>(null);

    useEffect(() => {
        const prevCourses = prevEnrolledCoursesRef.current;
        if (prevCourses) {
            for (const currentCourse of enrolledCourses) {
                const prevCourse = prevCourses.find(c => c.id === currentCourse.id);
                if (prevCourse) {
                    const newBadges = currentCourse.badges.filter(b => !prevCourse.badges.includes(b));
                    if (newBadges.length > 0) {
                        setNewlyAwardedBadgeCourseId(currentCourse.id);
                        const timer = setTimeout(() => {
                            setNewlyAwardedBadgeCourseId(null);
                        }, 7000); // Display confetti for 7 seconds
                        return () => clearTimeout(timer);
                    }
                }
            }
        }
        prevEnrolledCoursesRef.current = enrolledCourses;
    }, [enrolledCourses]);


    const overallStats = useMemo(() => {
        if (enrolledCourses.length === 0) {
            return {
                overallAttendance: 100,
                highestStreak: 0,
                allBadges: [],
                totalPresent: 0,
                totalSessions: 0,
            };
        }

        const totalPresent = enrolledCourses.reduce((sum, course) => sum + course.presentCount, 0);
        const totalSessions = enrolledCourses.reduce((sum, course) => sum + course.totalSessions, 0);

        const overallAttendance = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 100;
        const highestStreak = enrolledCourses.reduce((max, course) => Math.max(max, course.streak), 0);
        const allBadges = [...new Set(enrolledCourses.flatMap(course => course.badges))];

        return { overallAttendance, highestStreak, allBadges, totalPresent, totalSessions };
    }, [enrolledCourses]);

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
    
    const handleGenerateLearningPath = async (courseId: string, courseName: string, studentName: string, attendancePercentage: number) => {
        setLearningPaths(prev => ({
            ...prev,
            [courseId]: { plan: null, isLoading: true, error: null },
        }));

        try {
            const result = await generateLearningPath(courseName, studentName, attendancePercentage);
            setLearningPaths(prev => ({
                ...prev,
                [courseId]: { plan: result, isLoading: false, error: null },
            }));
        } catch (err: any) {
            setLearningPaths(prev => ({
                ...prev,
                [courseId]: { plan: null, isLoading: false, error: err.message || 'An unknown error occurred.' },
            }));
        }
    };

    return (
        <div className="mt-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Your Attendance Summary</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">An overview of your attendance and achievements.</p>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Overall Performance</h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                        <CircularProgress percentage={overallStats.overallAttendance} />
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
                            {overallStats.totalPresent} / {overallStats.totalSessions} Sessions
                        </p>
                    </div>
                    <div className="flex-grow w-full">
                        <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-3">Recent Achievements</h4>
                        <div className="space-y-3">
                            {overallStats.highestStreak > 2 && (
                                <div className="flex items-center text-sm font-semibold bg-orange-500/20 text-orange-600 dark:text-orange-300 px-3 py-2 rounded-lg">
                                    {ICONS.flame}
                                    <span className="ml-2">Highest Streak: {overallStats.highestStreak} Sessions!</span>
                                </div>
                            )}
                            {overallStats.allBadges.length > 0 ? (
                                overallStats.allBadges.map(badge => (
                                    <div key={badge} className="flex items-center text-sm font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 px-3 py-2 rounded-lg">
                                        {badge === 'Course Champion' && ICONS.trophy}
                                        {badge === 'Perfect Month' && ICONS.calendar}
                                        <span className="ml-2">{badge}</span>
                                    </div>
                                ))
                            ) : overallStats.highestStreak <= 2 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">Keep up the great work to earn new achievements!</p>
                            ) : null }
                        </div>
                    </div>
                </div>
            </div>

            {enrolledCourses.length > 0 ? (
                <div className="space-y-6">
                    {enrolledCourses.map(course => {
                        const learningPathState = learningPaths[course.id];
                        return (
                        <div key={course.id} className={`relative bg-white dark:bg-slate-800 p-6 rounded-xl border-2 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:-translate-y-1 ${course.attendancePercentage < 75 ? 'border-red-500/50 bg-red-50 dark:bg-red-900/20 shadow-lg shadow-red-900/30' : 'border-slate-200 dark:border-slate-700'}`}>
                            {newlyAwardedBadgeCourseId === course.id && <Confetti />}
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
                                    className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
                                >
                                    {expandedCourseId === course.id ? 'Hide Details' : 'View Details'}
                                </button>
                            </div>

                            {expandedCourseId === course.id && (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                    <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-3">Session History</h4>
                                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                        {course.sessions.map((session, index) => {
                                            const record = course.attendance.find(a => a.sessionId === session.id && a.studentId === user.id);
                                            const status = record?.status || 'Absent';
                                            return (
                                                <li key={session.id} className="flex justify-between items-center text-sm p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                                    <div className="flex items-center">
                                                        <span
                                                            style={{ animationDelay: `${index * 50}ms` }}
                                                            className={`w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0 animate-pulse-in ${status === 'Present' ? 'bg-green-500' : 'bg-red-500'}`}
                                                            title={status}
                                                        ></span>
                                                        <span className="text-slate-500 dark:text-slate-400">{new Date(session.date).toLocaleDateString()}</span>
                                                        {status === 'Absent' && (
                                                            <button 
                                                                onClick={() => handleGetCatchUpPlan(course, session)}
                                                                className="ml-3 text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-transform active:scale-90"
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

                             <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300">Personalized Learning Path</h4>
                                    {(learningPathState && learningPathState.plan) && (
                                        <button 
                                            onClick={() => handleGenerateLearningPath(course.id, course.name, user.name, course.attendancePercentage)} 
                                            disabled={learningPathState.isLoading}
                                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                                        >
                                            Regenerate
                                        </button>
                                    )}
                                </div>

                                <div className="mt-3">
                                    {learningPathState?.isLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                            <p className="ml-3 text-slate-500 dark:text-slate-400">Crafting your suggestions...</p>
                                        </div>
                                    ) : learningPathState?.error ? (
                                        <div className="p-3 text-center bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-sm">
                                            <strong>Error:</strong> {learningPathState.error}
                                        </div>
                                    ) : learningPathState?.plan ? (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <PlanRenderer text={learningPathState.plan} />
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Get AI-powered suggestions to improve your learning.</p>
                                            <button 
                                                onClick={() => handleGenerateLearningPath(course.id, course.name, user.name, course.attendancePercentage)}
                                                className="flex items-center justify-center mx-auto bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 font-bold py-2 px-4 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-all active:scale-95 text-sm"
                                            >
                                                <span className="mr-2">{ICONS.lightbulb}</span>
                                                Generate My Path
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )})}
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