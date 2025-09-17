import React, { useState } from 'react';
import type { UserRole } from '../types';

interface LoginProps {
    onLogin: (username: string, password: string, role: UserRole) => Promise<string | null>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'select' | 'faculty' | 'student'>('select');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleBackToSelect = () => {
        setMode('select');
        setUsername('');
        setPassword('');
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) { // Supabase default is 6
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (mode !== 'select') {
            setLoading(true);
            const errorMessage = await onLogin(username, password, mode);
            if (errorMessage) {
                setError(errorMessage);
            }
            // On success, App component will re-render and this component will be unmounted
            setLoading(false);
        }
    };

    if (mode === 'select') {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
                <div className="w-full max-w-sm p-8 space-y-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
                            <span className="bg-indigo-600 p-2 rounded-lg mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </span>
                            SmartTrack
                        </div>
                        <p className="text-slate-400">Please select your role to login.</p>
                    </div>
                    <div className="space-y-4">
                        <button
                            onClick={() => setMode('faculty')}
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-300 transform hover:scale-105"
                        >
                            Faculty Login
                        </button>
                        <button
                            onClick={() => setMode('student')}
                            className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-500 transition-colors duration-300 transform hover:scale-105"
                        >
                            Student Login
                        </button>
                    </div>
                    <div className="mt-6 text-xs text-slate-500 text-center">
                        <p>© 2024 Your University. All rights reserved.</p>
                    </div>
                </div>
            </div>
        );
    }

    const title = mode === 'faculty' ? 'Faculty Sign In' : 'Student Sign In';
    const accentColor = mode === 'faculty' ? 'indigo' : 'sky';

    return (
        <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
            <div className="w-full max-w-sm p-8 space-y-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
                <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
                        <span className={`bg-${accentColor}-600 p-2 rounded-lg mr-3`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        {title}
                    </div>
                    <p className="text-slate-400">Sign in to continue.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                            Email Address
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="email"
                            autoComplete="email"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
                            placeholder="e.g., name@university.edu"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-slate-300 mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/20 text-red-300 rounded-md text-sm font-medium text-center">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-${accentColor}-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-${accentColor}-500 transition-colors duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed`}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <button onClick={handleBackToSelect} className="text-sm text-slate-400 hover:text-white hover:underline disabled:text-slate-600" disabled={loading}>
                        &larr; Back to role selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;