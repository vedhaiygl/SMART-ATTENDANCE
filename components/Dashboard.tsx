
import React, { useMemo, useState } from 'react';
import type { Course } from '../types';

interface DashboardProps {
    courses: Course[];
}

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/20 hover:border-emerald-500 transition-all duration-300">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>
    </div>
);

const DailyActivityTimeline: React.FC<{ courses: Course[] }> = ({ courses }) => {
    type TimelineData = {
        date: string;
        sessionCount: number;
        attendanceRate: number;
    };
    
    const [hoveredData, setHoveredData] = useState<TimelineData | null>(null);

    const timelineData = useMemo((): TimelineData[] => {
        const dailyData = new Map<string, { sessionCount: number; totalPresent: number; totalStudentsInSessions: number }>();

        courses.forEach(course => {
            course.sessions.forEach(session => {
                const dateKey = new Date(session.date).toISOString().split('T')[0];
                
                if (!dailyData.has(dateKey)) {
                    dailyData.set(dateKey, { sessionCount: 0, totalPresent: 0, totalStudentsInSessions: 0 });
                }

                const data = dailyData.get(dateKey)!;
                data.sessionCount += 1;
                
                const sessionAttendance = course.attendance.filter(a => a.sessionId === session.id);
                data.totalPresent += sessionAttendance.filter(a => a.status === 'Present').length;
                data.totalStudentsInSessions += course.students.length;
            });
        });

        const formattedData = Array.from(dailyData.entries()).map(([date, data]) => ({
            date,
            sessionCount: data.sessionCount,
            attendanceRate: data.totalStudentsInSessions > 0 ? Math.round((data.totalPresent / data.totalStudentsInSessions) * 100) : 0
        }));

        return formattedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7).reverse();
    }, [courses]);
    
    const getPointColor = (rate: number) => {
        if (rate >= 90) return 'bg-green-500';
        if (rate >= 75) return 'bg-sky-500';
        return 'bg-red-500';
    };
    
    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString);
        // Add timeZone: 'UTC' to prevent off-by-one day errors due to local time zone conversion
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    }
    
    const formatFullDate = (dateString: string) => {
         const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
    }

    if (timelineData.length === 0) {
        return (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Daily Activity Timeline</h3>
                <p className="text-slate-500 dark:text-slate-400 text-center py-10">No recent session data to display.</p>
             </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Activity Timeline</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Hover over a point for a daily summary of the last 7 active days.</p>
            <div className="overflow-x-auto py-4 -my-4">
                <div className="relative h-32 flex items-center mt-8" style={{ minWidth: '500px' }}>
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-300 dark:bg-slate-600" />
                    <div className="relative w-full flex justify-between">
                        {timelineData.map(day => (
                            <div 
                                key={day.date} 
                                className="relative flex flex-col items-center" 
                                onMouseEnter={() => setHoveredData(day)} 
                                onMouseLeave={() => setHoveredData(null)}
                            >
                                {hoveredData?.date === day.date && (
                                    <div className="absolute bottom-full mb-4 w-48 p-3 bg-slate-800 dark:bg-slate-900 text-white rounded-lg shadow-xl z-20 text-center animate-fade-in">
                                        <p className="font-bold text-sm">{formatFullDate(hoveredData.date)}</p>
                                        <div className="mt-2 text-xs space-y-1 text-slate-300">
                                            <p><span className="font-semibold text-white">{hoveredData.sessionCount}</span> {hoveredData.sessionCount === 1 ? 'Session' : 'Sessions'}</p>
                                            <p><span className="font-semibold text-white">{hoveredData.attendanceRate}%</span> Avg. Attendance</p>
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800 dark:border-t-slate-900"></div>
                                    </div>
                                )}
                                <div 
                                    className={`w-4 h-4 rounded-full shadow-md ${getPointColor(day.attendanceRate)} border-2 border-white dark:border-slate-800 cursor-pointer transform hover:scale-125 transition-transform z-10`}
                                />
                                <p className="absolute top-full mt-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatShortDate(day.date)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


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
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, Administrator!</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Here's a quick overview of your attendance data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Courses" value={stats.totalCourses} description="Number of active courses" />
                <StatCard title="Total Students" value={stats.totalStudents} description="Unique students enrolled" />
                <StatCard title="Overall Attendance" value={stats.overallAttendance} description="Across all courses and sessions" />
            </div>

            <DailyActivityTimeline courses={courses} />
        </div>
    );
};

export default Dashboard;