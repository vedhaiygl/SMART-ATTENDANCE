

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Course } from '../../types';
import { useTheme } from '../../App';

interface ChartProps {
    course: Course;
}

const COLORS = {
    Excellent: '#0ea5e9', // Sky 500
    Good: '#3b82f6', // Blue 500
    Poor: '#ef4444', // Red 500
};

const StudentStatusPieChart: React.FC<ChartProps> = ({ course }) => {
    const { theme } = useTheme();

    const studentAttendance = course.students.map(student => {
        const studentRecords = course.attendance.filter(a => a.studentId === student.id);
        const presentCount = studentRecords.filter(r => r.status === 'Present').length;
        const totalSessions = course.sessions.length;
        const percentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;
        return { ...student, attendancePercentage: percentage };
    });

    const statusCounts = {
        Excellent: studentAttendance.filter(s => s.attendancePercentage >= 90).length,
        Good: studentAttendance.filter(s => s.attendancePercentage >= 70 && s.attendancePercentage < 90).length,
        Poor: studentAttendance.filter(s => s.attendancePercentage < 70).length,
    };

    const data = [
        { name: 'Excellent (>90%)', value: statusCounts.Excellent },
        { name: 'Good (70-90%)', value: statusCounts.Good },
        { name: 'Poor (<70%)', value: statusCounts.Poor },
    ].filter(entry => entry.value > 0);

    const chartColors = [COLORS.Excellent, COLORS.Good, COLORS.Poor];

    const tickColor = theme === 'dark' ? '#9ca3af' : '#4b5563';
    const tooltipBg = theme === 'dark' ? '#1e40af' : '#ffffff';
    const tooltipBorder = theme === 'dark' ? '#374151' : '#e0f2fe';
    const tooltipColor = theme === 'dark' ? '#d1d5db' : '#1f2937';

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Tooltip
                    contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        color: tooltipColor
                    }}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: "14px", color: tickColor}} />
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
};

export default StudentStatusPieChart;