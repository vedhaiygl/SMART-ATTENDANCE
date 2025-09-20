

import React, { useState, useMemo } from 'react';
import type { Course, AtRiskStudent, Student } from '../types';
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
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Attendance Analytics</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Visualize attendance trends and student engagement.</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                 <div className="flex-grow">
                    <label htmlFor="course-select" className="block mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Select a course</label>
                    <select 
                        id="course-select"
                        value={selectedCourseId} 
                        onChange={e => {
                            setSelectedCourseId(e.target.value);
                            setAtRiskStudents(null);
                            setAnalysisError(null);
                        }}
                        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full md:w-auto p-2.5"
                    >
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleGetInsights}
                    disabled={!selectedCourse || isInsightsLoading}
                    className="flex items-center justify-center bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-lg hover:bg-emerald-500 transition-all active:scale-95 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed mt-4 md:mt-0 md:self-end"
                >
                    {ICONS.sparkles}
                    <span>AI Insights</span>
                </button>
            </div>

            {selectedCourse ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Session Attendance Trend</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Track attendance percentage across all sessions for this course.</p>
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

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI At-Risk Student Analysis</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Identify students who may need additional support based on attendance patterns.</p>
                        
                        {isAnalyzing ? (
                             <div className="flex flex-col items-center justify-center h-40">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                                <p className="text-slate-600 dark:text-slate-300 mt-4">Analyzing patterns...</p>
                            </div>
                        ) : analysisError ? (
                            <div className="mt-4 p-4 text-center bg-red-500/10 text-red-600 dark:text-red-400 rounded-md">
                                <p><strong>Analysis Failed:</strong> {analysisError}</p>
                            </div>
                        ) : atRiskStudents ? (
                            atRiskStudents.length > 0 ? (
                                <div className="mt-4 space-y-3">
                                    {atRiskStudents.map(student => (
                                        <div key={student.studentId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{student.studentName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">Reason: {student.reason}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleGenerateEmail(student)}
                                                className="flex items-center justify-center mt-2 sm:mt-0 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 font-bold py-1.5 px-3 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-all active:scale-95 text-sm whitespace-nowrap"
                                            >
                                                <span className="mr-2">{ICONS.mail}</span>
                                                Generate Outreach Email
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                 <p className="mt-4 text-center text-slate-500 dark:text-slate-400 py-6">Good news! No students currently show at-risk attendance patterns.</p>
                            )
                        ) : (
                            <div className="text-center mt-6">
                                <button 
                                    onClick={handleAnalyzeAtRisk} 
                                    className="bg-emerald-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-emerald-500 transition-all active:scale-95"
                                >
                                    Analyze Student Engagement
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 py-10">Select a course to see analytics.</p>
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