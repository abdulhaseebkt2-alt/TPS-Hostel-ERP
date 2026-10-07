-- ==============================================================================
-- THAIBA PUBLIC SCHOOL - HOSTEL IRP
-- Initial Master Data & Realistic Seed Data
-- ==============================================================================

-- 1. System Settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES
('school_profile', '{
    "school_name": "Thaiba Public School",
    "portal_name": "TPS Hostel IRP",
    "motto": "Modern Education with Morality",
    "super_admin_email": "abdulhaseebkt2@gmail.com",
    "address": "Thaiba Campus, Valley Road, Malappuram, Kerala - 676505",
    "phone": "+91 483 2750000",
    "email": "hostel@thaibapublicschool.com",
    "website": "www.thaibapublicschool.com",
    "logo_url": "assets/icons/logo.svg",
    "primary_color": "#0d5c3a",
    "secondary_color": "#d97706"
}'::jsonb, 'School & Hostel branding information'),

('attendance_rules', '{
    "moral_class_start": "18:00",
    "moral_class_end": "19:00",
    "hostel_coaching_start": "19:30",
    "hostel_coaching_end": "21:00",
    "school_coaching_start": "16:30",
    "school_coaching_end": "17:30",
    "grace_period_minutes": 15,
    "lock_after_minutes": 30,
    "auto_flag_teacher_absent": true
}'::jsonb, 'Attendance window time constraints and auto-absence settings'),

('fine_rules', '{
    "default_rate_per_day": 100.00,
    "time_late_black_mark": 1,
    "unauthorized_exit_fine": 500.00,
    "mobile_possession_fine": 1000.00,
    "property_damage_base_fine": 250.00,
    "currency_symbol": "₹"
}'::jsonb, 'Fine calculations and penalties configuration')
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Designated Super Admin Profile
INSERT INTO profiles (id, email, full_name, role, phone, status)
VALUES
('00000000-0000-0000-0000-000000000001', 'abdulhaseebkt2@gmail.com', 'Abdul Haseeb', 'super_admin', '+91 98765 00001', 'active')
ON CONFLICT (email) DO UPDATE SET role = 'super_admin', status = 'active';

-- 3. Hostels
INSERT INTO hostels (id, name, code, gender, building, address, warden_name, warden_phone, capacity, status)
VALUES
('11111111-1111-1111-1111-111111111111', 'Boys Hostel', 'BH-01', 'boys', 'Block A (Al-Farooq Block)', 'Thaiba Campus North', 'Usthad Abdullah K.', '+91 98765 43210', 120, 'active'),
('22222222-2222-2222-2222-222222222222', 'Girls Hostel', 'GH-01', 'girls', 'Block B (Khadija Block)', 'Thaiba Campus South', 'Usthaza Fatima M.', '+91 98765 43211', 80, 'active')
ON CONFLICT (code) DO NOTHING;

-- 4. Rooms (8 Beds per bedroom)
INSERT INTO rooms (id, hostel_id, floor, room_number, capacity, room_type, status)
VALUES
('33333333-1111-1111-1111-000000000101', '11111111-1111-1111-1111-111111111111', 'Ground Floor', '101', 8, '8-Bed Dormitory', 'active'),
('33333333-1111-1111-1111-000000000102', '11111111-1111-1111-1111-111111111111', 'Ground Floor', '102', 8, '8-Bed Dormitory', 'active'),
('33333333-1111-1111-1111-000000000103', '11111111-1111-1111-1111-111111111111', 'First Floor', '201', 8, '8-Bed Dormitory', 'active'),
('33333333-2222-2222-2222-000000000201', '22222222-2222-2222-2222-222222222222', 'Ground Floor', 'G-101', 8, 'Girls 8-Bed Dormitory', 'active'),
('33333333-2222-2222-2222-000000000202', '22222222-2222-2222-2222-222222222222', 'Ground Floor', 'G-102', 8, 'Girls 8-Bed Dormitory', 'active')
ON CONFLICT (hostel_id, room_number) DO NOTHING;

