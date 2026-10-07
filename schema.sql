-- ==============================================================================
-- THAIBA PUBLIC SCHOOL - HOSTEL INTEGRATED RESOURCE & MANAGEMENT PLATFORM (TPS HOSTEL IRP)
-- Complete PostgreSQL Database Schema with Functions, Triggers, and Indexes
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean previous types if needed
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('super_admin', 'admin', 'warden', 'teacher', 'parent', 'student');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE student_status_type AS ENUM ('active', 'temporarily_away', 'long_leave', 'medical_leave', 'vacation', 'transferred', 'discharged', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_category_type AS ENUM ('moral_class', 'hostel_coaching', 'school_coaching', 'teacher_attendance');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status_type AS ENUM ('present', 'absent', 'leave', 'late', 'excused', 'not_submitted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE leave_status_type AS ENUM ('pending', 'approved', 'rejected', 'active', 'returned', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE bed_status_type AS ENUM ('available', 'occupied', 'reserved', 'maintenance');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE discipline_severity_type AS ENUM ('minor', 'moderate', 'major', 'severe', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 1. SYSTEM SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    phone VARCHAR(50),
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'active',
    hostel_id UUID,
    linked_student_id UUID,
    linked_teacher_id UUID,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. HOSTELS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('boys', 'girls', 'mixed')),
    building VARCHAR(255),
    address TEXT,
    warden_name VARCHAR(255),
    warden_phone VARCHAR(50),
    capacity INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. ROOMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    floor VARCHAR(50) NOT NULL DEFAULT 'Ground Floor',
    room_number VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 8,
    room_type VARCHAR(100) DEFAULT '8-Bed Dormitory',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hostel_id, room_number)
);

-- ------------------------------------------------------------------------------
-- 5. BEDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_number VARCHAR(50) NOT NULL,
    side VARCHAR(50) DEFAULT 'Left Side',
    status VARCHAR(50) DEFAULT 'available',
    current_student_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, bed_number)
);

-- ------------------------------------------------------------------------------
-- 6. TEACHERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    gender VARCHAR(20),
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. CLASS GROUPS (Moral groups, Hostel coaching, School coaching)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS class_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'moral_class', 'hostel_coaching', 'school_coaching'
    hostel_id UUID REFERENCES hostels(id) ON DELETE SET NULL,
    gender VARCHAR(20) DEFAULT 'all',
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    assistant_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    room_name VARCHAR(100),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week JSONB DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]'::jsonb,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. STUDENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admission_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    dob DATE NOT NULL,
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    school_class VARCHAR(50) NOT NULL,
    section VARCHAR(20) DEFAULT 'A',
    hostel_id UUID REFERENCES hostels(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'temporarily_away', 'long_leave', 'medical_leave', etc.
    
    -- Address
    village VARCHAR(255),
    post_office VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255) DEFAULT 'Kerala',
    pin_code VARCHAR(20),
    
    -- Father Information
    father_name VARCHAR(255),
    father_phone VARCHAR(50),
    father_whatsapp VARCHAR(50),
    father_occupation VARCHAR(255),
    
    -- Mother Information
    mother_name VARCHAR(255),
    mother_phone VARCHAR(50),
    mother_whatsapp VARCHAR(50),
    mother_occupation VARCHAR(255),
    
    -- Emergency Contact
    emergency_name VARCHAR(255),
    emergency_phone VARCHAR(50),
    emergency_relation VARCHAR(100),
    
    -- Medical & Additional
    medical_notes TEXT,
    allergies TEXT,
    special_instructions TEXT,
    previous_school VARCHAR(255),
    remarks TEXT,
    
    -- Class Assignments
    moral_group_id UUID REFERENCES class_groups(id) ON DELETE SET NULL,
    hostel_coaching_id UUID REFERENCES class_groups(id) ON DELETE SET NULL,
    school_coaching_id UUID REFERENCES class_groups(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link student back to bed
ALTER TABLE beds ADD CONSTRAINT fk_bed_student FOREIGN KEY (current_student_id) REFERENCES students(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 9. PARENTS & GUARDIANS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    occupation VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'Father',
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, parent_id)
);

