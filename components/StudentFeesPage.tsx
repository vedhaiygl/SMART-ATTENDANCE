import React, { useMemo } from 'react';
import type { User, Student } from '../types';

interface StudentFeesPageProps {
    user: User;
    allStudents: Student[];
}

const StatCard: React.FC<{ title: string; value: string; isWarning?: boolean }> = ({ title, value, isWarning }) => (
    <div className="bg-white dark:bg-blue-900 p-6 rounded-xl border border-sky-100 dark:border-blue-800 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 dark:text-sky-200">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${isWarning ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
);

const StudentFeesPage: React.FC<StudentFeesPageProps> = ({ user, allStudents }) => {
    const student = useMemo(() => {
        return allStudents.find(s => s.id === user.id);
    }, [allStudents, user.id]);

    const feeDetails = useMemo(() => {
        if (!student || !student.fees) {
            return { total: 0, paid: 0, due: 0, items: [] };
        }
        const total = student.fees.reduce((sum, item) => sum + item.amount, 0);
        const paid = student.fees.filter(item => item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
        const due = total - paid;
        return { total, paid, due, items: student.fees.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()) };
    }, [student]);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    };

    const isOverdue = (dueDate: string) => {
        // Compare dates without time part
        const due = new Date(dueDate);
        const today = new Date();
        due.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        return due < today;
    };

    if (!student) {
        return (
            <div className="mt-6 text-center text-gray-500 dark:text-sky-200">
                Could not load student data.
            </div>
        );
    }
    
    return (
        <div className="mt-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">My Fee Details</h2>
                <p className="text-gray-500 dark:text-sky-200">Here's an overview of your account statement and pending payments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Fees" value={formatCurrency(feeDetails.total)} />
                <StatCard title="Amount Paid" value={formatCurrency(feeDetails.paid)} />
                <StatCard title="Balance Due" value={formatCurrency(feeDetails.due)} isWarning={feeDetails.due > 0} />
            </div>

            <div className="bg-white dark:bg-blue-900 rounded-xl border border-sky-100 dark:border-blue-800 overflow-hidden">
                <div className="p-6 border-b border-sky-100 dark:border-blue-800">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fee Statement</h3>
                </div>
                {feeDetails.items.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                            <thead className="text-xs text-gray-500 dark:text-sky-200 uppercase bg-sky-50 dark:bg-blue-800/50">
                                <tr>
                                    <th scope="col" className="p-4 font-semibold tracking-wider">Description</th>
                                    <th scope="col" className="p-4 font-semibold tracking-wider text-right">Amount</th>
                                    <th scope="col" className="p-4 font-semibold tracking-wider text-center">Due Date</th>
                                    <th scope="col" className="p-4 font-semibold tracking-wider text-center">Status</th>
                                    <th scope="col" className="p-4 font-semibold tracking-wider text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feeDetails.items.map((item) => {
                                    const overdue = item.status === 'Unpaid' && isOverdue(item.dueDate);
                                    return (
                                        <tr key={item.id} className="border-b border-sky-100 dark:border-blue-800 last:border-b-0 hover:bg-sky-50 dark:hover:bg-blue-800/30">
                                            <td className="p-4 font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">{item.description}</td>
                                            <td className="p-4 text-right font-mono">{formatCurrency(item.amount)}</td>
                                            <td className={`p-4 text-center ${overdue ? 'text-red-500 font-semibold' : ''}`}>
                                                {new Date(item.dueDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                    item.status === 'Paid' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                                                    overdue ? 'bg-red-500/20 text-red-700 dark:text-red-300' :
                                                    'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                                                }`}>
                                                    {item.status === 'Unpaid' && overdue ? 'Overdue' : item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.status === 'Unpaid' && (
                                                    <button 
                                                        onClick={() => alert('Payment gateway integration is pending. Please contact the finance office.')}
                                                        className="bg-sky-600 text-white font-semibold py-1.5 px-4 rounded-lg text-xs hover:bg-sky-500 transition-all active:scale-95"
                                                    >
                                                        Pay Now
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-sky-200 py-10">You have no fee records at this time.</p>
                )}
            </div>
        </div>
    );
};

export default StudentFeesPage;
