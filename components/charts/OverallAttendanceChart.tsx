

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
    
    const tickColor = theme === 'dark' ? '#9ca3af' : '#4b5563';
    const gridColor = theme === 'dark' ? '#1e40af' : '#e0f2fe';
    const tooltipBg = theme === 'dark' ? 'rgba(30, 64, 175, 0.8)' : 'rgba(255, 255, 255, 0.8)';
    const tooltipBorder = theme === 'dark' ? '#1e40af' : '#e0f2fe';
    const tooltipColor = theme === 'dark' ? '#d1d5db' : '#1f2937';

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
                    cursor={{ stroke: '#0ea5e9', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Legend wrapperStyle={{fontSize: "14px", color: tickColor}} verticalAlign="top" align="right" />
                
                {averageAttendance > 0 && (
                     <ReferenceLine 
                        y={averageAttendance} 
                        label={{ 
                            value: `Avg ${averageAttendance.toFixed(0)}%`, 
                            position: 'insideTopRight', 
                            fill: theme === 'dark' ? '#a5b4fc' : '#6366f1',
                            fontSize: 12,
                            fontWeight: 'bold',
                        }} 
                        stroke={theme === 'dark' ? '#818cf8' : '#6366f1'} 
                        strokeDasharray="4 4" 
                    />
                )}
                
                <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#0284c7" strokeWidth={2} activeDot={{ r: 8, stroke: '#0284c7', strokeWidth: 2 }} dot={{fill: '#0284c7', r:4, strokeWidth: 0}} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default OverallAttendanceChart;