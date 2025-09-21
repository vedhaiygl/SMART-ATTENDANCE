import type { Course, Student, Session, AttendanceRecord, FeeItem } from '../types';

// Helper for dates
const getDate = (daysOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString();
};

// Expanded list of mock students
export const MOCK_STUDENTS: Student[] = [
    { id: 'student-1', name: 'Vedhan', anonymizedName: 'Alpha Lion', fees: [
        { id: 'fee-1-1', description: 'Tuition Fee - Fall Semester', amount: 5500, dueDate: getDate(30), status: 'Unpaid' },
        { id: 'fee-1-2', description: 'Library Fee', amount: 50, dueDate: getDate(-10), status: 'Paid' },
        { id: 'fee-1-3', description: 'Lab Fee - CS101', amount: 150, dueDate: getDate(30), status: 'Unpaid' },
    ]},
    { id: 'student-2', name: 'Mithun', anonymizedName: 'Beta Eagle', fees: [
        { id: 'fee-2-1', description: 'Tuition Fee - Fall Semester', amount: 5500, dueDate: getDate(-5), status: 'Paid' },
        { id: 'fee-2-2', description: 'Library Fee', amount: 50, dueDate: getDate(-5), status: 'Paid' },
        { id: 'fee-2-3', description: 'Sports Facility Fee', amount: 100, dueDate: getDate(-5), status: 'Paid' },
    ]},
    { id: 'student-3', name: 'Sanjeevi', anonymizedName: 'Gamma Shark', fees: [
        { id: 'fee-3-1', description: 'Tuition Fee - Fall Semester', amount: 5500, dueDate: getDate(-5), status: 'Unpaid' }, // Overdue
        { id: 'fee-3-2', description: 'Library Fee', amount: 50, dueDate: getDate(15), status: 'Unpaid' },
        { id: 'fee-3-3', description: 'Late Registration Fee', amount: 200, dueDate: getDate(-5), status: 'Unpaid' }, // Overdue
    ]},
    { id: 'student-4', name: 'David Lee', anonymizedName: 'Delta Fox', fees: [
        { id: 'fee-4-1', description: 'Tuition Fee - Fall Semester', amount: 5500, dueDate: getDate(20), status: 'Unpaid' },
    ]},
    { id: 'student-5', name: 'Sophia Chen', anonymizedName: 'Epsilon Owl', fees: [
        { id: 'fee-5-1', description: 'Tuition Fee - Fall Semester', amount: 5500, dueDate: getDate(-15), status: 'Paid' },
        { id: 'fee-5-2', description: 'Lab Fee - DS301', amount: 120, dueDate: getDate(10), status: 'Unpaid' },
    ]},
    { id: 'student-6', name: 'Michael Brown', anonymizedName: 'Zeta Tiger', fees: [] },
    { id: 'student-7', name: 'Olivia Garcia', anonymizedName: 'Eta Bear', fees: [
         { id: 'fee-7-1', description: 'Tuition Fee - Fall Semester', amount: 5500, dueDate: getDate(-20), status: 'Paid' },
    ]},
    { id: 'student-8', name: 'James Wilson', anonymizedName: 'Theta Wolf', fees: [
        { id: 'fee-8-1', description: 'Tuition Fee - Fall Semester', amount: 5500, dueDate: getDate(25), status: 'Unpaid' },
        { id: 'fee-8-2', description: 'Technology Fee', amount: 250, dueDate: getDate(25), status: 'Unpaid' },
    ]},
    { id: 'student-9', name: 'Isabella Martinez', anonymizedName: 'Iota Panther', fees: [] },
    { id: 'student-10', name: 'William Anderson', anonymizedName: 'Kappa Jaguar', fees: [] },
    { id: 'student-11', name: 'Emily Taylor', anonymizedName: 'Lambda Leopard', fees: [] },
    { id: 'student-12', name: 'Daniel Thomas', anonymizedName: 'Mu Cobra', fees: [] },
    { id: 'student-13', name: 'Mia Hernandez', anonymizedName: 'Nu Viper', fees: [] },
    { id: 'student-14', name: 'Alexander Moore', anonymizedName: 'Xi Python', fees: [] },
    { id: 'student-15', name: 'Charlotte Jackson', anonymizedName: 'Omicron Hawk', fees: [] },
    { id: 'student-16', name: 'Benjamin White', anonymizedName: 'Pi Falcon', fees: [] },
    { id: 'student-17', name: 'Amelia Harris', anonymizedName: 'Rho Condor', fees: [] },
    { id: 'student-18', name: 'Lucas Martin', anonymizedName: 'Sigma Raven', fees: [] },
    { id: 'student-19', name: 'Harper Thompson', anonymizedName: 'Tau Crow', fees: [] },
    { id: 'student-20', name: 'Henry Robinson', anonymizedName: 'Upsilon Dove', fees: [] },
];

