-- Fix 1: Add unique constraint to attendance_records to prevent duplicates
ALTER TABLE public.attendance_records 
ADD CONSTRAINT attendance_records_session_student_unique 
UNIQUE (session_id, student_id);

-- Fix 2: Allow lecturers to INSERT and DELETE attendance records for their sessions
CREATE POLICY "Lecturers can manually add attendance for their sessions"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  manually_added = true 
  AND EXISTS (
    SELECT 1 FROM attendance_sessions
    WHERE attendance_sessions.id = attendance_records.session_id
    AND attendance_sessions.lecturer_id = auth.uid()
  )
);

CREATE POLICY "Lecturers can delete attendance for their sessions"
ON public.attendance_records
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM attendance_sessions
    WHERE attendance_sessions.id = attendance_records.session_id
    AND attendance_sessions.lecturer_id = auth.uid()
  )
);

-- Fix 3: Allow students to view all sessions of their enrolled classes (not just active ones)
CREATE POLICY "Students can view all sessions for enrolled classes"
ON public.attendance_sessions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'student')
  AND EXISTS (
    SELECT 1 FROM student_enrollments
    WHERE student_enrollments.class_id = attendance_sessions.class_id
    AND student_enrollments.student_id = auth.uid()
  )
);

-- Fix 4: Allow students to view classmates' basic profile info for study groups
CREATE POLICY "Students can view classmates profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'student')
  AND (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM student_enrollments se1
      INNER JOIN student_enrollments se2 
        ON se1.class_id = se2.class_id
      WHERE se1.student_id = auth.uid()
        AND se2.student_id = profiles.id
    )
  )
);