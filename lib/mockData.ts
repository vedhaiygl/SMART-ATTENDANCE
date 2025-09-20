import type { Course, Student, Session, AttendanceRecord } from '../types';

// Expanded list of mock students
export const MOCK_STUDENTS: Student[] = [
    { id: 'student-1', name: 'Vedhan', anonymizedName: 'Alpha Lion' },
    { id: 'student-2', name: 'Mithun', anonymizedName: 'Beta Eagle' },
    { id: 'student-3', name: 'Sanjeevi', anonymizedName: 'Gamma Shark' },
    { id: 'student-4', name: 'David Lee', anonymizedName: 'Delta Fox' },
    { id: 'student-5', name: 'Sophia Chen', anonymizedName: 'Epsilon Owl' },
    { id: 'student-6', name: 'Michael Brown', anonymizedName: 'Zeta Tiger' },
    { id: 'student-7', name: 'Olivia Garcia', anonymizedName: 'Eta Bear' },
    { id: 'student-8', name: 'James Wilson', anonymizedName: 'Theta Wolf' },
    { id: 'student-9', name: 'Isabella Martinez', anonymizedName: 'Iota Panther' },
    { id: 'student-10', name: 'William Anderson', anonymizedName: 'Kappa Jaguar' },
    { id: 'student-11', name: 'Emily Taylor', anonymizedName: 'Lambda Leopard' },
    { id: 'student-12', name: 'Daniel Thomas', anonymizedName: 'Mu Cobra' },
    { id: 'student-13', name: 'Mia Hernandez', anonymizedName: 'Nu Viper' },
    { id: 'student-14', name: 'Alexander Moore', anonymizedName: 'Xi Python' },
    { id: 'student-15', name: 'Charlotte Jackson', anonymizedName: 'Omicron Hawk' },
    { id: 'student-16', name: 'Benjamin White', anonymizedName: 'Pi Falcon' },
    { id: 'student-17', name: 'Amelia Harris', anonymizedName: 'Rho Condor' },
    { id: 'student-18', name: 'Lucas Martin', anonymizedName: 'Sigma Raven' },
    { id: 'student-19', name: 'Harper Thompson', anonymizedName: 'Tau Crow' },
    { id: 'student-20', name: 'Henry Robinson', anonymizedName: 'Upsilon Dove' },
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
  },
  {
    id: 'course-2',
    name: 'Web Development',
    code: 'WD201',
    students: wd201Students,
    sessions: wd201Data.sessions,
    attendance: wd201Data.attendance,
    liveClasses: [],
  },
  {
    id: 'course-3',
    name: 'Data Structures',
    code: 'DS301',
    students: uniqueDs301Students,
    sessions: ds301Data.sessions,
    attendance: ds301Data.attendance,
    liveClasses: [],
  },
];