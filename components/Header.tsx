import React from 'react';
import type { ViewType, User } from '../types';

interface HeaderProps {
  view: ViewType;
  user: User;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ view, user, onLogout, onMenuToggle }) => {
  const title = view.charAt(0).toUpperCase() + view.slice(1);

  return (
    <header className="bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-700 flex justify-between items-center">
      <div className="flex items-center">
        {/* Mobile menu button */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden mr-3 text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className="text-xl lg:text-2xl font-bold text-white">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
          <span className="text-slate-300 hidden sm:inline">Welcome, {user.name}</span>
          <span className="text-slate-300 sm:hidden">{user.name}</span>
          <button
            onClick={onLogout}
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors text-sm"
          >
              Logout
          </button>
      </div>
    </header>
  );
};

export default Header;
