import { useState, useCallback } from 'react';
// FIX: Import MarkAttendanceResult from the central types file.
import type { Course, Student, Session, AttendanceRecord, MarkAttendanceResult } from '../types';

const generateInitialData = (): Course[] => {
  const adjectives = ['Agile', 'Bright', 'Clever', 'Daring', 'Eager', 'Fearless', 'Gifted', 'Happy', 'Intrepid', 'Jolly', 'Keen', 'Lively', 'Mighty', 'Noble', 'Optimistic', 'Proud', 'Quick', 'Resourceful', 'Stellar', 'Tenacious', 'Unwavering', 'Valiant', 'Wise', 'Youthful', 'Zealous', 'Creative', 'Dynamic', 'Energetic', 'Focused', 'Genuine', 'Honest', 'Inventive', 'Joyful', 'Kind', 'Loyal', 'Motivated', 'Neat', 'Open', 'Patient', 'Quiet', 'Reliable', 'Sharp', 'Thoughtful', 'Unique', 'Vibrant', 'Warm', 'Xenial', 'Young', 'Zesty'];
  const animals = ['Aardvark', 'Bison', 'Cheetah', 'Dolphin', 'Elephant', 'Falcon', 'Gazelle', 'Hawk', 'Iguana', 'Jaguar', 'Koala', 'Lemur', 'Meerkat', 'Nightingale', 'Ocelot', 'Panther', 'Quokka', 'Rabbit', 'Salamander', 'Tiger', 'Urial', 'Vulture', 'Walrus', 'Yak', 'Zebra', 'Alpaca', 'Bear', 'Cat', 'Dog', 'Eel', 'Fox', 'Goat', 'Horse', 'Impala', 'Jellyfish', 'Kangaroo', 'Lion', 'Monkey', 'Newt', 'Owl', 'Penguin', 'Quail', 'Raccoon', 'Shark', 'Turtle', 'Unicorn', 'Viper', 'Wolf', 'Xerus', 'Yellowjacket', 'Zonkey'];

  // Helper to shuffle array
  const shuffle = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const shuffledAdjectives = shuffle([...adjectives]);
  const shuffledAnimals = shuffle([...animals]);

  // Increased student count
  const students: Student[] = Array.from({ length: 50 }, (_, i) => ({
    id: `student-${i + 1}`,
    name: `Student ${i + 1}`,
    anonymizedName: `${shuffledAdjectives[i % shuffledAdjectives.length]} ${shuffledAnimals[i % shuffledAnimals.length]}`,
  }));

  const studentOne = students[0]; // Alex Johnson is student-1

  // Expanded course list
  const courses: Course[] = [
    {
      id: 'cs101',
      name: 'Intro to Computer Science',
      code: 'CS101',
      students: [studentOne, ...students.slice(1, 20)], // student-1 is enrolled
      sessions: [],
      attendance: [],
    },
    {
      id: 'math203',
      name: 'Advanced Calculus',
      code: 'MATH203',
      students: [studentOne, ...students.slice(20, 35)], // student-1 is enrolled
      sessions: [],
      attendance: [],
    },
    {
      id: 'phy301',
      name: 'Quantum Physics',
      code: 'PHY301',
      students: [studentOne, ...students.slice(35, 50)], // student-1 is enrolled
      sessions: [],
      attendance: [],
    },
    {
      id: 'ds202',
      name: 'Data Structures & Algorithms',
      code: 'DS202',
      students: [studentOne, ...students.slice(5, 25)], // student-1 is enrolled
      sessions: [],
      attendance: [],
    },
    {
      id: 'os401',
      name: 'Operating Systems',
      code: 'OS401',
      students: [studentOne, ...students.slice(10, 30)], // student-1 is enrolled
      sessions: [],
      attendance: [],
    },
    {
      id: 'db501',
      name: 'Database Management',
      code: 'DB501',
      students: [studentOne, ...students.slice(15, 40)], // student-1 is enrolled
      sessions: [],
      attendance: [],
    },
    {
      id: 'net303',
      name: 'Computer Networks',
      code: 'NET303',
      students: [studentOne, ...students.slice(25, 45)], // student-1 is enrolled
      sessions: [],
      attendance: [],
    }
  ];

  // Generate some historical sessions and attendance data
  courses.forEach(course => {
    // Making sure student lists are unique
    course.students = [...new Map(course.students.map(item => [item['id'], item])).values()];

    for (let i = 1; i <= 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (10 - i) * 3); // Sessions every 3 days
      const session: Session = {
        id: `${course.id}-session-${i}`,
        date: date.toISOString(),
        type: i % 2 === 0 ? 'Online' : 'Offline',
        limit: course.students.length, // Default limit to class size
        scannedCount: 0,
      };
      
      let presentCount = 0;
      course.students.forEach(student => {
        // student-1 (Alex) has a higher attendance rate for realism
        const attendanceChance = student.id === 'student-1' ? 0.05 : 0.15;
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

  return courses;
};

const generateQrCodeValue = () => `qr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// How long a QR code is valid for in seconds.
const QR_CODE_VALIDITY_SECONDS = 30; // Increased validity for manual scan flow.

export const useAttendanceData = () => {
  const [courses, setCourses] = useState<Course[]>(generateInitialData);

  const createNewSession = useCallback((courseId: string, type: 'Online' | 'Offline', limit: number): { sessionId: string; qrCodeValue: string } => {
    let newSessionId = '';
    const initialQrCodeValue = generateQrCodeValue();

    setCourses(prevCourses => {
      return prevCourses.map(course => {
        if (course.id === courseId) {
          const newSession: Session = {
            id: `${courseId}-session-${course.sessions.length + 1}`,
            date: new Date().toISOString(),
            type,
            limit,
            scannedCount: 0,
            qrCodeValue: initialQrCodeValue,
          };
          newSessionId = newSession.id;
          
          const newAttendanceRecords = course.students.map(student => ({
            studentId: student.id,
            sessionId: newSession.id,
            status: 'Absent' as const, // Default to absent
          }));

          return {
            ...course,
            sessions: [...course.sessions, newSession],
            attendance: [...course.attendance, ...newAttendanceRecords],
          };
        }
        return course;
      });
    });

    return { sessionId: newSessionId, qrCodeValue: initialQrCodeValue };
  }, []);

  const regenerateQrCode = useCallback((sessionId: string) => {
      setCourses(prevCourses => prevCourses.map(course => ({
          ...course,
          sessions: course.sessions.map(session => {
              if (session.id === sessionId) {
                  return { ...session, qrCodeValue: generateQrCodeValue() };
              }
              return session;
          })
      })));
  }, []);

  // FIX: Refactored function to correctly handle synchronous logic and asynchronous state updates.
  // This resolves a comparison error and ensures correct behavior for attendance marking.
  const markAttendance = useCallback((studentId: string, qrCodeValue: string): MarkAttendanceResult => {
    // Check for expiration first, based on the timestamp in the QR code string.
    if (qrCodeValue.startsWith('qr_')) {
        const parts = qrCodeValue.split('_');
        if (parts.length >= 2) {
            const timestamp = parseInt(parts[1], 10);
            if (!isNaN(timestamp) && Date.now() - timestamp > QR_CODE_VALIDITY_SECONDS * 1000) {
                return 'expired_qr';
            }
        }
    }
      
    const coursesCopy = JSON.parse(JSON.stringify(courses));
    let finalResult: MarkAttendanceResult = 'invalid_qr';
    let stateChanged = false;

    for (const course of coursesCopy) {
      const sessionIndex = course.sessions.findIndex(s => s.qrCodeValue === qrCodeValue);
      if (sessionIndex !== -1) {
        const session = course.sessions[sessionIndex];
        const sessionId = session.id;

        if (!course.students.some(s => s.id === studentId)) {
          finalResult = 'not_enrolled';
          break;
        }

        if (session.limit !== undefined && (session.scannedCount ?? 0) >= session.limit) {
          finalResult = 'limit_reached';
          break;
        }

        const recordIndex = course.attendance.findIndex(rec => rec.sessionId === sessionId && rec.studentId === studentId);
        if (recordIndex !== -1) {
          if (course.attendance[recordIndex].status === 'Present') {
              finalResult = 'already_marked';
              break;
          }
          
          course.attendance[recordIndex].status = 'Present';
          const newScannedCount = (session.scannedCount ?? 0) + 1;
          session.scannedCount = newScannedCount;
          
          // Regenerate QR code immediately if limit is not reached
          if (session.limit !== undefined && newScannedCount >= session.limit) {
              session.qrCodeValue = 'limit_reached'; // Special value to indicate completion
          } else {
              session.qrCodeValue = generateQrCodeValue();
          }
          
          finalResult = 'success';
          stateChanged = true;
          break;
        } else {
            finalResult = 'error';
            break;
        }
      }
    }
    
    if (stateChanged) {
        setCourses(coursesCopy);
    }

    return finalResult;
  }, [courses]);

  const simulateSingleScan = useCallback((courseId: string, sessionId: string) => {
    const course = courses.find(c => c.id === courseId);
    const session = course?.sessions.find(s => s.id === sessionId);
    if (!course || !session || !session.qrCodeValue || session.qrCodeValue === 'generating...') {
        console.warn("Cannot simulate scan right now.");
        return;
    }

    const absentStudent = course.students.find(student => 
        course.attendance.some(att => att.sessionId === sessionId && att.studentId === student.id && att.status === 'Absent')
    );

    if (absentStudent) {
        markAttendance(absentStudent.id, session.qrCodeValue);
    } else {
        console.log("No more absent students to simulate scan for.");
    }
  }, [courses, markAttendance]);

  const toggleAttendance = useCallback((studentId: string, sessionId: string, courseId: string) => {
    setCourses(prevCourses => {
        // Create a deep copy to avoid direct state mutation
        const newCourses = JSON.parse(JSON.stringify(prevCourses));
        const course = newCourses.find((c: Course) => c.id === courseId);
        
        if (!course) return prevCourses;

        const attendanceRecord = course.attendance.find((a: AttendanceRecord) => a.studentId === studentId && a.sessionId === sessionId);
        const session = course.sessions.find((s: Session) => s.id === sessionId);

        if (attendanceRecord && session) {
            if (attendanceRecord.status === 'Present') {
                attendanceRecord.status = 'Absent';
                session.scannedCount = Math.max(0, (session.scannedCount ?? 0) - 1);
            } else {
                attendanceRecord.status = 'Present';
                session.scannedCount = (session.scannedCount ?? 0) + 1;
            }
            return newCourses;
        }
        
        // If no change was made, return the original state to prevent re-render
        return prevCourses;
    });
  }, []);

  // FIX: Completed the resetData function and added a return statement to the custom hook.
  // This ensures the hook provides its state and methods to consuming components,
  // resolving the 'property does not exist on type void' errors in App.tsx.
  const resetData = useCallback(() => {
    setCourses(generateInitialData());
  }, []);

  return {
    courses,
    createNewSession,
    regenerateQrCode,
    markAttendance,
    simulateSingleScan,
    toggleAttendance,
    resetData,
  };
};