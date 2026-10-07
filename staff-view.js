/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Staff View: Faculty Directory, Usthads, Wardens, Coaching Tutors & Assignment Tracking
 */

class StaffView {
  constructor() {
    this.searchQuery = '';
    this.roleFilter = 'all';
    this.statusFilter = 'all';
    this.viewMode = 'grid'; // 'grid' or 'table'
  }

  getMinimalIcon(name, size = 13, strokeWidth = 1.8) {
    const icons = {
      whatsapp: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
      eye: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
      edit: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
      trash: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
    };
    return icons[name] || '';
  }

  async render() {
    const [staffList, summary, classGroups, hostels, isSuperAdmin] = await Promise.all([
      window.StaffService.getAllStaff(),
      window.StaffService.getStaffSummary(),
      db.getTable('class_groups'),
      window.HostelService.getAllHostels(),
      window.Auth ? window.Auth.isSuperAdmin() : false
    ]);

    // Filter staff
    const filteredStaff = staffList.filter(s => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchQ = !q || 
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.employee_id && s.employee_id.toLowerCase().includes(q)) ||
        (s.specialization && s.specialization.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q));

      const matchRole = this.roleFilter === 'all' || window.StaffService.hasStaffRole(s, this.roleFilter);
      const matchStatus = this.statusFilter === 'all' || (s.status || 'active') === this.statusFilter;

