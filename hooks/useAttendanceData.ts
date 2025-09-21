import { useState, useCallback, useEffect } from 'react';
import type { Course, Student, Session, AttendanceRecord, MarkAttendanceResult, User, LiveClass, LiveClassAttendee } from '../types';
import { MOCK_COURSES, MOCK_STUDENTS } from '../lib/mockData';

const generateQrCodeValue = () => `qr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
export const QR_CODE_VALIDITY_SECONDS = 60;

const generateShortCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    let result = '';
    for (let i = 0; i < 3; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    result += '-';
    for (let i = 0; i < 3; i++) result += nums.charAt(Math.floor(Math.random() * nums.length));
    return result;
};

export const useAttendanceData = (user: User | null) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    // Deep copy to prevent mutation issues between different components/renders
    const coursesCopy = JSON.parse(JSON.stringify(MOCK_COURSES));
    const studentsCopy = JSON.parse(JSON.stringify(MOCK_STUDENTS));
    setCourses(coursesCopy);
    setAllStudents(studentsCopy);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (user) {
      // Simulate async loading for better UX
      const timer = setTimeout(() => {
          loadData();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCourses([]);
      setAllStudents([]);
      setLoading(false);
    }
  }, [user, loadData]);

  const createNewSession = useCallback((courseId: string, type: 'Online' | 'Offline', limit: number, livenessCheck: boolean): { sessionId: string; qrCodeValue: string; shortCode?: string } => {
    const qrCodeValue = generateQrCodeValue();
    const shortCode = type === 'Online' ? generateShortCode() : undefined;
    const sessionId = `${courseId}-session-${Date.now()}`;

    const newSession: Session = {
        id: sessionId,
        date: new Date().toISOString(),
        type: type,
        limit: limit,
        scannedCount: 0,
        qrCodeValue: qrCodeValue,
        shortCode: shortCode,
        livenessCheck: type === 'Online' ? livenessCheck : false,
    };
    
    let targetCourse: Course | undefined;
    
    setCourses(prevCourses => {
        const newCourses = prevCourses.map(c => ({
            ...c,
            students: [...c.students],
            sessions: [...c.sessions],
            attendance: [...c.attendance],
            liveClasses: [...c.liveClasses],
        }));

        const courseIndex = newCourses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) throw new Error("Course not found");

        targetCourse = newCourses[courseIndex];
        targetCourse.sessions.push(newSession);
        
        const newAttendanceRecords = targetCourse.students.map(student => ({
          studentId: student.id,
          sessionId: sessionId,
          status: 'Absent' as const,
        }));
        
        targetCourse.attendance.push(...newAttendanceRecords);

        return newCourses;
    });

    return { sessionId, qrCodeValue, shortCode };
  }, []);

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

    const formattedCode = code.toUpperCase().replace(/\s|-/g, '');

    const sessionAndCourse = courses.flatMap(c => c.sessions.map(s => ({ session: s, course: c })))
        .find(({ session }) => session.qrCodeValue === code || (session.shortCode && session.shortCode.replace('-', '') === formattedCode));
        
    if (!sessionAndCourse) return 'invalid_qr';

    const { session, course } = sessionAndCourse;

    if (session.qrCodeValue === 'limit_reached') return 'limit_reached';

    const isEnrolled = course.students.some(s => s.id === studentId);
    if (!isEnrolled) return 'not_enrolled';

    if (session.limit && (session.scannedCount ?? 0) >= session.limit) {
      return 'limit_reached';
    }

    const existingRecord = course.attendance.find(a => a.sessionId === session.id && a.studentId === studentId);
    if (existingRecord?.status === 'Present') return 'already_marked';
    
    if (session.type === 'Online' && session.livenessCheck && !selfieData) {
        return 'liveness_required';
    }

    setCourses(prevCourses => {
        const newCourses = JSON.parse(JSON.stringify(prevCourses));
        const courseToUpdate = newCourses.find((c: Course) => c.id === course.id);
        if (!courseToUpdate) return prevCourses;

        const sessionToUpdate = courseToUpdate.sessions.find((s: Session) => s.id === session.id);
        const recordToUpdate = courseToUpdate.attendance.find((a: AttendanceRecord) => a.sessionId === session.id && a.studentId === studentId);

        if (!sessionToUpdate || !recordToUpdate) return prevCourses;

        recordToUpdate.status = 'Present';
        if (selfieData) {
            recordToUpdate.livenessData = selfieData;
        }

        sessionToUpdate.scannedCount = (sessionToUpdate.scannedCount ?? 0) + 1;
        if (sessionToUpdate.limit && sessionToUpdate.scannedCount >= sessionToUpdate.limit) {
            sessionToUpdate.qrCodeValue = 'limit_reached';
        }
        
        return newCourses;
    });

    return 'success';
  }, [courses]);
  
    const toggleAttendance = useCallback((studentId: string, sessionId: string, courseId: string) => {
        setCourses(prevCourses => {
            const newCourses = JSON.parse(JSON.stringify(prevCourses));
            const course = newCourses.find((c: Course) => c.id === courseId);
            if (!course) return prevCourses;

            const session = course.sessions.find((s: Session) => s.id === sessionId);
            const record = course.attendance.find((a: AttendanceRecord) => a.studentId === studentId && a.sessionId === sessionId);

            if (!session || !record) return prevCourses;

            const newStatus = record.status === 'Present' ? 'Absent' : 'Present';
            record.status = newStatus;
            
            session.scannedCount = newStatus === 'Present'
                ? (session.scannedCount ?? 0) + 1
                : Math.max(0, (session.scannedCount ?? 0) - 1);

            return newCourses;
        });
    }, []);

    const deleteSession = useCallback((courseId: string, sessionId: string) => {
        setCourses(prevCourses => {
            const newCourses = JSON.parse(JSON.stringify(prevCourses));
            const course = newCourses.find((c: Course) => c.id === courseId);
            if (!course) return prevCourses;

            course.sessions = course.sessions.filter((s: Session) => s.id !== sessionId);
            course.attendance = course.attendance.filter((a: AttendanceRecord) => a.sessionId !== sessionId);
            
            return newCourses;
        });
    }, []);

    const regenerateQrCode = useCallback((sessionId: string) => {
        const newQrCodeValue = generateQrCodeValue();
        setCourses(prevCourses => prevCourses.map(course => ({
            ...course,
            sessions: course.sessions.map(s => s.id === sessionId ? { ...s, qrCodeValue: newQrCodeValue } : s)
        })));
    }, []);

    const enrollStudent = useCallback((courseId: string, studentId: string) => {
        setCourses(prevCourses => {
            const newCourses = JSON.parse(JSON.stringify(prevCourses));
            const course = newCourses.find((c: Course) => c.id === courseId);
            const student = allStudents.find(s => s.id === studentId);
            if (!course || !student) return prevCourses;
            
            if(course.students.some((s: Student) => s.id === studentId)) return prevCourses; // Already enrolled

            course.students.push(student);

            const newAttendanceRecords = course.sessions.map((session: Session) => ({
                studentId: studentId,
                sessionId: session.id,
                status: 'Absent' as const,
            }));
            
            course.attendance.push(...newAttendanceRecords);

            return newCourses;
        });
    }, [allStudents]);

    const resetData = useCallback(() => {
        setCourses([]);
        setAllStudents([]);
        setLoading(true);
    }, []);

    const startLiveClass = useCallback((courseId: string): LiveClass => {
      const liveClassId = `live_${courseId}_${Date.now()}`;
      const newLiveClass: LiveClass = {
          id: liveClassId,
          courseId: courseId,
          status: 'live',
          startTime: new Date().toISOString(),
          endTime: null,
          attendees: [],
      };
  
      setCourses(prevCourses => {
          const newCourses = JSON.parse(JSON.stringify(prevCourses));
          const course = newCourses.find((c: Course) => c.id === courseId);
          if (course) {
              // End any other live classes for this course
              course.liveClasses.forEach((lc: LiveClass) => {
                  if (lc.status === 'live') {
                      lc.status = 'ended';
                      lc.endTime = new Date().toISOString();
                  }
              });
              course.liveClasses.push(newLiveClass);
          }
          return newCourses;
      });
  
      return newLiveClass;
    }, []);
  
    const endLiveClass = useCallback((courseId: string, liveClassId: string) => {
        setCourses(prevCourses => {
            const newCourses = JSON.parse(JSON.stringify(prevCourses));
            const course = newCourses.find((c: Course) => c.id === courseId);
            const liveClass = course?.liveClasses.find((lc: LiveClass) => lc.id === liveClassId);
            if (liveClass && liveClass.status === 'live') {
                const now = new Date();
                liveClass.status = 'ended';
                liveClass.endTime = now.toISOString();
  
                // Finalize duration for anyone still "in" the class
                liveClass.attendees.forEach((attendee: LiveClassAttendee) => {
                    if (!attendee.leaveTime) {
                        attendee.leaveTime = now.toISOString();
                        const joinTime = new Date(attendee.joinTime).getTime();
                        const durationMs = now.getTime() - joinTime;
                        attendee.durationMinutes = parseFloat((durationMs / (1000 * 60)).toFixed(2));
                    }
                });
            }
            return newCourses;
        });
    }, []);
  
    const studentJoinsLiveClass = useCallback((courseId: string, liveClassId: string, studentId: string) => {
        setCourses(prevCourses => {
            const newCourses = JSON.parse(JSON.stringify(prevCourses));
            const course = newCourses.find((c: Course) => c.id === courseId);
            const liveClass = course?.liveClasses.find((lc: LiveClass) => lc.id === liveClassId);
  
            if (liveClass && liveClass.status === 'live') {
                const existingAttendee = liveClass.attendees.find((a: LiveClassAttendee) => a.studentId === studentId);
                if (!existingAttendee) {
                  liveClass.attendees.push({
                      studentId: studentId,
                      joinTime: new Date().toISOString(),
                      leaveTime: null,
                      durationMinutes: 0,
                  });
                }
            }
            return newCourses;
        });
    }, []);
  
    const studentLeavesLiveClass = useCallback((courseId: string, liveClassId: string, studentId: string) => {
        setCourses(prevCourses => {
            const newCourses = JSON.parse(JSON.stringify(prevCourses));
            const course = newCourses.find((c: Course) => c.id === courseId);
            const liveClass = course?.liveClasses.find((lc: LiveClass) => lc.id === liveClassId);
            const attendee = liveClass?.attendees.find((a: LiveClassAttendee) => a.studentId === studentId && !a.leaveTime);
  
            if (attendee) {
                const now = new Date();
                attendee.leaveTime = now.toISOString();
                const joinTime = new Date(attendee.joinTime).getTime();
                const durationMs = now.getTime() - joinTime;
                attendee.durationMinutes = parseFloat((durationMs / (1000 * 60)).toFixed(2));
            }
            return newCourses;
        });
    }, []);

    const updateCourseBanner = useCallback((courseId: string, bannerUrl: string) => {
        setCourses(prevCourses =>
            prevCourses.map(c => (c.id === courseId ? { ...c, bannerUrl } : c))
        );
    }, []);

    return { courses, allStudents, loading, createNewSession, regenerateQrCode, markAttendance, toggleAttendance, deleteSession, resetData, enrollStudent, startLiveClass, endLiveClass, studentJoinsLiveClass, studentLeavesLiveClass, updateCourseBanner };
};