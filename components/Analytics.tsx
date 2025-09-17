
import React, { useState, useMemo } from 'react';
import type { Course } from '../types';
import OverallAttendanceChart from './charts/OverallAttendanceChart';
import StudentStatusPieChart from './charts/StudentStatusPieChart';

interface AnalyticsProps {
    courses: Course[];
}

const Analytics: React.FC<AnalyticsProps> = ({ courses }) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string>(courses.length > 0 ? courses[0].id : '');

    const selectedCourse = useMemo(() => {
        return courses.find(c => c.id === selectedCourseId) || null;
    }, [courses, selectedCourseId]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Attendance Analytics</h2>
                <p className="text-slate-400 mt-1">Visualize attendance trends and student engagement.</p>
            </div>

            <div>
                <label htmlFor="course-select" className="block mb-2 text-sm font-medium text-slate-300">Select a course</label>
                <select 
                    id="course-select"
                    value={selectedCourseId} 
                    onChange={e => setSelectedCourseId(e.target.value)}
                    className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full md:w-1/3 p-2.5"
                >
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                </select>
            </div>

            {selectedCourse ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-xl font-bold text-white mb-4">Overall Attendance Trend</h3>
                        <div className="h-80">
                            <OverallAttendanceChart course={selectedCourse} />
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-xl font-bold text-white mb-4">Student Engagement</h3>
                        <div className="h-80">
                            <StudentStatusPieChart course={selectedCourse} />
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-center text-slate-400 py-10">Select a course to see analytics.</p>
            )}
        </div>
    );
};

export default Analytics;
