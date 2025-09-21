import React from 'react';
import type { FacultyViewType } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  view: FacultyViewType;
  setView: (view: FacultyViewType) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-2 rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98] ${
      isActive
        ? 'bg-amber-500 text-white shadow-lg'
        : 'text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200'
    }`}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ view, setView, isOpen, onClose }) => {
    const handleSetView = (newView: FacultyViewType) => {
        setView(newView);
        onClose();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-800 p-4 flex flex-col border-r border-zinc-200 dark:border-zinc-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden absolute top-4 right-4 text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-transform active:scale-90"
                    aria-label="Close menu"
                >
                    {ICONS.close}
                </button>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-10 flex items-center justify-center py-4">
                    <span className="bg-amber-500 p-2 rounded-lg mr-2 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    ByteForce
                </div>
                <nav>
                    <ul>
                        <NavItem
                            icon={ICONS.dashboard}
                            label="Dashboard"
                            isActive={view === 'dashboard'}
                            onClick={() => handleSetView('dashboard')}
                        />
                        <NavItem
                            icon={ICONS.courses}
                            label="Courses"
                            isActive={view === 'courses'}
                            onClick={() => handleSetView('courses')}
                        />
                        <NavItem
                            icon={ICONS.analytics}
                            label="Analytics"
                            isActive={view === 'analytics'}
                            onClick={() => handleSetView('analytics')}
                        />
                    </ul>
                </nav>
                <div className="mt-auto p-4 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg text-center text-zinc-500 dark:text-zinc-400 text-sm">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Attendance System v1.0</p>
                    <p className="mt-1">© 2024 Your University</p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
