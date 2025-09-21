import React from 'react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-sky-50 dark:bg-blue-950">
            <div className="text-center">
                <div className="flex items-center justify-center text-4xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="relative mr-5">
                        <div className="absolute -inset-1.5 bg-sky-500 rounded-2xl animate-ping opacity-75"></div>
                        <div className="relative bg-sky-600 text-white p-4 rounded-2xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <span>ByteForce</span>
                </div>
                <p className="text-lg text-gray-500 dark:text-sky-200 animate-pulse">
                    Initializing...
                </p>
            </div>
        </div>
    );
};

export default LoadingScreen;