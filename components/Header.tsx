import React from 'react';
import type { ViewType, User } from '../types';

interface HeaderProps {
  view: ViewType;
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ view, user, onLogout }) => {
  const title = view.charAt(0).toUpperCase() + view.slice(1);

  return (
    <header className="bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-700 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <div className="flex items-center space-x-4">
          <span className="text-slate-300">Welcome, {user.name}</span>
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
