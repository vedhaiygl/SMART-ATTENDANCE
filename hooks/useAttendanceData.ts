import { useState, useCallback, useEffect } from 'react';
import type { Course, Student, Session, AttendanceRecord, MarkAttendanceResult, User } from '../types';

const generateInitialData = (): { courses: Course[], students: Student[] } => {
  const adjectives = ['Agile', 'Bright', 'Clever', 'Daring', 'Eager', 'Fearless', 'Gifted', 'Happy', 'Intrepid', 'Jolly', 'Keen', 'Lively', 'Mighty', 'Noble', 'Optimistic', 'Proud', 'Quick', 'Resourceful', 'Stellar', 'Tenacious', 'Unwavering', 'Valiant', 'Wise', 'Youthful', 'Zealous', 'Creative', 'Dynamic', 'Energetic', 'Focused', 'Genuine', 'Honest', 'Inventive', 'Joyful', 'Kind', 'Loyal', 'Motivated', 'Neat', 'Open', 'Patient', 'Quiet', 'Reliable', 'Sharp', 'Thoughtful', 'Unique', 'Vibrant', 'Warm', 'Xenial', 'Young', 'Zesty'];
  const animals = ['Aardvark', 'Bison', 'Cheetah', 'Dolphin', 'Elephant', 'Falcon', 'Gazelle', 'Hawk', 'Iguana', 'Jaguar', 'Koala', 'Lemur', 'Meerkat', 'Nightingale', 'Ocelot', 'Panther', 'Quokka', 'Rabbit', 'Salamander', 'Tiger', 'Urial', 'Vulture', 'Walrus', 'Yak', 'Zebra', 'Alpaca', 'Bear', 'Cat', 'Dog', 'Eel', 'Fox', 'Goat', 'Horse', 'Impala', 'Jellyfish', 'Kangaroo', 'Lion', 'Monkey', 'Newt', 'Owl', 'Penguin', 'Quail', 'Raccoon', 'Shark', 'Turtle', 'Unicorn', 'Viper', 'Wolf', 'Xerus', 'Yellowjacket', 'Zonkey'];

  const shuffle = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const newStudents: Student[] = [
    { id: 'student-1', name: 'Vedhan', anonymizedName: 'Valiant Vulture' },
    { id: 'student-2', name: 'Mithun', anonymizedName: 'Mighty Meerkat' },
    { id: 'student-3', name: 'Sanjeevi', anonymizedName: 'Stellar Salamander' },
  ];

  const shuffledAdjectives = shuffle([...adjectives]);
  const shuffledAnimals = shuffle([...animals]);

  const genericStudents: Student[] = Array.from({ length: 50 }, (_, i) => ({
    id: `student-${i + 4}`,
    name: `Student ${i + 4}`,
    anonymizedName: `${shuffledAdjectives[i % shuffledAdjectives.length]} ${shuffledAnimals[i % shuffledAnimals.length]}`,
  }));

  const students: Student[] = [...newStudents, ...genericStudents];

  const studentOne = students[0]; // This is now Vedhan

  const coursesData: { id: string; name: string; code: string; students: Student[]; }[] = [
    { id: 'cs101', name: 'Intro to Computer Science', code: 'CS101', students: [...newStudents, ...students.slice(3, 20)] },
    { id: 'math203', name: 'Advanced Calculus', code: 'MATH203', students: [studentOne, ...students.slice(20, 35)] },
    { id: 'phy301', name: 'Quantum Physics', code: 'PHY301', students: [studentOne, ...students.slice(35, 50)] },
    { id: 'ds202', name: 'Data Structures & Algorithms', code: 'DS202', students: [...newStudents, ...students.slice(5, 25)] },
    { id: 'os401', name: 'Operating Systems', code: 'OS401', students: [studentOne, ...students.slice(10, 30)] },
    { id: 'db501', name: 'Database Management', code: 'DB501', students: [studentOne, ...students.slice(15, 40)] },
    { id: 'net303', name: 'Computer Networks', code: 'NET303', students: [studentOne, ...students.slice(25, 45)] }
  ];

  const courses: Course[] = coursesData.map(c => ({
    ...c,
    students: [...new Map(c.students.map(item => [item.id, item])).values()],
    sessions: [],
    attendance: []
  }));

  courses.forEach(course => {
    for (let i = 1; i <= 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (10 - i) * 3);
      const session: Session = {
        id: `${course.id}-session-${i}`,
        date: date.toISOString(),
        type: i % 2 === 0 ? 'Online' : 'Offline',
        limit: course.students.length,
        scannedCount: 0,
      };
      
      let presentCount = 0;
      course.students.forEach(student => {
        const isNewStudent = newStudents.some(ns => ns.id === student.id);
        const attendanceChance = isNewStudent ? 0.2 : 0.15; // Slightly better attendance for our new users
        const isPresent = Math.random() > attendanceChance;
        if (isPresent) presentCount++;
        const attendanceRecord: AttendanceRecord = {
          studentId: student.id,
          sessionId: session.id,
          status: isPresent ? 'Present' : 'Absent',
        };
        course.attendance.push(attendanceRecord);
      });
      session.scannedCount = presentCount;
      course.sessions.push(session);
    }
  });

  return { courses, students };
};


