import React, { useState, useEffect } from 'react';
import type { Course } from '../types';
import { ICONS } from '../constants';
import { generateCourseBanner } from '../lib/gemini';

interface GenerateBannerModalProps {
    course: Course;
    onClose: () => void;
    onUpdateBanner: (courseId: string, bannerUrl: string) => void;
}

const GenerateBannerModal: React.FC<GenerateBannerModalProps> = ({ course, onClose, onUpdateBanner }) => {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setErrorMessage("Please enter a prompt to generate an image.");
            setStatus('error');
            return;
        }
        setStatus('loading');
        setErrorMessage(null);
        setGeneratedImage(null);

        try {
            const finalPrompt = `${prompt} for a course on ${course.name}`;
            const imageUrl = await generateCourseBanner(finalPrompt);
            setGeneratedImage(imageUrl);
            setStatus('success');
        } catch (err: any) {
            setErrorMessage(err.message || 'An unknown error occurred.');
            setStatus('error');
        }
    };

    const handleUseImage = () => {
        if (generatedImage) {
            onUpdateBanner(course.id, generatedImage);
            onClose();
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                        <p className="text-zinc-600 dark:text-zinc-300 mt-4">Generating your banner...</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">This may take a moment.</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="aspect-video w-full">
                         {generatedImage && <img src={generatedImage} alt="Generated course banner" className="rounded-lg w-full h-full object-cover" />}
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center h-48 flex flex-col justify-center bg-red-500/10 p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Generation Failed</h3>
                        <p className="text-zinc-600 dark:text-zinc-300 mt-2">{errorMessage}</p>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-48 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600">
                        <p className="text-zinc-500 dark:text-zinc-400">Your generated banner will appear here.</p>
                    </div>
                );
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-zinc-200 dark:border-zinc-700 animate-slide-in-top"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-transform active:scale-90" aria-label="Close">
                    {ICONS.close}
                </button>

                <div className="flex items-center gap-2 mb-4">
                     {ICONS.magicWand}
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Generate Course Banner</h2>
                </div>
                 <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                    Create a unique banner for <strong className="text-zinc-700 dark:text-zinc-200">{course.name}</strong> using AI.
                </p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="prompt-input" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Describe the banner you want:
                        </label>
                        <div className="flex gap-4">
                            <input
                                id="prompt-input"
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., Abstract art with code snippets"
                                className="flex-1 bg-zinc-100 dark:bg-zinc-700 w-full text-zinc-900 dark:text-white rounded-md py-2 px-3 border border-zinc-200 dark:border-zinc-600 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={status === 'loading'}
                                className="bg-amber-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-all active:scale-95 disabled:bg-gray-400"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                    
                    <div className="min-h-[200px] flex items-center justify-center">
                        {renderContent()}
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-100 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUseImage}
                        disabled={status !== 'success'}
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500 transition-all active:scale-95 disabled:bg-gray-400"
                    >
                        Use This Image
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateBannerModal;
