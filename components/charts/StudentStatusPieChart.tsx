
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Course } from '../../types';
import { useTheme } from '../../App';

interface ChartProps {
    course: Course;
}

const COLORS = {
    Excellent: '#10b981', // Green 500
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

    const tickColor = theme === 'dark' ? '#94a3b8' : '#475569';
    const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
    const tooltipBorder = theme === 'dark' ? '#475569' : '#e2e8f0';
    const tooltipColor = theme === 'dark' ? '#cbd5e1' : '#1e293b';

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