-- ------------------------------------------------------------------------------
-- 10. CLASS GROUP STUDENT ENROLLMENT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS class_group_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, student_id)
);

-- ------------------------------------------------------------------------------
-- 11. TIMETABLES & SCHEDULES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    hostel_id UUID REFERENCES hostels(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. ATTENDANCE SESSIONS & STUDENT ATTENDANCE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    hostel_id UUID REFERENCES hostels(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'submitted', 'locked', 'auto_closed'
    locked_at TIMESTAMPTZ,
    submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'present', -- 'present', 'absent', 'leave', 'late', 'excused'
    remarks TEXT,
    time_marked TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

CREATE TABLE IF NOT EXISTS teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'present', -- 'present', 'absent', 'leave', 'not_submitted'
    assigned_time VARCHAR(50),
    submitted_time TIMESTAMPTZ,
    is_auto_marked BOOLEAN DEFAULT false,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. LEAVE MANAGEMENT & RETURN REGISTER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_code VARCHAR(50) UNIQUE NOT NULL,
    leave_type VARCHAR(50) NOT NULL DEFAULT 'hostel_leave',
    reason TEXT NOT NULL,
    leaving_date DATE NOT NULL,
    leaving_time TIME NOT NULL,
    expected_return_date DATE NOT NULL,
    expected_return_time TIME NOT NULL,
    actual_return_date DATE,
    actual_return_time TIME,
    approved_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'approved', -- 'pending', 'approved', 'rejected', 'active', 'returned', 'overdue', 'cancelled'
    is_batch BOOLEAN DEFAULT false,
    remarks TEXT,
    total_students INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_id UUID NOT NULL REFERENCES leave_records(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    actual_return_date DATE,
    actual_return_time TIME,
    late_days INTEGER DEFAULT 0,
    fine_amount NUMERIC(10, 2) DEFAULT 0.00,
    black_marks INTEGER DEFAULT 0,
    condition_on_return VARCHAR(100) DEFAULT 'Normal / Good',
    return_remarks TEXT,
    checked_by VARCHAR(255),
    is_returned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(leave_id, student_id)
);

-- ------------------------------------------------------------------------------
-- 14. HOSTEL ENTRY & EXIT REGISTER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostel_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    entry_type VARCHAR(50) DEFAULT 'exit', -- 'exit', 'return', 'short_outing'
    exit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_time TIME NOT NULL,
    return_date DATE,
    return_time TIME,
    purpose TEXT NOT NULL,
    permission_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'outside', -- 'outside', 'returned', 'overdue'
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. FINE CATEGORIES & FINES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fine_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    default_amount_per_day NUMERIC(10, 2) DEFAULT 100.00,
    fixed_amount NUMERIC(10, 2) DEFAULT 0.00,
    default_black_marks INTEGER DEFAULT 1,
    severity VARCHAR(50) DEFAULT 'moderate',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fine_no VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    leave_id UUID REFERENCES leave_records(id) ON DELETE SET NULL,
    incident_id UUID,
    category_id UUID REFERENCES fine_categories(id) ON DELETE SET NULL,
    category_name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    late_days INTEGER DEFAULT 0,
    black_marks INTEGER DEFAULT 0,
    reason TEXT NOT NULL,
    issued_by VARCHAR(255),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'waived'
    paid_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 16. DISCIPLINE & STUDENT CONDUCT REGISTER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS discipline_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_no VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    hostel_id UUID REFERENCES hostels(id) ON DELETE SET NULL,
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    incident_time TIME NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'moderate',
    black_marks INTEGER DEFAULT 1,
    fine_amount NUMERIC(10, 2) DEFAULT 0.00,
    evidence_url TEXT,
    reported_by VARCHAR(255) NOT NULL,
    action_taken TEXT,
    parent_informed BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS black_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES discipline_incidents(id) ON DELETE SET NULL,
    leave_id UUID REFERENCES leave_records(id) ON DELETE SET NULL,
    marks_count INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 17. HOSTEL DAILY REGISTER / DIARY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostel_diary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    diary_date DATE NOT NULL DEFAULT CURRENT_DATE,
    morning_status TEXT,
    fajr_attendance_summary TEXT,
    moral_class_summary TEXT,
    coaching_summary TEXT,
    evening_summary TEXT,
    entry_exit_summary TEXT,
    discipline_notes TEXT,
    general_remarks TEXT,
    recorded_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hostel_id, diary_date)
);

