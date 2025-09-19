import React from 'react';
import type { ViewType, User } from '../types';
import { ICONS } from '../constants';
import { useTheme } from '../App';

interface HeaderProps {
  view: ViewType;
  user: User;
  onLogout: () => void;
  onMenuClick: () => void;
}

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? ICONS.moon : ICONS.sun}
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ view, user, onLogout, onMenuClick }) => {
  const title = view.charAt(0).toUpperCase() + view.slice(1);

  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
      <div className="flex items-center">
        <button
            onClick={onMenuClick}
            className="text-slate-800 dark:text-slate-200 mr-4 lg:hidden transition-transform active:scale-90"
            aria-label="Open menu"
        >
          {ICONS.menu}
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
          <span className="text-slate-600 dark:text-slate-300">Welcome, {user.name}</span>
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-all active:scale-95 text-sm"
          >
              Logout
          </button>
      </div>
    </header>
  );
};

export default Header;