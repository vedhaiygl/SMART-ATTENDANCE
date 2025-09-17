
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Course } from '../../types';

interface ChartProps {
    course: Course;
}

const OverallAttendanceChart: React.FC<ChartProps> = ({ course }) => {
    const data = course.sessions.map(session => {
        const sessionAttendance = course.attendance.filter(a => a.sessionId === session.id);
        const presentCount = sessionAttendance.filter(a => a.status === 'Present').length;
        const totalStudents = course.students.length;
        const percentage = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
        return {
            date: new Date(session.date).toLocaleDateString(),
            attendance: parseFloat(percentage.toFixed(1)),
        };
    });

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#475569',
                        color: '#cbd5e1'
                    }}
                />
                <Legend wrapperStyle={{fontSize: "14px"}} />
                <Line type="monotone" dataKey="attendance" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} dot={{fill: '#4f46e5', r:4}} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default OverallAttendanceChart;
