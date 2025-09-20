import React, { useEffect } from 'react';
import { ICONS } from '../constants';

interface CatchUpPlanModalProps {
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    plan: string | null;
    courseName: string;
    sessionDate: string;
}

// Simple markdown renderer for the catch-up plan
const PlanRenderer: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    return (
        <div className="space-y-3 text-slate-600 dark:text-slate-300">
            {lines.map((line, index) => {
                if (line.startsWith('**')) {
                    const content = line.replace(/\*\*/g, '');
                    return <h4 key={index} className="text-md font-bold text-slate-900 dark:text-white mt-3">{content}</h4>;
                }
                if (line.startsWith('-')) {
                    return <p key={index} className="pl-4">{line}</p>;
                }
                return <p key={index}>{line}</p>;
            })}
        </div>
    );
};

const CatchUpPlanModal: React.FC<CatchUpPlanModalProps> = ({ onClose, isLoading, error, plan, courseName, sessionDate }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 dark:border-emerald-400"></div>
                    <p className="text-slate-600 dark:text-slate-300 mt-4">Generating your plan...</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">The AI is crafting a personalized plan for you.</p>
                </div>
            );
        }

        if (error) {
            return (
                 <div className="text-center h-48 flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Generation Failed</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-2 bg-red-500/10 p-3 rounded-md">{error}</p>
                </div>
            );
        }

        if (plan) {
            return <PlanRenderer text={plan} />;
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
                    <span className="text-emerald-500 dark:text-emerald-400 mr-2">{ICONS.magicWand}</span>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI-Assisted Catch-Up Plan</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    For course <strong className="text-slate-800 dark:text-slate-200">{courseName}</strong>, session on <strong className="text-slate-800 dark:text-slate-200">{new Date(sessionDate).toLocaleDateString()}</strong>.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[240px]">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default CatchUpPlanModal;