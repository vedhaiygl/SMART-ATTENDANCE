
import React, { useState, useMemo } from 'react';
import type { Course } from '../types';
import OverallAttendanceChart from './charts/OverallAttendanceChart';
import StudentStatusPieChart from './charts/StudentStatusPieChart';
import AIInsightsModal from './AIInsightsModal';
import { getAIInsights } from '../lib/gemini';
import { ICONS } from '../constants';


interface AnalyticsProps {
    courses: Course[];
}

const Analytics: React.FC<AnalyticsProps> = ({ courses }) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string>(courses.length > 0 ? courses[0].id : '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insights, setInsights] = useState<string | null>(null);

    const selectedCourse = useMemo(() => {
        return courses.find(c => c.id === selectedCourseId) || null;
    }, [courses, selectedCourseId]);

    const handleGetInsights = async () => {
        if (!selectedCourse) return;

        setIsModalOpen(true);
        setIsLoading(true);
        setError(null);
        setInsights(null);

        try {
            const result = await getAIInsights(selectedCourse);
            setInsights(result);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Attendance Analytics</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Visualize attendance trends and student engagement.</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                 <div className="flex-grow">
                    <label htmlFor="course-select" className="block mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Select a course</label>
                    <select 
                        id="course-select"
                        value={selectedCourseId} 
                        onChange={e => setSelectedCourseId(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full md:w-auto p-2.5"
                    >
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleGetInsights}
                    disabled={!selectedCourse || isLoading}
                    className="flex items-center justify-center bg-indigo-600 text-white font-bold py-2.5 px-5 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed mt-4 md:mt-0 md:self-end"
                >
                    {ICONS.sparkles}
                    <span>AI Insights</span>
                </button>
            </div>

            {selectedCourse ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Overall Attendance Trend</h3>
                        <div className="h-80">
                            <OverallAttendanceChart course={selectedCourse} />
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Student Engagement</h3>
                        <div className="h-80">
                            <StudentStatusPieChart course={selectedCourse} />
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 py-10">Select a course to see analytics.</p>
            )}

            {isModalOpen && selectedCourse && (
                <AIInsightsModal
                    onClose={() => setIsModalOpen(false)}
                    isLoading={isLoading}
                    error={error}
                    insights={insights}
                    courseName={selectedCourse.name}
                />
            )}
        </div>
    );
};

export default Analytics;