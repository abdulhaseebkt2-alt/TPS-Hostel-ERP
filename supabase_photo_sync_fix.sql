-- ==============================================================================
-- THAIBA PUBLIC SCHOOL HOSTEL IRP - MASTER SUPABASE MIGRATION & PHOTO STORAGE SETUP
-- Run this complete script in Supabase Dashboard -> SQL Editor -> Click 'RUN'
-- ==============================================================================

-- 1. USERS & ROLES TABLE (For Super Admin, Admin, Warden, Teacher, Parent Logins)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'pending', -- 'super_admin', 'admin', 'warden', 'teacher', 'parent', 'student', 'pending'
    requested_role TEXT DEFAULT 'teacher',
    status TEXT DEFAULT 'pending_approval', -- 'active', 'pending_approval', 'disabled'
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    linked_teacher_id TEXT,
    linked_student_id TEXT,
    linked_student_ids JSONB DEFAULT '[]'::jsonb,
    hostel_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert or Update Master Super Admin Account
INSERT INTO users (id, full_name, email, role, requested_role, status, password_hash, phone, created_at)
VALUES (
    'usr_super_admin',
    'Abdul Haseeb',
    'abdulhaseebkt2@gmail.com',
    'super_admin',
    'super_admin',
    'active',
    '789321456Hkt.',
    '+91 98765 00001',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    email = 'abdulhaseebkt2@gmail.com',
    role = 'super_admin',
    requested_role = 'super_admin',
    status = 'active',
    password_hash = '789321456Hkt.';

-- 2. ENSURE PHOTO & AVATAR COLUMNS EXIST ON ALL CORE TABLES
ALTER TABLE IF EXISTS students 
    ADD COLUMN IF NOT EXISTS photo_url TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS father_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS father_whatsapp VARCHAR(50);

ALTER TABLE IF EXISTS teachers 
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS photo_url TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50),
    ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS profiles 
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE IF EXISTS notices 
    ADD COLUMN IF NOT EXISTS attachment_url TEXT;

ALTER TABLE IF EXISTS gate_register 
    ADD COLUMN IF NOT EXISTS student_photo_url TEXT;

-- 3. CREATE & CONFIGURE PUBLIC STORAGE BUCKETS FOR PHOTOS & DOCUMENTS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('photos', 'photos', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']),
    ('hostel-documents', 'hostel-documents', true, 20971520, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'application/pdf']),
    ('avatars', 'avatars', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. STORAGE ACCESS POLICIES (Full Public Read & Multi-device Upload/Delete Access)
DROP POLICY IF EXISTS "Public Access to Photos Bucket" ON storage.objects;
CREATE POLICY "Public Access to Photos Bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('photos', 'hostel-documents', 'avatars'));

DROP POLICY IF EXISTS "Allow All Uploads to Photos Bucket" ON storage.objects;
CREATE POLICY "Allow All Uploads to Photos Bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id IN ('photos', 'hostel-documents', 'avatars'));

DROP POLICY IF EXISTS "Allow Updates to Photos Bucket" ON storage.objects;
CREATE POLICY "Allow Updates to Photos Bucket"
    ON storage.objects FOR UPDATE
    USING (bucket_id IN ('photos', 'hostel-documents', 'avatars'));

DROP POLICY IF EXISTS "Allow Deletions from Photos Bucket" ON storage.objects;
CREATE POLICY "Allow Deletions from Photos Bucket"
    ON storage.objects FOR DELETE
    USING (bucket_id IN ('photos', 'hostel-documents', 'avatars'));

-- 5. DATABASE ROW LEVEL SECURITY (RLS) POLICIES FOR WEB & PWA CLIENTS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Full Access to Users" ON users;
CREATE POLICY "Allow Full Access to Users" ON users
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
        ALTER TABLE students ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Students" ON students;
        CREATE POLICY "Allow Full Access to Students" ON students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachers') THEN
        ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Teachers" ON teachers;
        CREATE POLICY "Allow Full Access to Teachers" ON teachers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Profiles" ON profiles;
        CREATE POLICY "Allow Full Access to Profiles" ON profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hostels') THEN
        ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Hostels" ON hostels;
        CREATE POLICY "Allow Full Access to Hostels" ON hostels FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rooms') THEN
        ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Rooms" ON rooms;
        CREATE POLICY "Allow Full Access to Rooms" ON rooms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'beds') THEN
        ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Beds" ON beds;
        CREATE POLICY "Allow Full Access to Beds" ON beds FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
        ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Attendance" ON attendance;
        CREATE POLICY "Allow Full Access to Attendance" ON attendance FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leaves') THEN
        ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Leaves" ON leaves;
        CREATE POLICY "Allow Full Access to Leaves" ON leaves FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_students') THEN
        ALTER TABLE leave_students ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Leave Students" ON leave_students;
        CREATE POLICY "Allow Full Access to Leave Students" ON leave_students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gate_register') THEN
        ALTER TABLE gate_register ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Gate Register" ON gate_register;
        CREATE POLICY "Allow Full Access to Gate Register" ON gate_register FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fines') THEN
        ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Fines" ON fines;
        CREATE POLICY "Allow Full Access to Fines" ON fines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conduct_logs') THEN
        ALTER TABLE conduct_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Conduct Logs" ON conduct_logs;
        CREATE POLICY "Allow Full Access to Conduct Logs" ON conduct_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timetables') THEN
        ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Timetables" ON timetables;
        CREATE POLICY "Allow Full Access to Timetables" ON timetables FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notices') THEN
        ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Notices" ON notices;
        CREATE POLICY "Allow Full Access to Notices" ON notices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow Full Access to Notifications" ON notifications;
        CREATE POLICY "Allow Full Access to Notifications" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 6. RELOAD POSTGREST CACHE
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