-- 5. Beds (8 Beds in each bedroom)
INSERT INTO beds (id, room_id, bed_number, status)
VALUES
-- Room 101 (Boys)
('44444444-1111-1111-1111-000000000101', '33333333-1111-1111-1111-000000000101', 'Bed 1', 'available'),
('44444444-1111-1111-1111-000000000102', '33333333-1111-1111-1111-000000000101', 'Bed 2', 'available'),
('44444444-1111-1111-1111-000000000103', '33333333-1111-1111-1111-000000000101', 'Bed 3', 'available'),
('44444444-1111-1111-1111-000000000104', '33333333-1111-1111-1111-000000000101', 'Bed 4', 'available'),
('44444444-1111-1111-1111-000000000105', '33333333-1111-1111-1111-000000000101', 'Bed 5', 'available'),
('44444444-1111-1111-1111-000000000106', '33333333-1111-1111-1111-000000000101', 'Bed 6', 'available'),
('44444444-1111-1111-1111-000000000107', '33333333-1111-1111-1111-000000000101', 'Bed 7', 'available'),
('44444444-1111-1111-1111-000000000108', '33333333-1111-1111-1111-000000000101', 'Bed 8', 'available'),
-- Room G-101 (Girls)
('44444444-2222-2222-2222-000000000201', '33333333-2222-2222-2222-000000000201', 'Bed G1', 'available'),
('44444444-2222-2222-2222-000000000202', '33333333-2222-2222-2222-000000000201', 'Bed G2', 'available'),
('44444444-2222-2222-2222-000000000203', '33333333-2222-2222-2222-000000000201', 'Bed G3', 'available'),
('44444444-2222-2222-2222-000000000204', '33333333-2222-2222-2222-000000000201', 'Bed G4', 'available'),
('44444444-2222-2222-2222-000000000205', '33333333-2222-2222-2222-000000000201', 'Bed G5', 'available'),
('44444444-2222-2222-2222-000000000206', '33333333-2222-2222-2222-000000000201', 'Bed G6', 'available'),
('44444444-2222-2222-2222-000000000207', '33333333-2222-2222-2222-000000000201', 'Bed G7', 'available'),
('44444444-2222-2222-2222-000000000208', '33333333-2222-2222-2222-000000000201', 'Bed G8', 'available')
ON CONFLICT (room_id, bed_number) DO NOTHING;

-- 6. Teachers
INSERT INTO teachers (id, employee_id, full_name, phone, email, gender, qualification, specialization, status)
VALUES
('55555555-1111-1111-1111-111111111111', 'TCH-001', 'Usthad Ibrahim Al-Qasimi', '+91 94471 11222', 'ibrahim@thaibapublicschool.com', 'male', 'MA Islamic Studies, B.Ed', 'Moral Education & Quran Recitation', 'active'),
('55555555-2222-2222-2222-222222222222', 'TCH-002', 'Usthad Zayd Rahman', '+91 94472 22333', 'zayd@thaibapublicschool.com', 'male', 'M.Sc Mathematics, B.Ed', 'Mathematics & Hostel Coaching', 'active'),
('55555555-3333-3333-3333-333333333333', 'TCH-003', 'Usthaza Maryam Siddiqa', '+91 94473 33444', 'maryam@thaibapublicschool.com', 'female', 'MA Arabic Literature, B.Ed', 'Girls Moral Education', 'active'),
('55555555-4444-4444-4444-444444444444', 'TCH-004', 'Mr. Vivek Nambiar', '+91 94474 44555', 'vivek@thaibapublicschool.com', 'male', 'M.Sc Physics, B.Ed', 'School Coaching (Science/Maths)', 'active'),
('55555555-5555-5555-5555-555555555555', 'TCH-005', 'Mrs. Anjali Kurian', '+91 94475 55666', 'anjali@thaibapublicschool.com', 'female', 'MA English, B.Ed', 'School Coaching (English/Grammar)', 'active')
ON CONFLICT (employee_id) DO NOTHING;