-- ------------------------------------------------------------------------------
-- 18. NOTICES & ANNOUNCEMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    audience VARCHAR(50) DEFAULT 'all', -- 'all', 'boys', 'girls', 'parents', 'teachers', 'wardens'
    hostel_id UUID REFERENCES hostels(id) ON DELETE SET NULL,
    priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    attachment_url TEXT,
    author_name VARCHAR(255),
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 19. NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_role VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general', -- 'attendance', 'leave', 'fine', 'discipline', 'notice'
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 20. DOCUMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(100) NOT NULL, -- 'photo', 'birth_certificate', 'id_proof', 'parent_id', 'medical', 'other'
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 21. AUDIT LOGS (Immutable)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_hostel_id ON students(hostel_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_gender ON students(gender);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON students(school_class);
CREATE INDEX IF NOT EXISTS idx_beds_room_id ON beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_class_groups_category ON class_groups(category);
CREATE INDEX IF NOT EXISTS idx_class_groups_hostel_id ON class_groups(hostel_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_group ON attendance_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_session ON student_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_records_status ON leave_records(status);
CREATE INDEX IF NOT EXISTS idx_leave_records_expected_return ON leave_records(expected_return_date);
CREATE INDEX IF NOT EXISTS idx_leave_students_student ON leave_students(student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_entries_status ON hostel_entries(status);
CREATE INDEX IF NOT EXISTS idx_fines_student_id ON fines(student_id);
CREATE INDEX IF NOT EXISTS idx_discipline_student_id ON discipline_incidents(student_id);
CREATE INDEX IF NOT EXISTS idx_black_marks_student_id ON black_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ------------------------------------------------------------------------------
-- STORED FUNCTIONS & PROCEDURES
-- ------------------------------------------------------------------------------

-- Function: Calculate Date-Based Late Return Fine and Time-based Black Mark
CREATE OR REPLACE FUNCTION calculate_leave_fine(
    p_leave_student_id UUID,
    p_actual_return_date DATE,
    p_actual_return_time TIME,
    p_fine_rate_per_day NUMERIC DEFAULT 100.00
)
RETURNS TABLE (
    late_days INTEGER,
    fine_amount NUMERIC,
    black_marks INTEGER
) AS $$
DECLARE
    v_expected_date DATE;
    v_expected_time TIME;
    v_days_diff INTEGER;
    v_calculated_fine NUMERIC := 0.00;
    v_calculated_black_marks INTEGER := 0;
BEGIN
    SELECT lr.expected_return_date, lr.expected_return_time
    INTO v_expected_date, v_expected_time
    FROM leave_students ls
    JOIN leave_records lr ON lr.id = ls.leave_id
    WHERE ls.id = p_leave_student_id;

    IF v_expected_date IS NULL THEN
        RAISE EXCEPTION 'Leave record not found';
    END IF;

    -- Late days calculated strictly by calendar date
    IF p_actual_return_date > v_expected_date THEN
        v_days_diff := (p_actual_return_date - v_expected_date);
        v_calculated_fine := v_days_diff * p_fine_rate_per_day;
        v_calculated_black_marks := v_days_diff; -- 1 black mark per late day
    ELSE
        v_days_diff := 0;
        v_calculated_fine := 0.00;
        
        -- Time-based late return on same date triggers black mark if returned after expected time
        IF p_actual_return_date = v_expected_date AND p_actual_return_time > v_expected_time THEN
            v_calculated_black_marks := 1; -- Late Mark for time delay
        END IF;
    END IF;

    RETURN QUERY SELECT v_days_diff, v_calculated_fine, v_calculated_black_marks;
END;
$$ LANGUAGE plpgsql;

-- Function: Conflict Detection for Timetable Scheduling
CREATE OR REPLACE FUNCTION check_timetable_conflicts(
    p_teacher_id UUID,
    p_day VARCHAR,
    p_start_time TIME,
    p_end_time TIME,
    p_room_name VARCHAR DEFAULT NULL,
    p_exclude_timetable_id UUID DEFAULT NULL
)
RETURNS TABLE (
    has_conflict BOOLEAN,
    conflict_type VARCHAR,
    conflict_details TEXT
) AS $$
DECLARE
    v_teacher_conflict_count INTEGER := 0;
    v_room_conflict_count INTEGER := 0;
    v_detail TEXT := '';
BEGIN
    -- 1. Check teacher double booking
    SELECT COUNT(*), string_agg(cg.group_name || ' (' || t.start_time || '-' || t.end_time || ')', ', ')
    INTO v_teacher_conflict_count, v_detail
    FROM timetables t
    JOIN class_groups cg ON cg.id = t.group_id
    WHERE t.teacher_id = p_teacher_id
      AND t.day_of_week = p_day
      AND (t.id != p_exclude_timetable_id OR p_exclude_timetable_id IS NULL)
      AND (
          (p_start_time >= t.start_time AND p_start_time < t.end_time) OR
          (p_end_time > t.start_time AND p_end_time <= t.end_time) OR
          (p_start_time <= t.start_time AND p_end_time >= t.end_time)
      );

    IF v_teacher_conflict_count > 0 THEN
        RETURN QUERY SELECT true, 'teacher_double_booking'::VARCHAR, ('Teacher already has scheduled class: ' || v_detail)::TEXT;
        RETURN;
    END IF;

    -- 2. Check room double booking if room name provided
    IF p_room_name IS NOT NULL AND p_room_name != '' THEN
        SELECT COUNT(*), string_agg(cg.group_name || ' (' || t.start_time || '-' || t.end_time || ')', ', ')
        INTO v_room_conflict_count, v_detail
        FROM timetables t
        JOIN class_groups cg ON cg.id = t.group_id
        WHERE LOWER(t.room_name) = LOWER(p_room_name)
          AND t.day_of_week = p_day
          AND (t.id != p_exclude_timetable_id OR p_exclude_timetable_id IS NULL)
          AND (
              (p_start_time >= t.start_time AND p_start_time < t.end_time) OR
              (p_end_time > t.start_time AND p_end_time <= t.end_time) OR
              (p_start_time <= t.start_time AND p_end_time >= t.end_time)
          );

        IF v_room_conflict_count > 0 THEN
            RETURN QUERY SELECT true, 'room_double_booking'::VARCHAR, ('Room ' || p_room_name || ' already booked for: ' || v_detail)::TEXT;
            RETURN;
        END IF;
    END IF;

    RETURN QUERY SELECT false, 'none'::VARCHAR, 'No schedule conflict detected'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function: Automatic Audit Logger
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_user_role VARCHAR(50);
BEGIN
    INSERT INTO audit_logs (
        action,
        module,
        record_id,
        details,
        created_at
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        ),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep bed status synchronized when student room/bed assignment changes
CREATE OR REPLACE FUNCTION sync_bed_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- If bed changed or student removed
    IF TG_OP = 'UPDATE' THEN
        IF OLD.bed_id IS NOT NULL AND OLD.bed_id != NEW.bed_id THEN
            UPDATE beds SET status = 'available', current_student_id = NULL WHERE id = OLD.bed_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.bed_id IS NOT NULL THEN
            UPDATE beds SET status = 'available', current_student_id = NULL WHERE id = OLD.bed_id;
        END IF;
        RETURN OLD;
    END IF;

    -- Allocate new bed
    IF NEW.bed_id IS NOT NULL THEN
        UPDATE beds SET status = 'occupied', current_student_id = NEW.id WHERE id = NEW.bed_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_bed_occupancy ON students;
CREATE TRIGGER trigger_sync_bed_occupancy
AFTER INSERT OR UPDATE OR DELETE ON students
FOR EACH ROW EXECUTE FUNCTION sync_bed_occupancy();
