
import React from 'react';
import type { ViewType } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-2 rounded-lg cursor-pointer transition-all duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
    }`}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ view, setView }) => {
  return (
    <aside className="w-64 bg-slate-800 p-4 flex flex-col border-r border-slate-700">
      <div className="text-2xl font-bold text-white mb-10 flex items-center justify-center py-4">
        <span className="bg-indigo-600 p-2 rounded-lg mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
        SmartTrack
      </div>
      <nav>
        <ul>
          <NavItem
            icon={ICONS.dashboard}
            label="Dashboard"
            isActive={view === 'dashboard'}
            onClick={() => setView('dashboard')}
          />
          <NavItem
            icon={ICONS.courses}
            label="Courses"
            isActive={view === 'courses'}
            onClick={() => setView('courses')}
          />
          <NavItem
            icon={ICONS.analytics}
            label="Analytics"
            isActive={view === 'analytics'}
            onClick={() => setView('analytics')}
          />
        </ul>
      </nav>
      <div className="mt-auto p-4 bg-slate-700/50 rounded-lg text-center text-slate-400 text-sm">
        <p className="font-semibold text-slate-200">Attendance System v1.0</p>
        <p className="mt-1">© 2024 Your University</p>
      </div>
    </aside>
  );
};

export default Sidebar;
