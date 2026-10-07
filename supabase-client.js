/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Supabase Client & Resilient Data Layer
 */

class DataManager {
  constructor() {
    this.client = null;
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.useSupabase = false;
    this.memoryStore = this.getDefaultInitialStore();
    this.init();
  }

  init() {
    let anonKey = '';
    try {
      anonKey = (typeof localStorage !== 'undefined' && localStorage.getItem('tps_supabase_anon_key')) || (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_SUPABASE_ANON_KEY : '');
    } catch (e) {
      anonKey = typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_SUPABASE_ANON_KEY : '';
    }

    if (typeof window !== 'undefined' && window.supabase && anonKey && anonKey.trim().length > 20 && typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL) {
      try {
        this.client = window.supabase.createClient(CONFIG.SUPABASE_URL, anonKey);
        this.useSupabase = true;
        console.log('[TPS IRP] Connected to live Supabase backend:', CONFIG.SUPABASE_URL);
        
        // Auto-sync any unsynced local Base64 photos to Supabase Storage bucket in the background
        setTimeout(() => {
          this.syncAllPhotosToSupabaseStorage().catch(err => {
            console.warn('[Background Photo Sync]', err.message);
          });
        }, 3000);
      } catch (err) {
        console.warn('[TPS IRP] Failed to initialize Supabase client, using local cache engine:', err);
        this.useSupabase = false;
      }
    } else {
      this.useSupabase = false;
      this.initLocalStore();
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('online', () => { this.isOnline = true; });
      window.addEventListener('offline', () => { this.isOnline = false; });
    }
  }

  // Generate customizable beds per bedroom with zone / side tagging
  generate8BedsForRoom(roomId, prefix = 'Bed', leftCount = 4, windowCount = 4) {
    const beds = [];
    let idx = 1;
    for (let i = 1; i <= leftCount; i++) {
      beds.push({
        id: `b-${roomId}-${idx}`,
        room_id: roomId,
        bed_number: `${prefix} ${idx}`,
        side: 'Left Side',
        status: 'available',
        current_student_id: null
      });
      idx++;
    }
    for (let i = 1; i <= windowCount; i++) {
      beds.push({
        id: `b-${roomId}-${idx}`,
        room_id: roomId,
        bed_number: `${prefix} ${idx}`,
        side: 'Window Side',
        status: 'available',
        current_student_id: null
      });
      idx++;
    }
    return beds;
  }

