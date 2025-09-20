

import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';

interface OutreachEmailModalProps {
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    emailContent: string | null;
    studentName: string;
    courseName: string;
}

const OutreachEmailModal: React.FC<OutreachEmailModalProps> = ({ onClose, isLoading, error, emailContent, studentName, courseName }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleCopy = () => {
        if (emailContent) {
            navigator.clipboard.writeText(emailContent);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                    <p className="text-slate-600 dark:text-slate-300 mt-4">Generating email...</p>
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

        if (emailContent) {
            return (
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans bg-slate-100 dark:bg-slate-900 p-4 rounded-md">
                    {emailContent}
                </div>
            );
        }

        return null;
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-700 relative animate-slide-in-top"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform active:scale-90" aria-label="Close">
                    {ICONS.close}
                </button>
                <div className="flex items-center mb-4">
                    <span className="text-emerald-500 dark:text-emerald-400 mr-2">{ICONS.mail}</span>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generated Outreach Email</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    A draft for <strong className="text-slate-800 dark:text-slate-200">{studentName}</strong> regarding <strong className="text-slate-800 dark:text-slate-200">{courseName}</strong>.
                </p>
                <div className="min-h-[240px]">
                    {renderContent()}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleCopy}
                        disabled={!emailContent || copyStatus === 'copied'}
                        className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-500 transition-all active:scale-95 disabled:bg-slate-400"
                    >
                        {copyStatus === 'copied' ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OutreachEmailModal;