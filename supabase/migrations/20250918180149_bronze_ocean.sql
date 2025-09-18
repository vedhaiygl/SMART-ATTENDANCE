/*
  # Create courses and attendance tables

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `name` (text, course name)
      - `code` (text, course code)
      - `created_by` (uuid, references profiles.id)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `course_enrollments`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references courses.id)
      - `student_id` (uuid, references profiles.id)
      - `anonymized_name` (text, for privacy in leaderboards)
      - `enrolled_at` (timestamp)
    
    - `sessions`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references courses.id)
      - `date` (timestamp, session date)
      - `type` (text, 'Online' or 'Offline')
      - `limit_count` (integer, attendance limit)
      - `scanned_count` (integer, current attendance count)
      - `qr_code_value` (text, current QR code)
      - `created_at` (timestamp)
    
    - `attendance_records`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions.id)
      - `student_id` (uuid, references profiles.id)
      - `status` (text, 'Present' or 'Absent')
      - `marked_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for faculty and students
*/

-- Create session type enum
DO $$ BEGIN
    CREATE TYPE session_type AS ENUM ('Online', 'Offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create attendance status enum
DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('Present', 'Absent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create course enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  anonymized_name text NOT NULL,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  type session_type NOT NULL,
  limit_count integer DEFAULT 50,
  scanned_count integer DEFAULT 0,
  qr_code_value text,
  created_at timestamptz DEFAULT now()
);

-- Create attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status attendance_status DEFAULT 'Absent',
  marked_at timestamptz DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Policies for courses table
CREATE POLICY "Faculty can manage their courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'faculty'
      AND (courses.created_by = auth.uid() OR courses.created_by IS NULL)
    )
  );

CREATE POLICY "Students can read courses they're enrolled in"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments 
      WHERE course_enrollments.course_id = courses.id 
      AND course_enrollments.student_id = auth.uid()
    )
  );

-- Policies for course enrollments
CREATE POLICY "Faculty can manage enrollments for their courses"
  ON course_enrollments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses, profiles
      WHERE courses.id = course_enrollments.course_id
      AND profiles.id = auth.uid()
      AND profiles.role = 'faculty'
      AND courses.created_by = auth.uid()
    )
  );

CREATE POLICY "Students can read their own enrollments"
  ON course_enrollments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can read enrollments in their courses"
  ON course_enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments ce2
      WHERE ce2.course_id = course_enrollments.course_id
      AND ce2.student_id = auth.uid()
    )
  );

-- Policies for sessions
CREATE POLICY "Faculty can manage sessions for their courses"
  ON sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses, profiles
      WHERE courses.id = sessions.course_id
      AND profiles.id = auth.uid()
      AND profiles.role = 'faculty'
      AND courses.created_by = auth.uid()
    )
  );

CREATE POLICY "Students can read sessions for enrolled courses"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_id = sessions.course_id
      AND course_enrollments.student_id = auth.uid()
    )
  );

-- Policies for attendance records
CREATE POLICY "Faculty can manage attendance for their courses"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions, courses, profiles
      WHERE sessions.id = attendance_records.session_id
      AND courses.id = sessions.course_id
      AND profiles.id = auth.uid()
      AND profiles.role = 'faculty'
      AND courses.created_by = auth.uid()
    )
  );

CREATE POLICY "Students can read their own attendance"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can update their own attendance via QR scan"
  ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();