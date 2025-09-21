

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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">Generating email...</p>
                </div>
            );
        }

        if (error) {
            return (
                 <div className="text-center h-48 flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Generation Failed</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 bg-red-500/10 p-3 rounded-md">{error}</p>
                </div>
            );
        }

        if (emailContent) {
            return (
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans bg-sky-100 dark:bg-blue-800 p-4 rounded-md">
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
                className="bg-white dark:bg-blue-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-sky-100 dark:border-blue-800 relative animate-slide-in-top"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-sky-200 hover:text-gray-900 dark:hover:text-white transition-transform active:scale-90" aria-label="Close">
                    {ICONS.close}
                </button>
                <div className="flex items-center mb-4">
                    <span className="text-sky-500 dark:text-sky-400 mr-2">{ICONS.mail}</span>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generated Outreach Email</h2>
                </div>
                <p className="text-gray-500 dark:text-sky-200 mb-6">
                    A draft for <strong className="text-gray-800 dark:text-gray-200">{studentName}</strong> regarding <strong className="text-gray-800 dark:text-gray-200">{courseName}</strong>.
                </p>
                <div className="min-h-[240px]">
                    {renderContent()}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleCopy}
                        disabled={!emailContent || copyStatus === 'copied'}
                        className="bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-500 transition-all active:scale-95 disabled:bg-gray-400"
                    >
                        {copyStatus === 'copied' ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OutreachEmailModal;