import React from 'react';

interface SplashScreenProps {
  onEnter: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="text-center p-8">
        <div className="flex items-center justify-center text-5xl font-bold mb-4">
          <span className="bg-emerald-600 text-white p-4 rounded-2xl mr-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          ByteForce
        </div>
        <p className="text-lg text-slate-500 dark:text-slate-400">Site Created By - VEDHAN S</p>
        <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 mb-10">
          The future of attendance management.
        </p>
        <button
          onClick={onEnter}
          className="bg-emerald-600 text-white font-bold py-4 px-10 rounded-lg text-lg hover:bg-emerald-500 transition-all duration-200 transform hover:scale-110 active:scale-100 focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
        >
          Get Started
        </button>
      </div>
      <footer className="absolute bottom-6 text-xs text-slate-400 dark:text-slate-500">
        <p>© 2024 Your University. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default SplashScreen;