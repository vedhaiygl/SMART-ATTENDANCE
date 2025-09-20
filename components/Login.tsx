import React, { useState, useEffect } from 'react';
import type { UserRole } from '../types';

interface LoginProps {
    onLogin: (username: string, password: string, role: UserRole, rememberMe: boolean) => string | null;
    onForgotPassword: (email: string) => string | null;
}


const Login: React.FC<LoginProps> = ({ onLogin, onForgotPassword }) => {
    const [mode, setMode] = useState<'select' | 'faculty' | 'student' | 'forgot'>('select');
    const [previousLoginMode, setPreviousLoginMode] = useState<'faculty' | 'student'>('faculty');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [formErrors, setFormErrors] = useState<{
        username?: string;
        password?: string;
        captcha?: string;
        general?: string;
        resetEmail?: string;
    }>({});
    
    // CAPTCHA state
    const [captchaNum1, setCaptchaNum1] = useState(0);
    const [captchaNum2, setCaptchaNum2] = useState(0);
    const [captchaAnswer, setCaptchaAnswer] = useState('');

    const generateCaptcha = () => {
        setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
        setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
        setCaptchaAnswer('');
    };
    
    const resetFormState = () => {
        setUsername('');
        setPassword('');
        setRememberMe(false);
        setFormErrors({});
        setInfoMessage('');
        setCaptchaAnswer('');
        generateCaptcha();
    };

    useEffect(() => {
        if (mode !== 'select') {
            generateCaptcha();
        }
    }, [mode]);

    const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleBackToSelect = () => {
        setMode('select');
        resetFormState();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setInfoMessage('');
        
        const newErrors: typeof formErrors = {};
        let hasError = false;

        if (!validateEmail(username)) {
            newErrors.username = 'Please enter a valid email address.';
            hasError = true;
        }

        if (password.length < 6) { 
            newErrors.password = 'Password must be at least 6 characters long.';
            hasError = true;
        }
        
        if (parseInt(captchaAnswer, 10) !== captchaNum1 + captchaNum2) {
            newErrors.captcha = 'Incorrect CAPTCHA answer. Please try again.';
            hasError = true;
        }
        
        setFormErrors(newErrors);

        if (hasError) {
            if (newErrors.captcha) {
                generateCaptcha();
            }
            return;
        }


        setLoading(true);

        if (mode !== 'faculty' && mode !== 'student') {
            setLoading(false);
            return;
        }
        
        // Simulate network delay for better UX
        setTimeout(() => {
            const errorMessage = onLogin(username, password, mode, rememberMe);
            if (errorMessage) {
                setFormErrors({ general: errorMessage });
                generateCaptcha();
            }
            setLoading(false);
        }, 500);
    };

    const handleForgotPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setInfoMessage('');
        
        const newErrors: typeof formErrors = {};
        let hasError = false;

        if (!validateEmail(resetEmail)) {
            newErrors.resetEmail = 'Please enter a valid email address.';
            hasError = true;
        }
        
        if (parseInt(captchaAnswer, 10) !== captchaNum1 + captchaNum2) {
            newErrors.captcha = 'Incorrect CAPTCHA answer. Please try again.';
            hasError = true;
        }
        
        setFormErrors(newErrors);

        if (hasError) {
            if (newErrors.captcha) {
                generateCaptcha();
            }
            return;
        }


        setLoading(true);

        // Simulate network delay for better UX
        setTimeout(() => {
            const resultMessage = onForgotPassword(resetEmail);
            setLoading(false);
            if (resultMessage) {
                setInfoMessage(resultMessage);
            }
            setResetEmail('');
            generateCaptcha();
        }, 500);

    };

    if (mode === 'select') {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
                <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center">
                            <span className="bg-indigo-600 text-white p-2 rounded-lg mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </span>
                            ByteForce
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">Please select your role to login.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <button onClick={() => setMode('faculty')} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 transition-all duration-150 transform hover:scale-105 active:scale-95">
                            Faculty Portal
                        </button>
                        <button onClick={() => setMode('student')} className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-500 transition-all duration-150 transform hover:scale-105 active:scale-95">
                            Student Portal
                        </button>
                    </div>

                    <div className="mt-4 text-xs text-slate-400 dark:text-slate-500 text-center">
                        <p>© 2024 Your University. All rights reserved.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'forgot') {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
                <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Enter your email to receive a reset link.</p>
                    </div>
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="reset-email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="reset-email" name="reset-email" type="email" autoComplete="email" required value={resetEmail}
                                onChange={(e) => { setResetEmail(e.target.value); setFormErrors(prev => ({...prev, resetEmail: undefined})); }}
                                className={`w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                placeholder="e.g., name@university.edu"
                            />
                            {formErrors.resetEmail && <p className="mt-2 text-xs text-red-500">{formErrors.resetEmail}</p>}
                        </div>
                        
                        <div>
                            <label htmlFor="captcha-forgot" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Security Check: What is {captchaNum1} + {captchaNum2}?
                            </label>
                            <input
                                id="captcha-forgot" name="captcha-forgot" type="number" required value={captchaAnswer}
                                onChange={(e) => { setCaptchaAnswer(e.target.value); setFormErrors(prev => ({...prev, captcha: undefined})); }}
                                className={`w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                placeholder="Your answer"
                            />
                            {formErrors.captcha && <p className="mt-2 text-xs text-red-500">{formErrors.captcha}</p>}
                        </div>

                        {formErrors.general && <div className="p-3 bg-red-500/20 text-red-400 dark:text-red-300 rounded-md text-sm font-medium text-center">{formErrors.general}</div>}
                        {infoMessage && <div className="p-3 bg-green-500/20 text-green-700 dark:text-green-300 rounded-md text-sm font-medium text-center">{infoMessage}</div>}
                        
                        <div>
                            <button type="submit" disabled={loading || !!infoMessage} className={`w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 transition-transform duration-150 transform hover:scale-105 active:scale-95 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed`}>
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>
                    <div className="text-center">
                        <button onClick={() => setMode(previousLoginMode)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline disabled:text-slate-600" disabled={loading}>
                           &larr; Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const title = mode === 'faculty' ? 'Faculty' : 'Student';
    const accentColor = mode === 'faculty' ? 'indigo' : 'sky';
    const formTitle = `${title} Sign In`;
    const buttonTitle = 'Login';
    const loadingText = 'Logging in...';

    return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
            <div className={`w-full max-w-sm p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 transition-colors duration-300 ${mode === 'faculty' ? 'border-indigo-500' : 'border-sky-500'}`}>
                <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center">
                        <span className={`bg-${accentColor}-600 text-white p-2 rounded-lg mr-3`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        {formTitle}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                        Sign in to continue.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Email Address</label>
                        <input id="username" name="username" type="email" autoComplete="username" required value={username}
                            onChange={(e) => { setUsername(e.target.value); setFormErrors(prev => ({...prev, username: undefined, general: undefined})); }}
                            className={`w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
                            placeholder="e.g., name@university.edu" />
                        {formErrors.username && <p className="mt-2 text-xs text-red-500">{formErrors.username}</p>}
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Password</label>
                        <input id="password" name="password" type="password" autoComplete="current-password" required value={password}
                            onChange={(e) => { 
                                setPassword(e.target.value);
                                setFormErrors(prev => ({...prev, password: undefined, general: undefined}));
                            }}
                            className={`w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
                            placeholder="••••••••" />
                        {formErrors.password && <p className="mt-2 text-xs text-red-500">{formErrors.password}</p>}
                    </div>
                     <div>
                        <label htmlFor="captcha-login" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Security Check: What is {captchaNum1} + {captchaNum2}?</label>
                        <input id="captcha-login" name="captcha-login" type="number" required value={captchaAnswer}
                            onChange={(e) => { setCaptchaAnswer(e.target.value); setFormErrors(prev => ({...prev, captcha: undefined, general: undefined})); }}
                            className={`w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
                            placeholder="Your answer" />
                         {formErrors.captcha && <p className="mt-2 text-xs text-red-500">{formErrors.captcha}</p>}
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={`h-4 w-4 rounded text-${accentColor}-600 focus:ring-${accentColor}-500 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700`}
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-300">
                                Remember me
                            </label>
                        </div>
                        <div className="text-sm">
                            <button type="button" onClick={() => { if(mode === 'faculty' || mode === 'student') setPreviousLoginMode(mode); setMode('forgot'); }} className={`font-medium text-${accentColor}-600 hover:text-${accentColor}-500 dark:text-${accentColor}-400 dark:hover:text-${accentColor}-300 focus:outline-none focus:underline`}>
                                Forgot password?
                            </button>
                        </div>
                    </div>


                    {formErrors.general && <div className="p-3 bg-red-500/20 text-red-400 dark:text-red-300 rounded-md text-sm font-medium text-center">{formErrors.general}</div>}
                    {infoMessage && <div className="p-3 bg-sky-500/20 text-sky-700 dark:text-sky-300 rounded-md text-sm font-medium text-center">{infoMessage}</div>}
                    
                    <div>
                        <button type="submit" disabled={loading} className={`w-full bg-${accentColor}-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-${accentColor}-500 transition-transform duration-150 transform hover:scale-105 active:scale-95 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed`}>
                            {loading ? loadingText : buttonTitle}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <button onClick={handleBackToSelect} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline disabled:text-slate-600" disabled={loading}>
                        &larr; Back to role selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;