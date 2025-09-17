
import React, { useMemo } from 'react';
import type { Course } from '../types';

interface DashboardProps {
    courses: Course[];
}

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500 transition-all duration-300">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <p className="text-3xl font-bold text-white mt-2">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ courses }) => {
    const stats = useMemo(() => {
        const totalStudents = new Set<string>();
        let totalAttendance = 0;
        let presentCount = 0;

        courses.forEach(course => {
            course.students.forEach(student => totalStudents.add(student.id));
            course.attendance.forEach(record => {
                totalAttendance++;
                if (record.status === 'Present') {
                    presentCount++;
                }
            });
        });

        const overallAttendance = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) + '%' : 'N/A';
        
        return {
            totalCourses: courses.length,
            totalStudents: totalStudents.size,
            overallAttendance,
        };
    }, [courses]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Welcome back, Administrator!</h2>
                <p className="text-slate-400 mt-1">Here's a quick overview of your attendance data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Courses" value={stats.totalCourses} description="Number of active courses" />
                <StatCard title="Total Students" value={stats.totalStudents} description="Unique students enrolled" />
                <StatCard title="Overall Attendance" value={stats.overallAttendance} description="Across all courses and sessions" />
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                <ul className="space-y-3">
                    {courses.slice(0, 3).map(course => (
                        course.sessions.slice(-2).map(session => (
                             <li key={session.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-3 ${session.type === 'Online' ? 'bg-sky-400' : 'bg-green-400'}`}></div>
                                    <div>
                                        <p className="font-semibold text-slate-200">{course.name} - Session</p>
                                        <p className="text-xs text-slate-400">{new Date(session.date).toLocaleString()} ({session.type})</p>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-green-400">Completed</span>
                            </li>
                        ))
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Dashboard;
