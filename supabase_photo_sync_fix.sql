-- ==============================================================================
-- THAIBA PUBLIC SCHOOL HOSTEL IRP - SUPABASE PHOTO & STORAGE FIX MIGRATION
-- Run this entire script in Supabase Dashboard -> SQL Editor -> Click 'Run'
-- ==============================================================================

-- 1. ADD MISSING PHOTO & AVATAR COLUMNS (TEXT allows large URLs & Base64 images)
ALTER TABLE IF EXISTS students 
    ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE IF EXISTS teachers 
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS photo_url TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50),
    ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS profiles 
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. CREATE / CONFIGURE STORAGE BUCKETS FOR PHOTOS & DOCUMENTS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('photos', 'photos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']),
    ('hostel-documents', 'hostel-documents', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. PERMISSIONS FOR STORAGE (Allow viewing, uploading and updating photos)
DROP POLICY IF EXISTS "Public Access to Photos Bucket" ON storage.objects;
CREATE POLICY "Public Access to Photos Bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('photos', 'hostel-documents'));

DROP POLICY IF EXISTS "Allow All Uploads to Photos Bucket" ON storage.objects;
CREATE POLICY "Allow All Uploads to Photos Bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id IN ('photos', 'hostel-documents'));

DROP POLICY IF EXISTS "Allow Updates to Photos Bucket" ON storage.objects;
CREATE POLICY "Allow Updates to Photos Bucket"
    ON storage.objects FOR UPDATE
    USING (bucket_id IN ('photos', 'hostel-documents'));

DROP POLICY IF EXISTS "Allow Deletions from Photos Bucket" ON storage.objects;
CREATE POLICY "Allow Deletions from Photos Bucket"
    ON storage.objects FOR DELETE
    USING (bucket_id IN ('photos', 'hostel-documents'));

-- 4. TABLE RLS FIX: Allow both Anonymous & Authenticated App syncing
-- This ensures photos and student/teacher profiles save successfully from the Web App / APK.
DROP POLICY IF EXISTS "Allow Full Access to Students" ON students;
CREATE POLICY "Allow Full Access to Students" ON students
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Full Access to Teachers" ON teachers;
CREATE POLICY "Allow Full Access to Teachers" ON teachers
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Full Access to Profiles" ON profiles;
CREATE POLICY "Allow Full Access to Profiles" ON profiles
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Full Access to Parents" ON parents;
CREATE POLICY "Allow Full Access to Parents" ON parents
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Full Access to Student Parents" ON student_parents;
CREATE POLICY "Allow Full Access to Student Parents" ON student_parents
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

-- 5. RELOAD POSTGREST CACHE
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
