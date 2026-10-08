/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Users & Roles Management View (Super Admin / Admin Control Center)
 * Manage all Faculty & Staff Directory logins, approve roles/positions, deactivate, set/reset passwords
 */

class UsersView {
  constructor() {
    this.searchQuery = '';
    this.filterRole = 'all';
    this.filterStatus = 'all';
  }

  async render() {
    const users = await window.Auth.getAllUsers();
    const students = await window.StudentService.getAllStudents();
    const teachers = await db.getTable('teachers');
    const hostels = await window.HostelService.getAllHostels();

    // Build unified list combining Faculty & Staff Directory with Registered System Users
    const unifiedList = [];
    const processedTeacherIds = new Set();
    const processedUserEmails = new Set();

    // 1. Process all existing registered user accounts
    users.forEach(u => {
      if (u.linked_teacher_id) {
        processedTeacherIds.add(u.linked_teacher_id);
      }
      if (u.email) {
        processedUserEmails.add(u.email.toLowerCase().trim());
      }
      const matchedTeacher = u.linked_teacher_id ? teachers.find(t => t.id === u.linked_teacher_id) : (u.email ? teachers.find(t => t.email && t.email.toLowerCase().trim() === u.email.toLowerCase().trim()) : null);
      if (matchedTeacher) {
        processedTeacherIds.add(matchedTeacher.id);
      }

      unifiedList.push({
        type: 'user',
        id: u.id,
        user_id: u.id,
        email: u.email || (matchedTeacher ? matchedTeacher.email : ''),
        full_name: u.full_name || (matchedTeacher ? matchedTeacher.full_name : 'Unnamed User'),
        phone: u.phone || (matchedTeacher ? matchedTeacher.phone : ''),
        role: u.role || 'teacher',
        status: u.status || 'active',
        avatar_url: u.avatar_url || (matchedTeacher ? matchedTeacher.avatar_url : null),
        linked_teacher_id: u.linked_teacher_id || (matchedTeacher ? matchedTeacher.id : null),
        linked_student_id: u.linked_student_id || null,
        hostel_id: u.hostel_id || null,
        employee_id: matchedTeacher ? matchedTeacher.employee_id : null,
        specialization: matchedTeacher ? (matchedTeacher.specialization || matchedTeacher.designation) : null,
        created_at: u.created_at || new Date().toISOString(),
        hasAccount: true
      });
    });

    // 2. Process all faculty/staff from Directory who do not have a user login account yet
    teachers.forEach(t => {
      const isAlreadyInUsers = processedTeacherIds.has(t.id) || (t.email && processedUserEmails.has(t.email.toLowerCase().trim()));
      if (!isAlreadyInUsers) {
        // Derive appropriate role from teacher record
        let role = 'teacher';
        if ((t.roles && t.roles.includes('warden')) || (t.specialization && t.specialization.toLowerCase().includes('warden')) || t.role === 'warden') {
          role = 'warden';
        } else if ((t.roles && t.roles.includes('admin')) || t.role === 'admin') {
          role = 'admin';
        }

        unifiedList.push({
          type: 'staff_directory',
          id: `staff_${t.id}`,
          user_id: null,
          staff_id: t.id,
          employee_id: t.employee_id || 'Staff',
          email: t.email || '',
          full_name: t.full_name,
          phone: t.phone || '',
          role: role,
          status: 'needs_password', // requires login credentials setup
          avatar_url: (t.avatar_url && !t.avatar_url.includes('unsplash.com')) ? t.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : ''),
          linked_teacher_id: t.id,
          linked_student_id: null,
          hostel_id: null,
          specialization: t.specialization || t.designation || 'Faculty Member',
          created_at: t.created_at || new Date().toISOString(),
          hasAccount: false
        });
      }
    });

    const pendingUsers = unifiedList.filter(u => u.status === 'pending_approval' || u.status === 'needs_password');
    const activeUsers = unifiedList.filter(u => u.status === 'active' && u.hasAccount);
    const disabledUsers = unifiedList.filter(u => u.status === 'disabled');

