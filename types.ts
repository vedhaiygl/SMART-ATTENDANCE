
export interface Student {
  id: string;
  name: string;
  anonymizedName: string;
}

export interface Session {
  id: string;
  date: string; // ISO string
  type: 'Online' | 'Offline';
  limit?: number;
  scannedCount?: number;
  qrCodeValue?: string; // Holds the current, unique QR code value for an active session
}

export interface AttendanceRecord {
  studentId: string;
  sessionId: string;
  status: 'Present' | 'Absent';
}

export interface Course {
  id: string;
  name: string;
  code: string;
  students: Student[];
  sessions: Session[];
  attendance: AttendanceRecord[];
}

export type ViewType = 'dashboard' | 'courses' | 'analytics';

export type UserRole = 'faculty' | 'student';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    email: string;
}

// FIX: Moved MarkAttendanceResult here to be a shared type.
export type MarkAttendanceResult = 'success' | 'already_marked' | 'limit_reached' | 'not_enrolled' | 'error' | 'invalid_qr' | 'expired_qr';