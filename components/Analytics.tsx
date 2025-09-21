
import React, { useState, useMemo } from 'react';
import type { Course, AtRiskStudent } from '../types';
import OverallAttendanceChart from './charts/OverallAttendanceChart';
import StudentStatusPieChart from './charts/StudentStatusPieChart';
import AIInsightsModal from './AIInsightsModal';
import OutreachEmailModal from './OutreachEmailModal';
import { getAIInsights, getAtRiskStudents, generateOutreachEmail } from '../lib/gemini';
import { ICONS } from '../constants';


interface AnalyticsProps {
    courses: Course[];
}

const Analytics: React.FC<AnalyticsProps> = ({ courses }) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string>(courses.length > 0 ? courses[0].id : '');
    
    // State for general insights
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);
    const [insightsError, setInsightsError] = useState<string | null>(null);
    const [insights, setInsights] = useState<string | null>(null);

    // State for at-risk student analysis
    const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[] | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // State for outreach email generation
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);
    const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);


    const selectedCourse = useMemo(() => {
        return courses.find(c => c.id === selectedCourseId) || null;
    }, [courses, selectedCourseId]);

    const handleGetInsights = async () => {
        if (!selectedCourse) return;
        setIsInsightsModalOpen(true);
        setIsInsightsLoading(true);
        setInsightsError(null);
        setInsights(null);
        try {
            const result = await getAIInsights(selectedCourse);
            setInsights(result);
        } catch (err: any) {
            setInsightsError(err.message || 'An unknown error occurred.');
        } finally {
            setIsInsightsLoading(false);
        }
    };

    const handleAnalyzeAtRisk = async () => {
        if (!selectedCourse) return;
        setIsAnalyzing(true);
        setAnalysisError(null);
        setAtRiskStudents(null);
        try {
            const result = await getAtRiskStudents(selectedCourse);
            setAtRiskStudents(result);
        } catch (err: any) {
            setAnalysisError(err.message || 'An unknown error occurred.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateEmail = async (student: AtRiskStudent) => {
        if (!selectedCourse) return;
        setSelectedStudent(student);
        setIsEmailModalOpen(true);
        setIsGeneratingEmail(true);
        setEmailError(null);
        setGeneratedEmail(null);
        try {
            const result = await generateOutreachEmail(student.studentName, selectedCourse.name, student.reason);
            setGeneratedEmail(result);
        } catch (err: any) {
            setEmailError(err.message || 'An unknown error occurred.');
        } finally {
            setIsGeneratingEmail(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Attendance Analytics</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">Visualize attendance trends and student engagement.</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                 <div className="flex-grow">
                    <label htmlFor="course-select" className="block mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">Select a course</label>
                    <select 
                        id="course-select"
                        value={selectedCourseId} 
                        onChange={e => {
                            setSelectedCourseId(e.target.value);
                            setAtRiskStudents(null);
                            setAnalysisError(null);
                        }}
                        className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full md:w-auto p-2.5"
                    >
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleGetInsights}
                    disabled={!selectedCourse || isInsightsLoading}
                    className="flex items-center justify-center bg-amber-500 text-white font-bold py-2.5 px-5 rounded-lg hover:bg-amber-600 transition-all active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed mt-4 md:mt-0 md:self-end"
                >
                    {ICONS.sparkles}
                    <span>AI Insights</span>
                </button>
            </div>

            {selectedCourse ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 bg-white dark:bg-zinc-800 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Session Attendance Trend</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Track attendance percentage across all sessions for this course.</p>
                            <div className="h-80">
                                <OverallAttendanceChart course={selectedCourse} />
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-800 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Student Engagement</h3>
                            <div className="h-80">
                                <StudentStatusPieChart course={selectedCourse} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">AI At-Risk Student Analysis</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Use AI to identify students who may need extra support based on their recent attendance patterns.</p>
                        <div className="mt-4">
                            <button
                                onClick={handleAnalyzeAtRisk}
                                disabled={isAnalyzing || !selectedCourse}
                                className="flex items-center justify-center bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-500 transition-all active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-700"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Analyzing...
                                    </>
                                ) : (
                                    'Analyze At-Risk Students'
                                )}
                            </button>
                        </div>

                        {analysisError && (
                            <div className="mt-4 p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-sm">
                                <strong>Error:</strong> {analysisError}
                            </div>
                        )}

                        {atRiskStudents && (
                            <div className="mt-4 space-y-3">
                                {atRiskStudents.length > 0 ? (
                                    atRiskStudents.map(student => (
                                        <div key={student.studentId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-sky-50 dark:bg-blue-950/50 rounded-lg border border-sky-100 dark:border-blue-800">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{student.studentName}</p>
                                                <p className="text-sm text-gray-500 dark:text-sky-200">{student.reason}</p>
                                            </div>
                                            <button
                                                onClick={() => handleGenerateEmail(student)}
                                                className="mt-2 sm:mt-0 flex items-center justify-center bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 font-bold py-2 px-4 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition-all active:scale-95 text-sm whitespace-nowrap"
                                            >
                                                {ICONS.mail}
                                                <span className="ml-2">Generate Email</span>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 dark:text-sky-200 py-4">No at-risk students found based on current attendance data.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-10">Select a course to see analytics.</p>
            )}

            {isInsightsModalOpen && selectedCourse && (
                <AIInsightsModal
                    onClose={() => setIsInsightsModalOpen(false)}
                    isLoading={isInsightsLoading}
                    error={insightsError}
                    insights={insights}
                    courseName={selectedCourse.name}
                />
            )}
            
            {isEmailModalOpen && selectedStudent && selectedCourse && (
                <OutreachEmailModal
                    onClose={() => setIsEmailModalOpen(false)}
                    isLoading={isGeneratingEmail}
                    error={emailError}
                    emailContent={generatedEmail}
                    studentName={selectedStudent.studentName}
                    courseName={selectedCourse.name}
                />
            )}
        </div>
    );
};

export default Analytics;
