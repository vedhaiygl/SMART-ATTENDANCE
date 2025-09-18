
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Course } from '../../types';
import { useTheme } from '../../App';

interface ChartProps {
    course: Course;
}

const OverallAttendanceChart: React.FC<ChartProps> = ({ course }) => {
    const { theme } = useTheme();

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
    
    const tickColor = theme === 'dark' ? '#94a3b8' : '#475569';
    const gridColor = theme === 'dark' ? '#475569' : '#e2e8f0';
    const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
    const tooltipBorder = theme === 'dark' ? '#475569' : '#e2e8f0';
    const tooltipColor = theme === 'dark' ? '#cbd5e1' : '#1e293b';

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        color: tooltipColor
                    }}
                />
                <Legend wrapperStyle={{fontSize: "14px", color: tickColor}} />
                <Line type="monotone" dataKey="attendance" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} dot={{fill: '#4f46e5', r:4}} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default OverallAttendanceChart;