// Helper to generate mock sessions and attendance data
const generateCourseData = (courseId: string, students: Student[], sessionCount: number) => {
    const sessions: Session[] = [];
    const attendance: AttendanceRecord[] = [];

    for (let i = 0; i < sessionCount; i++) {
        const sessionId = `${courseId}-session-${i + 1}`;
        const date = new Date();
        date.setDate(date.getDate() - (sessionCount - i) * 2); // Sessions every 2 days
        const type = Math.random() > 0.5 ? 'Online' : 'Offline';

        let presentCount = 0;
        students.forEach(student => {
            // Create a varied attendance pattern
            const isPresent = Math.random() < (0.85 - (i * 0.02)); // Attendance slightly drops over time
            if (isPresent) {
                presentCount++;
            }
            attendance.push({
                studentId: student.id,
                sessionId: sessionId,
                status: isPresent ? 'Present' : 'Absent',
            });
        });

        sessions.push({
            id: sessionId,
            date: date.toISOString(),
            type: type,
            limit: students.length,
            scannedCount: presentCount,
            ...(type === 'Online' && { shortCode: `ABC-${100 + i}`, livenessCheck: Math.random() > 0.7 }),
        });
    }
    return { sessions, attendance };
};

// --- COURSE 1: Introduction to AI ---
const cs101Students = MOCK_STUDENTS.slice(0, 15);
const cs101Data = generateCourseData('course-1', cs101Students, 8);

// --- COURSE 2: Web Development ---
const wd201Students = MOCK_STUDENTS.slice(5, 17); // 12 students
const wd201Data = generateCourseData('course-2', wd201Students, 6);

// --- COURSE 3: Data Structures ---
const ds301Students = [
    ...MOCK_STUDENTS.slice(0, 5),
    ...MOCK_STUDENTS.slice(15, 20),
    ...MOCK_STUDENTS.slice(8, 16)
];
const uniqueDs301Students = [...new Set(ds301Students)]; // Ensure unique students
const ds301Data = generateCourseData('course-3', uniqueDs301Students, 10);

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    name: 'Introduction to AI',
    code: 'CS101',
    students: cs101Students,
    sessions: cs101Data.sessions,
    attendance: cs101Data.attendance,
    liveClasses: [],
    bannerUrl: `data:image/svg+xml,%3Csvg width='320' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p1' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%23a78bfa'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='%231e1b4b'/%3E%3Crect width='100%25' height='100%25' fill='url(%23p1)'/%3E%3C/svg%3E`,
  },
  {
    id: 'course-2',
    name: 'Web Development',
    code: 'WD201',
    students: wd201Students,
    sessions: wd201Data.sessions,
    attendance: wd201Data.attendance,
    liveClasses: [],
    bannerUrl: `data:image/svg+xml,%3Csvg width='320' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p2' width='30' height='30' patternUnits='userSpaceOnUse'%3E%3Cpath d='M15 0 L30 15 L15 30 L0 15 Z' fill='%23f59e0b' fill-opacity='0.8'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='%2318181b'/%3E%3Crect width='100%25' height='100%25' fill='url(%23p2)'/%3E%3C/svg%3E`,
  },
  {
    id: 'course-3',
    name: 'Data Structures',
    code: 'DS301',
    students: uniqueDs301Students,
    sessions: ds301Data.sessions,
    attendance: ds301Data.attendance,
    liveClasses: [],
    bannerUrl: `data:image/svg+xml,%3Csvg width='320' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p3' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 0 H20 V20 H0 Z' fill='%2322c55e' stroke='%23166534'/%3E%3Cpath d='M20 20 H40 V40 H20 Z' fill='%2322c55e' stroke='%23166534'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='%23052e16'/%3E%3Crect width='100%25' height='100%25' fill='url(%23p3)'/%3E%3C/svg%3E`,
  },
];