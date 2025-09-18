import { supabase } from './supabaseClient';
import type { Course, Student, Session, AttendanceRecord } from '../types';

// Helper function to generate anonymized names
const generateAnonymizedName = (): string => {
  const adjectives = ['Agile', 'Bright', 'Clever', 'Daring', 'Eager', 'Fearless', 'Gifted', 'Happy', 'Intrepid', 'Jolly'];
  const animals = ['Aardvark', 'Bison', 'Cheetah', 'Dolphin', 'Elephant', 'Falcon', 'Gazelle', 'Hawk', 'Iguana', 'Jaguar'];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  
  return `${randomAdjective} ${randomAnimal}`;
};

// Fetch courses for the current user
export const fetchUserCourses = async (): Promise<Course[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  let coursesQuery;
  
  if (profile.role === 'faculty') {
    // Faculty can see courses they created
    coursesQuery = supabase
      .from('courses')
      .select(`
        *,
        course_enrollments (
          student_id,
          anonymized_name,
          profiles (
            id,
            name
          )
        ),
        sessions (*),
        attendance_records (*)
      `)
      .eq('created_by', user.id);
  } else {
    // Students can see courses they're enrolled in
    coursesQuery = supabase
      .from('courses')
      .select(`
        *,
        course_enrollments (
          student_id,
          anonymized_name,
          profiles (
            id,
            name
          )
        ),
        sessions (*),
        attendance_records (*)
      `)
      .in('id', 
        supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', user.id)
      );
  }

  const { data: courses, error } = await coursesQuery;
  if (error) throw error;

  // Transform the data to match our Course interface
  return courses?.map(course => ({
    id: course.id,
    name: course.name,
    code: course.code,
    students: course.course_enrollments?.map((enrollment: any) => ({
      id: enrollment.student_id,
      name: enrollment.profiles?.name || 'Unknown',
      anonymizedName: enrollment.anonymized_name
    })) || [],
    sessions: course.sessions?.map((session: any) => ({
      id: session.id,
      date: session.date,
      type: session.type,
      limit: session.limit_count,
      scannedCount: session.scanned_count,
      qrCodeValue: session.qr_code_value
    })) || [],
    attendance: course.attendance_records?.map((record: any) => ({
      studentId: record.student_id,
      sessionId: record.session_id,
      status: record.status
    })) || []
  })) || [];
};

// Create a new course (faculty only)
export const createCourse = async (name: string, code: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('courses')
    .insert({
      name,
      code,
      created_by: user.id
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

// Enroll a student in a course
export const enrollStudent = async (courseId: string, studentEmail: string): Promise<void> => {
  // First, find the student by email
  const { data: studentProfile, error: studentError } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('email', studentEmail)
    .eq('role', 'student')
    .single();

  if (studentError || !studentProfile) {
    throw new Error('Student not found');
  }

  // Check if already enrolled
  const { data: existingEnrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', studentProfile.id)
    .single();

  if (existingEnrollment) {
    throw new Error('Student is already enrolled in this course');
  }

  // Enroll the student
  const { error } = await supabase
    .from('course_enrollments')
    .insert({
      course_id: courseId,
      student_id: studentProfile.id,
      anonymized_name: generateAnonymizedName()
    });

  if (error) throw error;
};

// Create a new session
export const createSession = async (
  courseId: string, 
  type: 'Online' | 'Offline', 
  limit: number
): Promise<{ sessionId: string; qrCodeValue: string }> => {
  const qrCodeValue = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      course_id: courseId,
      date: new Date().toISOString(),
      type,
      limit_count: limit,
      scanned_count: 0,
      qr_code_value: qrCodeValue
    })
    .select('id')
    .single();

  if (error) throw error;

  // Create attendance records for all enrolled students (default to Absent)
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('student_id')
    .eq('course_id', courseId);

  if (enrollments && enrollments.length > 0) {
    const attendanceRecords = enrollments.map(enrollment => ({
      session_id: data.id,
      student_id: enrollment.student_id,
      status: 'Absent' as const
    }));

    await supabase
      .from('attendance_records')
      .insert(attendanceRecords);
  }

  return { sessionId: data.id, qrCodeValue };
};

// Mark attendance via QR code scan
export const markAttendanceViaQR = async (qrCodeValue: string): Promise<'success' | 'already_marked' | 'limit_reached' | 'not_enrolled' | 'invalid_qr' | 'expired_qr'> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check QR code expiration (30 seconds)
  if (qrCodeValue.startsWith('qr_')) {
    const parts = qrCodeValue.split('_');
    if (parts.length >= 2) {
      const timestamp = parseInt(parts[1], 10);
      if (!isNaN(timestamp) && Date.now() - timestamp > 30000) {
        return 'expired_qr';
      }
    }
  }

  // Find the session with this QR code
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, course_id, limit_count, scanned_count')
    .eq('qr_code_value', qrCodeValue)
    .single();

  if (sessionError || !session) {
    return 'invalid_qr';
  }

  // Check if student is enrolled in this course
  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', session.course_id)
    .eq('student_id', user.id)
    .single();

  if (!enrollment) {
    return 'not_enrolled';
  }

  // Check if limit is reached
  if (session.limit_count && session.scanned_count >= session.limit_count) {
    return 'limit_reached';
  }

  // Check if already marked present
  const { data: existingRecord } = await supabase
    .from('attendance_records')
    .select('status')
    .eq('session_id', session.id)
    .eq('student_id', user.id)
    .single();

  if (existingRecord?.status === 'Present') {
    return 'already_marked';
  }

  // Mark attendance as present
  const { error: updateError } = await supabase
    .from('attendance_records')
    .update({ 
      status: 'Present',
      marked_at: new Date().toISOString()
    })
    .eq('session_id', session.id)
    .eq('student_id', user.id);

  if (updateError) throw updateError;

  // Update scanned count and regenerate QR code
  const newScannedCount = session.scanned_count + 1;
  const newQrCode = newScannedCount >= (session.limit_count || 0) 
    ? 'limit_reached' 
    : `qr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await supabase
    .from('sessions')
    .update({
      scanned_count: newScannedCount,
      qr_code_value: newQrCode
    })
    .eq('id', session.id);

  return 'success';
};