  getDefaultInitialStore() {
    const rooms = [
      { id: 'r-101', hostel_id: 'bh-01', floor: 'Ground Floor', room_number: '101', capacity: 8, room_type: '8-Bed Dormitory', status: 'active' },
      { id: 'r-102', hostel_id: 'bh-01', floor: 'Ground Floor', room_number: '102', capacity: 8, room_type: '8-Bed Dormitory', status: 'active' },
      { id: 'r-201', hostel_id: 'bh-01', floor: 'First Floor', room_number: '201', capacity: 8, room_type: '8-Bed Dormitory', status: 'active' },
      { id: 'r-g101', hostel_id: 'gh-01', floor: 'Ground Floor', room_number: 'G-101', capacity: 8, room_type: 'Girls 8-Bed Dormitory', status: 'active' },
      { id: 'r-g102', hostel_id: 'gh-01', floor: 'Ground Floor', room_number: 'G-102', capacity: 8, room_type: 'Girls 8-Bed Dormitory', status: 'active' }
    ];

    const allBeds = [];
    rooms.forEach(r => {
      const isGirls = r.hostel_id === 'gh-01';
      allBeds.push(...this.generate8BedsForRoom(r.id, isGirls ? 'Bed G' : 'Bed', 4, 4));
    });

    const assignBed = (bedId, studentId) => {
      const b = allBeds.find(item => item.id === bedId);
      if (b) { b.status = 'occupied'; b.current_student_id = studentId; }
    };

    assignBed('b-r-101-1', 's-01');
    assignBed('b-r-101-2', 's-02');
    assignBed('b-r-101-3', 's-04');
    assignBed('b-r-102-1', 's-06');
    assignBed('b-r-102-2', 's-08');
    assignBed('b-r-102-3', 's-12');
    assignBed('b-r-201-1', 's-10');

    assignBed('b-r-g101-1', 's-03');
    assignBed('b-r-g101-2', 's-05');
    assignBed('b-r-g101-3', 's-09');
    assignBed('b-r-g102-1', 's-07');
    assignBed('b-r-g102-2', 's-11');

    return {
      users: [
        {
          id: 'usr_super_admin',
          email: 'abdulhaseebkt2@gmail.com',
          password_hash: 'admin123',
          full_name: 'Abdul Haseeb',
          role: typeof CONFIG !== 'undefined' ? CONFIG.ROLES.SUPER_ADMIN : 'super_admin',
          status: 'active',
          phone: '+91 98765 00001',
          avatar_url: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '',
          created_at: new Date().toISOString()
        },
        {
          id: 'usr_warden_01',
          email: 'warden.boys@thaibapublicschool.com',
          password_hash: 'warden123',
          full_name: 'Usthad Abdullah K.',
          role: typeof CONFIG !== 'undefined' ? CONFIG.ROLES.WARDEN : 'warden',
          hostel_id: 'bh-01',
          status: 'active',
          phone: '+91 98765 43210',
          avatar_url: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '',
          created_at: new Date().toISOString()
        },
        {
          id: 'usr_teacher_01',
          email: 'ibrahim@thaibapublicschool.com',
          password_hash: 'teacher123',
          full_name: 'Usthad Ibrahim Al-Qasimi',
          role: typeof CONFIG !== 'undefined' ? CONFIG.ROLES.TEACHER : 'teacher',
          linked_teacher_id: 't-01',
          status: 'active',
          phone: '+91 94471 11222',
          avatar_url: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '',
          created_at: new Date().toISOString()
        },
        {
          id: 'usr_student_01',
          email: 'rayan.student@thaibapublicschool.com',
          password_hash: 'student123',
          full_name: 'Mohammed Rayan',
          role: typeof CONFIG !== 'undefined' ? CONFIG.ROLES.STUDENT : 'student',
          linked_student_id: 's-01',
          status: 'active',
          phone: '+91 98470 12345',
          avatar_url: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '',
          created_at: new Date().toISOString()
        },
        {
          id: 'usr_parent_01',
          email: 'parent.rasheed@gmail.com',
          password_hash: 'parent123',
          full_name: 'Abdul Rasheed',
          role: typeof CONFIG !== 'undefined' ? CONFIG.ROLES.PARENT : 'parent',
          linked_student_id: 's-01',
          status: 'active',
          phone: '+91 98470 12345',
          avatar_url: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '',
          created_at: new Date().toISOString()
        },
        {
          id: 'usr_pending_01',
          email: 'newapplicant@gmail.com',
          password_hash: 'pass123',
          full_name: 'Salman Faris',
          role: typeof CONFIG !== 'undefined' ? CONFIG.ROLES.PENDING : 'pending',
          status: 'pending_approval',
          phone: '+91 98478 99887',
          avatar_url: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '',
          requested_role: 'teacher',
          created_at: new Date().toISOString()
        }
      ],
      hostels: [
        { id: 'bh-01', name: 'Boys Hostel', code: 'BH-01', gender: 'boys', building: 'Al-Farooq Block', capacity: 120, status: 'active', warden_name: 'Usthad Abdullah K.', warden_phone: '+91 98765 43210' },
        { id: 'gh-01', name: 'Girls Hostel', code: 'GH-01', gender: 'girls', building: 'Khadija Block', capacity: 80, status: 'active', warden_name: 'Usthaza Fatima M.', warden_phone: '+91 98765 43211' }
      ],
      rooms: rooms,
      beds: allBeds,
      teachers: [
        { id: 't-01', employee_id: 'TCH-001', full_name: 'Usthad Ibrahim Al-Qasimi', phone: '+91 94471 11222', email: 'ibrahim@thaibapublicschool.com', specialization: 'Moral Education & Quran Recitation', role: 'moral_teacher', roles: ['moral_teacher', 'mentor'], status: 'active', avatar_url: '', whatsapp: '+919447111222' },
        { id: 't-02', employee_id: 'TCH-002', full_name: 'Usthad Zayd Rahman', phone: '+91 94472 22333', email: 'zayd@thaibapublicschool.com', specialization: 'Mathematics & Hostel Coaching', role: 'coaching_tutor', roles: ['moral_teacher', 'coaching_tutor', 'mentor'], status: 'active', avatar_url: '', whatsapp: '+919447222333' },
        { id: 't-03', employee_id: 'TCH-003', full_name: 'Usthaza Maryam Siddiqa', phone: '+91 94473 33444', email: 'maryam@thaibapublicschool.com', specialization: 'Girls Moral Education & Mentoring', role: 'moral_teacher', roles: ['moral_teacher', 'mentor'], status: 'active', avatar_url: '', whatsapp: '+919447333444' },
        { id: 't-04', employee_id: 'TCH-004', full_name: 'Mr. Vivek Nambiar', phone: '+91 94474 44555', email: 'vivek@thaibapublicschool.com', specialization: 'School Coaching (Science/Maths)', role: 'coaching_tutor', roles: ['coaching_tutor', 'teacher'], status: 'active', avatar_url: '', whatsapp: '+919447444555' },
        { id: 't-05', employee_id: 'WRD-001', full_name: 'Usthad Abdullah K.', phone: '+91 98765 43210', email: 'warden.boys@thaibapublicschool.com', specialization: 'Boys Hostel Warden & Moral Mentor', role: 'warden', roles: ['warden', 'moral_teacher', 'mentor'], status: 'active', avatar_url: '', whatsapp: '+919876543210' },
        { id: 't-06', employee_id: 'WRD-002', full_name: 'Usthaza Fatima M.', phone: '+91 98765 43211', email: 'warden.girls@thaibapublicschool.com', specialization: 'Girls Hostel Warden & Student Counseling', role: 'warden', roles: ['warden', 'mentor'], status: 'active', avatar_url: '', whatsapp: '+919876543211' }
      ],
      class_groups: [
        { id: 'cg-01', group_name: 'Boys Moral Group A (Junior)', category: 'moral_section', hostel_id: 'bh-01', gender: 'boys', teacher_id: 't-01', room_name: 'Prayer Hall A', start_time: '18:00', end_time: '19:00', status: 'active', assigned_student_ids: ['s-01', 's-06', 's-08', 's-12'] },
        { id: 'cg-02', group_name: 'Boys Moral Group B (Senior)', category: 'moral_section', hostel_id: 'bh-01', gender: 'boys', teacher_id: 't-02', room_name: 'Prayer Hall B', start_time: '18:00', end_time: '19:00', status: 'active', assigned_student_ids: ['s-02', 's-04', 's-10'] },
        { id: 'cg-03', group_name: 'Girls Moral Class (Combined)', category: 'moral_section', hostel_id: 'gh-01', gender: 'girls', teacher_id: 't-03', room_name: 'Girls Activity Hall', start_time: '18:00', end_time: '19:00', status: 'active', assigned_student_ids: ['s-03', 's-05', 's-07', 's-09', 's-11'] },
        { id: 'cg-04', group_name: 'Boys Hostel Coaching Grp 1', category: 'coaching_section', hostel_id: 'bh-01', gender: 'boys', teacher_id: 't-02', room_name: 'Study Hall 1', start_time: '19:30', end_time: '21:00', status: 'active', assigned_student_ids: ['s-01', 's-02', 's-04', 's-06', 's-08', 's-10', 's-12'] },
        { id: 'cg-05', group_name: 'School Coaching Group 1 (Science/Math)', category: 'extra_section', hostel_id: null, gender: 'all', teacher_id: 't-04', room_name: 'Smart Classroom 1', start_time: '16:30', end_time: '17:30', status: 'active', assigned_student_ids: ['s-01', 's-02', 's-03', 's-04', 's-05', 's-07', 's-10'] }
      ],
      students: [
        {
          id: 's-01', admission_no: 'TPS2026056', full_name: 'Mohammed Rayan',
          photo_url: '',
          gender: 'male', dob: '2012-05-15', admission_date: '2026-06-01', school_class: 'STD-VIII', section: 'A',
          hostel_id: 'bh-01', room_id: 'r-101', bed_id: 'b-r-101-1', status: 'active',
          village: 'Kottakkal', post_office: 'Kottakkal HO', district: 'Malappuram', state: 'Kerala', pin_code: '676503',
          father_name: 'Abdul Rasheed', father_phone: '+91 98470 12345', father_whatsapp: '+91 98470 12345', father_occupation: 'Business Executive',
          mother_name: 'Sainaba Rasheed', mother_phone: '+91 98470 67890', mother_whatsapp: '+91 98470 67890', mother_occupation: 'Teacher',
          emergency_name: 'Uncle Faisal', emergency_phone: '+91 98471 99887', emergency_relation: 'Maternal Uncle',
          medical_notes: 'Mild asthma under control', allergies: 'Dust allergy', special_instructions: 'Ensure evening revision after Maghrib',
          moral_group_id: 'cg-01', hostel_coaching_id: 'cg-04', school_coaching_id: 'cg-05',
          created_at: new Date().toISOString()
        },
        {
          id: 's-02', admission_no: 'TPS2026057', full_name: 'Ahmed Farhan',
          photo_url: '',
          gender: 'male', dob: '2011-08-20', admission_date: '2026-06-01', school_class: 'STD-IX', section: 'B',
          hostel_id: 'bh-01', room_id: 'r-101', bed_id: 'b-r-101-2', status: 'active',
          village: 'Manjeri', post_office: 'Manjeri PO', district: 'Malappuram', state: 'Kerala', pin_code: '676121',
          father_name: 'Moideenkutty K.', father_phone: '+91 98472 23456', father_whatsapp: '+91 98472 23456', father_occupation: 'Pharmacist',
          mother_name: 'Fathima M.', mother_phone: '+91 98472 78901', mother_whatsapp: '+91 98472 78901', mother_occupation: 'Homemaker',
          emergency_name: 'Moideenkutty K.', emergency_phone: '+91 98472 23456', emergency_relation: 'Father',
          medical_notes: 'None', allergies: 'None', special_instructions: 'Monitor study timings',
          moral_group_id: 'cg-02', hostel_coaching_id: 'cg-04', school_coaching_id: 'cg-05',
          created_at: new Date().toISOString()
        },
        {
          id: 's-03', admission_no: 'TPS2026058', full_name: 'Amina Zahra',
          photo_url: '',
          gender: 'female', dob: '2013-02-10', admission_date: '2026-06-01', school_class: 'STD-VII', section: 'A',
          hostel_id: 'gh-01', room_id: 'r-g101', bed_id: 'b-r-g101-1', status: 'active',
          village: 'Tirur', post_office: 'Tirur Town', district: 'Malappuram', state: 'Kerala', pin_code: '676101',
          father_name: 'Sharafudheen T.', father_phone: '+91 98473 34567', father_whatsapp: '+91 98473 34567', father_occupation: 'Civil Engineer',
          mother_name: 'Rukhiya S.', mother_phone: '+91 98473 89012', mother_whatsapp: '+91 98473 89012', mother_occupation: 'Bank Officer',
          emergency_name: 'Sharafudheen T.', emergency_phone: '+91 98473 34567', emergency_relation: 'Father',
          medical_notes: 'Wears spectacles for reading', allergies: 'Peanuts', special_instructions: 'Math coaching support',
          moral_group_id: 'cg-03', hostel_coaching_id: null, school_coaching_id: 'cg-05',
          created_at: new Date().toISOString()
        },
        {
          id: 's-04', admission_no: 'TPS2026059', full_name: 'Bilal Hassan',
          photo_url: '',
          gender: 'male', dob: '2010-11-14', admission_date: '2026-06-01', school_class: 'STD-X', section: 'A',
          hostel_id: 'bh-01', room_id: 'r-101', bed_id: 'b-r-101-3', status: 'active',
          village: 'Perinthalmanna', post_office: 'Perinthalmanna', district: 'Malappuram', state: 'Kerala', pin_code: '679322',
          father_name: 'Hassan Kutty', father_phone: '+91 98474 45678', father_whatsapp: '+91 98474 45678', father_occupation: 'Contractor',
          mother_name: 'Jameela H.', mother_phone: '+91 98474 90123', mother_whatsapp: '+91 98474 90123', mother_occupation: 'Homemaker',
          emergency_name: 'Hassan Kutty', emergency_phone: '+91 98474 45678', emergency_relation: 'Father',
          medical_notes: 'None', allergies: 'None', special_instructions: 'Board Exam focus',
          moral_group_id: 'cg-02', hostel_coaching_id: 'cg-04', school_coaching_id: 'cg-05',
          created_at: new Date().toISOString()
        },
        {
          id: 's-05', admission_no: 'TPS2026060', full_name: 'Fathima Nida',
          photo_url: '',
          gender: 'female', dob: '2012-09-05', admission_date: '2026-06-01', school_class: 'STD-VIII', section: 'B',
          hostel_id: 'gh-01', room_id: 'r-g101', bed_id: 'b-r-g101-2', status: 'active',
          village: 'Kondotty', post_office: 'Kondotty PO', district: 'Malappuram', state: 'Kerala', pin_code: '673638',
          father_name: 'Najeeb K.P.', father_phone: '+91 98475 56789', father_whatsapp: '+91 98475 56789', father_occupation: 'Merchant',
          mother_name: 'Maimoona N.', mother_phone: '+91 98475 01234', mother_whatsapp: '+91 98475 01234', mother_occupation: 'Teacher',
          emergency_name: 'Najeeb K.P.', emergency_phone: '+91 98475 56789', emergency_relation: 'Father',
          medical_notes: 'None', allergies: 'None', special_instructions: 'Quran recitation guidance',
          moral_group_id: 'cg-03', hostel_coaching_id: null, school_coaching_id: 'cg-05',
          created_at: new Date().toISOString()
        },
        {
          id: 's-06', admission_no: 'TPS2026061', full_name: 'Zayd Mansoor',
          photo_url: '',
          gender: 'male', dob: '2014-04-12', admission_date: '2026-06-01', school_class: 'STD-VI', section: 'A',
          hostel_id: 'bh-01', room_id: 'r-102', bed_id: 'b-r-102-1', status: 'active',
          village: 'Nilambur', post_office: 'Nilambur RS', district: 'Malappuram', state: 'Kerala', pin_code: '679329',
          father_name: 'Mansoor Ali', father_phone: '+91 98476 67890', father_whatsapp: '+91 98476 67890', father_occupation: 'Accountant',
          mother_name: 'Yasmin M.', mother_phone: '+91 98476 12345', mother_whatsapp: '+91 98476 12345', mother_occupation: 'Homemaker',
          emergency_name: 'Mansoor Ali', emergency_phone: '+91 98476 67890', emergency_relation: 'Father',
          medical_notes: 'None', allergies: 'None', special_instructions: 'Junior care support',
          moral_group_id: 'cg-01', hostel_coaching_id: 'cg-04', school_coaching_id: null,
          created_at: new Date().toISOString()
        },
        {
          id: 's-07', admission_no: 'TPS2026062', full_name: 'Maryam Huda',
          photo_url: '',
          gender: 'female', dob: '2011-12-18', admission_date: '2026-06-01', school_class: 'STD-IX', section: 'A',
          hostel_id: 'gh-01', room_id: 'r-g102', bed_id: 'b-r-g102-1', status: 'active',
          village: 'Valanchery', post_office: 'Valanchery', district: 'Malappuram', state: 'Kerala', pin_code: '676552',
          father_name: 'Hameed C.', father_phone: '+91 98477 78901', father_whatsapp: '+91 98477 78901', father_occupation: 'School Principal',
          mother_name: 'Suhara H.', mother_phone: '+91 98477 23456', mother_whatsapp: '+91 98477 23456', mother_occupation: 'Professor',
          emergency_name: 'Hameed C.', emergency_phone: '+91 98477 78901', emergency_relation: 'Father',
          medical_notes: 'None', allergies: 'None', special_instructions: 'Science project encouragement',
          moral_group_id: 'cg-03', hostel_coaching_id: null, school_coaching_id: 'cg-05',
          created_at: new Date().toISOString()
        },
        {
          id: 's-08', admission_no: 'TPS2026063', full_name: 'Hamza Tariq',
          photo_url: '',
          gender: 'male', dob: '2013-07-22', admission_date: '2026-06-01', school_class: 'STD-VII', section: 'B',
          hostel_id: 'bh-01', room_id: 'r-102', bed_id: 'b-r-102-2', status: 'active',
          village: 'Edapal', post_office: 'Edapal Town', district: 'Malappuram', state: 'Kerala', pin_code: '679576',
          father_name: 'Tariq Anwar', father_phone: '+91 98478 89012', father_whatsapp: '+91 98478 89012', father_occupation: 'Architect',
          mother_name: 'Sumayya T.', mother_phone: '+91 98478 34567', mother_whatsapp: '+91 98478 34567', mother_occupation: 'Homemaker',
          emergency_name: 'Tariq Anwar', emergency_phone: '+91 98478 89012', emergency_relation: 'Father',
          medical_notes: 'None', allergies: 'None', special_instructions: 'Math coaching support',
          moral_group_id: 'cg-01', hostel_coaching_id: 'cg-04', school_coaching_id: null,
          created_at: new Date().toISOString()
        },
        {
          id: 's-09', admission_no: 'TPS2026064', full_name: 'Aisha Nour',
          photo_url: '',
          gender: 'female', dob: '2014-01-30', admission_date: '2026-06-01', school_class: 'STD-VI', section: 'B',
          hostel_id: 'gh-01', room_id: 'r-g101', bed_id: 'b-r-g101-3', status: 'active',
          village: 'Ponnani', post_office: 'Ponnani South', district: 'Malappuram', state: 'Kerala', pin_code: '679586',
          father_name: 'Nourudheen P.', father_phone: '+91 98479 90123', father_whatsapp: '+91 98479 90123', father_occupation: 'Software Dev',
          mother_name: 'Nasreen N.', mother_phone: '+91 98479 45678', mother_whatsapp: '+91 98479 45678', mother_occupation: 'Designer',
          emergency_name: 'Nourudheen P.', emergency_phone: '+91 98479 90123', emergency_relation: 'Father',
          medical_notes: 'None', allergies: 'None', special_instructions: 'Arabic reading practice',
          moral_group_id: 'cg-03', hostel_coaching_id: null, school_coaching_id: null,
          created_at: new Date().toISOString()
        },
        {
          id: 's-10', admission_no: 'TPS2026065', full_name: 'Salman Khalid',
          photo_url: '',
          gender: 'male', dob: '2009-08-11', admission_date: '2026-06-01', school_class: 'STD-XI', section: 'Science',
          hostel_id: 'bh-01', room_id: 'r-201', bed_id: 'b-r-201-1', status: 'active',
          village: 'Kozhikode', post_office: 'Feroke', district: 'Kozhikode', state: 'Kerala', pin_code: '673631',
          father_name: 'Khalid Rahman', father_phone: '+91 98480 01234', father_whatsapp: '+91 98480 01234', father_occupation: 'Manager',
          mother_name: 'Tahira K.', mother_phone: '+91 98480 56789', mother_whatsapp: '+91 98480 56789', mother_occupation: 'Homemaker',
          emergency_name: 'Khalid Rahman', emergency_phone: '+91 98480 01234', emergency_relation: 'Father',
          medical_notes: 'None', allergies: 'None', special_instructions: 'Physics & Chemistry coaching',
          moral_group_id: 'cg-02', hostel_coaching_id: 'cg-04', school_coaching_id: 'cg-05',
          created_at: new Date().toISOString()
        },
        {
          id: 's-11', admission_no: 'TPS2026066', full_name: 'Zainab Rafeeq',
          photo_url: '',
          gender: 'female', dob: '2010-06-25', admission_date: '2026-06-01', school_class: 'STD-X', section: 'B',
          hostel_id: 'gh-01', room_id: 'r-g102', bed_id: 'b-r-g102-2', status: 'active',
          village: 'Wandoor', post_office: 'Wandoor PO', district: 'Malappuram', state: 'Kerala', pin_code: '679328',
          father_name: 'Rafeeq Ahmed', father_phone: '+91 98481 12345', father_whatsapp: '+91 98481 12345', father_occupation: 'Trader',
          mother_name: 'Shefeeka R.', mother_phone: '+91 98481 67890', mother_whatsapp: '+91 98481 67890', mother_occupation: 'Homemaker',
          emergency_name: 'Rafeeq Ahmed', emergency_phone: '+91 98481 12345', emergency_relation: 'Father',
          medical_notes: 'None', allergies: 'None', special_instructions: 'Board Exam Preparation',
          moral_group_id: 'cg-03', hostel_coaching_id: null, school_coaching_id: null,
          created_at: new Date().toISOString()
        },
        {
          id: 's-12', admission_no: 'TPS2026067', full_name: 'Adil Rasheed',
          photo_url: '',
          gender: 'male', dob: '2012-03-14', admission_date: '2026-06-01', school_class: 'STD-VIII', section: 'A',
          hostel_id: 'bh-01', room_id: 'r-102', bed_id: 'b-r-102-3', status: 'active',
          village: 'Malappuram', post_office: 'Civil Station PO', district: 'Malappuram', state: 'Kerala', pin_code: '676505',
          father_name: 'Rasheed Ali K.', father_phone: '+91 98482 23456', father_whatsapp: '+91 98482 23456', father_occupation: 'Govt Service',
          mother_name: 'Farida R.', mother_phone: '+91 98482 78901', mother_whatsapp: '+91 98482 78901', mother_occupation: 'Teacher',
          emergency_name: 'Rasheed Ali K.', emergency_phone: '+91 98482 23456', emergency_relation: 'Father',
          medical_notes: 'None', allergies: 'None', special_instructions: 'Active sports revision',
          moral_group_id: 'cg-01', hostel_coaching_id: 'cg-04', school_coaching_id: null,
          created_at: new Date().toISOString()
        }
      ],
      attendance_sessions: [],
      student_attendance: [],
      teacher_attendance: [],
      leave_records: [
        {
          id: 'lv-01', leave_code: 'LV-2026-001', leave_type: 'hostel_leave', reason: 'Weekend Family Visit',
          leaving_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], leaving_time: '16:00',
          expected_return_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], expected_return_time: '17:00',
          status: 'overdue', is_batch: false, approved_by: 'Usthad Abdullah (Warden)', total_students: 1
        }
      ],
      leave_students: [
        { id: 'lvs-01', leave_id: 'lv-01', student_id: 's-02', is_returned: false, late_days: 1, fine_amount: 100.00, black_marks: 1 }
      ],
      hostel_entries: [
        { id: 'he-01', student_id: 's-02', hostel_id: 'bh-01', entry_type: 'exit', exit_date: new Date().toISOString().split('T')[0], exit_time: '16:00', return_date: null, return_time: null, purpose: 'Weekend Vacation', permission_by: 'Warden Office', status: 'outside' }
      ],
      fines: [
        { id: 'fn-01', fine_no: 'FN-2026-001', student_id: 's-02', category_name: 'Late Hostel Return', amount: 100.00, late_days: 1, black_marks: 1, reason: '1 day late return from weekend leave', issued_by: 'Warden Office', issue_date: new Date().toISOString().split('T')[0], status: 'pending' }
      ],
      discipline_incidents: [
        { id: 'dc-01', incident_no: 'INC-2026-001', student_id: 's-02', hostel_id: 'bh-01', incident_date: new Date().toISOString().split('T')[0], incident_time: '21:30', category: 'Prohibited Mobile Possession', description: 'Found using mobile device after night lights out in Room 101', severity: 'moderate', black_marks: 1, fine_amount: 0.00, reported_by: 'Usthad Abdullah', action_taken: 'Warning issued & confiscated for 1 week', parent_informed: true, status: 'resolved' }
      ],
      black_marks: [
        { id: 'bm-01', student_id: 's-02', marks_count: 1, reason: 'Late night mobile usage', issued_date: new Date().toISOString().split('T')[0], issued_by: 'Usthad Abdullah' }
      ],
      notices: [
        { id: 'nt-01', title: 'Hostel Re-opening & Weekend Leave Rules', content: 'All students returning from vacation must report to their respective wardens before 06:00 PM. Unexcused late returns will incur standard date-based late fines.', published_date: new Date().toISOString().split('T')[0], audience: 'all', priority: 'high', author_name: 'Warden Office', is_pinned: true },
        { id: 'nt-02', title: 'Special School Coaching Schedule for Term Exams', content: 'School coaching for Grade 8, 9 & 10 will have revision tests conducted in Smart Classroom 1.', published_date: new Date().toISOString().split('T')[0], audience: 'all', priority: 'normal', author_name: 'Academic Coordinator', is_pinned: false }
      ],
      notifications: [
        { id: 'n-01', title: 'Late Return Flagged', message: 'Ahmed Farhan (TPS-2026-0102) is overdue for return by 1 day.', type: 'leave', is_read: false, created_at: new Date().toISOString() },
        { id: 'n-02', title: 'Timetable Updated', message: 'Boys Moral Group A schedule confirmed for 06:00 PM.', type: 'attendance', is_read: false, created_at: new Date().toISOString() }
      ],
      timetables: this.generateDefaultTimetables(),
      audit_logs: [
        { id: 'aud-01', user_email: 'abdulhaseebkt2@gmail.com', user_role: 'super_admin', action: 'INIT_SYSTEM', module: 'system', details: { msg: 'TPS Hostel IRP system initialized with Super Admin Abdul Haseeb and 8-bed bedrooms' }, created_at: new Date().toISOString() }
      ]
    };
  }

  initLocalStore() {
    try {
      const storageKey = (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS && CONFIG.STORAGE_KEYS.OFFLINE_DATA) || 'tps_hostel_irp_offline_data';
      const existingRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;
      let loadedStore = null;

      if (existingRaw) {
        try {
          loadedStore = JSON.parse(existingRaw);
        } catch (e) {
          loadedStore = null;
        }
      }

      if (loadedStore && typeof loadedStore === 'object') {
        // Merge with memoryStore defaults to ensure all keys exist
        Object.keys(this.memoryStore).forEach(key => {
          if (Array.isArray(this.memoryStore[key])) {
            if (Array.isArray(loadedStore[key])) {
              this.memoryStore[key] = loadedStore[key];
            }
          } else if (loadedStore[key] !== undefined) {
            this.memoryStore[key] = loadedStore[key];
          }
        });

        // Ensure timetables exist if empty
        if (!this.memoryStore.timetables || this.memoryStore.timetables.length === 0) {
          this.memoryStore.timetables = this.generateDefaultTimetables();
        }

        // Ensure category / section normalization
        if (this.memoryStore.class_groups) {
          this.memoryStore.class_groups.forEach(g => {
            if (g.category === 'moral_class') g.category = 'moral_section';
            else if (g.category === 'hostel_coaching') g.category = 'coaching_section';
            else if (g.category === 'school_coaching') g.category = 'extra_section';
          });
        }

        // Sync beds and save merged state safely
        this.saveLocalStore(this.memoryStore);
      } else {
        // Save initial seed to localStorage safely
        this.saveLocalStore(this.memoryStore);
      }
    } catch (err) {
      console.warn('[TPS DataManager] Error initializing local store cache, using memory store:', err);
    }
  }

  resetToFullSampleData() {
    this.memoryStore = this.getDefaultInitialStore();
    try {
      const storageKey = (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS && CONFIG.STORAGE_KEYS.OFFLINE_DATA) || 'tps_hostel_irp_offline_data';
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(storageKey);
        localStorage.removeItem('tps_deleted_sections');
        localStorage.removeItem('tps_custom_sections');
      }
      this.saveLocalStore(this.memoryStore);
    } catch (e) {
      console.warn('[TPS DataManager] Reset sample data error:', e);
    }
    return this.memoryStore;
  }

  generateDefaultTimetables() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const entries = [];

    // Moral Section: Boys Moral Group A (cg-01) - Junior
    const moralA_MonThu = [
      { num: 1, name: 'Period 1', start: '18:00', end: '18:45', subject: 'Quran Recitation & Tajweed', teacher_id: 't-01', teacher_name: 'Usthad Ibrahim Al-Qasimi', room: 'Prayer Hall A', notes: 'Surah An-Naba & Makharij rules' },
      { num: 2, name: 'Period 2', start: '18:45', end: '19:30', subject: 'Islamic Manners & Daily Akhlaq', teacher_id: 't-01', teacher_name: 'Usthad Ibrahim Al-Qasimi', room: 'Prayer Hall A', notes: 'Sunnah practices & Masnoon Duas' }
    ];
    const moralA_FriSun = [
      { num: 1, name: 'Period 1', start: '18:00', end: '19:00', subject: 'Fiqh Basics & Weekly Quran Assessment', teacher_id: 't-01', teacher_name: 'Usthad Ibrahim Al-Qasimi', room: 'Prayer Hall A', notes: 'Weekly recitation evaluation' }
    ];

    days.forEach(day => {
      const schedule = (day === 'Friday' || day === 'Sunday') ? moralA_FriSun : moralA_MonThu;
      schedule.forEach((slot, sIdx) => {
        entries.push({
          id: `tt-cg01-${day.toLowerCase()}-${slot.num}`,
          group_id: 'cg-01',
          day: day,
          period_number: slot.num,
          period_name: slot.name,
          start_time: slot.start,
          end_time: slot.end,
          subject: slot.subject,
          teacher_id: slot.teacher_id,
          teacher_name: slot.teacher_name,
          room_location: slot.room,
          notes: slot.notes || '',
          is_active: true,
          order_index: sIdx + 1
        });
      });
    });

    // Moral Section: Boys Moral Group B (cg-02) - Senior
    days.forEach(day => {
      entries.push({
        id: `tt-cg02-${day.toLowerCase()}-1`,
        group_id: 'cg-02',
        day: day,
        period_number: 1,
        period_name: 'Period 1',
        start_time: '18:00',
        end_time: '18:45',
        subject: 'Quran Hifz & Advanced Tajweed',
        teacher_id: 't-02',
        teacher_name: 'Usthad Zayd Rahman',
        room_location: 'Prayer Hall B',
        notes: 'Surah Al-Baqarah revision',
        is_active: true,
        order_index: 1
      });
      entries.push({
        id: `tt-cg02-${day.toLowerCase()}-2`,
        group_id: 'cg-02',
        day: day,
        period_number: 2,
        period_name: 'Period 2',
        start_time: '18:45',
        end_time: '19:30',
        subject: 'Hadith Studies & Islamic Jurisprudence',
        teacher_id: 't-02',
        teacher_name: 'Usthad Zayd Rahman',
        room_location: 'Prayer Hall B',
        notes: 'Arba\'in An-Nawawi study',
        is_active: true,
        order_index: 2
      });
    });

    // Moral Section: Girls Moral Class (cg-03)
    days.forEach(day => {
      entries.push({
        id: `tt-cg03-${day.toLowerCase()}-1`,
        group_id: 'cg-03',
        day: day,
        period_number: 1,
        period_name: 'Period 1',
        start_time: '18:00',
        end_time: '19:00',
        subject: 'Tajweed, Quran Recitation & Seerah',
        teacher_id: 't-03',
        teacher_name: 'Usthaza Maryam Siddiqa',
        room_location: 'Girls Activity Hall',
        notes: 'Daily recitation with tajweed check',
        is_active: true,
        order_index: 1
      });
    });

    // Coaching Section: Boys Hostel Coaching (cg-04)
    days.forEach(day => {
      entries.push({
        id: `tt-cg04-${day.toLowerCase()}-1`,
        group_id: 'cg-04',
        day: day,
        period_number: 1,
        period_name: 'Session 1',
        start_time: '19:30',
        end_time: '20:15',
        subject: 'Mathematics Coaching & Problem Solving',
        teacher_id: 't-02',
        teacher_name: 'Usthad Zayd Rahman',
        room_location: 'Study Hall 1',
        notes: 'State syllabus problem drills',
        is_active: true,
        order_index: 1
      });
      entries.push({
        id: `tt-cg04-${day.toLowerCase()}-2`,
        group_id: 'cg-04',
        day: day,
        period_number: 2,
        period_name: 'Session 2',
        start_time: '20:15',
        end_time: '21:00',
        subject: 'Science & Physics Tutorial',
        teacher_id: 't-02',
        teacher_name: 'Usthad Zayd Rahman',
        room_location: 'Study Hall 1',
        notes: 'Daily homework check & lab questions',
        is_active: true,
        order_index: 2
      });
    });

    // Extra Section: School & STEM Coaching (cg-05)
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
      entries.push({
        id: `tt-cg05-${day.toLowerCase()}-1`,
        group_id: 'cg-05',
        day: day,
        period_number: 1,
        period_name: 'Period 1',
        start_time: '16:30',
        end_time: '17:15',
        subject: 'STEM Coaching (Physics & Maths)',
        teacher_id: 't-04',
        teacher_name: 'Mr. Vivek Nambiar',
        room_location: 'Smart Classroom 1',
        notes: 'Concept building & numerical problems',
        is_active: true,
        order_index: 1
      });
      entries.push({
        id: `tt-cg05-${day.toLowerCase()}-2`,
        group_id: 'cg-05',
        day: day,
        period_number: 2,
        period_name: 'Period 2',
        start_time: '17:15',
        end_time: '18:00',
        subject: 'English Communication & Grammar',
        teacher_id: 't-04',
        teacher_name: 'Mr. Vivek Nambiar',
        room_location: 'Smart Classroom 1',
        notes: 'Spoken English & Writing practice',
        is_active: true,
        order_index: 2
      });
    });

    return entries;
  }

  getLocalStore() {
    if (!this.memoryStore) {
      this.memoryStore = this.getDefaultInitialStore();
    }
    return this.memoryStore;
  }

  saveLocalStore(store) {
    if (store && typeof store === 'object') {
      this.memoryStore = store;
    }
    try {
      if (typeof localStorage !== 'undefined' && typeof CONFIG !== 'undefined') {
        const key = CONFIG.STORAGE_KEYS.OFFLINE_DATA || 'tps_hostel_irp_offline_data';
        localStorage.setItem(key, JSON.stringify(this.memoryStore));
      }
    } catch (err) {
      console.warn('[Storage Quota Exceeded] Pruning non-essential data and retrying cache save...', err);
      try {
        if (this.memoryStore.audit_logs && this.memoryStore.audit_logs.length > 20) {
          this.memoryStore.audit_logs = this.memoryStore.audit_logs.slice(0, 20);
        }
        if (this.memoryStore.notifications && this.memoryStore.notifications.length > 15) {
          this.memoryStore.notifications = this.memoryStore.notifications.slice(0, 15);
        }
        if (typeof localStorage !== 'undefined' && typeof CONFIG !== 'undefined') {
          const key = CONFIG.STORAGE_KEYS.OFFLINE_DATA || 'tps_hostel_irp_offline_data';
          localStorage.setItem(key, JSON.stringify(this.memoryStore));
        }
      } catch (retryErr) {
        console.warn('[Storage Quota Notice] In-memory persistence active; localStorage cache full or disabled.', retryErr);
      }
    }
  }

  // Convert Data URL (Base64) to Blob for binary upload to Supabase Storage
  dataUrlToBlob(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
    try {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.warn('[DataUrlToBlob Conversion Failed]', e);
      return null;
    }
  }

  // Upload Photo or Base64 Data URL to Supabase Storage Bucket ('photos' or 'hostel-documents')
  async uploadPhoto(fileOrDataUrl, folder = 'students', customName = null) {
    if (!fileOrDataUrl) return null;

    // If it's already an HTTP / Supabase public URL or SVG data, return as-is
    if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
      return fileOrDataUrl;
    }

    if (!this.useSupabase || !this.client) {
      return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : null;
    }

    try {
      let blob = null;
      let extension = 'jpg';
      let contentType = 'image/jpeg';

      if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
        blob = this.dataUrlToBlob(fileOrDataUrl);
        if (blob) {
          contentType = blob.type;
          extension = blob.type.split('/')[1] || 'jpg';
          if (extension === 'jpeg') extension = 'jpg';
          if (extension.includes('+')) extension = extension.split('+')[0];
        }
      } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
        blob = fileOrDataUrl;
        contentType = blob.type || 'image/jpeg';
        extension = contentType.split('/')[1] || 'jpg';
      }

      if (!blob) return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : null;

      const safeFolder = folder || 'general';
      const safeCustom = customName ? String(customName).replace(/[^a-zA-Z0-9_-]/g, '_') : null;
      const fileName = safeCustom ? `${safeCustom}_${Date.now()}.${extension}` : `${safeFolder}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${extension}`;
      const filePath = `${safeFolder}/${fileName}`;

      // Try 'photos' bucket first
      let uploadRes = await this.client.storage
        .from('photos')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: contentType
        });

      let targetBucket = 'photos';

      if (uploadRes.error) {
        console.warn(`[Supabase Storage] photos bucket failed (${uploadRes.error.message}), trying hostel-documents bucket...`);
        uploadRes = await this.client.storage
          .from('hostel-documents')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: contentType
          });
        targetBucket = 'hostel-documents';
      }

      if (uploadRes.error) {
        console.warn('[Supabase Storage Upload Failed]', uploadRes.error.message);
        return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : null;
      }

      const { data: publicUrlData } = this.client.storage.from(targetBucket).getPublicUrl(filePath);
      if (publicUrlData && publicUrlData.publicUrl) {
        console.log(`[Supabase Storage] Successfully uploaded to ${targetBucket}/${filePath} ->`, publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      }
    } catch (err) {
      console.warn('[Supabase Storage Upload Exception]', err);
    }

    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : null;
  }

  // Scan and synchronize all local/base64 student & teacher photos to Supabase Storage Bucket
  async syncAllPhotosToSupabaseStorage() {
    if (!this.useSupabase || !this.client) {
      console.log('[Photo Sync] Supabase not connected. Skipping bucket upload.');
      return { syncedCount: 0, skippedCount: 0 };
    }

    let syncedCount = 0;
    let skippedCount = 0;

    try {
      // 1. Sync Student Photos
      const students = await this.getTable('students');
      for (const s of students) {
        if (s.photo_url && typeof s.photo_url === 'string' && s.photo_url.startsWith('data:image/')) {
          console.log(`[Photo Sync] Uploading photo for student ${s.full_name} (${s.admission_no || s.id})...`);
          const publicUrl = await this.uploadPhoto(s.photo_url, 'students', s.admission_no || s.id);
          if (publicUrl && publicUrl.startsWith('http')) {
            await this.updateRecord('students', s.id, { photo_url: publicUrl });
            syncedCount++;
          }
        } else {
          skippedCount++;
        }
      }

      // 2. Sync Teacher / Staff Photos
      const teachers = await this.getTable('teachers');
      for (const t of teachers) {
        const photo = t.avatar_url || t.photo_url;
        if (photo && typeof photo === 'string' && photo.startsWith('data:image/')) {
          console.log(`[Photo Sync] Uploading avatar for teacher ${t.full_name} (${t.employee_id || t.id})...`);
          const publicUrl = await this.uploadPhoto(photo, 'teachers', t.employee_id || t.id);
          if (publicUrl && publicUrl.startsWith('http')) {
            await this.updateRecord('teachers', t.id, { avatar_url: publicUrl, photo_url: publicUrl });
            syncedCount++;
          }
        } else {
          skippedCount++;
        }
      }

      // 3. Sync Profile Avatars
      const profiles = await this.getTable('profiles');
      for (const p of profiles) {
        if (p.avatar_url && typeof p.avatar_url === 'string' && p.avatar_url.startsWith('data:image/')) {
          const publicUrl = await this.uploadPhoto(p.avatar_url, 'profiles', p.id);
          if (publicUrl && publicUrl.startsWith('http')) {
            await this.updateRecord('profiles', p.id, { avatar_url: publicUrl, photo_url: publicUrl });
            syncedCount++;
          }
        }
      }

      console.log(`[Photo Sync Finished] Uploaded ${syncedCount} photos to Supabase Storage.`);
    } catch (err) {
      console.warn('[Photo Sync Error]', err);
    }

    return { syncedCount, skippedCount };
  }

  // Generic Query Method
  async getTable(tableName) {
    if (this.useSupabase && this.client) {
      try {
        const { data, error } = await this.client.from(tableName).select('*');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn(`[Supabase Error on ${tableName}] Falling back to local cache:`, err.message);
      }
    }
    const store = this.getLocalStore();
    return store[tableName] || [];
  }

  async insertRecord(tableName, record) {
    if (!record.id) {
      record.id = 'rec_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    if (!record.created_at) {
      record.created_at = new Date().toISOString();
    }

    // Auto-upload Base64 images to Supabase Storage bucket before database insertion
    if (this.useSupabase && this.client) {
      try {
        if (record.photo_url && typeof record.photo_url === 'string' && record.photo_url.startsWith('data:image/')) {
          const folder = tableName === 'students' ? 'students' : (tableName === 'teachers' ? 'teachers' : 'photos');
          const uploadedUrl = await this.uploadPhoto(record.photo_url, folder, record.admission_no || record.employee_id || record.id);
          if (uploadedUrl) record.photo_url = uploadedUrl;
        }
        if (record.avatar_url && typeof record.avatar_url === 'string' && record.avatar_url.startsWith('data:image/')) {
          const folder = tableName === 'teachers' ? 'teachers' : (tableName === 'profiles' ? 'profiles' : 'avatars');
          const uploadedUrl = await this.uploadPhoto(record.avatar_url, folder, record.employee_id || record.id);
          if (uploadedUrl) record.avatar_url = uploadedUrl;
        }
      } catch (uploadErr) {
        console.warn(`[Photo Upload on Insert ${tableName}]`, uploadErr);
      }
    }

    if (this.useSupabase && this.client) {
      try {
        const { data, error } = await this.client.from(tableName).insert([record]).select();
        if (error) throw error;
        return data ? data[0] : record;
      } catch (err) {
        console.warn(`[Supabase Insert Error on ${tableName}]`, err.message);
      }
    }

    const store = this.getLocalStore();
    if (!store[tableName]) store[tableName] = [];
    store[tableName].push(record);
    this.saveLocalStore(store);

    // Audit log
    this.logAudit('INSERT', tableName, record.id, record);
    return record;
  }

  async updateRecord(tableName, id, updates) {
    updates.updated_at = new Date().toISOString();

    // Auto-upload Base64 images to Supabase Storage bucket before database update
    if (this.useSupabase && this.client) {
      try {
        if (updates.photo_url && typeof updates.photo_url === 'string' && updates.photo_url.startsWith('data:image/')) {
          const folder = tableName === 'students' ? 'students' : (tableName === 'teachers' ? 'teachers' : 'photos');
          const uploadedUrl = await this.uploadPhoto(updates.photo_url, folder, updates.admission_no || id);
          if (uploadedUrl) updates.photo_url = uploadedUrl;
        }
        if (updates.avatar_url && typeof updates.avatar_url === 'string' && updates.avatar_url.startsWith('data:image/')) {
          const folder = tableName === 'teachers' ? 'teachers' : (tableName === 'profiles' ? 'profiles' : 'avatars');
          const uploadedUrl = await this.uploadPhoto(updates.avatar_url, folder, updates.employee_id || id);
          if (uploadedUrl) updates.avatar_url = uploadedUrl;
        }
      } catch (uploadErr) {
        console.warn(`[Photo Upload on Update ${tableName}]`, uploadErr);
      }
    }

    if (this.useSupabase && this.client) {
      try {
        const { data, error } = await this.client.from(tableName).update(updates).eq('id', id).select();
        if (error) throw error;
        return data ? data[0] : { id, ...updates };
      } catch (err) {
        console.warn(`[Supabase Update Error on ${tableName}]`, err.message);
      }
    }

    const store = this.getLocalStore();
    if (store[tableName]) {
      const idx = store[tableName].findIndex(item => item.id === id);
      if (idx !== -1) {
        store[tableName][idx] = { ...store[tableName][idx], ...updates };
        this.saveLocalStore(store);
      }
    }

    this.logAudit('UPDATE', tableName, id, updates);
    return { id, ...updates };
  }

  async deleteRecord(tableName, id) {
    if (this.useSupabase && this.client) {
      try {
        const { error } = await this.client.from(tableName).delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn(`[Supabase Delete Error on ${tableName}]`, err.message);
      }
    }

    const store = this.getLocalStore();
    if (store[tableName]) {
      store[tableName] = store[tableName].filter(item => item.id !== id);
      this.saveLocalStore(store);
    }

    this.logAudit('DELETE', tableName, id, { id });
    return true;
  }

  // Convenient aliases
  async insert(tableName, record) {
    return await this.insertRecord(tableName, record);
  }

  async update(tableName, id, updates) {
    return await this.updateRecord(tableName, id, updates);
  }

  async delete(tableName, id) {
    return await this.deleteRecord(tableName, id);
  }

  logAudit(action, moduleName, recordId, details) {
    const user = window.Auth ? window.Auth.currentUser : null;
    const auditRecord = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      user_email: user ? user.email : 'system@thaibapublicschool.com',
      user_role: user ? user.role : 'system',
      action: action,
      module: moduleName,
      record_id: String(recordId),
      details: details,
      created_at: new Date().toISOString()
    };

    const store = this.getLocalStore();
    if (!store.audit_logs) store.audit_logs = [];
    store.audit_logs.unshift(auditRecord);
    this.saveLocalStore(store);
  }
}

window.db = new DataManager();
