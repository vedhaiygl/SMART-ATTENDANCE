import React, { useMemo } from 'react';
import type { User, Course } from '../types';

interface StudentAttendancePageProps {
    user: User;
    courses: Course[];
}

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const sqSize = 100;
    const strokeWidth = 10;
    const radius = (sqSize - strokeWidth) / 2;
    const viewBox = `0 0 ${sqSize} ${sqSize}`;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (percentage / 100) * circumference;

    const colorClass = percentage < 75 ? 'text-red-400' : 'text-green-400';
    const strokeColorClass = percentage < 75 ? 'stroke-red-500' : 'stroke-green-500';

    return (
        <div className="relative w-24 h-24 flex-shrink-0">
            <svg width={100} height={100} viewBox={viewBox}>
                <circle
                    className="stroke-slate-700"
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
                    className={`text-2xl font-bold ${colorClass} fill-current`}
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

    const enrolledCourses = useMemo(() => {
        return courses
            .filter(course => course.students.some(student => student.id === user.id))
            .map(course => {
                const totalSessions = course.sessions.length;
                if (totalSessions === 0) {
                    return {
                        ...course,
                        attendancePercentage: 100,
                        presentCount: 0,
                        totalSessions: 0,
                    };
                }
                const presentCount = course.attendance.filter(
                    record => record.studentId === user.id && record.status === 'Present'
                ).length;
                const attendancePercentage = Math.round((presentCount / totalSessions) * 100);

                return {
                    ...course,
                    attendancePercentage,
                    presentCount,
                    totalSessions
                };
            });
    }, [courses, user.id]);


    return (
        <div className="mt-6">
            <h2 className="text-3xl font-bold text-white mb-1">Your Attendance Summary</h2>
            <p className="text-slate-400 mb-6">Here is an overview of your attendance for each course.</p>
            
            {enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrolledCourses.map(course => (
                        <div key={course.id} className={`bg-slate-800 p-6 rounded-xl border-2 transition-all duration-300 ${course.attendancePercentage < 75 ? 'border-red-500/50 bg-red-900/20 shadow-lg shadow-red-900/30' : 'border-slate-700'}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex-grow pr-4">
                                    <p className="text-xs font-semibold text-slate-400 uppercase">{course.code}</p>
                                    <h3 className={`text-xl font-bold mt-1 flex items-center ${course.attendancePercentage < 75 ? 'text-red-400' : 'text-white'}`}>
                                        {course.attendancePercentage < 75 && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.031-1.742 3.031H4.42c-1.532 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        {course.name}
                                    </h3>
                                     <p className="text-sm text-slate-400 mt-4">
                                        Attended: {course.presentCount} / {course.totalSessions} sessions
                                    </p>
                                </div>
                               <CircularProgress percentage={course.attendancePercentage} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-400 py-10">You are not enrolled in any courses yet.</p>
            )}
        </div>
    );
};

export default StudentAttendancePage;