-- 7. Fine Categories
INSERT INTO fine_categories (id, category_name, code, default_amount_per_day, fixed_amount, default_black_marks, severity, description)
VALUES
('66666666-1111-1111-1111-111111111111', 'Late Hostel Return', 'FINE_LATE_RETURN', 100.00, 0.00, 1, 'moderate', 'Late return from approved hostel leave calculated per calendar day'),
('66666666-2222-2222-2222-222222222222', 'Unauthorized Hostel Exit', 'FINE_UNAUTHORIZED_EXIT', 0.00, 500.00, 3, 'major', 'Leaving campus perimeter without written warden leave slip'),
('66666666-3333-3333-3333-333333333333', 'Property & Furniture Damage', 'FINE_PROPERTY_DAMAGE', 0.00, 300.00, 2, 'major', 'Damage to windows, fans, doors, clocks or hostel furniture'),
('66666666-4444-4444-4444-444444444444', 'Prohibited Mobile Possession', 'FINE_MOBILE_PHONE', 0.00, 1000.00, 3, 'severe', 'Keeping unauthorized mobile phone in student dormitory'),
('66666666-5555-5555-5555-555555555555', 'Fighting & Misconduct', 'FINE_MISCONDUCT', 0.00, 500.00, 4, 'critical', 'Physical altercation, bullying or major disobedience')
ON CONFLICT (code) DO NOTHING;

-- 8. Class Groups
INSERT INTO class_groups (id, group_name, category, hostel_id, gender, teacher_id, room_name, start_time, end_time, days_of_week, status)
VALUES
('77777777-1111-1111-1111-111111111111', 'Boys Moral Group A (Junior)', 'moral_class', '11111111-1111-1111-1111-111111111111', 'boys', '55555555-1111-1111-1111-111111111111', 'Prayer Hall A', '18:00', '19:00', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]'::jsonb, 'active'),
('77777777-2222-2222-2222-222222222222', 'Boys Moral Group B (Senior)', 'moral_class', '11111111-1111-1111-1111-111111111111', 'boys', '55555555-2222-2222-2222-222222222222', 'Prayer Hall B', '18:00', '19:00', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]'::jsonb, 'active'),
('77777777-3333-3333-3333-333333333333', 'Girls Moral Class (Combined)', 'moral_class', '22222222-2222-2222-2222-222222222222', 'girls', '55555555-3333-3333-3333-333333333333', 'Girls Activity Hall', '18:00', '19:00', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]'::jsonb, 'active'),
('77777777-4444-4444-4444-444444444444', 'Boys Hostel Coaching Group 1', 'hostel_coaching', '11111111-1111-1111-1111-111111111111', 'boys', '55555555-2222-2222-2222-222222222222', 'Study Hall 1', '19:30', '21:00', '["Monday","Tuesday","Wednesday","Thursday","Friday"]'::jsonb, 'active'),
('77777777-5555-5555-5555-555555555555', 'School Coaching Group 1 (Science & Math)', 'school_coaching', NULL, 'all', '55555555-4444-4444-4444-444444444444', 'Smart Classroom 1', '16:30', '17:30', '["Monday","Wednesday","Friday"]'::jsonb, 'active'),
('77777777-6666-6666-6666-666666666666', 'School Coaching Group 2 (English & Languages)', 'school_coaching', NULL, 'all', '55555555-5555-5555-5555-555555555555', 'Smart Classroom 2', '16:30', '17:30', '["Tuesday","Thursday","Saturday"]'::jsonb, 'active')
ON CONFLICT DO NOTHING;

