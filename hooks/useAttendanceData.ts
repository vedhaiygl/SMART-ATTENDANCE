import { useState, useCallback } from 'react';
// FIX: Import MarkAttendanceResult from the central types file.
import type { Course, Student, Session, AttendanceRecord, MarkAttendanceResult } from '../types';

const generateInitialData = (): Course[] => {
  const students: Student[] = Array.from({ length: 20 }, (_, i) => ({
    id: `student-${i + 1}`,
    name: `Student ${i + 1}`,
  }));

  const courses: Course[] = [
    {
      id: 'cs101',
      name: 'Intro to Computer Science',
      code: 'CS101',
      students: students.slice(0, 15),
      sessions: [],
      attendance: [],
    },
    {
      id: 'math203',
      name: 'Advanced Calculus',
      code: 'MATH203',
      students: students.slice(10, 20),
      sessions: [],
      attendance: [],
    },
    {
      id: 'phy301',
      name: 'Quantum Physics',
      code: 'PHY301',
      students: students.slice(5, 15),
      sessions: [],
      attendance: [],
    }
  ];

  // Generate some historical sessions and attendance data
  courses.forEach(course => {
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
        const isPresent = Math.random() > 0.15;
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
    const coursesCopy = JSON.parse(JSON.stringify(courses));
    let finalResult: MarkAttendanceResult = 'invalid_qr';
    let sessionToUpdateId: string | null = null;
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
          session.scannedCount = (session.scannedCount ?? 0) + 1;
          session.qrCodeValue = 'generating...';
          
          finalResult = 'success';
          sessionToUpdateId = sessionId;
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
    
    if (finalResult === 'success' && sessionToUpdateId) {
      setTimeout(() => {
        regenerateQrCode(sessionToUpdateId);
      }, 1500);
    }

    return finalResult;
  }, [courses, regenerateQrCode]);

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


  return { courses, createNewSession, markAttendance, simulateSingleScan };
};
