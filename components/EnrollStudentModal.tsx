import React, { useState, useMemo, useEffect } from 'react';
import type { Course, Student } from '../types';
import { ICONS } from '../constants';

interface EnrollStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
    allStudents: Student[];
    enrollStudent: (courseId: string, studentId: string) => void;
}

const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
    isOpen,
    onClose,
    course,
    allStudents,
    enrollStudent
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        const lowercasedTerm = searchTerm.toLowerCase();
        return allStudents.filter(student => 
            (student.anonymizedName.toLowerCase().includes(lowercasedTerm) || student.id.toLowerCase().includes(lowercasedTerm))
        ).slice(0, 10); // Limit results for performance
    }, [searchTerm, allStudents]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-slate-200 dark:border-slate-700 relative transform transition-transform scale-100"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform active:scale-90">
                    {ICONS.close}
                </button>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Enroll Student</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Search for a student by ID or anonymized name to enroll them in <strong className="text-slate-700 dark:text-slate-200">{course.name}</strong>.</p>
                
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Anonymized Name or ID..."
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    aria-label="Search for students"
                    autoFocus
                />

                <div className="mt-4 max-h-64 overflow-y-auto pr-2 space-y-2">
                    {searchResults.map(student => {
                        const isEnrolled = course.students.some(s => s.id === student.id);
                        return (
                            <div key={student.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{student.anonymizedName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{student.name} ({student.id})</p>
                                </div>
                                <button
                                    onClick={() => enrollStudent(course.id, student.id)}
                                    disabled={isEnrolled}
                                    className="bg-emerald-600 text-white font-semibold py-1.5 px-4 rounded-lg text-sm hover:bg-emerald-500 transition-all active:scale-95 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                    {isEnrolled ? 'Enrolled' : 'Enroll'}
                                </button>
                            </div>
                        );
                    })}
                    {searchTerm && searchResults.length === 0 && (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-4">No students found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnrollStudentModal;