import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { User, Course, ChatMessage } from '../types';
import { startChatWithStudyBuddy } from '../lib/gemini';
import type { Chat } from '@google/genai';
import { ICONS } from '../constants';

const formatText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const elements: React.ReactNode[] = [];
    const lines = text.split('\n');
    let listItems: string[] = [];

    const flushList = (key: string) => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={key} className="list-disc list-inside space-y-1 my-2 pl-2">
                    {listItems.map((item, j) => (
                        <li key={j} dangerouslySetInnerHTML={{ __html: formatText(item) }} />
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, i) => {
        const isListItem = line.trim().startsWith('* ') || line.trim().startsWith('- ');
        if (isListItem) {
            listItems.push(line.substring(line.indexOf(' ') + 1));
        } else {
            flushList(`ul-${i}`);
            if (line.trim()) {
                elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: formatText(line) }} />);
            }
        }
    });

    flushList('ul-end');

    return <div className="space-y-2">{elements}</div>;
};


const StudyBuddyPage: React.FC<{ user: User, courses: Course[] }> = ({ user, courses }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    const enrolledCourses = useMemo(() => {
        return courses.filter(course => course.students.some(student => student.id === user.id));
    }, [courses, user.id]);

    useEffect(() => {
        try {
            if (enrolledCourses.length > 0) {
                const chatSession = startChatWithStudyBuddy(enrolledCourses, user.name);
                setChat(chatSession);
                setHistory([{
                    role: 'model',
                    text: `Hi ${user.name}! I'm your AI Study Buddy. How can I help you with your courses today? You can ask me for explanations, practice problems, or study tips!`
                }]);
            } else {
                 setHistory([{
                    role: 'model',
                    text: `Hi ${user.name}! It looks like you're not enrolled in any courses. Once you are, I can help you with your studies!`
                }]);
            }
        } catch (e: any) {
            setError(e.message || "Could not start the study buddy. Please check your API key configuration.");
        }
    }, [enrolledCourses, user.name]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    const handleSendMessage = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isLoading) return;

        const text = userInput.trim();
        setUserInput('');
        setIsLoading(true);

        const userMessage: ChatMessage = { role: 'user', text };
        setHistory(prev => [...prev, userMessage, { role: 'model', text: '' }]);

        try {
            const result = await chat.sendMessageStream({ message: text });
            let responseText = '';
            for await (const chunk of result) {
                responseText += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    if (newHistory.length > 0) {
                        newHistory[newHistory.length - 1] = { role: 'model', text: responseText };
                    }
                    return newHistory;
                });
            }
        } catch (e) {
            console.error("Error sending message:", e);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setHistory(prev => {
                const newHistory = [...prev];
                 if (newHistory.length > 0) {
                    newHistory[newHistory.length - 1] = { role: 'model', text: errorMessage };
                }
                return newHistory;
            });
        } finally {
            setIsLoading(false);
        }
    }, [chat, isLoading, userInput]);

    return (
        <div className="mt-6 flex flex-col h-[calc(100vh-220px)] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Study Buddy</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Your personal academic assistant.</p>
            </div>
            {error ? (
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-red-500 bg-red-500/10 p-4 rounded-lg">{error}</p>
                </div>
            ) : (
                <>
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && (
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                                        {ICONS.studyBuddy}
                                    </div>
                                )}
                                <div className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                                    {isLoading && index === history.length - 1 && msg.role === 'model' && msg.text.length === 0 ? (
                                        <div className="flex items-center space-x-1 p-1">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                                        </div>
                                    ) : (
                                        <>
                                            <SimpleMarkdown text={msg.text} />
                                            {isLoading && index === history.length - 1 && msg.role === 'model' && (
                                                <div className="inline-block w-2 h-4 bg-slate-600 dark:bg-slate-300 ml-1 animate-pulse align-bottom"></div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder={enrolledCourses.length > 0 ? "Ask a question about your courses..." : "You are not enrolled in any courses."}
                                disabled={isLoading || enrolledCourses.length === 0}
                                className="flex-1 bg-slate-100 dark:bg-slate-700 w-full text-slate-900 dark:text-white rounded-full py-2 px-4 border border-slate-300 dark:border-slate-600 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !userInput.trim() || enrolledCourses.length === 0}
                                className="bg-emerald-600 text-white font-bold p-3 rounded-full hover:bg-emerald-500 transition-all active:scale-95 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default StudyBuddyPage;