const generateQrCodeValue = () => `qr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
export const QR_CODE_VALIDITY_SECONDS = 60;

const generateShortCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    let result = '';
    for (let i = 0; i < 3; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for (let i = 0; i < 3; i++) {
        result += nums.charAt(Math.floor(Math.random() * nums.length));
    }
    return result;
};

export const useAttendanceData = (user: User | null) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    const { courses: initialCourses, students: allStudentsData } = generateInitialData();
    setCourses(initialCourses);
    setAllStudents(allStudentsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setCourses([]); // Clear data on logout
      setLoading(false);
    }
  }, [user, loadData]);


  const createNewSession = useCallback((courseId: string, type: 'Online' | 'Offline', limit: number, livenessCheck: boolean): { sessionId: string; qrCodeValue: string; shortCode?: string } => {
    const course = courses.find(c => c.id === courseId);
    if (!course) throw new Error("Course not found");

    const initialQrCodeValue = generateQrCodeValue();
    const newSessionData: Session = {
      id: `${courseId}-session-${Date.now()}`,
      date: new Date().toISOString(),
      type,
      limit,
      scannedCount: 0,
      qrCodeValue: initialQrCodeValue,
    };
    
    let shortCode: string | undefined = undefined;
    if (type === 'Online') {
        shortCode = generateShortCode();
        newSessionData.shortCode = shortCode;
        if (livenessCheck) {
            newSessionData.livenessCheck = true;
        }
    }

    const newAttendanceRecords: AttendanceRecord[] = course.students.map(student => ({
      studentId: student.id,
      sessionId: newSessionData.id,
      status: 'Absent' as const,
    }));
    
    setCourses(prev => prev.map(c => c.id === courseId ? {
      ...c,
      sessions: [...c.sessions, newSessionData],
      attendance: [...c.attendance, ...newAttendanceRecords]
    } : c));

    return { sessionId: newSessionData.id, qrCodeValue: initialQrCodeValue, shortCode };
  }, [courses]);

  const markAttendance = useCallback((code: string, studentId: string, selfieData?: string): MarkAttendanceResult => {
    if (code.startsWith('qr_')) {
        const parts = code.split('_');
        if (parts.length >= 2) {
            const timestamp = parseInt(parts[1], 10);
            if (!isNaN(timestamp) && Date.now() - timestamp > QR_CODE_VALIDITY_SECONDS * 1000) {
                return 'expired_qr';
            }
        }
    }

    let sessionData: Session | undefined;
    let courseId: string | undefined;
    const formattedCode = code.toUpperCase().replace(/\s|-/g, '');

    for (const course of courses) {
        let foundSession = course.sessions.find(s => s.qrCodeValue === code);
        if (!foundSession) {
            foundSession = course.sessions.find(s => 
                s.shortCode?.replace(/-/g, '') === formattedCode && 
                s.qrCodeValue && 
                s.qrCodeValue !== 'limit_reached'
            );
        }
        
        if (foundSession) {
            sessionData = foundSession;
            courseId = course.id;
            break;
        }
    }
    
    if (!sessionData || !courseId) return 'invalid_qr';
    
    const sessionId = sessionData.id;
    const course = courses.find(c => c.id === courseId);
    if (!course?.students.some(s => s.id === studentId)) return 'not_enrolled';

    if (sessionData.limit !== undefined && (sessionData.scannedCount ?? 0) >= sessionData.limit) {
      return 'limit_reached';
    }

    const existingRecord = course.attendance.find(a => a.sessionId === sessionId && a.studentId === studentId);
    if (existingRecord && existingRecord.status === 'Present') return 'already_marked';

    if (sessionData.type === 'Online' && sessionData.livenessCheck && !selfieData) {
        return 'liveness_required';
    }
    
    const newScannedCount = (sessionData.scannedCount ?? 0) + 1;
    const isLimitReached = sessionData.limit !== undefined && newScannedCount >= sessionData.limit;

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        sessions: c.sessions.map(s => {
          if (s.id !== sessionId) return s;
          return { 
            ...s, 
            scannedCount: newScannedCount, 
            // Only update qrCodeValue if the limit is reached, otherwise keep it stable
            qrCodeValue: isLimitReached ? 'limit_reached' : s.qrCodeValue 
          };
        }),
        attendance: c.attendance.map(a => a.sessionId === sessionId && a.studentId === studentId ? { ...a, status: 'Present', livenessData: selfieData } : a)
      }
    }));

    return 'success';
  }, [courses]);

  const toggleAttendance = useCallback((studentId: string, sessionId: string, courseId: string) => {
      setCourses(prevCourses => {
        return prevCourses.map(c => {
          if (c.id !== courseId) return c;
    
          const record = c.attendance.find(a => a.studentId === studentId && a.sessionId === sessionId);
          const session = c.sessions.find(s => s.id === sessionId);
          if (!record || !session) return c;
    
          const newStatus = record.status === 'Present' ? 'Absent' : 'Present';
          const newScannedCount = newStatus === 'Present' ? (session.scannedCount ?? 0) + 1 : Math.max(0, (session.scannedCount ?? 0) - 1);
    
          return {
            ...c,
            sessions: c.sessions.map(s => s.id === sessionId ? { ...s, scannedCount: newScannedCount } : s),
            attendance: c.attendance.map(a => a.sessionId === sessionId && a.studentId === studentId ? { ...a, status: newStatus } : a),
          };
        });
      });
  }, []);
  
  const deleteSession = useCallback((courseId: string, sessionId: string) => {
    setCourses(prevCourses => {
        return prevCourses.map(course => {
            if (course.id !== courseId) {
                return course;
            }

            if (!course.sessions.some(s => s.id === sessionId)) {
                console.warn(`Session with id ${sessionId} not found in course ${courseId}.`);
                return course;
            }

            const updatedSessions = course.sessions.filter(session => session.id !== sessionId);
            const updatedAttendance = course.attendance.filter(record => record.sessionId !== sessionId);

            return {
                ...course,
                sessions: updatedSessions,
                attendance: updatedAttendance,
            };
        });
    });
  }, []);

  const resetData = useCallback(() => {
    loadData();
  }, [loadData]);
  
  const regenerateQrCode = useCallback((sessionId: string) => {
    setCourses(prevCourses => {
        return prevCourses.map(course => {
            const sessionIndex = course.sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex === -1) return course;

            const session = course.sessions[sessionIndex];
            if ((session.limit !== undefined && (session.scannedCount ?? 0) >= session.limit) || session.qrCodeValue === 'limit_reached') {
                return course; // Don't regenerate if limit is reached
            }

            const newQrCodeValue = generateQrCodeValue();
            const updatedSessions = [...course.sessions];
            updatedSessions[sessionIndex] = { ...session, qrCodeValue: newQrCodeValue };
            
            return { ...course, sessions: updatedSessions };
        });
    });
  }, []);


  const enrollStudent = useCallback((courseId: string, studentId: string) => {
    setCourses(prevCourses => {
        const studentToEnroll = allStudents.find(s => s.id === studentId);
        if (!studentToEnroll) {
            console.error("Student not found");
            return prevCourses;
        }

        return prevCourses.map(course => {
            if (course.id !== courseId) {
                return course;
            }

            if (course.students.some(s => s.id === studentId)) {
                console.warn("Student already enrolled");
                return course;
            }

            const newStudents = [...course.students, studentToEnroll];

            const newAttendanceRecords = course.sessions.map(session => ({
                studentId: studentId,
                sessionId: session.id,
                status: 'Absent' as const,
            }));

            return {
                ...course,
                students: newStudents,
                attendance: [...course.attendance, ...newAttendanceRecords],
            };
        });
    });
  }, [allStudents]);

  return {
    courses,
    allStudents,
    loading,
    createNewSession,
    regenerateQrCode,
    markAttendance,
    toggleAttendance,
    deleteSession,
    resetData,
    enrollStudent,
  };
};