

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
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
            date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            attendance: parseFloat(percentage.toFixed(1)),
        };
    });
    
    const averageAttendance = data.length > 0 
        ? data.reduce((acc, curr) => acc + curr.attendance, 0) / data.length
        : 0;
    
    const tickColor = theme === 'dark' ? '#94a3b8' : '#475569';
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0'; // slate-700, slate-200
    const tooltipBg = theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)';
    const tooltipBorder = theme === 'dark' ? '#475569' : '#e2e8f0';
    const tooltipColor = theme === 'dark' ? '#cbd5e1' : '#1e293b';

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" stroke={tickColor} fontSize={12} tickLine={false} axisLine={{ stroke: gridColor }} />
                <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={{ stroke: gridColor }} unit="%" />
                <Tooltip
                    formatter={(value: number) => [`${value}%`, "Attendance"]}
                    labelFormatter={(label: string) => `Session: ${label}`}
                    contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        color: tooltipColor,
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(4px)',
                    }}
                    cursor={{ stroke: '#34d399', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Legend wrapperStyle={{fontSize: "14px", color: tickColor}} verticalAlign="top" align="right" />
                
                {averageAttendance > 0 && (
                     <ReferenceLine 
                        y={averageAttendance} 
                        label={{ 
                            value: `Avg ${averageAttendance.toFixed(0)}%`, 
                            position: 'insideTopRight', 
                            fill: theme === 'dark' ? '#f59e0b' : '#d97706',
                            fontSize: 12,
                            fontWeight: 'bold',
                        }} 
                        stroke={theme === 'dark' ? '#f59e0b' : '#d97706'} 
                        strokeDasharray="4 4" 
                    />
                )}
                
                <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }} dot={{fill: '#10b981', r:4, strokeWidth: 0}} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default OverallAttendanceChart;