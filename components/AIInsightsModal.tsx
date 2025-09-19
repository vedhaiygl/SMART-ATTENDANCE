import React, { useEffect } from 'react';
import { ICONS } from '../constants';

interface AIInsightsModalProps {
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    insights: string | null;
    courseName: string;
}

// A simple component to render markdown-like text
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const sections = text.split('**').filter(Boolean); // Split by ** and remove empty strings
    
    return (
        <div className="space-y-2 text-slate-600 dark:text-slate-300">
            {sections.map((section, index) => {
                if (index % 2 === 0) {
                    // This is a heading like "Analysis:" or "Recommendations:"
                    return <h3 key={index} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{section}</h3>;
                } else {
                    // This is the content
                    const listItems = section.trim().split(/\n\s*(?=\d\.)/).map((item, i) => {
                        if (!item) return null;
                        const parts = item.split(':');
                        const title = parts.shift();
                        const content = parts.join(':').trim();
                        return (
                             <div key={i} className="mb-3">
                                <p>
                                    <strong className="text-slate-800 dark:text-slate-100">{title}:</strong>
                                    <span> {content}</span>
                                </p>
                            </div>
                        )
                    });
                    return <div key={index}>{listItems}</div>
                }
            })}
        </div>
    );
};


const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ onClose, isLoading, error, insights, courseName }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
                    <p className="text-slate-600 dark:text-slate-300 mt-4">Analyzing data...</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">The AI is thinking. This may take a moment.</p>
                </div>
            );
        }

        if (error) {
            return (
                 <div className="text-center h-48 flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Analysis Failed</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-2 bg-red-500/10 p-3 rounded-md">{error}</p>
                </div>
            );
        }

        if (insights) {
             // A simple check for a common non-analytical response
            if (insights.includes("enough session data")) {
                return (
                    <div className="text-center h-48 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-sky-600 dark:text-sky-400">More Data Needed</h3>
                        <p className="text-slate-600 dark:text-slate-300 mt-2">{insights}</p>
                    </div>
                );
            }
            return <MarkdownRenderer text={insights} />;
        }

        return null;
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-700 relative transform transition-transform scale-100"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform active:scale-90" aria-label="Close">
                    {ICONS.close}
                </button>
                <div className="flex items-center mb-4">
                    <span className="text-indigo-500 dark:text-indigo-400">{ICONS.sparkles}</span>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Engagement Insights</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Powered by Gemini, here are some data-driven suggestions for <strong className="text-slate-800 dark:text-slate-200">{courseName}</strong>.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[240px]">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AIInsightsModal;