      return matchQ && matchRole && matchStatus;
    });

    const roleBadges = {
      'moral_teacher': { label: 'Moral Usthad', class: 'badge-purple' },
      'coaching_tutor': { label: 'Coaching Tutor', class: 'badge-info' },
      'mentor': { label: 'Mentor / Guide', class: 'badge-success' },
      'warden': { label: 'Hostel Warden', class: 'badge-warning' },
      'teacher': { label: 'Academic Teacher', class: 'badge-primary' },
      'incharge': { label: 'In-Charge', class: 'badge-neutral' }
    };

    const roleLabels = {
      'all': 'All Roles & Categories',
      'moral_teacher': 'Moral Teachers / Usthads',
      'coaching_tutor': 'Coaching Tutors',
      'mentor': 'Mentors & Student Guides',
      'warden': 'Hostel Wardens',
      'teacher': 'Academic Faculty'
    };
    const currentRoleLabel = roleLabels[this.roleFilter] || 'All Roles & Categories';

    const statusLabels = {
      'all': 'All Status',
      'active': 'Active',
      'on_leave': 'On Leave',
      'inactive': 'Inactive'
    };
    const currentStatusLabel = statusLabels[this.statusFilter] || 'All Status';

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Staff & Faculty Directory
          </h2>
          <p>Manage hostel wardens, moral education usthads, coaching tutors, mentors, and academic faculty</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="App.exportStaffCSV()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Directory
          </button>
          <button class="btn btn-primary btn-sm" onclick="App.openAddStaffModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Staff Member
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-card-info">
            <h4>Total Faculty & Staff</h4>
            <div class="stat-card-value">${summary.total}</div>
            <div class="stat-card-sub positive">● ${summary.active} Active Members</div>
          </div>
          <div class="stat-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-info">
            <h4>Moral Class Usthads</h4>
            <div class="stat-card-value">${summary.moralUsthads}</div>
            <div class="stat-card-sub" style="color:#7e22ce; font-weight:600;">Quran & Moral Faculty</div>
          </div>
          <div class="stat-card-icon" style="background:#f3e8ff; color:#7e22ce; border-color:#e9d5ff;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
        </div>

        <div class="stat-card boys">
          <div class="stat-card-info">
            <h4>Coaching Tutors</h4>
            <div class="stat-card-value">${summary.coachingTutors}</div>
            <div class="stat-card-sub" style="color:#0284c7; font-weight:600;">Evening Academics</div>
          </div>
          <div class="stat-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-card-info">
            <h4>Wardens & Mentors</h4>
            <div class="stat-card-value">${summary.wardens + (summary.mentors || 0)}</div>
            <div class="stat-card-sub" style="color:#b45309; font-weight:600;">${summary.wardens} Wardens • ${summary.mentors || 0} Mentors</div>
          </div>
          <div class="stat-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
        </div>
      </div>

      <!-- Controls & Search Bar -->
      <div class="card" style="margin-bottom:1.5rem; overflow:visible; position:relative; z-index:40;">
        <div class="card-body" style="padding:0.85rem 1.25rem; overflow:visible;">
          <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center; justify-content:space-between; overflow:visible;">
            <!-- Search & Filters -->
            <div style="display:flex; flex-wrap:wrap; gap:0.6rem; align-items:center; flex:1; min-width:280px; overflow:visible;">
              <div style="position:relative; flex:1; min-width:200px;">
                <input type="text" class="form-control" style="padding-left:2.2rem; font-size:0.85rem;" placeholder="Search by name, employee ID, specialization, phone..." value="${this.searchQuery}" oninput="App.onStaffSearch(this.value)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>

              <!-- Liquid Glass Custom Dropdown for Roles with Curved Corners -->
              <div class="glass-dropdown" id="staff-role-glass-dd">
                <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('staff-role-glass-dd', event)" title="Filter by Role">
                  <span>${currentRoleLabel}</span>
                  <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="glass-dropdown-menu">
                  <div class="glass-dropdown-item ${this.roleFilter === 'all' ? 'active' : ''}" onclick="App.selectStaffRoleFilter('all', event)">All Roles & Categories</div>
                  <div class="glass-dropdown-item ${this.roleFilter === 'moral_teacher' ? 'active' : ''}" onclick="App.selectStaffRoleFilter('moral_teacher', event)">Moral Teachers / Usthads</div>
                  <div class="glass-dropdown-item ${this.roleFilter === 'coaching_tutor' ? 'active' : ''}" onclick="App.selectStaffRoleFilter('coaching_tutor', event)">Coaching Tutors</div>
                  <div class="glass-dropdown-item ${this.roleFilter === 'mentor' ? 'active' : ''}" onclick="App.selectStaffRoleFilter('mentor', event)">Mentors & Student Guides</div>
                  <div class="glass-dropdown-item ${this.roleFilter === 'warden' ? 'active' : ''}" onclick="App.selectStaffRoleFilter('warden', event)">Hostel Wardens</div>
                  <div class="glass-dropdown-item ${this.roleFilter === 'teacher' ? 'active' : ''}" onclick="App.selectStaffRoleFilter('teacher', event)">Academic Faculty</div>
                </div>
              </div>

              <!-- Liquid Glass Custom Dropdown for Status with Curved Corners -->
              <div class="glass-dropdown" id="staff-status-glass-dd">
                <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('staff-status-glass-dd', event)" title="Filter by Status">
                  <span>${currentStatusLabel}</span>
                  <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="glass-dropdown-menu">
                  <div class="glass-dropdown-item ${this.statusFilter === 'all' ? 'active' : ''}" onclick="App.selectStaffStatusFilter('all', event)">All Status</div>
                  <div class="glass-dropdown-item ${this.statusFilter === 'active' ? 'active' : ''}" onclick="App.selectStaffStatusFilter('active', event)">Active</div>
                  <div class="glass-dropdown-item ${this.statusFilter === 'on_leave' ? 'active' : ''}" onclick="App.selectStaffStatusFilter('on_leave', event)">On Leave</div>
                  <div class="glass-dropdown-item ${this.statusFilter === 'inactive' ? 'active' : ''}" onclick="App.selectStaffStatusFilter('inactive', event)">Inactive</div>
                </div>
              </div>
            </div>

            <!-- View Mode Switcher -->
            <div style="display:flex; gap:0.25rem; background:var(--bg-surface-secondary); padding:3px; border-radius:var(--radius-full); border:1px solid var(--border-color);">
              <button class="btn btn-xs ${this.viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}" style="border-radius:var(--radius-full); padding:0.25rem 0.65rem;" onclick="App.setStaffViewMode('grid')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                Grid
              </button>
              <button class="btn btn-xs ${this.viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}" style="border-radius:var(--radius-full); padding:0.25rem 0.65rem;" onclick="App.setStaffViewMode('table')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Staff Grid / Table Container -->
      ${filteredStaff.length === 0 ? `
        <div class="card">
          <div class="card-body empty-state" style="padding:3rem 1.5rem;">
            <div class="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h4>No Staff Members Found</h4>
            <p style="max-width:450px; margin:0.35rem auto 1.25rem auto;">No faculty or staff records matched your search query or selected filter criteria.</p>
            <button class="btn btn-primary btn-sm" onclick="App.openAddStaffModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add New Staff Record
            </button>
          </div>
        </div>
      ` : this.viewMode === 'grid' ? `
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:1.25rem;">
          ${filteredStaff.map(s => {
            const assignedGroups = classGroups.filter(cg => cg.teacher_id === s.id);
            const assignedHostel = hostels.find(h => h.id === s.hostel_id || (h.warden_name && h.warden_name.includes(s.full_name)));
            const isActive = (s.status || 'active') === 'active';

            const staffRoles = Array.isArray(s.roles) && s.roles.length > 0 ? s.roles : [s.role || 'teacher'];
            const badgesHtml = staffRoles.map(r => {
              const info = roleBadges[r] || { label: r.replace('_', ' '), class: 'badge-neutral' };
              return `<span class="badge ${info.class}" style="font-size:0.68rem; padding:1px 6px;">${info.label}</span>`;
            }).join(' ');

            return `
              <div class="card" style="transition:transform var(--transition-fast), box-shadow var(--transition-fast); position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
                <div class="card-body" style="padding:1.25rem;">
                  <!-- Top Row: Avatar & Details -->
                  <div style="display:flex; gap:1rem; align-items:flex-start;">
                    <img src="${(s.avatar_url && !s.avatar_url.includes('unsplash.com')) ? s.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')}" style="width:58px; height:58px; border-radius:var(--radius-full); object-fit:cover; border:2.5px solid var(--primary-600); flex-shrink:0; box-shadow:var(--shadow-sm);" alt="${s.full_name}">
                    <div style="flex:1; min-width:0;">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.4rem;">
                        <h4 style="margin:0; font-size:1.05rem; color:var(--text-primary); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                          ${s.full_name}
                        </h4>
                        <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}" style="font-size:0.65rem; padding:1px 6px; flex-shrink:0;">
                          ${isActive ? 'Active' : (s.status || 'Inactive')}
                        </span>
                      </div>

                      <div style="display:flex; align-items:center; gap:6px; margin-top:4px; flex-wrap:wrap;">
                        <span style="font-family:monospace; font-size:0.75rem; font-weight:700; color:var(--primary-700); background:var(--primary-50); padding:1px 5px; border-radius:4px;">
                          ${s.employee_id || 'TCH'}
                        </span>
                        ${badgesHtml}
                      </div>

                      <p style="margin:6px 0 0 0; font-size:0.82rem; color:var(--text-secondary); line-height:1.35; font-weight:500;">
                        ${s.specialization || s.designation || 'Academic Staff'}
                      </p>
                    </div>
                  </div>

                  <!-- Contact Links -->
                  <div style="margin-top:1rem; padding-top:0.85rem; border-top:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:0.35rem; font-size:0.82rem;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                      <span style="color:var(--text-muted); display:flex; align-items:center; gap:5px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        Phone:
                      </span>
                      <strong style="color:var(--text-primary);"><a href="tel:${s.phone}" style="color:inherit; text-decoration:none;">${s.phone || '—'}</a></strong>
                    </div>

                    ${s.email ? `
                      <div style="display:flex; align-items:center; justify-content:space-between;">
                        <span style="color:var(--text-muted); display:flex; align-items:center; gap:5px;">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                          Email:
                        </span>
                        <a href="mailto:${s.email}" style="color:var(--primary-700); text-decoration:none; font-size:0.78rem; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${s.email}</a>
                      </div>
                    ` : ''}

                    ${assignedHostel ? `
                      <div style="display:flex; align-items:center; justify-content:space-between;">
                        <span style="color:var(--text-muted); display:flex; align-items:center; gap:5px;">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                          Hostel:
                        </span>
                        <span class="badge badge-neutral" style="font-size:0.72rem;">${assignedHostel.name}</span>
                      </div>
                    ` : ''}
                  </div>

                  <!-- Assigned Class Rooms Badges -->
                  <div style="margin-top:0.85rem; padding-top:0.75rem; border-top:1px solid var(--border-subtle);">
                    <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:5px; letter-spacing:0.3px;">
                      Assigned Class Rooms (${assignedGroups.length})
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:0.35rem;">
                      ${assignedGroups.length === 0 ? `
                        <span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">No active class assigned</span>
                      ` : assignedGroups.map(cg => `
                        <span class="badge badge-info" style="font-size:0.72rem; padding:2px 7px;" title="${cg.start_time} - ${cg.end_time}">
                          ${cg.group_name}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                </div>

                <!-- Card Footer Actions -->
                <div class="card-footer" style="background:var(--bg-surface-secondary); padding:0.6rem 1.15rem; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); border-bottom-left-radius:var(--radius-lg); border-bottom-right-radius:var(--radius-lg);">
                  <div style="display:flex; gap:0.4rem; align-items:center;">
                    ${s.whatsapp ? `
                      <a href="https://wa.me/${s.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="btn-minimal btn-minimal-wa" title="Message on WhatsApp">
                        ${this.getMinimalIcon('whatsapp', 13)}
                        <span>WA</span>
                      </a>
                    ` : ''}
                    <button class="btn-minimal btn-minimal-primary" onclick="App.openStaffProfileModal('${s.id}')" title="View Full Profile">
                      ${this.getMinimalIcon('eye', 13)}
                      <span>Profile</span>
                    </button>
                  </div>

                  <div style="display:flex; gap:0.4rem; align-items:center;">
                    <button class="btn-minimal" onclick="App.openEditStaffModal('${s.id}')" title="Edit Staff Details">
                      ${this.getMinimalIcon('edit', 13)}
                      <span>Edit</span>
                    </button>
                    ${isSuperAdmin ? `
                      <button class="icon-btn-minimal danger" onclick="App.confirmDeleteStaff('${s.id}', '${s.full_name.replace(/'/g, "\\'")}')" title="Delete Staff Member">
                        ${this.getMinimalIcon('trash', 13)}
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <!-- Table Directory View -->
        <div class="card">
          <div class="card-body" style="padding:0; overflow-x:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>ID Number</th>
                  <th>Roles & Responsibilities</th>
                  <th>Specialization</th>
                  <th>Assigned Classes</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredStaff.map(s => {
                  const assignedGroups = classGroups.filter(cg => cg.teacher_id === s.id);
                  const isActive = (s.status || 'active') === 'active';

                  const staffRoles = Array.isArray(s.roles) && s.roles.length > 0 ? s.roles : [s.role || 'teacher'];
                  const badgesHtml = staffRoles.map(r => {
                    const info = roleBadges[r] || { label: r.replace('_', ' '), class: 'badge-neutral' };
                    return `<span class="badge ${info.class}" style="font-size:0.68rem; padding:1px 5px;">${info.label}</span>`;
                  }).join(' ');

                  return `
                    <tr>
                      <td>
                        <div style="display:flex; align-items:center; gap:0.65rem;">
                          <img src="${(s.avatar_url && !s.avatar_url.includes('unsplash.com')) ? s.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')}" style="width:36px; height:36px; border-radius:var(--radius-full); object-fit:cover; border:1.5px solid var(--border-color);" alt="avatar">
                          <div>
                            <strong style="color:var(--text-primary); font-size:0.9rem;">${s.full_name}</strong>
                            <div style="font-size:0.75rem; color:var(--text-muted);">${s.qualification || 'Faculty'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style="font-family:monospace; font-size:0.82rem; color:var(--primary-700);">${s.employee_id || '—'}</strong>
                      </td>
                      <td>
                        <div style="display:flex; flex-wrap:wrap; gap:3px;">
                          ${badgesHtml}
                        </div>
                      </td>
                      <td>
                        <span style="font-size:0.85rem; font-weight:500;">${s.specialization || s.designation || '—'}</span>
                      </td>
                      <td>
                        <div style="display:flex; flex-wrap:wrap; gap:3px;">
                          ${assignedGroups.length === 0 ? `<span style="font-size:0.75rem; color:var(--text-muted);">None</span>` : assignedGroups.map(cg => `
                            <span class="badge badge-info" style="font-size:0.68rem; padding:1px 5px;">${cg.group_name}</span>
                          `).join('')}
                        </div>
                      </td>
                      <td>
                        <div style="font-size:0.82rem;">
                          <a href="tel:${s.phone}" style="color:var(--text-primary); text-decoration:none; font-weight:600;">${s.phone || '—'}</a>
                          ${s.email ? `<div style="font-size:0.75rem; color:var(--text-muted);">${s.email}</div>` : ''}
                        </div>
                      </td>
                      <td>
                        <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">● ${isActive ? 'Active' : (s.status || 'Inactive')}</span>
                      </td>
                      <td style="text-align:right;">
                        <div style="display:inline-flex; gap:0.35rem; align-items:center; justify-content:flex-end;">
                          <button class="btn-minimal btn-minimal-primary" onclick="App.openStaffProfileModal('${s.id}')" title="View Profile">
                            ${this.getMinimalIcon('eye', 12)} Profile
                          </button>
                          ${isSuperAdmin ? `
                            <button class="btn-minimal" onclick="App.openCreateUserModal('${s.id}')" title="Provision / Manage Login Password & Account">
                              🔑 Login
                            </button>
                          ` : ''}
                          <button class="btn-minimal" onclick="App.openEditStaffModal('${s.id}')" title="Edit Staff">
                            ${this.getMinimalIcon('edit', 12)} Edit
                          </button>
                          ${isSuperAdmin ? `
                            <button class="icon-btn-minimal danger" onclick="App.confirmDeleteStaff('${s.id}', '${s.full_name.replace(/'/g, "\\'")}')" title="Delete Staff Member">
                              ${this.getMinimalIcon('trash', 12)}
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `}
    `;
  }
}

window.StaffView = new StaffView();
