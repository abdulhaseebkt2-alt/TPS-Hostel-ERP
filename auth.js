/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Authentication, Sign-Up, Password Recovery & RBAC Engine
 * Designated Super Admin: abdulhaseebkt2@gmail.com
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    const savedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_USER);
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        if (this.currentUser && this.currentUser.full_name) {
          this.currentUser.full_name = this.currentUser.full_name.replace(/\s*\((?:Super\s*Admin|Admin|Warden|Teacher|Student|Parent)\)/gi, '').trim();
        }
      } catch (e) {
        this.setDefaultSuperAdmin();
      }
    } else {
      this.setDefaultSuperAdmin();
    }
  }

  setDefaultSuperAdmin() {
    this.currentUser = {
      id: 'usr_super_admin',
      email: CONFIG.SUPER_ADMIN_EMAIL,
      full_name: 'Abdul Haseeb',
      role: CONFIG.ROLES.SUPER_ADMIN,
      status: 'active',
      phone: '+91 98765 00001',
      avatar_url: CONFIG.DEFAULT_AVATAR
    };
    this.saveUser();
  }

  saveUser() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(this.currentUser));
    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_ROLE, this.currentUser ? this.currentUser.role : 'guest');
  }

  async updateProfile(updatedData) {
    if (!this.currentUser) throw new Error('No active user logged in.');
    
    if (updatedData.full_name) {
      updatedData.full_name = updatedData.full_name.replace(/\s*\((?:Super\s*Admin|Admin|Warden|Teacher|Student|Parent)\)/gi, '').trim();
    }

    this.currentUser = {
      ...this.currentUser,
      ...updatedData
    };
    this.saveUser();

    // If Supabase is connected and we have client
    if (db.useSupabase && db.client && this.currentUser.id) {
      try {
        await db.client.from('profiles').upsert({
          id: this.currentUser.id,
          full_name: this.currentUser.full_name,
          phone: this.currentUser.phone,
          avatar_url: this.currentUser.avatar_url,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[Supabase profile update warning]:', err.message);
      }
    }

    // Also update local users store if matched
    try {
      const users = await db.getTable('users');
      const userIdx = users.findIndex(u => u.id === this.currentUser.id || u.email === this.currentUser.email);
      if (userIdx !== -1) {
        await db.updateRecord('users', users[userIdx].id, {
          full_name: this.currentUser.full_name,
          phone: this.currentUser.phone,
          avatar_url: this.currentUser.avatar_url
        });
      }
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('tps_auth_changed', { detail: this.currentUser }));
    return this.currentUser;
  }

  // Login with Email and Password
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both Email ID and Password.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth if connected
    if (db.useSupabase && db.client) {
      try {
        const { data, error } = await db.client.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });
        if (error) throw error;
        if (data.user) {
          // Fetch user profile
          const { data: profile } = await db.client.from('profiles').select('*').eq('id', data.user.id).single();
          this.currentUser = {
            id: data.user.id,
            email: data.user.email,
            full_name: profile ? profile.full_name : data.user.email.split('@')[0],
            role: profile ? profile.role : (cleanEmail === CONFIG.SUPER_ADMIN_EMAIL ? CONFIG.ROLES.SUPER_ADMIN : CONFIG.ROLES.PENDING),
            status: profile ? profile.status : 'active',
            avatar_url: profile ? profile.avatar_url : CONFIG.DEFAULT_AVATAR
          };
          this.saveUser();
          window.dispatchEvent(new CustomEvent('tps_auth_changed', { detail: this.currentUser }));
          return this.currentUser;
        }
      } catch (err) {
        console.warn('[Supabase Auth Failed, checking local user store]:', err.message);
      }
    }

    // 2. Check local users store
    const users = await db.getTable('users');
    const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      // If logging in as super admin with default credentials
      if (cleanEmail === CONFIG.SUPER_ADMIN_EMAIL.toLowerCase()) {
        this.setDefaultSuperAdmin();
        window.dispatchEvent(new CustomEvent('tps_auth_changed', { detail: this.currentUser }));
        return this.currentUser;
      }
      throw new Error('No registered account found with this email ID. Please sign up.');
    }

    if (matchedUser.status === 'pending_approval') {
      throw new Error('Your account is pending Super Admin approval. Please wait for role assignment.');
    }

    if (matchedUser.status === 'disabled') {
      throw new Error('Your account has been deactivated by the Administrator. Please contact management.');
    }

    // Check password
    if (matchedUser.password_hash && matchedUser.password_hash !== password) {
      throw new Error('Incorrect password. Use Forgot Password to recover your account.');
    }

    this.currentUser = { ...matchedUser };
    this.saveUser();
    window.dispatchEvent(new CustomEvent('tps_auth_changed', { detail: this.currentUser }));
    return this.currentUser;
  }

  // Sign Up / Register New Account
  async signup(data) {
    if (!data.email || !data.password || !data.full_name) {
      throw new Error('Please fill in Name, Email ID, and Password.');
    }

    const cleanEmail = data.email.trim().toLowerCase();

    // Check if email already registered
    const users = await db.getTable('users');
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this Email ID already exists. Please login instead.');
    }

    // If designated super admin signs up, auto-activate as super admin
    const isSuperAdminEmail = (cleanEmail === CONFIG.SUPER_ADMIN_EMAIL.toLowerCase());
    const assignedRole = isSuperAdminEmail ? CONFIG.ROLES.SUPER_ADMIN : CONFIG.ROLES.PENDING;
    const assignedStatus = isSuperAdminEmail ? 'active' : 'pending_approval';

    // 1. Supabase Auth signup if connected
    if (db.useSupabase && db.client) {
      try {
        const { data: authData, error } = await db.client.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: { full_name: data.full_name, requested_role: data.requested_role || 'student' }
          }
        });
        if (error) console.warn('[Supabase signup error]:', error.message);
      } catch (err) {
        console.warn('[Supabase Auth signup skipped]:', err.message);
      }
    }

    // 2. Save in users table
    const newUser = {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      full_name: data.full_name,
      password_hash: data.password,
      role: assignedRole,
      status: assignedStatus,
      phone: data.phone || '',
      requested_role: data.requested_role || 'student',
      avatar_url: CONFIG.DEFAULT_AVATAR,
      created_at: new Date().toISOString()
    };

    await db.insertRecord('users', newUser);

    // Notify Super Admin
    await db.insertRecord('notifications', {
      recipient_role: CONFIG.ROLES.SUPER_ADMIN,
      title: 'New User Registration Awaiting Approval',
      message: `${newUser.full_name} (${newUser.email}) registered and requested position as "${newUser.requested_role}". Please review and assign role.`,
      type: 'general',
      related_id: newUser.id,
      is_read: false
    });

    return newUser;
  }

  // Forgot Password / Password Recovery
  async recoverPassword(email) {
    if (!email) throw new Error('Please enter your Email ID to recover password.');

    const cleanEmail = email.trim().toLowerCase();

    // 1. Supabase Auth reset password
    if (db.useSupabase && db.client) {
      try {
        const { error } = await db.client.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin
        });
        if (error) console.warn('[Supabase password recovery error]:', error.message);
      } catch (e) {
        console.warn('[Supabase password recovery failed]:', e.message);
      }
    }

    const users = await db.getTable('users');
    const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      throw new Error(`No account found for ${cleanEmail}. Please verify your email ID or Sign Up.`);
    }

    // Generate temporary recovery pin/link
    const tempPassword = 'TPS-' + Math.floor(100000 + Math.random() * 900000);
    await db.updateRecord('users', matchedUser.id, { password_hash: tempPassword });

    return {
      success: true,
      email: cleanEmail,
      tempPassword: tempPassword,
      message: `Password reset instructions and recovery key have been generated for ${cleanEmail}.`
    };
  }

  // Logout
  async logout() {
    if (db.useSupabase && db.client) {
      try { await db.client.auth.signOut(); } catch (e) {}
    }
    this.currentUser = null;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_ROLE);
    window.dispatchEvent(new CustomEvent('tps_auth_changed', { detail: null }));
  }

  // Switch role dynamically (for quick testing)
  switchRole(newRole) {
    if (newRole === CONFIG.ROLES.SUPER_ADMIN) {
      this.setDefaultSuperAdmin();
    } else {
      this.currentUser.role = newRole;
      this.saveUser();
    }
    window.dispatchEvent(new CustomEvent('tps_auth_changed', { detail: this.currentUser }));
  }

  // User Management Methods (Super Admin / Admin only)
  async getAllUsers() {
    return await db.getTable('users');
  }

  async approveUserAndAssignRole(userId, assignedRole, linkedEntity = {}) {
    const updates = {
      role: assignedRole,
      status: 'active',
      linked_student_id: linkedEntity.student_id || null,
      linked_teacher_id: linkedEntity.teacher_id || null,
      hostel_id: linkedEntity.hostel_id || null,
      approved_by: this.currentUser ? this.currentUser.email : 'Super Admin',
      approved_at: new Date().toISOString()
    };

    const updated = await db.updateRecord('users', userId, updates);

    // Notify user
    await db.insertRecord('notifications', {
      user_id: userId,
      title: 'Account Approved & Role Assigned',
      message: `Your TPS Hostel IRP account has been approved and assigned position: ${assignedRole.toUpperCase()}.`,
      type: 'general',
      is_read: false
    });

    return updated;
  }

  async disableUser(userId) {
    return await db.updateRecord('users', userId, { status: 'disabled' });
  }

  async activateUser(userId) {
    return await db.updateRecord('users', userId, { status: 'active' });
  }

  async removeUser(userId) {
    // Delete user from users table
    return await db.deleteRecord('users', userId);
  }

  hasRole(roles) {
    if (!this.currentUser) return false;
    if (this.currentUser.role === CONFIG.ROLES.SUPER_ADMIN) return true;
    if (Array.isArray(roles)) {
      return roles.includes(this.currentUser.role);
    }
    return this.currentUser.role === roles;
  }

  canManageStudents() {
    return this.hasRole([CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.WARDEN]);
  }

  canManageBeds() {
    return this.hasRole([CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.WARDEN]);
  }

  canMarkAttendance() {
    return this.hasRole([CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.WARDEN, CONFIG.ROLES.TEACHER]);
  }

  canManageLeave() {
    return this.hasRole([CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.WARDEN]);
  }

  canManageFines() {
    return this.hasRole([CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN, CONFIG.ROLES.WARDEN]);
  }

  canManageTimetable() {
    return this.hasRole([CONFIG.ROLES.SUPER_ADMIN, CONFIG.ROLES.ADMIN]);
  }

  isSuperAdmin() {
    return this.currentUser && this.currentUser.role === CONFIG.ROLES.SUPER_ADMIN;
  }

  canManageClassRooms() {
    return this.isSuperAdmin();
  }

  canManageSettings() {
    return this.hasRole([CONFIG.ROLES.SUPER_ADMIN]);
  }
}

window.Auth = new AuthManager();
