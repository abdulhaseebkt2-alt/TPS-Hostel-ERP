/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Timetable & Coaching Schedule Management View
 * Table-driven layout matching Student Directory, with centered Liquid Glass dropdowns,
 * cascading Section & Sub-Section (Class) filters directly driven by Attendance & Section Management data.
 */

class TimetableView {
  constructor() {
    this.searchQuery = '';
    this.filterSection = 'all';
    this.filterGroup = 'all';
    this.filterDay = 'all';
    this.filterTeacher = 'all';
    this.filterStatus = 'all';
  }

  getMinimalIcon(name, size = 16, strokeWidth = 1.8) {
    switch (name) {
      case 'calendar':
      case 'timetable':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
      case 'search':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
      case 'plus':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
      case 'edit':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
      case 'trash':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
      case 'copy':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      case 'print':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`;
      case 'download':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
      case 'pin':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      default:
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;
    }
  }

  async render() {
    const [rawTimetables, groups, teachers, hostels] = await Promise.all([
      db.getTable('timetables'),
      window.AttendanceService.getClassGroups(),
      db.getTable('teachers'),
      window.HostelService.getAllHostels()
    ]);

    const sections = window.AttendanceService.getSections();
    const daysOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };

    // Build unified timetable list
    let allSlots = [...(rawTimetables || [])];

    // If any classroom doesn't have explicit timetable rows yet, include its default timing across days (unless user configured/cleared slots)
    groups.forEach(g => {
      if (g.timetable_configured) return;
      const hasEntries = allSlots.some(t => t.group_id === g.id);
      if (!hasEntries) {
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(d => {
          allSlots.push({
            id: `synthetic-${g.id}-${d.toLowerCase()}`,
            group_id: g.id,
            day: d,
            day_of_week: d,
            period_number: 1,
            period_name: 'Session Slot',
            start_time: g.start_time || '18:00',
            end_time: g.end_time || '19:00',
            subject: g.group_name,
            teacher_id: g.teacher_id || null,
            room_name: g.room_name || 'Study Hall',
            room_location: g.room_name || 'Study Hall',
            notes: 'Default classroom session',
            is_active: g.status !== 'inactive',
            order_index: 1,
            is_synthetic: true
          });
        });
      }
    });

    // Enrich each slot with section, group, teacher, and hostel metadata directly from Attendance & Section Management
    const enrichedSlots = allSlots.map(slot => {
      const group = groups.find(g => g.id === slot.group_id) || {
        id: slot.group_id,
        group_name: 'General Classroom',
        category: 'moral_section',
        assigned_student_ids: []
      };

      const normalizedSecId = window.AttendanceService.normalizeSectionId(group.category || group.section_id);
      const section = sections.find(s => s.id === normalizedSecId) || window.AttendanceService.getSectionById(normalizedSecId);

      const teacher = teachers.find(t => t.id === (slot.teacher_id || group.teacher_id)) || null;
      const hostel = hostels.find(h => h.id === group.hostel_id) || null;
      const dayName = slot.day || slot.day_of_week || 'Monday';

      return {
        ...slot,
        day: dayName,
        day_of_week: dayName,
        group,
        group_id: group.id,
        group_name: group.group_name,
        section,
        section_id: normalizedSecId,
        section_name: section ? section.name : 'Moral Section',
        teacher,
        teacher_name: teacher ? teacher.full_name : (slot.teacher_name || 'Not Assigned'),
        teacher_spec: teacher ? teacher.specialization : 'Faculty',
        hostel,
        hostel_name: hostel ? hostel.name : 'Campus Wide',
        room: slot.room_location || slot.room_name || group.room_name || 'General Hall',
        enrolledCount: Array.isArray(group.assigned_student_ids) ? group.assigned_student_ids.length : 0,
        gender: group.gender || 'all'
      };
    });

    // Sub-sections (classes) list filtered by chosen section
    const currentSelectedSection = sections.find(s => s.id === this.filterSection);
    const availableGroupsForDropdown = groups.filter(g => {
      if (this.filterSection === 'all') return true;
      const gSec = window.AttendanceService.normalizeSectionId(g.category || g.section_id);
      return gSec === this.filterSection;
    });

    // Apply active filters safely
    const q = (this.searchQuery || '').toLowerCase().trim();
    const filtered = enrichedSlots.filter(s => {
      const matchSearch = !q ||
        (s.subject && String(s.subject).toLowerCase().includes(q)) ||
        (s.group_name && String(s.group_name).toLowerCase().includes(q)) ||
        (s.section_name && String(s.section_name).toLowerCase().includes(q)) ||
        (s.teacher_name && String(s.teacher_name).toLowerCase().includes(q)) ||
        (s.teacher_spec && String(s.teacher_spec).toLowerCase().includes(q)) ||
        (s.hostel_name && String(s.hostel_name).toLowerCase().includes(q)) ||
        (s.room && String(s.room).toLowerCase().includes(q)) ||
        (s.day && String(s.day).toLowerCase().includes(q)) ||
        (s.period_name && String(s.period_name).toLowerCase().includes(q)) ||
        (s.notes && String(s.notes).toLowerCase().includes(q));

      const matchSection = this.filterSection === 'all' || s.section_id === this.filterSection;
      const matchGroup = this.filterGroup === 'all' || s.group_id === this.filterGroup;
      const matchDay = this.filterDay === 'all' || (s.day && String(s.day).toLowerCase() === String(this.filterDay).toLowerCase());
      const matchTeacher = this.filterTeacher === 'all' || (s.teacher && s.teacher.id === this.filterTeacher) || s.teacher_id === this.filterTeacher;
      const matchStatus = this.filterStatus === 'all' ||
        (this.filterStatus === 'active' ? s.is_active !== false : s.is_active === false);

      return matchSearch && matchSection && matchGroup && matchDay && matchTeacher && matchStatus;
    });

    // Sort by Day of Week, then Start Time, then Period Order
    filtered.sort((a, b) => {
      const dayDiff = (daysOrder[a.day] || 99) - (daysOrder[b.day] || 99);
      if (dayDiff !== 0) return dayDiff;
      const timeDiff = String(a.start_time || '').localeCompare(String(b.start_time || ''));
      if (timeDiff !== 0) return timeDiff;
      return (Number(a.order_index) || 0) - (Number(b.order_index) || 0);
    });

    const isSuperAdmin = window.Auth && window.Auth.currentUser && window.Auth.currentUser.role === CONFIG.ROLES.SUPER_ADMIN;

    return `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div class="page-title-group" style="display:flex; align-items:center; gap:0.9rem;">
          <div>
            <h2 style="display:flex; align-items:center; gap:8px; margin:0; font-size:1.45rem;">
              ${this.getMinimalIcon('timetable', 24)}
              Timetable & Coaching Schedule Management
            </h2>
            <p style="margin:3px 0 0 0; color:var(--text-muted); font-size:0.85rem;">Schedule Moral Classes, Hostel Coaching, and Special Tuition across all sections with conflict detection</p>
          </div>
        </div>
        <div class="page-actions" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="App.exportTimetableCSV()" title="Export schedule to CSV">
            ${this.getMinimalIcon('download', 15)}
            Export CSV
          </button>
          <button class="btn btn-outline-primary btn-sm" onclick="App.printFullTimetable()" title="Print filtered timetable sheet">
            ${this.getMinimalIcon('print', 15)}
            Print Timetable
          </button>
          ${isSuperAdmin ? `
            <button class="btn btn-primary btn-sm" onclick="App.openAddTimetableModal()" title="Schedule a new class or coaching period">
              ${this.getMinimalIcon('plus', 15)}
              + Schedule New Class Slot
            </button>
          ` : ''}
          <!-- Sleek Liquid Glass Back Button (Positioned at Far Right) -->
          <button class="btn btn-secondary btn-sm" onclick="App.navigateBack()" title="Back to Previous Page" style="border-radius:var(--radius-full); padding:0.45rem 0.95rem; font-weight:700; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(0,0,0,0.04); background:var(--glass-bg-hover); border:1px solid var(--border-color); cursor:pointer;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <span>Back</span>
          </button>
        </div>
      </div>

      <!-- Filter Toolbar with Centered Liquid Glass Dropdowns -->
      <div class="filter-toolbar">
        <div class="filter-search">
          ${this.getMinimalIcon('search', 16)}
          <input 
            type="text" 
            placeholder="Search by subject, classroom, section, teacher, room, topic..." 
            value="${this.searchQuery || ''}" 
            oninput="App.onTimetableSearch(this.value)"
            autofocus
          >
        </div>

        <!-- 1st Dropdown: Section Filter (Liquid Glass) -->
        <div class="glass-dropdown" id="tt-filter-section-dropdown">
          <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-filter-section-dropdown', event)" title="Filter by Academic / Coaching Section">
            <span>${(sections.find(s => s.id === this.filterSection)?.name) || 'All Sections'}</span>
            <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="glass-dropdown-menu">
            <div class="glass-dropdown-item ${this.filterSection === 'all' ? 'active' : ''}" onclick="App.onTimetableFilter('section', 'all')">
              All Sections
            </div>
            ${sections.map(sec => `
              <div class="glass-dropdown-item ${this.filterSection === sec.id ? 'active' : ''}" onclick="App.onTimetableFilter('section', '${sec.id}')">
                ${sec.name}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2nd Dropdown: Sub-Section (Classes) Filter (Liquid Glass) -->
        <div class="glass-dropdown" id="tt-filter-group-dropdown">
          <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-filter-group-dropdown', event)" title="Filter by Sub-Section (Classroom)">
            <span>${this.filterGroup === 'all' ? (this.filterSection !== 'all' && currentSelectedSection ? `All ${currentSelectedSection.name} Sub-Sections` : 'All Sub-Sections (Classes)') : ((availableGroupsForDropdown.find(g => g.id === this.filterGroup)?.group_name) || 'All Sub-Sections (Classes)')}</span>
            <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="glass-dropdown-menu" style="max-height: 260px; overflow-y: auto;">
            <div class="glass-dropdown-item ${this.filterGroup === 'all' ? 'active' : ''}" onclick="App.onTimetableFilter('group', 'all')">
              ${this.filterSection !== 'all' && currentSelectedSection ? `All ${currentSelectedSection.name} Sub-Sections` : 'All Sub-Sections (Classes)'}
            </div>
            ${availableGroupsForDropdown.map(g => {
              const gSec = window.AttendanceService.normalizeSectionId(g.category || g.section_id);
              const secObj = sections.find(s => s.id === gSec);
              const secLabel = this.filterSection === 'all' && secObj ? ` • ${secObj.name}` : '';
              return `
                <div class="glass-dropdown-item ${this.filterGroup === g.id ? 'active' : ''}" onclick="App.onTimetableFilter('group', '${g.id}')">
                  ${g.group_name}${secLabel}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3rd Dropdown: Day of Week Filter (Liquid Glass) -->
        <div class="glass-dropdown" id="tt-filter-day-dropdown">
          <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-filter-day-dropdown', event)" title="Filter by Day">
            <span>${this.filterDay === 'all' ? 'All Days (Mon - Sun)' : this.filterDay}</span>
            <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="glass-dropdown-menu">
            <div class="glass-dropdown-item ${this.filterDay === 'all' ? 'active' : ''}" onclick="App.onTimetableFilter('day', 'all')">
              All Days (Mon - Sun)
            </div>
            ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => `
              <div class="glass-dropdown-item ${this.filterDay === d ? 'active' : ''}" onclick="App.onTimetableFilter('day', '${d}')">
                ${d}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 4th Dropdown: Assigned Teacher Filter (Liquid Glass) -->
        <div class="glass-dropdown" id="tt-filter-teacher-dropdown">
          <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-filter-teacher-dropdown', event)" title="Filter by Assigned Teacher">
            <span>${this.filterTeacher === 'all' ? 'All Teachers' : ((teachers.find(t => t.id === this.filterTeacher)?.full_name) || 'All Teachers')}</span>
            <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="glass-dropdown-menu" style="max-height: 260px; overflow-y: auto;">
            <div class="glass-dropdown-item ${this.filterTeacher === 'all' ? 'active' : ''}" onclick="App.onTimetableFilter('teacher', 'all')">
              All Teachers
            </div>
            ${teachers.map(t => `
              <div class="glass-dropdown-item ${this.filterTeacher === t.id ? 'active' : ''}" onclick="App.onTimetableFilter('teacher', '${t.id}')">
                ${t.full_name} (${t.specialization || 'Teacher'})
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 5th Dropdown: Status Filter (Liquid Glass) -->
        <div class="glass-dropdown" id="tt-filter-status-dropdown">
          <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-filter-status-dropdown', event)" title="Filter by Status">
            <span>${this.filterStatus === 'active' ? 'Active Slots' : (this.filterStatus === 'inactive' ? 'Inactive / Suspended' : 'All Statuses')}</span>
            <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="glass-dropdown-menu">
            <div class="glass-dropdown-item ${this.filterStatus === 'all' ? 'active' : ''}" onclick="App.onTimetableFilter('status', 'all')">
              All Statuses
            </div>
            <div class="glass-dropdown-item ${this.filterStatus === 'active' ? 'active' : ''}" onclick="App.onTimetableFilter('status', 'active')">
              Active Slots
            </div>
            <div class="glass-dropdown-item ${this.filterStatus === 'inactive' ? 'active' : ''}" onclick="App.onTimetableFilter('status', 'inactive')">
              Inactive / Suspended
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule Table Card -->
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.65rem;">
          <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
            <h3 style="margin:0; font-size:1.05rem;">
              Master Timetable & Coaching Schedule 
              <span style="font-size:0.85rem; font-weight:normal; color:var(--text-muted);">
                (${filtered.length} scheduled slots found)
              </span>
            </h3>

            <!-- Dynamic Bulk Action Bar -->
            <div id="tt-bulk-bar" style="display:none; align-items:center; gap:0.5rem; background:rgba(220,38,38,0.08); border:1px solid rgba(220,38,38,0.22); padding:0.22rem 0.65rem; border-radius:var(--radius-full);">
              <span id="tt-selected-count-badge" class="badge badge-danger" style="font-size:0.75rem; font-weight:700;">
                0 Selected
              </span>
              <button type="button" class="btn btn-xs btn-danger" onclick="App.confirmBulkDeleteTimetableSlots()" style="display:inline-flex; align-items:center; gap:4px; font-weight:700; border-radius:var(--radius-full); padding:0.25rem 0.65rem; cursor:pointer;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete Selected
              </button>
              <button type="button" class="btn btn-xs btn-secondary" onclick="App.toggleSelectAllTimetableSlots(false)" style="border-radius:var(--radius-full); padding:0.25rem 0.55rem; font-size:0.75rem; cursor:pointer;">
                Clear
              </button>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:0.5rem;">
            ${this.filterSection !== 'all' || this.filterGroup !== 'all' || this.filterDay !== 'all' || this.filterTeacher !== 'all' || this.filterStatus !== 'all' || this.searchQuery ? `
              <button class="btn btn-xs btn-outline-secondary" onclick="App.resetTimetableFilters()" style="border-radius:var(--radius-full);">
                ✕ Reset Filters
              </button>
            ` : ''}
          </div>
        </div>

        <div class="card-body" style="padding:0;">
          ${filtered.length === 0 ? `
            <div class="empty-state" style="padding:3.5rem 1.5rem; text-align:center;">
              <div class="empty-state-icon" style="color:var(--text-muted); margin-bottom:0.75rem;">
                ${this.getMinimalIcon('timetable', 40)}
              </div>
              <h4 style="color:var(--text-primary); margin-bottom:0.35rem;">No Timetable Slots Found</h4>
              <p style="color:var(--text-secondary); font-size:0.88rem; max-width:420px; margin:0 auto 1.25rem auto;">
                No scheduled class or coaching periods matched your search and filter criteria.
              </p>
              ${isSuperAdmin ? `
                <button class="btn btn-primary btn-sm" onclick="App.openAddTimetableModal()">
                  ${this.getMinimalIcon('plus', 14)}
                  Schedule New Class Slot
                </button>
              ` : ''}
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="min-width:140px;">Day & Time</th>
                    <th style="min-width:200px;">Section & Sub-Section (Class)</th>
                    <th style="min-width:190px;">Subject & Topic</th>
                    <th style="min-width:180px;">Assigned Teacher</th>
                    <th style="min-width:140px;">Room / Location</th>
                    <th style="min-width:100px; text-align:center;">Students</th>
                    <th style="min-width:85px; text-align:center;">Status</th>
                    <th style="width:40px; text-align:center; padding-left:4px; padding-right:4px;">
                      <input type="checkbox" id="tt-select-all" onchange="App.toggleSelectAllTimetableSlots(this.checked)" style="width:16px; height:16px; accent-color:var(--primary-600); cursor:pointer; vertical-align:middle;" title="Select All Visible Slots">
                    </th>
                    <th style="text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map(slot => {
                    const dayBadgeColor = this.getDayBadgeColor(slot.day);
                    const secBadgeBg = slot.section && slot.section.badgeBg ? slot.section.badgeBg : 'rgba(13,92,58,0.1)';
                    const secColor = slot.section && slot.section.color ? slot.section.color : 'var(--primary-700)';

                    return `
                      <tr>
                        <!-- 1. Day & Timing -->
                        <td>
                          <div style="display:flex; flex-direction:column; gap:3px;">
                            <div style="display:flex; align-items:center; gap:5px;">
                              <span class="badge" style="background:${dayBadgeColor.bg}; color:${dayBadgeColor.color}; font-size:0.72rem; font-weight:700; padding:2px 7px;">
                                ${slot.day}
                              </span>
                              ${slot.period_name ? `
                                <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">
                                  ${slot.period_name}
                                </span>
                              ` : ''}
                            </div>
                            <div style="font-weight:800; font-family:monospace; color:var(--primary-700); font-size:0.92rem; margin-top:1px;">
                              ${slot.start_time} - ${slot.end_time}
                            </div>
                          </div>
                        </td>

                        <!-- 2. Section & Sub-Section (Class) -->
                        <td>
                          <div style="display:flex; flex-direction:column; gap:3px;">
                            <span class="badge" style="background:${secBadgeBg}; color:${secColor}; font-size:0.72rem; font-weight:700; width:fit-content; border:1px solid ${secColor}25;">
                              ${slot.section_name}
                            </span>
                            <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem; cursor:pointer;" onclick="App.openEditClassGroupModal('${slot.group_id}')" title="Click to view/edit classroom">
                              ${slot.group_name}
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">
                              ${slot.gender === 'male' ? '👦 Boys Only' : (slot.gender === 'female' ? '👧 Girls Only' : '👥 Co-Ed / All')} • ${slot.hostel_name}
                            </div>
                          </div>
                        </td>

                        <!-- 3. Subject & Topic -->
                        <td>
                          <div style="font-weight:700; color:var(--text-primary); font-size:0.88rem;">
                            ${slot.subject}
                          </div>
                          ${slot.notes ? `
                            <div style="font-size:0.76rem; color:var(--text-secondary); margin-top:2px; font-style:italic; line-height:1.35;">
                              ${slot.notes}
                            </div>
                          ` : `<div style="font-size:0.75rem; color:var(--text-muted);">Core curriculum syllabus</div>`}
                        </td>

                        <!-- 4. Assigned Teacher -->
                        <td>
                          <div class="table-user-cell">
                            <div style="width:30px; height:30px; border-radius:var(--radius-full); background:var(--primary-100); color:var(--primary-800); display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:0.78rem; flex-shrink:0;">
                              ${slot.teacher_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <div class="table-user-name" style="font-weight:700; font-size:0.86rem;">
                                ${slot.teacher_name}
                              </div>
                              <div class="table-user-sub" style="font-size:0.74rem;">
                                ${slot.teacher_spec}
                              </div>
                            </div>
                          </div>
                        </td>

                        <!-- 5. Room / Location -->
                        <td>
                          <div style="display:flex; align-items:center; gap:4px; font-size:0.85rem; font-weight:600; color:var(--text-primary);">
                            <span style="color:var(--text-muted);">${this.getMinimalIcon('pin', 13)}</span>
                            <span>${slot.room}</span>
                          </div>
                        </td>

                        <!-- 6. Enrolled Students -->
                        <td style="text-align:center;">
                          <span class="badge badge-neutral" style="font-size:0.76rem; font-weight:700; padding:3px 8px; cursor:pointer;" onclick="App.openEditClassGroupModal('${slot.group_id}')" title="View student roster">
                            👥 ${slot.enrolledCount}
                          </span>
                        </td>

                        <!-- 7. Status -->
                        <td style="text-align:center;">
                          <span class="badge ${slot.is_active !== false ? 'badge-success' : 'badge-neutral'}" style="font-size:0.74rem;">
                            ${slot.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <!-- 8. Selection Checkbox -->
                        <td style="width:40px; text-align:center; vertical-align:middle; padding-left:4px; padding-right:4px;">
                          <input type="checkbox" class="tt-slot-checkbox" value="${slot.id}" data-group-id="${slot.group_id}" onchange="App.onTimetableSlotSelectionChange()" style="width:16px; height:16px; accent-color:var(--primary-600); cursor:pointer; vertical-align:middle;" title="Select this slot">
                        </td>

                        <!-- 9. Action Buttons -->
                        <td style="text-align:right; vertical-align:middle;">
                          <div style="display:inline-flex; align-items:center; gap:6px; justify-content:flex-end;">
                            <button class="icon-btn" onclick="App.openEditTimetableSlotModal('${slot.id}', '${slot.group_id}')" title="Edit Schedule Slot" style="width:28px; height:28px; border-radius:6px; border:1px solid var(--border-subtle); color:var(--text-muted); background:var(--bg-surface-secondary); display:inline-flex; align-items:center; justify-content:center;" onmouseover="this.style.color='var(--primary-700)';" onmouseout="this.style.color='var(--text-muted)';">
                              ${this.getMinimalIcon('edit', 13)}
                            </button>
                            <button class="icon-btn" onclick="App.openDuplicateTimetableSlotModal('${slot.id}', '${slot.group_id}')" title="Duplicate to other days" style="width:28px; height:28px; border-radius:6px; border:1px solid var(--border-subtle); color:var(--text-muted); background:var(--bg-surface-secondary); display:inline-flex; align-items:center; justify-content:center;" onmouseover="this.style.color='var(--primary-700)';" onmouseout="this.style.color='var(--text-muted)';">
                              ${this.getMinimalIcon('copy', 13)}
                            </button>
                            ${isSuperAdmin ? `
                              <button class="icon-btn" onclick="App.confirmDeleteTimetableSlot('${slot.id}', '${slot.group_id}')" title="Delete Schedule Slot" style="width:28px; height:28px; border-radius:6px; border:1px solid var(--border-subtle); color:var(--danger-solid); background:var(--bg-surface-secondary); display:inline-flex; align-items:center; justify-content:center;" onmouseover="this.style.background='rgba(220,38,38,0.08)';" onmouseout="this.style.background='var(--bg-surface-secondary)';">
                                ${this.getMinimalIcon('trash', 13)}
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
          `}
        </div>
      </div>
    `;
  }

  getDayBadgeColor(day) {
    switch (day) {
      case 'Monday': return { bg: 'rgba(5, 150, 105, 0.12)', color: '#047857' };
      case 'Tuesday': return { bg: 'rgba(2, 132, 199, 0.12)', color: '#0369a1' };
      case 'Wednesday': return { bg: 'rgba(124, 58, 237, 0.12)', color: '#6d28d9' };
      case 'Thursday': return { bg: 'rgba(217, 119, 6, 0.12)', color: '#b45309' };
      case 'Friday': return { bg: 'rgba(13, 92, 58, 0.15)', color: '#064e3b' };
      case 'Saturday': return { bg: 'rgba(234, 88, 12, 0.12)', color: '#c2410c' };
      case 'Sunday': return { bg: 'rgba(225, 29, 72, 0.12)', color: '#be123c' };
      default: return { bg: 'rgba(100, 116, 139, 0.12)', color: '#475569' };
    }
  }
}

window.TimetableView = new TimetableView();
