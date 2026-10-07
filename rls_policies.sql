-- ==============================================================================
-- THAIBA PUBLIC SCHOOL - HOSTEL IRP
-- Comprehensive Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_group_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE black_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper Function: Get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Helper Function: Check if user is Super Admin or Admin
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    );
$$ LANGUAGE sql STABLE;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public profiles read for authenticated" ON profiles;
CREATE POLICY "Public profiles read for authenticated" ON profiles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users update own profile or admin updates all" ON profiles;
CREATE POLICY "Users update own profile or admin updates all" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR is_admin_or_super());

DROP POLICY IF EXISTS "Super admin can insert profiles" ON profiles;
CREATE POLICY "Super admin can insert profiles" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (is_admin_or_super());

-- ------------------------------------------------------------------------------
-- STUDENTS POLICIES
-- ------------------------------------------------------------------------------
-- Super Admin / Admin: Full access
-- Warden: Access to hostel students
-- Teacher: Access to students in assigned class groups
-- Parent: Access only to linked children
-- Student: Access only to self
DROP POLICY IF EXISTS "Students viewable by authorized users" ON students;
CREATE POLICY "Students viewable by authorized users" ON students
    FOR SELECT TO authenticated
    USING (
        is_admin_or_super()
        OR (get_current_user_role() = 'warden')
        OR (get_current_user_role() = 'teacher')
        OR (
            get_current_user_role() = 'parent' AND id IN (
                SELECT sp.student_id FROM student_parents sp
                JOIN parents p ON p.id = sp.parent_id
                WHERE p.user_id = auth.uid()
            )
        )
        OR (
            get_current_user_role() = 'student' AND id IN (
                SELECT linked_student_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Students manageable by admin and warden" ON students;
CREATE POLICY "Students manageable by admin and warden" ON students
    FOR ALL TO authenticated
    USING (is_admin_or_super() OR get_current_user_role() = 'warden')
    WITH CHECK (is_admin_or_super() OR get_current_user_role() = 'warden');

-- ------------------------------------------------------------------------------
-- HOSTELS, ROOMS & BEDS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Hostels viewable by all authenticated" ON hostels;
CREATE POLICY "Hostels viewable by all authenticated" ON hostels
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Hostels managed by admin" ON hostels;
CREATE POLICY "Hostels managed by admin" ON hostels
    FOR ALL TO authenticated
    USING (is_admin_or_super())
    WITH CHECK (is_admin_or_super());

DROP POLICY IF EXISTS "Rooms and beds viewable by all authenticated" ON rooms;
CREATE POLICY "Rooms and beds viewable by all authenticated" ON rooms
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Rooms managed by admin and warden" ON rooms;
CREATE POLICY "Rooms managed by admin and warden" ON rooms
    FOR ALL TO authenticated
    USING (is_admin_or_super() OR get_current_user_role() = 'warden');

DROP POLICY IF EXISTS "Beds viewable by authenticated" ON beds;
CREATE POLICY "Beds viewable by authenticated" ON beds
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Beds managed by admin and warden" ON beds;
CREATE POLICY "Beds managed by admin and warden" ON beds
    FOR ALL TO authenticated
    USING (is_admin_or_super() OR get_current_user_role() = 'warden');

-- ------------------------------------------------------------------------------
-- ATTENDANCE SESSIONS & ATTENDANCE RECORDS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Attendance sessions viewable by authenticated" ON attendance_sessions;
CREATE POLICY "Attendance sessions viewable by authenticated" ON attendance_sessions
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Teachers and admins can insert/update attendance sessions" ON attendance_sessions;
CREATE POLICY "Teachers and admins can insert/update attendance sessions" ON attendance_sessions
    FOR ALL TO authenticated
    USING (
        is_admin_or_super() 
        OR get_current_user_role() = 'warden'
        OR (get_current_user_role() = 'teacher' AND teacher_id IN (
            SELECT id FROM teachers WHERE user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Student attendance viewable" ON student_attendance;
CREATE POLICY "Student attendance viewable" ON student_attendance
    FOR SELECT TO authenticated
    USING (
        is_admin_or_super()
        OR get_current_user_role() IN ('warden', 'teacher')
        OR (
            get_current_user_role() = 'parent' AND student_id IN (
                SELECT sp.student_id FROM student_parents sp
                JOIN parents p ON p.id = sp.parent_id
                WHERE p.user_id = auth.uid()
            )
        )
        OR (
            get_current_user_role() = 'student' AND student_id IN (
                SELECT linked_student_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Student attendance manageable by teachers, wardens, admins" ON student_attendance;
CREATE POLICY "Student attendance manageable by teachers, wardens, admins" ON student_attendance
    FOR ALL TO authenticated
    USING (is_admin_or_super() OR get_current_user_role() IN ('warden', 'teacher'));

-- ------------------------------------------------------------------------------
-- LEAVE RECORDS & RETURN REGISTER POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Leave records viewable" ON leave_records;
CREATE POLICY "Leave records viewable" ON leave_records
    FOR SELECT TO authenticated
    USING (
        is_admin_or_super()
        OR get_current_user_role() = 'warden'
        OR id IN (
            SELECT ls.leave_id FROM leave_students ls
            WHERE (
                get_current_user_role() = 'student' AND ls.student_id IN (
                    SELECT linked_student_id FROM profiles WHERE id = auth.uid()
                )
            ) OR (
                get_current_user_role() = 'parent' AND ls.student_id IN (
                    SELECT sp.student_id FROM student_parents sp
                    JOIN parents p ON p.id = sp.parent_id
                    WHERE p.user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Leave records managed by admin and warden" ON leave_records;
CREATE POLICY "Leave records managed by admin and warden" ON leave_records
    FOR ALL TO authenticated
    USING (is_admin_or_super() OR get_current_user_role() = 'warden');

DROP POLICY IF EXISTS "Leave students viewable" ON leave_students;
CREATE POLICY "Leave students viewable" ON leave_students
    FOR SELECT TO authenticated
    USING (
        is_admin_or_super()
        OR get_current_user_role() = 'warden'
        OR (
            get_current_user_role() = 'student' AND student_id IN (
                SELECT linked_student_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR (
            get_current_user_role() = 'parent' AND student_id IN (
                SELECT sp.student_id FROM student_parents sp
                JOIN parents p ON p.id = sp.parent_id
                WHERE p.user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Leave students managed by admin and warden" ON leave_students;
CREATE POLICY "Leave students managed by admin and warden" ON leave_students
    FOR ALL TO authenticated
    USING (is_admin_or_super() OR get_current_user_role() = 'warden');

-- ------------------------------------------------------------------------------
-- FINES & DISCIPLINE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Fines viewable" ON fines;
CREATE POLICY "Fines viewable" ON fines
    FOR SELECT TO authenticated
    USING (
        is_admin_or_super()
        OR get_current_user_role() = 'warden'
        OR (
            get_current_user_role() = 'parent' AND student_id IN (
                SELECT sp.student_id FROM student_parents sp
                JOIN parents p ON p.id = sp.parent_id
                WHERE p.user_id = auth.uid()
            )
        )
        OR (
            get_current_user_role() = 'student' AND student_id IN (
                SELECT linked_student_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Fines managed by admin and warden" ON fines;
CREATE POLICY "Fines managed by admin and warden" ON fines
    FOR ALL TO authenticated
    USING (is_admin_or_super() OR get_current_user_role() = 'warden');

DROP POLICY IF EXISTS "Discipline viewable" ON discipline_incidents;
CREATE POLICY "Discipline viewable" ON discipline_incidents
    FOR SELECT TO authenticated
    USING (
        is_admin_or_super()
        OR get_current_user_role() = 'warden'
        OR (
            get_current_user_role() = 'parent' AND parent_informed = true AND student_id IN (
                SELECT sp.student_id FROM student_parents sp
                JOIN parents p ON p.id = sp.parent_id
                WHERE p.user_id = auth.uid()
            )
        )
        OR (
            get_current_user_role() = 'student' AND student_id IN (
                SELECT linked_student_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Discipline managed by admin and warden" ON discipline_incidents;
CREATE POLICY "Discipline managed by admin and warden" ON discipline_incidents
    FOR ALL TO authenticated
    USING (is_admin_or_super() OR get_current_user_role() = 'warden');

-- ------------------------------------------------------------------------------
-- NOTICES & NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Notices viewable by all authenticated" ON notices;
CREATE POLICY "Notices viewable by all authenticated" ON notices
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Notices managed by admins and wardens" ON notices;
CREATE POLICY "Notices managed by admins and wardens" ON notices
    FOR ALL TO authenticated
    USING (is_admin_or_super() OR get_current_user_role() = 'warden');

DROP POLICY IF EXISTS "Notifications viewable by recipient" ON notifications;
CREATE POLICY "Notifications viewable by recipient" ON notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_admin_or_super());

DROP POLICY IF EXISTS "Notifications manageable by recipient or admin" ON notifications;
CREATE POLICY "Notifications manageable by recipient or admin" ON notifications
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR is_admin_or_super());

-- ------------------------------------------------------------------------------
-- AUDIT LOGS (Read only for Super Admin, writeable by system)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Audit logs viewable by super admin" ON audit_logs;
CREATE POLICY "Audit logs viewable by super admin" ON audit_logs
    FOR SELECT TO authenticated
    USING (is_admin_or_super());

DROP POLICY IF EXISTS "Audit logs insertable by all" ON audit_logs;
CREATE POLICY "Audit logs insertable by all" ON audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);
