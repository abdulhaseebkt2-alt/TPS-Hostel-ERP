/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Authentication Engine, Pending Registrations & Role-Based Security Gateway
 */

class AuthService {
  constructor() {
    this.currentUser = this.loadSavedSession();
  }

  loadSavedSession() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_USER);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[Auth] Error parsing saved session:', e);
    }
    return null;
  }

  saveSession(user) {
    this.currentUser = user;
    try {
      if (user) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_USER);
      }
    } catch (e) {
      console.warn('[Auth] Error saving session:', e);
    }
  }

  getPortalUrl(role) {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return 'index.html';
      case 'warden':
        return 'warden.html';
      case 'teacher':
      case 'mentor':
        return 'teacher.html';
      case 'parent':
      case 'student':
        return 'parent.html';
      default:
        return 'login.html';
    }
  }

  /**
   * Require Authentication & Authorize Portal Access
   * Automatically redirects to login or proper portal
   */
  requireAuth(allowedRoles = []) {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }

    if (user.status === 'pending_approval') {
      alert('Your registration is currently pending review by Super Admin (abdulhaseebkt2@gmail.com). You will gain access once approved.');
      this.logout();
      window.location.href = 'login.html';
      return null;
    }

    if (user.status === 'disabled') {
      alert('This user account has been deactivated. Please contact the hostel office.');
      this.logout();
      window.location.href = 'login.html';
      return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // User is logged in but trying to access an unauthorized portal window
      const properPortal = this.getPortalUrl(user.role);
      console.warn(`[Auth Guard] Unauthorized access for role "${user.role}". Redirecting to ${properPortal}`);
      window.location.href = properPortal;
      return null;
    }

    return user;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isSuperAdmin() {
    return this.currentUser && this.currentUser.role === 'super_admin';
  }

  isAdmin() {
    return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'super_admin');
  }

  isWarden() {
    return this.currentUser && (this.currentUser.role === 'warden' || this.isAdmin());
  }

  isTeacher() {
    return this.currentUser && (this.currentUser.role === 'teacher' || this.currentUser.role === 'mentor' || this.isAdmin());
  }

  isParent() {
    return this.currentUser && (this.currentUser.role === 'parent' || this.isAdmin());
  }

  /**
   * Universal Login (Handles Super Admin, Staff, Teachers, Parents by Phone or Email)
   */
  async login(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Please enter your email / mobile number and password.');
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Check Master Super Admin Hardcoded Credentials
    if (cleanId === CONFIG.SUPER_ADMIN_EMAIL.toLowerCase() && cleanPass === CONFIG.DEFAULT_SUPER_ADMIN_PASS) {
      const superAdminUser = {
        id: 'usr_super_admin',
        email: CONFIG.SUPER_ADMIN_EMAIL,
        full_name: 'Abdul Haseeb',
        role: 'super_admin',
        status: 'active',
        phone: '+91 98765 00001',
        avatar_url: CONFIG.DEFAULT_AVATAR,
        created_at: new Date().toISOString()
      };
      this.saveSession(superAdminUser);
      return superAdminUser;
    }

    // 2. Query Users from Database Layer
    const users = await window.db.getTable('users');

    // Find by email or by phone number
    const user = users.find(u => {
      const matchEmail = u.email && u.email.toLowerCase().trim() === cleanId;
      const cleanPhone = (u.phone || '').replace(/[^0-9]/g, '');
      const cleanInputDigits = cleanId.replace(/[^0-9]/g, '');
      const matchPhone = cleanInputDigits.length >= 10 && cleanPhone.endsWith(cleanInputDigits.slice(-10));
      return matchEmail || matchPhone;
    });

    if (!user) {
      throw new Error('No account found with this email or registered phone number. Please sign up or contact Super Admin.');
    }

    if (user.password_hash !== cleanPass && user.password !== cleanPass) {
      throw new Error('Incorrect password. Please verify your credentials.');
    }

    if (user.status === 'pending_approval') {
      throw new Error('Your registration is pending review by Super Admin (abdulhaseebkt2@gmail.com). You will be notified once assigned.');
    }

    if (user.status === 'disabled') {
      throw new Error('Your account has been deactivated. Please contact the administrator.');
    }

    this.saveSession(user);
    return user;
  }

  /**
   * Public Registration (Sign Up)
   * Places new registrations into 'pending_approval' queue
   */
  async signup(signupData) {
    const { full_name, email, phone, requested_role, password } = signupData;

    if (!full_name || !password) {
      throw new Error('Full Name and Password are required.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const cleanPhone = (phone || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail && !cleanPhone) {
      throw new Error('Please provide either an Email address or Mobile number.');
    }

    const users = await window.db.getTable('users');

    // Check duplicate email
    if (cleanEmail && users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`An account with email "${cleanEmail}" already exists. Please log in.`);
    }

    // Check duplicate phone for parents
    if (cleanPhone) {
      const inputDigits = cleanPhone.replace(/[^0-9]/g, '').slice(-10);
      if (inputDigits.length === 10 && users.some(u => (u.phone || '').replace(/[^0-9]/g, '').endsWith(inputDigits))) {
        throw new Error(`An account with mobile number "${cleanPhone}" is already registered.`);
      }
    }

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      full_name: full_name.trim(),
      email: cleanEmail || `${cleanPhone.replace(/[^0-9]/g, '')}@parent.tps`,
      phone: cleanPhone,
      role: 'pending',
      requested_role: requested_role || 'teacher',
      status: 'pending_approval',
      password_hash: password.trim(),
      avatar_url: CONFIG.DEFAULT_AVATAR,
      created_at: new Date().toISOString()
    };

    // If parent signup, auto-link candidate students by phone
    if (requested_role === 'parent' && cleanPhone) {
      const students = await window.db.getTable('students');
      const phoneDigits = cleanPhone.replace(/[^0-9]/g, '').slice(-10);
      const matched = students.filter(s => {
        const fPhone = (s.father_phone || '').replace(/[^0-9]/g, '');
        const mPhone = (s.mother_phone || '').replace(/[^0-9]/g, '');
        return fPhone.endsWith(phoneDigits) || mPhone.endsWith(phoneDigits);
      });
      if (matched.length > 0) {
        newUser.linked_student_ids = matched.map(s => s.id);
        newUser.linked_student_id = matched[0].id;
      }
    }

    await window.db.insertRecord('users', newUser);

    // Create Notification for Super Admin
    await window.db.insertRecord('notifications', {
      recipient_role: 'super_admin',
      title: 'New Account Registration Request',
      message: `${newUser.full_name} registered as ${newUser.requested_role.toUpperCase()}. Awaiting role approval.`,
      type: 'registration_request',
      related_id: newUser.id,
      is_read: false,
      created_at: new Date().toISOString()
    });

    return newUser;
  }

  /**
   * Super Admin approves pending applicant and designates exact institutional position
   */
  async approveUserAndAssignRole(userId, designatedRole, metadata = {}) {
    const users = await window.db.getTable('users');
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User record not found.');

    const updates = {
      role: designatedRole,
      status: 'active',
      linked_teacher_id: metadata.teacher_id || null,
      linked_student_id: metadata.student_id || null,
      linked_student_ids: metadata.student_ids || (metadata.student_id ? [metadata.student_id] : (user.linked_student_ids || [])),
      hostel_id: metadata.hostel_id || null,
      updated_at: new Date().toISOString()
    };

    // If assigned as teacher/warden and has teacher profile, link avatar
    if (metadata.teacher_id) {
      const teachers = await window.db.getTable('teachers');
      const t = teachers.find(item => item.id === metadata.teacher_id);
      if (t && t.avatar_url) {
        updates.avatar_url = t.avatar_url;
      }
    }

    await window.db.updateRecord('users', userId, updates);

    // If current session is this user, refresh session
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = { ...this.currentUser, ...updates };
      this.saveSession(this.currentUser);
    }

    return updates;
  }

  async activateUser(userId) {
    return await window.db.updateRecord('users', userId, { status: 'active' });
  }

  async disableUser(userId) {
    return await window.db.updateRecord('users', userId, { status: 'disabled' });
  }

  async removeUser(userId) {
    return await window.db.deleteRecord('users', userId);
  }

  async getAllUsers() {
    return await window.db.getTable('users');
  }

  async getPendingUsers() {
    const users = await this.getAllUsers();
    return users.filter(u => u.status === 'pending_approval' || u.role === 'pending');
  }

  logout() {
    this.saveSession(null);
    window.location.href = 'login.html';
  }
}

window.Auth = new AuthService();
