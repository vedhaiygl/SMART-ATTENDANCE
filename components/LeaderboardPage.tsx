import React, { useState, useMemo } from 'react';
import type { Course, User, Student } from '../types';
import { ICONS } from '../constants';

interface LeaderboardPageProps {
    user: User;
    courses: Course[];
}

interface StudentStat extends Student {
    attendancePercentage: number;
    streak: number;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ user, courses }) => {
    const enrolledCourses = useMemo(() => {
        return courses.filter(course => course.students.some(student => student.id === user.id));
    }, [courses, user.id]);

    const [selectedCourseId, setSelectedCourseId] = useState<string>(enrolledCourses.length > 0 ? enrolledCourses[0].id : '');
    const [sortBy, setSortBy] = useState<'streak' | 'attendance'>('streak');

    const leaderboardData = useMemo((): StudentStat[] => {
        const course = courses.find(c => c.id === selectedCourseId);
        if (!course) return [];

        const studentStats = course.students.map(student => {
            const sortedSessions = [...course.sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const totalSessions = sortedSessions.length;

            if (totalSessions === 0) {
                return { ...student, attendancePercentage: 100, streak: 0 };
            }

            const presentCount = course.attendance.filter(record => record.studentId === student.id && record.status === 'Present').length;
            const attendancePercentage = Math.round((presentCount / totalSessions) * 100);

            let streak = 0;
            for (const session of sortedSessions) {
                const record = course.attendance.find(a => a.sessionId === session.id && a.studentId === student.id);
                if (record?.status === 'Present') {
                    streak++;
                } else {
                    break;
                }
            }
            return { ...student, attendancePercentage, streak };
        });

        return studentStats.sort((a, b) => {
            if (sortBy === 'streak') {
                if (b.streak !== a.streak) return b.streak - a.streak;
                return b.attendancePercentage - a.attendancePercentage; // Secondary sort
            } else {
                if (b.attendancePercentage !== a.attendancePercentage) return b.attendancePercentage - a.attendancePercentage;
                return b.streak - a.streak; // Secondary sort
            }
        });

    }, [courses, selectedCourseId, sortBy]);

    return (
        <div className="mt-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Class Leaderboard</h2>
                <p className="text-gray-500 dark:text-sky-200">See how you stack up against your classmates in attendance.</p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white dark:bg-blue-900 rounded-xl border border-sky-100 dark:border-blue-800">
                <div className="flex-grow">
                    <label htmlFor="course-select-leaderboard" className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Select a course</label>
                    <select
                        id="course-select-leaderboard"
                        value={selectedCourseId}
                        onChange={e => setSelectedCourseId(e.target.value)}
                        className="bg-sky-50 dark:bg-blue-800 border border-sky-200 dark:border-blue-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full md:w-auto p-2.5"
                    >
                        {enrolledCourses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center space-x-2 p-1 bg-sky-100 dark:bg-blue-800 rounded-lg self-start md:self-center">
                    <button
                        onClick={() => setSortBy('streak')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all active:scale-95 ${sortBy === 'streak' ? 'bg-sky-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-sky-200 dark:hover:bg-blue-700'}`}
                    >
                        Top Streaks
                    </button>
                    <button
                        onClick={() => setSortBy('attendance')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all active:scale-95 ${sortBy === 'attendance' ? 'bg-sky-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-sky-200 dark:hover:bg-blue-700'}`}
                    >
                        Top Attendance
                    </button>
                </div>
            </div>

            {leaderboardData.length > 0 ? (
                <div className="bg-white dark:bg-blue-900 rounded-xl border border-sky-100 dark:border-blue-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                            <thead className="text-xs text-gray-500 dark:text-sky-200 uppercase bg-sky-50 dark:bg-blue-800/50">
                                <tr>
                                    <th scope="col" className="p-4 font-semibold tracking-wider text-center w-16">Rank</th>
                                    <th scope="col" className="p-4 font-semibold tracking-wider">Student</th>
                                    <th scope="col" className="p-4 font-semibold tracking-wider text-center">Streak</th>
                                    <th scope="col" className="p-4 font-semibold tracking-wider text-center">Attendance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboardData.map((student, index) => (
                                    <tr 
                                        key={student.id} 
                                        className={`border-b border-sky-100 dark:border-blue-800 animate-slide-in-top ${student.id === user.id ? 'bg-sky-100 dark:bg-sky-900/50' : 'hover:bg-sky-50 dark:hover:bg-blue-800/30'}`}
                                        style={{ animationDelay: `${Math.min(index * 100, 1000)}ms` }}
                                    >
                                        <td className="p-4 font-bold text-lg text-center text-gray-800 dark:text-gray-100">
                                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                                        </td>
                                        <td className="p-4 font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                                            {student.anonymizedName}
                                            {student.id === user.id && <span className="ml-2 text-xs font-bold text-sky-600 dark:text-sky-400">(You)</span>}
                                        </td>
                                        <td className="p-4 font-semibold text-center text-lg text-gray-800 dark:text-gray-100 flex items-center justify-center">
                                            {student.streak}
                                            <span className="text-orange-500 dark:text-orange-400 ml-1">{ICONS.flame}</span>
                                        </td>
                                        <td className="p-4 font-semibold text-center text-lg text-gray-800 dark:text-gray-100">{student.attendancePercentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500 dark:text-sky-200 py-10 bg-white dark:bg-blue-900 rounded-xl border border-sky-100 dark:border-blue-800">
                    <p>No leaderboard data available for this course yet.</p>
                </div>
            )}
        </div>
    );
};

export default LeaderboardPage;