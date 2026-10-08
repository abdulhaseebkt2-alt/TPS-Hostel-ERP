/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Global Configuration & Roles Architecture
 */

const CONFIG = {
  APP_NAME: 'TPS Hostel IRP',
  FULL_NAME: 'Thaiba Public School – Hostel Integrated Resource & Management Platform',
  VERSION: '2.0.0',
  MOTTO: 'Modern Education with Morality',

  // Designated Super Admin Credentials (Default Master Account)
  SUPER_ADMIN_EMAIL: 'abdulhaseebkt2@gmail.com',
  DEFAULT_SUPER_ADMIN_PASS: '789321456Hkt.',

  // Supabase Backend Project URL & Configuration
  SUPABASE_URL: 'https://cnknmmysyifgplwxicmz.supabase.co',
  DEFAULT_SUPABASE_ANON_KEY: (typeof localStorage !== 'undefined' && localStorage.getItem('tps_supabase_anon_key')) || '',

  // Available System Roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    WARDEN: 'warden',
    TEACHER: 'teacher',
    MENTOR: 'mentor',
    PARENT: 'parent',
    STUDENT: 'student',
    PENDING: 'pending'
  },

  // Role Display Labels & Metadata
  ROLE_INFO: {
    super_admin: { label: 'Super Admin', portal: 'index.html', badge: 'badge-danger', desc: 'Full Institutional Authority' },
    admin: { label: 'Administrator', portal: 'index.html', badge: 'badge-primary', desc: 'Hostel Operations Manager' },
    warden: { label: 'Hostel Warden', portal: 'warden.html', badge: 'badge-warning', desc: 'Leave & Residence In-Charge' },
    teacher: { label: 'Teacher / Usthad', portal: 'teacher.html', badge: 'badge-secondary', desc: 'Moral & Coaching Faculty' },
    mentor: { label: 'Student Mentor', portal: 'teacher.html', badge: 'badge-info', desc: 'Guidance & Counselling' },
    parent: { label: 'Parent / Guardian', portal: 'parent.html', badge: 'badge-success', desc: 'Family Portal' },
    student: { label: 'Hostel Student', portal: 'parent.html', badge: 'badge-neutral', desc: 'Resident Student' }
  },

  // User Account Lifecycle Statuses
  USER_STATUSES: {
    ACTIVE: 'active',
    PENDING_APPROVAL: 'pending_approval',
    DISABLED: 'disabled'
  },

  // Default Vector Avatars
  DEFAULT_AVATAR: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Ccircle cx='50' cy='36' r='17' fill='%2364748b'/%3E%3Cpath d='M22 88 c0 -17 13 -26 28 -26 s28 9 28 26 Z' fill='%2364748b'/%3E%3C/svg%3E",
  DEFAULT_STUDENT_PHOTO: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e0f2fe'/%3E%3Ccircle cx='50' cy='36' r='17' fill='%230284c7'/%3E%3Cpath d='M22 88 c0 -17 13 -26 28 -26 s28 9 28 26 Z' fill='%230284c7'/%3E%3C/svg%3E",
  DEFAULT_BOY_PHOTO: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e0f2fe'/%3E%3Ccircle cx='50' cy='36' r='17' fill='%230284c7'/%3E%3Cpath d='M22 88 c0 -17 13 -26 28 -26 s28 9 28 26 Z' fill='%230284c7'/%3E%3C/svg%3E",
  DEFAULT_GIRL_PHOTO: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23fce7f3'/%3E%3Ccircle cx='50' cy='36' r='17' fill='%23db2777'/%3E%3Cpath d='M22 88 c0 -17 13 -26 28 -26 s28 9 28 26 Z' fill='%23db2777'/%3E%3C/svg%3E",
  DEFAULT_MALE_TEACHER: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23ecfdf5'/%3E%3Ccircle cx='50' cy='36' r='17' fill='%23059669'/%3E%3Cpath d='M22 88 c0 -17 13 -26 28 -26 s28 9 28 26 Z' fill='%23059669'/%3E%3C/svg%3E",
  DEFAULT_FEMALE_TEACHER: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f5f3ff'/%3E%3Ccircle cx='50' cy='36' r='17' fill='%237c3aed'/%3E%3Cpath d='M22 88 c0 -17 13 -26 28 -26 s28 9 28 26 Z' fill='%237c3aed'/%3E%3C/svg%3E",

  getStudentPhoto(student) {
    if (student && student.photo_url && student.photo_url.trim() && !student.photo_url.includes('unsplash.com')) {
      return student.photo_url;
    }
    const isGirl = student && (student.gender === 'female' || student.gender === 'girl' || student.gender === 'girls');
    return isGirl ? this.DEFAULT_GIRL_PHOTO : this.DEFAULT_BOY_PHOTO;
  },

  getStaffPhoto(staff) {
    if (staff && staff.avatar_url && staff.avatar_url.trim() && !staff.avatar_url.includes('unsplash.com')) {
      return staff.avatar_url;
    }
    const isFemale = staff && (staff.gender === 'female' || (staff.full_name && (staff.full_name.includes('Maryam') || staff.full_name.includes('Fatima') || staff.full_name.includes('Usthaza'))));
    return isFemale ? this.DEFAULT_FEMALE_TEACHER : this.DEFAULT_MALE_TEACHER;
  },

  // Institutional Branding
  DEFAULT_BRANDING: {
    appName: 'TPS HOSTEL',
    schoolName: 'THAIBAPUBLICSCHOOL',
    fullName: 'Thaiba Public School – Hostel Integrated Resource & Management Platform',
    motto: 'Modern Education with Morality',
    campusPhone: '+91 483 2750000',
    logoUrl: 'logo.svg'
  },

  getBranding() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        const saved = localStorage.getItem('tps_branding_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...this.DEFAULT_BRANDING, ...parsed };
        }
      }
    } catch (e) {}
    return { ...this.DEFAULT_BRANDING };
  },

  saveBranding(newBranding) {
    try {
      const merged = { ...this.getBranding(), ...newBranding };
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem('tps_branding_config', JSON.stringify(merged));
      }
      return merged;
    } catch (e) {
      return null;
    }
  },

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_USER: 'tps_auth_user_session',
    THEME: 'tps_theme',
    BRANDING: 'tps_branding_config',
    OFFLINE_DATA: 'tps_hostel_irp_offline_data_v2'
  },

  // Standard School Classes
  SCHOOL_CLASSES: [
    'LKG', 'UKG', 'STD-I', 'STD-II', 'STD-III', 'STD-IV', 'STD-V',
    'STD-VI', 'STD-VII', 'STD-VIII', 'STD-IX', 'STD-X', 'STD-XI', 'STD-XII'
  ],

  // Student Statuses
  STUDENT_STATUSES: [
    { value: 'Enrolled', label: 'Enrolled', color: 'success' },
    { value: 'Withdrawn', label: 'Withdrawn', color: 'neutral' },
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'temporarily_away', label: 'Temporarily Away (On Leave)', color: 'warning' },
    { value: 'long_leave', label: 'Long Leave', color: 'purple' },
    { value: 'medical_leave', label: 'Medical Leave', color: 'danger' },
    { value: 'vacation', label: 'Vacation', color: 'info' }
  ],

  // Fine Defaults
  FINES: {
    DEFAULT_RATE_PER_DAY: 100.00,
    CURRENCY_SYMBOL: '₹'
  }
};

window.CONFIG = CONFIG;