    const filteredItems = unifiedList.filter(item => {
      const q = (this.searchQuery || '').toLowerCase().trim();
      const matchSearch = !q ||
        (item.full_name && item.full_name.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.phone && item.phone.includes(q)) ||
        (item.employee_id && item.employee_id.toLowerCase().includes(q)) ||
        (item.specialization && item.specialization.toLowerCase().includes(q));

      const matchRole = this.filterRole === 'all' || item.role === this.filterRole;
      
      let matchStatus = true;
      if (this.filterStatus !== 'all') {
        if (this.filterStatus === 'active') matchStatus = (item.status === 'active' && item.hasAccount);
        else if (this.filterStatus === 'pending_approval') matchStatus = (item.status === 'pending_approval' || item.status === 'needs_password');
        else if (this.filterStatus === 'disabled') matchStatus = (item.status === 'disabled');
      }

      return matchSearch && matchRole && matchStatus;
    });

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            User Accounts & Position Approval Center
          </h2>
          <p>Super Admin console for managing all Faculty & Staff login credentials, Gmail accounts, assigning positions, and portal access</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="App.openCreateUserModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create User Account
          </button>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-card-info">
            <h4>Total Staff & Users</h4>
            <div class="stat-card-value">${unifiedList.length}</div>
            <div class="stat-card-sub positive">${teachers.length} Faculty Directory • ${users.length} Logins</div>
          </div>
          <div class="stat-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
        </div>

        <div class="stat-card ${pendingUsers.length > 0 ? 'danger' : ''}">
          <div class="stat-card-info">
            <h4>Pending Password / Login</h4>
            <div class="stat-card-value">${pendingUsers.length}</div>
            <div class="stat-card-sub ${pendingUsers.length > 0 ? 'negative' : 'positive'}">
              ${pendingUsers.length > 0 ? `● ${pendingUsers.length} Needs Login Setup` : 'All faculty active'}
            </div>
          </div>
          <div class="stat-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-info">
            <h4>Active Portal Users</h4>
            <div class="stat-card-value">${activeUsers.length}</div>
            <div class="stat-card-sub positive">Authorized Access</div>
          </div>
          <div class="stat-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-card-info">
            <h4>Deactivated Users</h4>
            <div class="stat-card-value">${disabledUsers.length}</div>
            <div class="stat-card-sub">Access Suspended</div>
          </div>
          <div class="stat-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
          </div>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="filter-toolbar">
        <div class="filter-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search by staff name, employee ID, Gmail, phone..." value="${this.searchQuery}" oninput="App.onUserSearch(this.value)">
        </div>

        <!-- Liquid Glass Role Dropdown -->
        <div class="glass-dropdown" id="user-role-dropdown">
          <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('user-role-dropdown', event)" title="Filter by Role">
            <span>${this.filterRole === 'super_admin' ? 'Super Admin' : (this.filterRole === 'admin' ? 'Hostel Admin' : (this.filterRole === 'warden' ? 'Hostel Warden' : (this.filterRole === 'teacher' ? 'Teacher' : (this.filterRole === 'parent' ? 'Parent' : (this.filterRole === 'student' ? 'Student' : (this.filterRole === 'pending' ? 'Pending Role' : 'All Roles'))))))}</span>
            <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="glass-dropdown-menu">
            <div class="glass-dropdown-item ${this.filterRole === 'all' ? 'active' : ''}" onclick="App.onUserFilter('role', 'all')">All Roles</div>
            <div class="glass-dropdown-item ${this.filterRole === 'super_admin' ? 'active' : ''}" onclick="App.onUserFilter('role', 'super_admin')">Super Admin</div>
            <div class="glass-dropdown-item ${this.filterRole === 'admin' ? 'active' : ''}" onclick="App.onUserFilter('role', 'admin')">Hostel Admin</div>
            <div class="glass-dropdown-item ${this.filterRole === 'warden' ? 'active' : ''}" onclick="App.onUserFilter('role', 'warden')">Hostel Warden</div>
            <div class="glass-dropdown-item ${this.filterRole === 'teacher' ? 'active' : ''}" onclick="App.onUserFilter('role', 'teacher')">Teacher</div>
            <div class="glass-dropdown-item ${this.filterRole === 'parent' ? 'active' : ''}" onclick="App.onUserFilter('role', 'parent')">Parent</div>
            <div class="glass-dropdown-item ${this.filterRole === 'student' ? 'active' : ''}" onclick="App.onUserFilter('role', 'student')">Student</div>
          </div>
        </div>

