import React from 'react';
import type { User, Course } from '../types';
import { ICONS } from '../constants';

interface StudentLiveClassPageProps {
    user: User;
    courses: Course[];
    onJoinClass: (info: { courseId: string, liveClassId: string }) => void;
}

const StudentLiveClassPage: React.FC<StudentLiveClassPageProps> = ({ user, courses, onJoinClass }) => {
    const activeLiveClasses = React.useMemo(() => {
        return courses
            .filter(c => c.students.some(s => s.id === user.id))
            .flatMap(course => 
                course.liveClasses
                    .filter(lc => lc.status === 'live')
                    .map(liveClass => ({ course, liveClass }))
            );
    }, [courses, user.id]);

    return (
        <div className="mt-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Live Classes</h2>
                <p className="text-gray-500 dark:text-sky-200">Join any ongoing classes for your enrolled courses.</p>
            </div>

            {activeLiveClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeLiveClasses.map(({ course, liveClass }) => (
                        <div key={liveClass.id} className="bg-white dark:bg-blue-900 p-6 rounded-xl border-2 border-red-500/50 flex flex-col items-center text-center shadow-lg shadow-red-500/10 animate-pulse-in">
                            <div className="text-red-500 mb-3 animate-pulse">
                                {ICONS.live}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{course.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-sky-200 mt-1">A live class is in session now!</p>
                            <button
                                onClick={() => onJoinClass({ courseId: course.id, liveClassId: liveClass.id })}
                                className="mt-4 bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-500 transition-all active:scale-95"
                            >
                                Join Class
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-blue-900 rounded-xl border border-sky-100 dark:border-blue-800">
                    <div className="text-gray-400 dark:text-gray-500 w-16 h-16 mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75Zm4.5 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-4">No Live Classes Right Now</h3>
                    <p className="text-gray-500 dark:text-sky-200 mt-1">Check back later or watch for a notification banner.</p>
                </div>
            )}
        </div>
    );
};

export default StudentLiveClassPage;