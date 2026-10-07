/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Students View: Directory, Full Admission Form, 13-Tab Comprehensive Profile, ID Card Generator
 */

class StudentsView {
  constructor() {
    this.searchQuery = '';
    this.filterGender = 'all';
    this.filterHostel = 'all';
    this.filterStatus = 'all';
    this.filterClass = 'all';
  }

  async render() {
    const students = await window.StudentService.getAllStudents();
    const hostels = await window.HostelService.getAllHostels();
    const rooms = await window.HostelService.getAllRooms();
    const beds = await window.HostelService.getAllBeds();

    // Apply active filters
    const filtered = students.filter(s => {
      const matchSearch = !this.searchQuery ||
        s.full_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        s.admission_no.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (s.father_name && s.father_name.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (s.father_phone && s.father_phone.includes(this.searchQuery));

      const matchGender = this.filterGender === 'all' || s.gender === this.filterGender;
      const matchHostel = this.filterHostel === 'all' || s.hostel_id === this.filterHostel;
      const matchStatus = this.filterStatus === 'all' || s.status === this.filterStatus;
      const matchClass = this.filterClass === 'all' || s.school_class === this.filterClass;

      return matchSearch && matchGender && matchHostel && matchStatus && matchClass;
    });

    const uniqueClasses = [...new Set([...CONFIG.SCHOOL_CLASSES, ...students.map(s => s.school_class).filter(Boolean)])];

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Student Directory & Admission Register
          </h2>
          <p>Manage hostel residents, admissions, bed allocations, and academic coaching assignments</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline-primary btn-sm" onclick="App.openImportStudentsModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Import Students (CSV)
          </button>
          <button class="btn btn-secondary btn-sm" onclick="App.exportStudentsCSV()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export CSV
          </button>
          <button class="btn btn-primary btn-sm" onclick="App.openAdmissionModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Student Admission
          </button>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="filter-toolbar">
        <div class="filter-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search by name, ID number (e.g. TPS2026056), phone..." value="${this.searchQuery}" oninput="App.onStudentSearch(this.value)">
        </div>

        <!-- Custom Liquid Glass Dropdown: Gender / Category Filter -->
        <div class="glass-dropdown" id="student-gender-dropdown">
          <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('student-gender-dropdown', event)">
            <span>${this.filterGender === 'male' ? 'Boys' : (this.filterGender === 'female' ? 'Girls' : 'All')}</span>
            <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="glass-dropdown-menu">
            <div class="glass-dropdown-item ${this.filterGender === 'all' ? 'active' : ''}" onclick="App.onStudentFilter('gender', 'all')">All</div>
            <div class="glass-dropdown-item ${this.filterGender === 'male' ? 'active' : ''}" onclick="App.onStudentFilter('gender', 'male')">Boys</div>
            <div class="glass-dropdown-item ${this.filterGender === 'female' ? 'active' : ''}" onclick="App.onStudentFilter('gender', 'female')">Girls</div>
          </div>
        </div>

        <!-- Custom Liquid Glass Dropdown: Status Filter -->
        <div class="glass-dropdown" id="student-status-dropdown">
          <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('student-status-dropdown', event)">
            <span>${(CONFIG.STUDENT_STATUSES.find(st => st.value === this.filterStatus)?.label) || 'All Statuses'}</span>
            <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="glass-dropdown-menu">
            <div class="glass-dropdown-item ${this.filterStatus === 'all' ? 'active' : ''}" onclick="App.onStudentFilter('status', 'all')">All Statuses</div>
            ${CONFIG.STUDENT_STATUSES.map(st => `
              <div class="glass-dropdown-item ${this.filterStatus === st.value ? 'active' : ''}" onclick="App.onStudentFilter('status', '${st.value}')">
                ${st.label}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Custom Liquid Glass Dropdown: Class Filter -->
        <div class="glass-dropdown" id="student-class-dropdown">
          <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('student-class-dropdown', event)">
            <span>${this.filterClass === 'all' ? 'All Classes' : this.filterClass}</span>
            <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="glass-dropdown-menu" style="max-height: 260px; overflow-y: auto;">
            <div class="glass-dropdown-item ${this.filterClass === 'all' ? 'active' : ''}" onclick="App.onStudentFilter('class', 'all')">All Classes</div>
            ${uniqueClasses.map(c => `
              <div class="glass-dropdown-item ${this.filterClass === c ? 'active' : ''}" onclick="App.onStudentFilter('class', '${c}')">
                ${c}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Students Table Card -->
      <div class="card">
        <div class="card-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem;">
          <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
            <h3 style="margin:0; font-size:1.05rem;">
              Enrolled Hostel Students 
              <span style="font-size:0.85rem; font-weight:normal; color:var(--text-muted);">(${filtered.length} found)</span>
            </h3>

            <!-- Dynamic Bulk Action Bar -->
            <div id="student-bulk-bar" style="display:none; align-items:center; gap:0.5rem; background:rgba(220,38,38,0.08); border:1px solid rgba(220,38,38,0.22); padding:0.22rem 0.65rem; border-radius:var(--radius-full);">
              <span id="student-selected-count-badge" class="badge badge-danger" style="font-size:0.75rem; font-weight:700;">
                0 Selected
              </span>
              <button type="button" class="btn btn-xs btn-danger" onclick="App.confirmBulkDeleteStudents()" style="display:inline-flex; align-items:center; gap:4px; font-weight:700; border-radius:var(--radius-full); padding:0.25rem 0.65rem; cursor:pointer;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete Selected
              </button>
              <button type="button" class="btn btn-xs btn-secondary" onclick="App.toggleSelectAllStudents(false)" style="border-radius:var(--radius-full); padding:0.25rem 0.55rem; font-size:0.75rem; cursor:pointer;">
                Clear
              </button>
            </div>
          </div>
        </div>
        <div class="card-body" style="padding:0;">
          ${filtered.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <h4>No Students Found</h4>
              <p>No student records matched the specified filter criteria.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>ID Number</th>
                    <th>Class</th>
                    <th>Category</th>
                    <th>Hostel / Bed</th>
                    <th>Parent / Contact</th>
                    <th>Status</th>
                    <th style="width:40px; text-align:center; padding-left:4px; padding-right:4px;">
                      <input type="checkbox" id="student-select-all" onchange="App.toggleSelectAllStudents(this.checked)" style="width:16px; height:16px; accent-color:var(--primary-600); cursor:pointer; vertical-align:middle;" title="Select All Visible Students">
                    </th>
                    <th style="text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map(s => {
                    const hostel = hostels.find(h => h.id === s.hostel_id);
                    const room = rooms.find(r => r.id === s.room_id);
                    const bed = beds.find(b => b.id === s.bed_id);
                    const isWithdrawn = s.status === 'Withdrawn';
                    const category = s.student_category || 'General';
                    const catBadgeClass = category === 'Orphan' ? 'badge-danger' : (category === 'Staff ward' ? 'badge-warning' : 'badge-neutral');

                    return `
                      <tr>
                        <td>
                          <div class="table-user-cell">
                            <img src="${(s.photo_url && !s.photo_url.includes('unsplash.com')) ? s.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')}" class="table-avatar" alt="Photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                            <div>
                              <div class="table-user-name" style="cursor:pointer; color:var(--primary-700); font-weight:700;" onclick="App.openStudentProfile('${s.id}')">
                                ${s.full_name}
                              </div>
                              <div class="table-user-sub">${s.gender === 'male' ? 'Boy' : 'Girl'}${s.age ? ` • ${s.age} yrs` : ''} • DOB: ${s.dob || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td><span style="font-weight:700; font-family:monospace; background:var(--bg-surface-secondary); padding:2px 6px; border-radius:4px; border:1px solid var(--border-color);">${s.admission_no}</span></td>
                        <td><strong>${s.school_class}</strong></td>
                        <td>
                          <span class="badge ${catBadgeClass}" style="font-size:0.75rem;">
                            ${category}
                          </span>
                        </td>
                        <td>
                          <div style="font-weight:600;">${hostel ? hostel.name : 'Unassigned'}</div>
                          <div style="font-size:0.75rem; color:var(--text-muted);">${room ? 'Room ' + room.room_number : 'No Room'} • ${bed ? bed.bed_number : 'No Bed'}</div>
                        </td>
                        <td>
                          <div style="font-weight:600;">${s.father_name || '—'}</div>
                          <div style="font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
                            <span>${s.father_phone || '—'}</span>
                            ${s.father_whatsapp ? `<span title="WhatsApp available" style="color:#059669; display:inline-flex; align-items:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></span>` : ''}
                          </div>
                        </td>
                        <td>
                          <span class="badge ${isWithdrawn ? 'badge-danger' : 'badge-success'}">
                            <span class="badge-dot-indicator"></span>
                            ${s.status || 'Enrolled'}
                          </span>
                        </td>
                        <td style="width:40px; text-align:center; vertical-align:middle; padding-left:4px; padding-right:4px;">
                          <input type="checkbox" class="student-row-checkbox" value="${s.id}" data-student-name="${(s.full_name || '').replace(/"/g, '&quot;')}" onchange="App.onStudentRowSelectionChange()" style="width:16px; height:16px; accent-color:var(--primary-600); cursor:pointer; vertical-align:middle;" title="Select student">
                        </td>
                        <td style="text-align:right; vertical-align:middle;">
                          <div style="display:inline-flex; gap:0.35rem; align-items:center; justify-content:flex-end;">
                            <button class="icon-btn-minimal" title="View Student Profile" onclick="App.openStudentProfile('${s.id}')">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                            <button class="icon-btn-minimal" title="Edit Student Details" onclick="App.openEditStudentModal('${s.id}')">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="icon-btn-minimal danger" title="Delete Student Record" onclick="App.confirmDeleteStudent('${s.id}', '${s.full_name.replace(/'/g, "\\'")}', '${s.admission_no || ''}')">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  }
}

window.StudentsView = new StudentsView();