        <!-- Liquid Glass Status Dropdown -->
        <div class="glass-dropdown" id="user-status-dropdown">
          <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('user-status-dropdown', event)" title="Filter by Status">
            <span>${this.filterStatus === 'active' ? 'Active Logins' : (this.filterStatus === 'pending_approval' ? 'Needs Login / Pending' : (this.filterStatus === 'disabled' ? 'Deactivated' : 'All Statuses'))}</span>
            <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="glass-dropdown-menu">
            <div class="glass-dropdown-item ${this.filterStatus === 'all' ? 'active' : ''}" onclick="App.onUserFilter('status', 'all')">All Statuses</div>
            <div class="glass-dropdown-item ${this.filterStatus === 'active' ? 'active' : ''}" onclick="App.onUserFilter('status', 'active')">Active Logins</div>
            <div class="glass-dropdown-item ${this.filterStatus === 'pending_approval' ? 'active' : ''}" onclick="App.onUserFilter('status', 'pending_approval')">Needs Login / Pending</div>
            <div class="glass-dropdown-item ${this.filterStatus === 'disabled' ? 'active' : ''}" onclick="App.onUserFilter('status', 'disabled')">Deactivated</div>
          </div>
        </div>
      </div>

      <!-- All Users & Faculty Directory Table -->
      <div class="card">
        <div class="card-header">
          <h3>Faculty & System User Accounts <span style="font-size:0.85rem; font-weight:normal; color:var(--text-muted);">(${filteredItems.length} total • ${activeUsers.length} active logins)</span></h3>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User / Staff Profile</th>
                  <th>Gmail / Email ID</th>
                  <th>Assigned Role / Position</th>
                  <th>Status</th>
                  <th>Linked Record</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredItems.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
                      No matching staff or user accounts found.
                    </td>
                  </tr>
                ` : filteredItems.map(item => {
                  const isSuperAdminAccount = (item.email && item.email.toLowerCase() === CONFIG.SUPER_ADMIN_EMAIL.toLowerCase());
                  const student = item.linked_student_id ? students.find(s => s.id === item.linked_student_id) : null;
                  const teacher = item.linked_teacher_id ? teachers.find(t => t.id === item.linked_teacher_id) : null;
                  const hostel = item.hostel_id ? hostels.find(h => h.id === item.hostel_id) : null;

                  return `
                    <tr>
                      <td>
                        <div class="table-user-cell">
                          <img src="${(item.avatar_url && !item.avatar_url.includes('unsplash.com')) ? item.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')}" class="table-avatar" alt="avatar" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')">
                          <div>
                            <div class="table-user-name">${item.full_name}</div>
                            <div class="table-user-sub">
                              ${item.employee_id ? `<span style="font-family:monospace; font-weight:600; color:var(--primary-700);">${item.employee_id}</span> • ` : ''}
                              ${item.phone || (teacher && teacher.phone) || 'No phone'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        ${item.email ? `
                          <div style="display:flex; align-items:center; gap:0.35rem;">
                            <span style="font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">${item.email}</span>
                            ${item.linked_teacher_id ? `
                              <button class="icon-btn-minimal" onclick="App.openQuickSetEmailModal('${item.linked_teacher_id}', '${item.full_name.replace(/'/g, "\\'")}', '${item.email}')" title="Change / Edit Gmail ID" style="padding:1px 4px; font-size:0.75rem;">
                                ✏️
                              </button>
                            ` : ''}
                          </div>
                        ` : `
                          <button class="btn btn-sm btn-outline-warning" onclick="App.openQuickSetEmailModal('${item.linked_teacher_id || item.staff_id}', '${item.full_name.replace(/'/g, "\\'")}', '')" style="font-size:0.75rem; padding:3px 8px; border-style:dashed; border-width:1.5px; font-weight:600;" title="No Gmail ID registered. Click to set Gmail ID.">
                            + Add Gmail ID
                          </button>
                        `}
                      </td>
                      <td>
                        <span class="badge ${item.role === 'super_admin' ? 'badge-danger' : item.role === 'admin' ? 'badge-purple' : item.role === 'warden' ? 'badge-warning' : item.role === 'teacher' ? 'badge-info' : 'badge-success'}" ${item.hasAccount && !isSuperAdminAccount ? `style="cursor:pointer;" onclick="App.openAssignRoleModal('${item.user_id}')" title="Click to change role/position"` : ''}>
                          ${item.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        ${item.hasAccount ? `
                          <span class="badge ${item.status === 'active' ? 'badge-success' : item.status === 'pending_approval' ? 'badge-warning' : 'badge-danger'}">
                            <span class="badge-dot-indicator"></span>
                            ${item.status.replace('_', ' ')}
                          </span>
                        ` : `
                          <span class="badge badge-warning" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;">
                            <span class="badge-dot-indicator" style="background:#f59e0b;"></span>
                            Login Not Created
                          </span>
                        `}
                      </td>
                      <td style="font-size:0.8rem; color:var(--text-secondary);">
                        ${teacher ? `Faculty: <strong>${teacher.full_name} (${teacher.employee_id || 'Staff'})</strong>` : ''}
                        ${student ? `Student: <strong>${student.full_name} (${student.admission_no})</strong>` : ''}
                        ${hostel ? `Hostel: <strong>${hostel.name}</strong>` : ''}
                        ${!teacher && !student && !hostel ? '—' : ''}
                      </td>
                      <td style="text-align:right;">
                        <div style="display:inline-flex; gap:0.35rem; align-items:center; justify-content:flex-end;">
                          ${item.hasAccount ? `
                            ${item.status === 'pending_approval' ? `
                              <button class="btn btn-sm btn-success" onclick="App.openAssignRoleModal('${item.user_id}')" style="background:#16a34a; color:#fff; font-weight:600; font-size:0.78rem; padding:4px 10px; border-radius:6px; box-shadow:0 2px 4px rgba(22,163,74,0.2);" title="Review request and designate role">
                                ✓ Approve & Assign Position
                              </button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline-primary" onclick="App.openResetPasswordModal('${item.user_id}')" title="Reset Password">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </button>
                            ${!isSuperAdminAccount ? `
                              ${item.status === 'active' ? `
                                <button class="btn btn-sm btn-warning" onclick="App.toggleUserActive('${item.user_id}', 'disabled')" title="Deactivate access">
                                  Deactivate
                                </button>
                              ` : item.status === 'disabled' ? `
                                <button class="btn btn-sm btn-primary" onclick="App.toggleUserActive('${item.user_id}', 'active')" title="Activate access">
                                  Activate
                                </button>
                              ` : ''}
                              <button class="btn btn-sm btn-danger" onclick="App.confirmRemoveUser('${item.user_id}', '${item.full_name.replace(/'/g, "\\'")}')" title="Remove user account">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            ` : `
                              <span style="font-size:0.75rem; color:var(--primary-700); font-weight:700; padding:0 0.5rem;">Super Admin</span>
                            `}
                          ` : `
                            <button class="btn btn-sm btn-primary" onclick="App.openCreateUserModal('${item.linked_teacher_id || item.staff_id}')" title="Assign Password & Provision Login Account">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:3px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                              Set Password & Create Login
                            </button>
                          `}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}

window.UsersView = new UsersView();