-- 9. Students
INSERT INTO students (
    id, admission_no, full_name, photo_url, gender, dob, admission_date, school_class, section,
    hostel_id, room_id, bed_id, status,
    village, post_office, district, state, pin_code,
    father_name, father_phone, father_whatsapp, father_occupation,
    mother_name, mother_phone, mother_whatsapp, mother_occupation,
    emergency_name, emergency_phone, emergency_relation,
    medical_notes, allergies, special_instructions,
    moral_group_id, hostel_coaching_id, school_coaching_id
)
VALUES
(
    '88888888-1111-1111-1111-111111111111', 'TPS2026056', 'Mohammed Rayan',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'male', '2012-05-15', '2026-06-01', 'Grade 8', 'A',
    '11111111-1111-1111-1111-111111111111', '33333333-1111-1111-1111-000000000101', '44444444-1111-1111-1111-000000000101', 'active',
    'Kottakkal', 'Kottakkal HO', 'Malappuram', 'Kerala', '676503',
    'Abdul Rasheed', '+91 98470 12345', '+91 98470 12345', 'Business Executive',
    'Sainaba Rasheed', '+91 98470 67890', '+91 98470 67890', 'Teacher',
    'Uncle Faisal', '+91 98471 99887', 'Maternal Uncle',
    'Mild asthma under control, uses inhaler when needed', 'Dust allergy', 'Ensure evening revision after Maghrib',
    '77777777-1111-1111-1111-111111111111', '77777777-4444-4444-4444-444444444444', '77777777-5555-5555-5555-555555555555'
),
(
    '88888888-2222-2222-2222-222222222222', 'TPS2026057', 'Ahmed Farhan',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'male', '2011-08-20', '2026-06-01', 'Grade 9', 'B',
    '11111111-1111-1111-1111-111111111111', '33333333-1111-1111-1111-000000000101', '44444444-1111-1111-1111-000000000102', 'active',
    'Manjeri', 'Manjeri PO', 'Malappuram', 'Kerala', '676121',
    'Moideenkutty K.', '+91 98472 23456', '+91 98472 23456', 'Pharmacist',
    'Fathima M.', '+91 98472 78901', '+91 98472 78901', 'Homemaker',
    'Moideenkutty K.', '+91 98472 23456', 'Father',
    'None', 'None', 'Monitor mobile phone usage strictly',
    '77777777-2222-2222-2222-222222222222', '77777777-4444-4444-4444-444444444444', '77777777-6666-6666-6666-666666666666'
),
(
    '88888888-3333-3333-3333-333333333333', 'TPS2026058', 'Amina Zahra',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'female', '2013-02-10', '2026-06-01', 'Grade 7', 'A',
    '22222222-2222-2222-2222-222222222222', '33333333-2222-2222-2222-000000000201', '44444444-2222-2222-2222-000000000201', 'active',
    'Tirur', 'Tirur Town', 'Malappuram', 'Kerala', '676101',
    'Sharafudheen T.', '+91 98473 34567', '+91 98473 34567', 'Civil Engineer',
    'Rukhiya S.', '+91 98473 89012', '+91 98473 89012', 'Bank Officer',
    'Sharafudheen T.', '+91 98473 34567', 'Father',
    'Wears spectacles for reading', 'Peanut allergy', 'Special encouragement in Mathematics coaching',
    '77777777-3333-3333-3333-333333333333', NULL, '77777777-5555-5555-5555-555555555555'
)
ON CONFLICT (admission_no) DO NOTHING;

-- 10. Sample Notices
INSERT INTO notices (title, content, published_date, expiry_date, audience, hostel_id, priority, author_name, is_pinned)
VALUES
('Hostel Re-opening & Weekend Leave Rules', 'All students returning from vacation must report to their respective wardens before 06:00 PM. Unexcused late returns will incur standard date-based late fines as per hostel guidelines.', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'all', NULL, 'high', 'Warden Office', true),
('Special School Coaching Schedule for Term Exams', 'School coaching for Grade 8, 9 & 10 will have revised timings starting Monday. Evening revision tests will be conducted in Smart Classroom 1.', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 'all', NULL, 'normal', 'Academic Coordinator', false)
ON CONFLICT DO NOTHING;
