
import { useState, useCallback, useEffect } from 'react';
import type { Course, Student, Session, AttendanceRecord, MarkAttendanceResult, User } from '../types';
import { supabase } from '../lib/supabaseClient';

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
        const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*');
        if (coursesError) throw coursesError;

        const { data: studentsData, error: studentsError } = await supabase.from('students').select('*');
        if (studentsError) throw studentsError;

        const { data: sessionsData, error: sessionsError } = await supabase.from('sessions').select('*');
        if (sessionsError) throw sessionsError;

        const { data: attendanceData, error: attendanceError } = await supabase.from('attendance_records').select('*');
        if (attendanceError) throw attendanceError;

        const { data: enrollmentsData, error: enrollmentsError } = await supabase.from('enrollments').select('*');
        if (enrollmentsError) throw enrollmentsError;
        
        // FIX: Map Supabase snake_case data to application camelCase data model (Student)
        const mappedStudents: Student[] = studentsData.map(s => ({
            id: s.id,
            name: s.name,
            anonymizedName: s.anonymized_name,
        }));
        const studentsMap = new Map(mappedStudents.map(s => [s.id, s]));

        const transformedCourses = coursesData.map(course => {
            const courseStudentIds = enrollmentsData
                .filter(e => e.course_id === course.id)
                .map(e => e.student_id);

            const courseStudents = courseStudentIds
                .map(id => studentsMap.get(id))
                .filter((s): s is Student => s !== undefined);

            // FIX: Map Supabase snake_case data to application camelCase data model (Session)
            const courseSessions: Session[] = sessionsData
                .filter(s => s.course_id === course.id)
                .map(s => ({
                    id: s.id,
                    date: s.date,
                    type: s.type,
                    limit: s.limit ?? undefined,
                    scannedCount: s.scanned_count ?? 0,
                    qrCodeValue: s.qr_code_value ?? undefined,
                    shortCode: s.short_code ?? undefined,
                    livenessCheck: s.liveness_check ?? false,
                }));

            const courseSessionIds = new Set(courseSessions.map(s => s.id));
            
            // FIX: Map Supabase snake_case data to application camelCase data model (AttendanceRecord)
            const courseAttendance: AttendanceRecord[] = attendanceData
                .filter(a => courseSessionIds.has(a.session_id))
                .map(a => ({
                    studentId: a.student_id,
                    sessionId: a.session_id,
                    status: a.status,
                    livenessData: a.liveness_data ?? undefined,
                }));


            return {
                ...course,
                students: courseStudents,
                sessions: courseSessions,
                attendance: courseAttendance,
            };
        });
        
        setAllStudents(mappedStudents);
        setCourses(transformedCourses);

    } catch (error) {
        console.error("Error loading data from Supabase:", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setCourses([]);
      setAllStudents([]);
      setLoading(false);
    }
  }, [user, loadData]);

  const createNewSession = useCallback(async (courseId: string, type: 'Online' | 'Offline', limit: number, livenessCheck: boolean): Promise<{ sessionId: string; qrCodeValue: string; shortCode?: string }> => {
    const course = courses.find(c => c.id === courseId);
    if (!course) throw new Error("Course not found");

    const initialQrCodeValue = generateQrCodeValue();
    const shortCode = type === 'Online' ? generateShortCode() : undefined;
    
    // FIX: Use snake_case for Supabase insert
    const newSessionData = {
      id: `${courseId}-session-${Date.now()}`,
      course_id: courseId,
      date: new Date().toISOString(),
      type,
      limit,
      scanned_count: 0,
      qr_code_value: initialQrCodeValue,
      short_code: shortCode,
      liveness_check: type === 'Online' ? livenessCheck : false,
    };
    
    const { error: sessionError } = await supabase.from('sessions').insert(newSessionData);
    if(sessionError) throw sessionError;
    
    const newAttendanceRecords = course.students.map(student => ({
      student_id: student.id,
      session_id: newSessionData.id,
      status: 'Absent' as const,
    }));
    
    if (newAttendanceRecords.length > 0) {
        const { error: attendanceError } = await supabase.from('attendance_records').insert(newAttendanceRecords);
        if (attendanceError) throw attendanceError;
    }
    
    await loadData(); // Refresh data

    return { sessionId: newSessionData.id, qrCodeValue: initialQrCodeValue, shortCode };
  }, [courses, loadData]);

  const markAttendance = useCallback(async (code: string, studentId: string, selfieData?: string): Promise<MarkAttendanceResult> => {
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

    const { data: sessions, error: sessionError } = await supabase.from('sessions')
        .select('*')
        // FIX: Use snake_case column names in query
        .or(`qr_code_value.eq.${code},short_code.eq.${formattedCode.replace('-', '')}`)
        .limit(1);

    if (sessionError || !sessions || sessions.length === 0) return 'invalid_qr';
    
    const sessionData = sessions[0];
    // FIX: Use snake_case property
    if (sessionData.qr_code_value === 'limit_reached') return 'limit_reached';

    const { data: enrollment, error: enrollError } = await supabase.from('enrollments')
        .select()
        .eq('course_id', sessionData.course_id)
        .eq('student_id', studentId)
        .maybeSingle();
        
    if (enrollError || !enrollment) return 'not_enrolled';

    // FIX: Use snake_case properties
    if (sessionData.limit !== undefined && sessionData.limit !== null && (sessionData.scanned_count ?? 0) >= sessionData.limit) {
      return 'limit_reached';
    }

    const { data: existingRecord, error: recordError } = await supabase.from('attendance_records')
        .select('status')
        .eq('session_id', sessionData.id)
        .eq('student_id', studentId)
        .single();
    
    if (recordError) console.error("Error fetching existing record", recordError);
    // FIX: Added optional chaining to prevent crash if record is null
    if (existingRecord?.status === 'Present') return 'already_marked';

    // FIX: Use snake_case property
    if (sessionData.type === 'Online' && sessionData.liveness_check && !selfieData) {
        return 'liveness_required';
    }

    // FIX: Use snake_case property for update
    const { error: updateError } = await supabase.from('attendance_records')
        .update({ status: 'Present', liveness_data: selfieData })
        .eq('session_id', sessionData.id)
        .eq('student_id', studentId);
        
    if (updateError) throw updateError;
    
    // FIX: Use snake_case property
    const newScannedCount = (sessionData.scanned_count ?? 0) + 1;
    const isLimitReached = sessionData.limit !== undefined && sessionData.limit !== null && newScannedCount >= sessionData.limit;

    // FIX: Use snake_case properties for update
    const { error: sessionUpdateError } = await supabase.from('sessions')
        .update({ 
            scanned_count: newScannedCount, 
            qr_code_value: isLimitReached ? 'limit_reached' : sessionData.qr_code_value 
        })
        .eq('id', sessionData.id);
        
    if (sessionUpdateError) throw sessionUpdateError;
    
    await loadData();
    return 'success';
  }, [loadData]);
  
    const toggleAttendance = useCallback(async (studentId: string, sessionId: string, courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        const session = course?.sessions.find(s => s.id === sessionId);
        const record = course?.attendance.find(a => a.studentId === studentId && a.sessionId === sessionId);

        if (!session || !record) return;

        const newStatus = record.status === 'Present' ? 'Absent' : 'Present';
        const newScannedCount = newStatus === 'Present'
            ? (session.scannedCount ?? 0) + 1
            : Math.max(0, (session.scannedCount ?? 0) - 1);
        
        const { error: recordUpdateError } = await supabase.from('attendance_records').update({ status: newStatus }).match({ student_id: studentId, session_id: sessionId });
        if (recordUpdateError) throw recordUpdateError;

        // FIX: Use snake_case property for update
        const { error: sessionUpdateError } = await supabase.from('sessions').update({ scanned_count: newScannedCount }).eq('id', sessionId);
        if (sessionUpdateError) throw sessionUpdateError;

        await loadData();
    }, [courses, loadData]);

    const deleteSession = useCallback(async (courseId: string, sessionId: string) => {
        const { error: attendanceError } = await supabase.from('attendance_records').delete().eq('session_id', sessionId);
        if (attendanceError) throw attendanceError;
        
        const { error: sessionError } = await supabase.from('sessions').delete().eq('id', sessionId);
        if (sessionError) throw sessionError;
        
        await loadData();
    }, [loadData]);

    const regenerateQrCode = useCallback(async (sessionId: string) => {
        const newQrCodeValue = generateQrCodeValue();
        // FIX: Use snake_case property for update
        const { error } = await supabase.from('sessions').update({ qr_code_value: newQrCodeValue }).eq('id', sessionId);
        if (error) throw error;
        // Optimistic update for smoother UX in the modal
        setCourses(prevCourses => prevCourses.map(course => ({
            ...course,
            sessions: course.sessions.map(s => s.id === sessionId ? { ...s, qrCodeValue: newQrCodeValue } : s)
        })));
    }, []);

    const enrollStudent = useCallback(async (courseId: string, studentId: string) => {
        const course = courses.find(c => c.id === courseId);
        if (!course) return;

        const { error: enrollError } = await supabase.from('enrollments').insert({ course_id: courseId, student_id: studentId });
        if (enrollError) {
             // Ignore primary key violation errors if student is already enrolled
            if (enrollError.code !== '23505') throw enrollError;
            else return;
        }

        const newAttendanceRecords = course.sessions.map(session => ({
            student_id: studentId,
            session_id: session.id,
            status: 'Absent' as const,
        }));
        
        if (newAttendanceRecords.length > 0) {
            const { error: attendanceError } = await supabase.from('attendance_records').insert(newAttendanceRecords);
            if (attendanceError) throw attendanceError;
        }

        await loadData();
    }, [courses, loadData]);

    const resetData = useCallback(() => {
        loadData();
    }, [loadData]);

    return { courses, allStudents, loading, createNewSession, regenerateQrCode, markAttendance, toggleAttendance, deleteSession, resetData, enrollStudent };
};
