import React, { useState, useMemo } from 'react';
import type { User, Course } from '../types';
import { ICONS } from '../constants';

interface AttendanceCalendarPageProps {
    user: User;
    courses: Course[];
}

type AttendanceRecordForDay = {
    courseName: string;
    courseCode: string;
    status: 'Present' | 'Absent';
};

const AttendanceCalendarPage: React.FC<AttendanceCalendarPageProps> = ({ user, courses }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const attendanceByDate = useMemo(() => {
        const map = new Map<string, AttendanceRecordForDay[]>();
        const enrolledCourses = courses.filter(course => course.students.some(student => student.id === user.id));

        for (const course of enrolledCourses) {
            for (const session of course.sessions) {
                const dateKey = new Date(session.date).toISOString().split('T')[0];
                const record = course.attendance.find(a => a.sessionId === session.id && a.studentId === user.id);
                if (record) {
                    const entry = {
                        courseName: course.name,
                        courseCode: course.code,
                        status: record.status,
                    };
                    if (map.has(dateKey)) {
                        map.get(dateKey)!.push(entry);
                    } else {
                        map.set(dateKey, [entry]);
                    }
                }
            }
        }
        return map;
    }, [courses, user.id]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = new Date();
        const todayKey = today.toISOString().split('T')[0];

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = [];
        // Add days from previous month to fill the first week
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
        for (let i = 0; i < startDayOfWeek; i++) {
            const date = new Date(firstDayOfMonth);
            date.setDate(date.getDate() - (startDayOfWeek - i));
            daysInMonth.push(date);
        }

        // Add days of the current month
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            daysInMonth.push(new Date(year, month, i));
        }

        // Add days from next month to fill the last week
        const endDayOfWeek = lastDayOfMonth.getDay();
        for (let i = 1; i < 7 - endDayOfWeek; i++) {
            const date = new Date(lastDayOfMonth);
            date.setDate(date.getDate() + i);
            daysInMonth.push(date);
        }

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <div className="bg-white dark:bg-blue-900 rounded-xl border border-sky-100 dark:border-blue-800 p-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-sky-100 dark:hover:bg-blue-800 transition-colors" aria-label="Previous month">
                        {ICONS.chevronLeft}
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-sky-100 dark:hover:bg-blue-800 transition-colors" aria-label="Next month">
                        {ICONS.chevronRight}
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {daysOfWeek.map(day => (
                        <div key={day} className="text-center font-semibold text-xs text-gray-500 dark:text-sky-200 py-2">
                            {day}
                        </div>
                    ))}
                    {daysInMonth.map((day, index) => {
                        const dateKey = day.toISOString().split('T')[0];
                        const records = attendanceByDate.get(dateKey) || [];
                        const isCurrentMonth = day.getMonth() === month;
                        const isToday = dateKey === todayKey;

                        return (
                            <div
                                key={index}
                                className={`h-28 border border-sky-100 dark:border-blue-800/50 rounded-lg p-2 flex flex-col ${isCurrentMonth ? 'bg-white dark:bg-blue-900' : 'bg-sky-50 dark:bg-blue-900/50'}`}
                            >
                                <span className={`font-semibold text-sm ${isToday ? 'bg-sky-600 text-white rounded-full h-6 w-6 flex items-center justify-center' : ''} ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                                    {day.getDate()}
                                </span>
                                <div className="mt-1 space-y-1 overflow-y-auto text-xs">
                                    {records.map((record, recIndex) => (
                                        <div key={recIndex} className="flex items-center" title={`${record.courseName}: ${record.status}`}>
                                            <span className={`w-2 h-2 rounded-full mr-1.5 flex-shrink-0 ${record.status === 'Present' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className="truncate text-gray-600 dark:text-gray-300">{record.courseCode}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="mt-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Attendance Calendar</h2>
                <p className="text-gray-500 dark:text-sky-200">View your session attendance on a monthly calendar.</p>
            </div>
            {renderCalendar()}
        </div>
    );
};

export default AttendanceCalendarPage;