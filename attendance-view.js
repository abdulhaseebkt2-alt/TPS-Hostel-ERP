/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Attendance View: 3 Main Sections (Moral, Coaching, Extra), Multi-Classroom Engine,
 * Weekly Timetable Schedule & Date-wise Reports
 */

class AttendanceView {
  constructor() {
    this.selectedSectionId = 'moral_section';
    this.selectedGroupId = null;
    this.selectedTab = 'attendance'; // 'attendance' | 'timetable' | 'roster' | 'reports' | 'classrooms'
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.selectedTimetableDay = 'Monday';
    this.selectedPeriodId = null;
    this.timetableFilterView = 'grid'; // 'grid' | 'day'
    this.attendanceState = {};
    this.isStateInitialized = false;
  }

  getMinimalIcon(name, size = 16, strokeWidth = 1.8) {
    switch (name) {
      case 'book':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
      case 'academic':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`;
      case 'sparkle':
      case 'science':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>`;
      case 'clipboard':
      case 'attendance':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="m9 14 2 2 4-4"></path></svg>`;
      case 'calendar':
      case 'timetable':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
      case 'users':
      case 'roster':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
      case 'chart':
      case 'reports':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`;
      case 'settings':
      case 'classrooms':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
      case 'plus':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
      case 'edit':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
      case 'trash':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
      default:
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
    }
  }

  renderLiquidGlassCalendar(selectedDateStr) {
    const selectedDate = new Date(selectedDateStr || Date.now());
    if (this.calViewYear === undefined) {
      this.calViewYear = selectedDate.getFullYear();
      this.calViewMonth = selectedDate.getMonth();
    }

    const year = this.calViewYear;
    const month = this.calViewMonth;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthTitle = `${monthNames[month]} ${year}`;

    // First day index (0 = Sun, 1 = Mon...) -> Convert Mon=0, Sun=6
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let daysHtml = '';

    // Prev month trailing days
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      daysHtml += `<div class="glass-cal-day empty">${prevDay}</div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = dayStr === selectedDateStr;
      const isToday = dayStr === todayStr;

      let classes = 'glass-cal-day';
      if (isSelected) classes += ' selected';
      if (isToday) classes += ' today';

      daysHtml += `<div class="${classes}" onclick="App.selectAttendanceDate('${dayStr}', event)">${day}</div>`;
    }

    // Next month padding
    const totalRendered = startOffset + daysInMonth;
    const remaining = (7 - (totalRendered % 7)) % 7;
    for (let nextDay = 1; nextDay <= remaining; nextDay++) {
      daysHtml += `<div class="glass-cal-day empty">${nextDay}</div>`;
    }

    const displayFormatted = new Date(selectedDateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return `
      <div class="glass-datepicker-wrapper" id="attendance-datepicker">
        <button type="button" class="glass-datepicker-toggle" onclick="App.toggleAttendanceDatePicker(event)" title="Select Attendance Date">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary-700);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>${displayFormatted}</span>
          <svg class="arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>

        <div class="glass-datepicker-popover">
          <div class="glass-cal-header">
            <button type="button" class="glass-cal-nav-btn" onclick="App.navAttendanceCal(-1, event)" title="Previous Month">‹</button>
            <span class="glass-cal-title">${monthTitle}</span>
            <button type="button" class="glass-cal-nav-btn" onclick="App.navAttendanceCal(1, event)" title="Next Month">›</button>
          </div>
          <div class="glass-cal-weekdays">
            <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
          </div>
          <div class="glass-cal-days">
            ${daysHtml}
          </div>
          <div class="glass-cal-footer">
            <button type="button" class="glass-cal-today-btn" onclick="App.selectAttendanceDate('${todayStr}', event)">Today</button>
            <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${selectedDateStr}</span>
          </div>
        </div>
      </div>
    `;
  }

  async render() {
    const sections = window.AttendanceService.getSections();
    this.selectedSectionId = window.AttendanceService.normalizeSectionId(this.selectedSectionId);
    if (!sections.some(s => s.id === this.selectedSectionId)) {
      this.selectedSectionId = sections[0]?.id || 'moral_section';
    }

    const currentSection = window.AttendanceService.getSectionById(this.selectedSectionId);
    const allGroups = await window.AttendanceService.getClassGroups();
    const sectionGroups = await window.AttendanceService.getClassGroups(this.selectedSectionId);

    // If current selected group is not in this section, default to first in section
    if (!sectionGroups.some(g => g.id === this.selectedGroupId)) {
      this.selectedGroupId = sectionGroups[0]?.id || null;
      this.isStateInitialized = false;
      this.selectedPeriodId = null;
    }

    const currentGroup = sectionGroups.find(g => g.id === this.selectedGroupId) || sectionGroups[0] || null;
    if (currentGroup) {
      this.selectedGroupId = currentGroup.id;
    }

    const assignedStudents = currentGroup ? await window.AttendanceService.getStudentsInGroup(currentGroup.id) : [];
    const teachers = await db.getTable('teachers');
    const assignedTeacher = teachers.find(t => t.id === currentGroup?.teacher_id);
    const isSuperAdmin = window.Auth && window.Auth.isSuperAdmin();
    const canManageAttendance = window.Auth && window.Auth.canMarkAttendance();

    // Check if session exists for selected date
    const dateAttendance = currentGroup ? await window.AttendanceService.getClassroomDateAttendance(currentGroup.id, this.selectedDate) : null;

    // Detect scheduled periods for this classroom & date
    const scheduledInfo = currentGroup ? await window.AttendanceService.getCurrentScheduledPeriod(currentGroup.id, this.selectedDate) : { currentPeriod: null, todayPeriods: [], dayName: 'Monday', isLive: false };

    // Initialize state
    if (!this.isStateInitialized && assignedStudents.length > 0) {
      this.attendanceState = {};
      if (dateAttendance && dateAttendance.stateMap) {
        assignedStudents.forEach(s => {
          this.attendanceState[s.id] = dateAttendance.stateMap[s.id] || 'present';
        });
      } else {
        assignedStudents.forEach(s => {
          this.attendanceState[s.id] = 'present';
        });
      }
      this.isStateInitialized = true;
    }

    // Live counts
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    assignedStudents.forEach(s => {
      const st = this.attendanceState[s.id] || 'present';
      if (st === 'present' || st === 'late') presentCount++;
      else if (st === 'absent') absentCount++;
      else if (st === 'leave') leaveCount++;
    });

    const windowInfo = currentGroup
      ? window.AttendanceService.isAttendanceWindowOpen(currentGroup.start_time, currentGroup.end_time)
      : { isOpen: true, statusText: 'No Session Selected', minutesRemaining: 0 };

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            ${this.getMinimalIcon('clipboard', 24)}
            Attendance & Section Management
          </h2>
          <p>Academic & Moral Sections • Multi-Classrooms • Weekly Timetables • Reports</p>
        </div>
        <div class="page-actions">
          ${isSuperAdmin ? `
            <button class="btn btn-primary btn-sm" onclick="App.openCreateSectionModal()" title="Add a new academic section">
              ${this.getMinimalIcon('plus', 14)}
              Add Section
            </button>
            <button class="btn btn-outline-primary btn-sm" onclick="App.openCreateClassGroupModal('${this.selectedSectionId}')" title="Add a new classroom">
              ${this.getMinimalIcon('plus', 14)}
              Add Class Room
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.openManageSectionsModal()" title="Manage all sections">
              ${this.getMinimalIcon('settings', 14)}
              Manage Sections
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-sm" onclick="App.checkAutoAbsences()">
            ${this.getMinimalIcon('calendar', 14)}
            Audit Submissions
          </button>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- DYNAMIC SECTIONS GRID (With Direct Edit & Delete per Section) -->
      <!-- ==================================================================== -->
      <div class="section-nav-grid">
        ${sections.map(sec => {
          const normSec = window.AttendanceService.normalizeSectionId(sec.id);
          const secGroups = allGroups.filter(g => {
            const gSec = window.AttendanceService.normalizeSectionId(g.category || g.section_id);
            return gSec === normSec;
          });
          const totalEnrolled = secGroups.reduce((acc, g) => acc + (Array.isArray(g.assigned_student_ids) ? g.assigned_student_ids.length : 0), 0);
          const isSelected = this.selectedSectionId === normSec;

          return `
            <div class="section-hero-card ${isSelected ? 'active' : ''}" onclick="App.onSelectAttendanceSection('${normSec}')">
              <div class="section-hero-icon" style="background:${sec.badgeBg || 'rgba(13,92,58,0.08)'}; color:${sec.color || 'var(--primary-700)'};">
                ${this.getMinimalIcon(sec.icon || 'book', 20)}
              </div>
              <div class="section-hero-info">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                  <h4>${sec.name}</h4>
                  ${isSuperAdmin ? `
                    <div class="section-quick-actions" onclick="event.stopPropagation()">
                      <button class="icon-btn-minimal" onclick="App.openEditSectionModal('${sec.id}')" title="Edit Section Details">
                        ${this.getMinimalIcon('edit', 12)}
                      </button>
                      <button class="icon-btn-minimal danger" onclick="App.confirmDeleteSection('${sec.id}', '${sec.name.replace(/'/g, "\\'")}')" title="Delete Section">
                        ${this.getMinimalIcon('trash', 12)}
                      </button>
                    </div>
                  ` : ''}
                </div>
                <p>${sec.description}</p>
                <div class="section-hero-badge" style="background:${isSelected ? 'var(--primary-700)' : 'var(--glass-bg-subtle)'}; color:${isSelected ? '#ffffff' : 'var(--text-secondary)'};">
                  ${secGroups.length} Class Rooms • ${totalEnrolled} Students
                </div>
              </div>
            </div>
          `;
        }).join('')}

        ${isSuperAdmin ? `
          <div class="add-section-btn-card" onclick="App.openCreateSectionModal()" title="Add a new academic or coaching section">
            <div class="add-section-icon">
              ${this.getMinimalIcon('plus', 18)}
            </div>
            <div>
              <strong>+ Add Section</strong>
              <p>Create new section stream</p>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Class Rooms Navigation Bar (Identical .tab-nav CSS) -->
      ${sectionGroups.length > 0 ? `
        <div class="tab-nav" style="margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.35rem;">
          <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
            ${sectionGroups.map(g => `
              <button class="tab-btn ${this.selectedGroupId === g.id ? 'active' : ''}" onclick="App.onSelectAttendanceGroup('${g.id}')">
                ${this.getMinimalIcon('academic', 14)}
                <span>${g.group_name}</span>
                <span style="font-size:0.72rem; opacity:0.85; font-weight:700; background:rgba(0,0,0,0.06); padding:1px 6px; border-radius:var(--radius-full); margin-left:3px;">
                  ${Array.isArray(g.assigned_student_ids) ? g.assigned_student_ids.length : 0}
                </span>
              </button>
            `).join('')}
          </div>

          ${isSuperAdmin ? `
            <button class="tab-btn" onclick="App.openCreateClassGroupModal('${this.selectedSectionId}')" style="border: 1px dashed var(--primary-500); color: var(--primary-700); margin-left: auto;" title="Create new classroom in ${currentSection.name}">
              ${this.getMinimalIcon('plus', 13)}
              <span>Add Class Room</span>
            </button>
          ` : ''}
        </div>
      ` : ''}

      <!-- Section Navigation Sub-Tabs with Minimal Stroke Icons -->
      <div class="tab-nav" style="margin-bottom:1.25rem;">
        <button class="tab-btn ${this.selectedTab === 'attendance' ? 'active' : ''}" onclick="App.onSelectAttendanceTab('attendance')">
          ${this.getMinimalIcon('clipboard', 15)} <span>Live Attendance</span>
        </button>
        <button class="tab-btn ${this.selectedTab === 'timetable' ? 'active' : ''}" onclick="App.onSelectAttendanceTab('timetable')">
          ${this.getMinimalIcon('calendar', 15)} <span>Weekly Timetable</span>
        </button>
        <button class="tab-btn ${this.selectedTab === 'roster' ? 'active' : ''}" onclick="App.onSelectAttendanceTab('roster')">
          ${this.getMinimalIcon('users', 15)} <span>Students & Roster</span>
        </button>
        <button class="tab-btn ${this.selectedTab === 'reports' ? 'active' : ''}" onclick="App.onSelectAttendanceTab('reports')">
          ${this.getMinimalIcon('chart', 15)} <span>Records & Reports</span>
        </button>
        <button class="tab-btn ${this.selectedTab === 'classrooms' ? 'active' : ''}" onclick="App.onSelectAttendanceTab('classrooms')">
          ${this.getMinimalIcon('settings', 15)} <span>Classrooms Directory (${sectionGroups.length})</span>
        </button>
      </div>

      <!-- ==================================================================== -->
      <!-- TAB CONTENT ROUTER -->
      <!-- ==================================================================== -->

      ${sectionGroups.length === 0 ? `
        <div class="card" style="text-align:center; padding:3.5rem 1.5rem;">
          <div style="margin-bottom:0.75rem; color:var(--text-muted);">
            ${this.getMinimalIcon('settings', 40)}
          </div>
          <h3 style="color:var(--text-primary); margin-bottom:0.5rem;">No Class Rooms in "${currentSection.name}"</h3>
          <p style="color:var(--text-secondary); max-width:480px; margin:0 auto 1.5rem auto; font-size:0.9rem;">
            Create your first classroom under this section (e.g. "Moral Class STD-VIII Boys" or "Hostel Coaching Group 1") to set its weekly timetable, assign students and record attendance.
          </p>
          ${isSuperAdmin ? `
            <div style="display:flex; justify-content:center; gap:0.6rem; flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="App.openCreateClassGroupModal('${this.selectedSectionId}')">
                ${this.getMinimalIcon('plus', 15)}
                Create Class Room in ${currentSection.name}
              </button>
              <button class="btn btn-outline-danger" onclick="App.confirmDeleteSection('${currentSection.id}', '${currentSection.name.replace(/'/g, "\\'")}')">
                ${this.getMinimalIcon('trash', 15)}
                Delete Section
              </button>
            </div>
          ` : ''}
        </div>
      ` : `
        ${this.selectedTab === 'attendance' ? this.renderLiveAttendanceTab(currentSection, sectionGroups, currentGroup, assignedStudents, assignedTeacher, windowInfo, dateAttendance, scheduledInfo, presentCount, absentCount, leaveCount, isSuperAdmin) : ''}
        ${this.selectedTab === 'timetable' ? await this.renderWeeklyTimetableTab(currentSection, sectionGroups, currentGroup, teachers, isSuperAdmin) : ''}
        ${this.selectedTab === 'roster' ? await this.renderStudentRosterTab(currentSection, sectionGroups, currentGroup, assignedStudents, isSuperAdmin) : ''}
        ${this.selectedTab === 'reports' ? await this.renderReportsTab(currentSection, sectionGroups, currentGroup) : ''}
        ${this.selectedTab === 'classrooms' ? this.renderClassroomsTab(currentSection, sectionGroups, teachers, isSuperAdmin) : ''}
      `}
    `;
  }

  // --------------------------------------------------------------------------
  // SUB-TAB 1: LIVE ATTENDANCE ENGINE (WITH TIMETABLE LINKING & CLASS ACTIONS)
  // --------------------------------------------------------------------------
  renderLiveAttendanceTab(currentSection, sectionGroups, currentGroup, assignedStudents, assignedTeacher, windowInfo, dateAttendance, scheduledInfo, presentCount, absentCount, leaveCount, isSuperAdmin) {
    const { currentPeriod, todayPeriods, dayName, isLive } = scheduledInfo;
    const selectedSlot = todayPeriods.find(p => p.id === this.selectedPeriodId) || (isLive ? currentPeriod : null);

    return `
      <!-- Smart Timetable Schedule Banner (Live Period Detector) -->
      ${todayPeriods.length > 0 ? `
        <div class="live-timetable-banner">
          <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
            <div style="font-size:0.82rem; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem;">
              <span>${this.getMinimalIcon('calendar', 14)} ${dayName}'s Schedule:</span>
            </div>
            <div class="live-period-chips">
              <button class="live-period-chip ${!this.selectedPeriodId ? 'active' : ''}" onclick="App.onSelectAttendancePeriod(null)" title="Mark general session attendance">
                <span>Overall Session</span>
              </button>
              ${todayPeriods.map(p => {
                const isOngoing = isLive && currentPeriod && currentPeriod.id === p.id;
                const isChipSelected = this.selectedPeriodId === p.id;
                return `
                  <button class="live-period-chip ${isChipSelected ? 'active' : ''} ${isOngoing ? 'is-now' : ''}" onclick="App.onSelectAttendancePeriod('${p.id}')">
                    ${isOngoing ? `<span class="pulse-dot" title="Live Now"></span>` : ''}
                    <span>${p.period_name || 'Slot'}: ${p.start_time} - ${p.end_time}</span>
                    <strong style="font-size:0.76rem; opacity:0.9;">(${p.subject})</strong>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
          <button class="btn btn-xs btn-outline-primary" onclick="App.onSelectAttendanceTab('timetable')" style="border-radius:var(--radius-full);">
            Weekly Timetable ➔
          </button>
        </div>
      ` : ''}

      <!-- Attendance Control & Time Banner -->
      <div class="attendance-window-card">
        <div class="window-info">
          <div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">
            <h3 style="margin:0;">
              ${currentGroup.group_name}
            </h3>
            ${isSuperAdmin ? `
              <div style="display:inline-flex; align-items:center; gap:0.35rem; margin-left:0.25rem;">
                <button class="btn btn-xs btn-secondary" onclick="App.openEditClassGroupModal('${currentGroup.id}')" title="Edit this classroom">
                  ${this.getMinimalIcon('edit', 12)} Edit Class
                </button>
                <button class="btn btn-xs btn-outline-danger" onclick="App.confirmDeleteClassGroup('${currentGroup.id}', '${currentGroup.group_name.replace(/'/g, "\\'")}', ${assignedStudents.length})" title="Delete this classroom">
                  ${this.getMinimalIcon('trash', 12)} Delete Class
                </button>
              </div>
            ` : ''}
            ${selectedSlot ? `
              <span class="badge badge-success" style="font-size:0.75rem;">
                ${selectedSlot.period_name}: ${selectedSlot.subject} (${selectedSlot.start_time} – ${selectedSlot.end_time})
              </span>
            ` : ''}
            <span class="badge ${windowInfo.isOpen ? 'badge-success' : 'badge-danger'}" style="font-size:0.75rem;">
              ${windowInfo.isOpen ? 'Active Window' : 'Time Restricted'}
            </span>
            ${dateAttendance ? `
              <span class="badge badge-info" style="font-size:0.75rem;">
                ● Submitted (${new Date(dateAttendance.session.submitted_at || Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})
              </span>
            ` : `
              <span class="badge badge-warning" style="font-size:0.75rem;">
                Pending Submission
              </span>
            `}
          </div>
          <p style="margin-top:4px;">
            Section: <strong>${currentSection.name}</strong> • 
            Teacher: <strong>${selectedSlot && selectedSlot.teacher_name ? selectedSlot.teacher_name : (assignedTeacher ? assignedTeacher.full_name : 'Staff Assigned')}</strong> • 
            Time Slot: <strong>${selectedSlot ? `${selectedSlot.start_time} – ${selectedSlot.end_time}` : `${currentGroup.start_time} – ${currentGroup.end_time}`}</strong> • 
            Room: <strong>${selectedSlot && selectedSlot.room_location ? selectedSlot.room_location : (currentGroup.room_name || 'Study Hall')}</strong> • 
            Roster: <strong style="color:var(--primary-700);">${assignedStudents.length} Students</strong>
          </p>
        </div>

        <!-- Liquid Glass Calendar Date Selector -->
        <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; position:relative; z-index:50;">
          ${this.renderLiquidGlassCalendar(this.selectedDate)}
        </div>
      </div>

      <!-- Bulk Quick Action Bar -->
      <div class="attendance-bulk-bar">
        <div class="bulk-actions-group">
          <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Quick Actions:</span>
          <button class="btn btn-xs btn-outline-primary" onclick="App.setAllAttendance('present')" style="border-radius:var(--radius-full);">
            ✓ Mark All P
          </button>
          <button class="btn btn-xs btn-outline-danger" onclick="App.setAllAttendance('absent')" style="border-radius:var(--radius-full);">
            ✕ Mark All A
          </button>
          <button class="btn btn-xs btn-secondary" onclick="App.resetAttendanceToDefault()" style="border-radius:var(--radius-full);">
            Reset
          </button>
        </div>
        <div style="font-size:0.82rem; color:var(--text-secondary); font-weight:600;">
          Marking Date: <strong>${new Date(this.selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
        </div>
      </div>

      <!-- Student Touch Cards Grid with Light Aesthetic P, A, L buttons -->
      ${assignedStudents.length === 0 ? `
        <div class="card" style="text-align:center; padding:3rem 1.5rem;">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">👥</div>
          <h4 style="color:var(--text-primary); margin-bottom:0.35rem;">No Students Enrolled in this Classroom</h4>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1.25rem;">
            Assign students to "${currentGroup.group_name}" from the Student Roster tab.
          </p>
          <button class="btn btn-primary btn-sm" onclick="App.openAddStudentsToClassroomModal('${currentGroup.id}')">
            + Assign Students to Classroom
          </button>
        </div>
      ` : `
        <div class="attendance-grid">
          ${assignedStudents.map(s => {
            const currentStatus = this.attendanceState[s.id] || 'present';
            return `
              <div class="att-card status-${currentStatus}">
                <div class="att-student-header">
                  <img src="${(s.photo_url && !s.photo_url.includes('unsplash.com')) ? s.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')}" class="att-student-avatar" alt="photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                  <div class="att-student-info">
                    <h4>${s.full_name}</h4>
                    <p>${s.admission_no} • Class ${s.school_class} (${s.gender === 'male' ? 'Boy' : 'Girl'})</p>
                  </div>
                </div>

                <div class="att-status-buttons">
                  <button class="att-btn btn-p ${currentStatus === 'present' ? 'active' : ''}" onclick="App.setStudentAttendance('${s.id}', 'present')" title="Mark Present (P)">
                    <span>P</span>
                  </button>
                  <button class="att-btn btn-a ${currentStatus === 'absent' ? 'active' : ''}" onclick="App.setStudentAttendance('${s.id}', 'absent')" title="Mark Absent (A)">
                    <span>A</span>
                  </button>
                  <button class="att-btn btn-l ${currentStatus === 'leave' ? 'active' : ''}" onclick="App.setStudentAttendance('${s.id}', 'leave')" title="Mark Leave (L)">
                    <span>L</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Prominent Bottom Submit Bar -->
        <div class="card" style="margin-top:1.5rem; background:var(--glass-bg-hover); border:1.5px solid var(--primary-300); box-shadow:var(--shadow-md);">
          <div class="card-body" style="padding:1.25rem 1.75rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.25rem;">
            <div>
              <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.6px; color:var(--text-muted); font-weight:700;">
                Summary • ${currentGroup.group_name} (${this.selectedDate}) ${selectedSlot ? `• [${selectedSlot.period_name}: ${selectedSlot.subject}]` : ''}
              </div>
              <div style="display:flex; gap:0.65rem; align-items:center; margin-top:6px; flex-wrap:wrap;">
                <span class="badge badge-success" style="font-size:0.85rem; padding:4px 10px; font-weight:700;">
                  ✓ ${presentCount} Present
                </span>
                <span class="badge badge-danger" style="font-size:0.85rem; padding:4px 10px; font-weight:700;">
                  ✕ ${absentCount} Absent
                </span>
                <span class="badge badge-warning" style="font-size:0.85rem; padding:4px 10px; font-weight:700;">
                  ⏳ ${leaveCount} Leave
                </span>
                <span style="font-size:0.82rem; color:var(--text-secondary); font-weight:600; margin-left:4px;">
                  Total: ${assignedStudents.length} Students
                </span>
              </div>
            </div>

            <div style="display:flex; gap:0.65rem; align-items:center;">
              <button class="btn btn-primary btn-lg" onclick="App.submitCurrentAttendance()" style="padding:0.65rem 1.75rem; font-size:0.95rem; font-weight:700; box-shadow:0 6px 18px rgba(13, 92, 58, 0.35); display:inline-flex; align-items:center; gap:6px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Submit
              </button>
            </div>
          </div>
        </div>
      `}
    `;
  }

  // --------------------------------------------------------------------------
  // SUB-TAB 2: WEEKLY TIMETABLE (VISUAL GRID & DAY VIEW)
  // --------------------------------------------------------------------------
  async renderWeeklyTimetableTab(currentSection, sectionGroups, currentGroup, teachers, isSuperAdmin) {
    const days = CONFIG.TIMETABLE_DAYS || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const allTimetables = await window.AttendanceService.getClassroomTimetables(currentGroup.id);

    const targetDate = new Date();
    const todayName = days[(targetDate.getDay() + 6) % 7]; // Monday=0..Sunday=6

    return `
      <!-- Timetable Header Card -->
      <div class="timetable-header-card">
        <div>
          <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
            <h3 style="margin:0; font-size:1.15rem; color:var(--text-primary);">
              🗓️ Weekly Timetable: ${currentGroup.group_name}
            </h3>
            <span class="badge badge-success" style="font-size:0.75rem;">
              ${allTimetables.length} Scheduled Periods
            </span>
          </div>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-top:4px;">
            Section: <strong>${currentSection.name}</strong> • 
            Room: <strong>${currentGroup.room_name || 'Study Hall'}</strong> • 
            Schedule spans Monday through Sunday with customizable periods.
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <!-- View Toggle: Weekly 7-Day Grid vs Single Day Focus -->
          <div style="display:flex; background:var(--glass-bg-subtle); padding:2px; border-radius:var(--radius-full); border:1px solid var(--border-color);">
            <button class="btn btn-xs ${this.timetableFilterView === 'grid' ? 'btn-primary' : 'btn-secondary'}" onclick="App.onSetTimetableFilterView('grid')" style="border-radius:var(--radius-full);">
              📅 7-Day Grid
            </button>
            <button class="btn btn-xs ${this.timetableFilterView === 'day' ? 'btn-primary' : 'btn-secondary'}" onclick="App.onSetTimetableFilterView('day')" style="border-radius:var(--radius-full);">
              📌 Day View
            </button>
          </div>

          ${isSuperAdmin ? `
            <button class="btn btn-outline-primary btn-sm" onclick="App.openCopyDayScheduleModal('${currentGroup.id}')" title="Copy an entire day schedule to other days">
              📋 Copy Day Schedule
            </button>
            <button class="btn btn-primary btn-sm" onclick="App.openAddClassroomPeriodModal('${currentGroup.id}', '${this.selectedTimetableDay}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              + Add Period
            </button>
          ` : ''}

          <button class="btn btn-secondary btn-sm" onclick="App.printClassroomTimetable('${currentGroup.id}')" title="Print Timetable Sheet">
            🖨️ Print
          </button>
        </div>
      </div>

      <!-- Day Pills for quick mobile/desktop day navigation -->
      <div class="tt-day-pill-nav">
        ${days.map(d => {
          const count = allTimetables.filter(t => t.day.toLowerCase() === d.toLowerCase()).length;
          const isSelected = this.selectedTimetableDay === d;
          const isToday = d.toLowerCase() === todayName.toLowerCase();
          return `
            <button class="tt-day-pill ${isSelected ? 'active' : ''}" onclick="App.onSelectTimetableDay('${d}')">
              <span>${d}</span>
              ${isToday ? `<span style="font-size:0.65rem; background:rgba(255,255,255,0.25); padding:1px 4px; border-radius:3px;">TODAY</span>` : ''}
              <span class="period-count-badge">${count}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- ================================================================== -->
      <!-- VIEW 1: FULL 7-DAY VISUAL WEEKLY GRID -->
      <!-- ================================================================== -->
      ${this.timetableFilterView === 'grid' ? `
        <div class="tt-weekly-grid">
          ${days.map(d => {
            const dayPeriods = allTimetables.filter(t => t.day.toLowerCase() === d.toLowerCase());
            const isToday = d.toLowerCase() === todayName.toLowerCase();

            return `
              <div class="tt-day-col ${isToday ? 'is-today' : ''}">
                <div class="tt-day-col-header">
                  <div class="tt-day-col-title">
                    <span>${d}</span>
                    ${isToday ? `<span class="today-tag">Today</span>` : ''}
                  </div>
                  ${isSuperAdmin ? `
                    <button class="btn btn-xs btn-outline-primary" onclick="App.openAddClassroomPeriodModal('${currentGroup.id}', '${d}')" title="Add period on ${d}" style="padding:1px 6px; font-size:0.75rem; border-radius:var(--radius-full);">
                      + Add
                    </button>
                  ` : ''}
                </div>

                <div class="tt-period-list">
                  ${dayPeriods.length === 0 ? `
                    <div class="tt-empty-day">
                      <div style="font-size:1.5rem; margin-bottom:4px;">☕</div>
                      <div>No periods scheduled for ${d}</div>
                      ${isSuperAdmin ? `
                        <button class="btn btn-xs btn-outline-primary" style="margin-top:8px;" onclick="App.openAddClassroomPeriodModal('${currentGroup.id}', '${d}')">
                          + Schedule Period
                        </button>
                      ` : ''}
                    </div>
                  ` : `
                    ${dayPeriods.map((p, pIdx) => this.renderPeriodCard(p, pIdx, dayPeriods.length, isSuperAdmin)).join('')}
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <!-- ================================================================== -->
        <!-- VIEW 2: SINGLE DAY FOCUS LIST -->
        <!-- ================================================================== -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                ${this.selectedTimetableDay}'s Timetable Schedule
              </h3>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
                ${currentGroup.group_name} • ${allTimetables.filter(t => t.day.toLowerCase() === this.selectedTimetableDay.toLowerCase()).length} periods scheduled
              </p>
            </div>
            ${isSuperAdmin ? `
              <button class="btn btn-primary btn-sm" onclick="App.openAddClassroomPeriodModal('${currentGroup.id}', '${this.selectedTimetableDay}')">
                + Add Period to ${this.selectedTimetableDay}
              </button>
            ` : ''}
          </div>

          <div class="card-body">
            ${(() => {
              const dayPeriods = allTimetables.filter(t => t.day.toLowerCase() === this.selectedTimetableDay.toLowerCase());
              if (dayPeriods.length === 0) {
                return `
                  <div style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted);">
                    <div style="font-size:2.5rem; margin-bottom:0.5rem;">🗓️</div>
                    <h4>No Timetable Slots Scheduled for ${this.selectedTimetableDay}</h4>
                    <p style="font-size:0.85rem; margin-bottom:1rem;">Add periods for this day or copy schedule from another day.</p>
                    <button class="btn btn-primary btn-sm" onclick="App.openAddClassroomPeriodModal('${currentGroup.id}', '${this.selectedTimetableDay}')">
                      + Add First Period to ${this.selectedTimetableDay}
                    </button>
                  </div>
                `;
              }
              return `
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1rem;">
                  ${dayPeriods.map((p, pIdx) => this.renderPeriodCard(p, pIdx, dayPeriods.length, isSuperAdmin)).join('')}
                </div>
              `;
            })()}
          </div>
        </div>
      `}
    `;
  }

  // Render individual period card
  renderPeriodCard(p, pIdx, totalInDay, isSuperAdmin) {
    const isEnabled = p.is_active !== false;
    return `
      <div class="tt-period-card ${isEnabled ? '' : 'disabled'}">
        <div class="tt-period-top">
          <div class="tt-period-time">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${p.start_time} – ${p.end_time}
          </div>
          <span class="badge ${isEnabled ? 'badge-success' : 'badge-neutral'}" style="font-size:0.68rem; padding:1px 6px;">
            ${p.period_name || `P${p.period_number || (pIdx + 1)}`}
          </span>
        </div>

        <div class="tt-period-subject">${p.subject}</div>

        <div class="tt-period-meta">
          <div class="tt-period-meta-item">
            <span>👨‍🏫</span>
            <span>${p.teacher_name || 'Staff Assigned'}</span>
          </div>
          <div class="tt-period-meta-item">
            <span>📍</span>
            <span>${p.room_location || 'Study Hall'}</span>
          </div>
        </div>

        ${p.notes ? `
          <div class="tt-period-notes">
            📝 ${p.notes}
          </div>
        ` : ''}

        ${isSuperAdmin ? `
          <div class="tt-period-actions">
            <div class="tt-card-btn-group">
              <!-- Reorder Buttons -->
              <button class="tt-btn-icon" onclick="App.movePeriodOrder('${p.id}', 'up')" title="Move Up" ${pIdx === 0 ? 'disabled style="opacity:0.3;"' : ''}>
                ▲
              </button>
              <button class="tt-btn-icon" onclick="App.movePeriodOrder('${p.id}', 'down')" title="Move Down" ${pIdx === totalInDay - 1 ? 'disabled style="opacity:0.3;"' : ''}>
                ▼
              </button>
              <!-- Enable / Disable Toggle -->
              <button class="tt-btn-icon" onclick="App.togglePeriodActiveStatus('${p.id}', ${!isEnabled})" title="${isEnabled ? 'Disable Period' : 'Enable Period'}">
                ${isEnabled ? '⏸️' : '▶️'}
              </button>
            </div>

            <div class="tt-card-btn-group">
              <!-- Duplicate Button -->
              <button class="tt-btn-icon" onclick="App.openDuplicateClassroomPeriodModal('${p.id}')" title="Duplicate this period to other days">
                ${this.getMinimalIcon('clipboard', 12)}
              </button>
              <!-- Edit Button -->
              <button class="tt-btn-icon" onclick="App.openEditClassroomPeriodModal('${p.id}')" title="Edit Period">
                ${this.getMinimalIcon('edit', 12)}
              </button>
              <!-- Delete Button -->
              <button class="tt-btn-icon danger" onclick="App.deleteClassroomPeriod('${p.id}')" title="Delete Period">
                ${this.getMinimalIcon('trash', 12)}
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // SUB-TAB 3: STUDENT ROSTER & TRANSFER MANAGER
  // --------------------------------------------------------------------------
  async renderStudentRosterTab(currentSection, sectionGroups, currentGroup, assignedStudents, isSuperAdmin) {
    const allStudents = await window.StudentService.getAllStudents();
    const hostels = await window.HostelService.getAllHostels();

    return `
      <div class="card">
        <div class="card-header">
          <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Student Roster: ${currentGroup.group_name}
            </h3>
            <span class="badge badge-neutral">${assignedStudents.length} Students Assigned</span>
          </div>

            <!-- Liquid Glass Classroom Switcher -->
            <div class="glass-dropdown" id="att-roster-group-dd">
              <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('att-roster-group-dd', event)" title="Switch Classroom Roster">
                <span>Classroom: ${currentGroup.group_name} (${assignedStudents.length})</span>
                <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div class="glass-dropdown-menu" style="max-height: 260px; overflow-y: auto;">
                ${sectionGroups.map(g => `
                  <div class="glass-dropdown-item ${g.id === currentGroup.id ? 'active' : ''}" onclick="App.onSelectAttendanceGroup('${g.id}')">
                    Classroom: ${g.group_name} (${Array.isArray(g.assigned_student_ids) ? g.assigned_student_ids.length : 0})
                  </div>
                `).join('')}
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="App.openAddStudentsToClassroomModal('${currentGroup.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              + Add Students
            </button>
          </div>
        </div>

        <div class="card-body" style="padding:0;">
          ${assignedStudents.length === 0 ? `
            <div style="text-align:center; padding:3rem 1.5rem;">
              <div style="font-size:2.5rem; margin-bottom:0.5rem;">📋</div>
              <h4 style="color:var(--text-primary); margin-bottom:0.35rem;">Classroom Roster is Empty</h4>
              <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1rem;">
                Add students to "${currentGroup.group_name}" or transfer them from another classroom.
              </p>
              <button class="btn btn-primary btn-sm" onclick="App.openAddStudentsToClassroomModal('${currentGroup.id}')">
                Add Students to this Roster
              </button>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>Admission No</th>
                    <th>Class / Gender</th>
                    <th>Hostel / Bed</th>
                    <th>Emergency Contact</th>
                    <th style="text-align:right;">Student Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${assignedStudents.map(s => {
                    const hostel = hostels.find(h => h.id === s.hostel_id);
                    return `
                      <tr>
                        <td>
                          <div style="display:flex; align-items:center; gap:0.65rem;">
                            <img src="${(s.photo_url && !s.photo_url.includes('unsplash.com')) ? s.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1.5px solid var(--border-subtle);" alt="${s.full_name}" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                            <div>
                              <strong>${s.full_name}</strong>
                              <div style="font-size:0.75rem; color:var(--text-muted);">${s.father_name ? `s/o ${s.father_name}` : ''}</div>
                            </div>
                          </div>
                        </td>
                        <td style="font-family:monospace; font-weight:600;">${s.admission_no}</td>
                        <td>${s.school_class} (${s.gender === 'male' ? 'Boy' : 'Girl'})</td>
                        <td>${hostel ? hostel.name : '—'}</td>
                        <td>${s.father_phone || s.emergency_phone || '—'}</td>
                        <td style="text-align:right;">
                          <div style="display:inline-flex; gap:0.35rem; align-items:center;">
                            <button class="btn btn-xs btn-outline-primary" onclick="App.openTransferStudentModal('${s.id}', '${currentGroup.id}')" title="Transfer student to another classroom">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:2px;"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                              Transfer
                            </button>
                            <button class="btn btn-xs btn-danger" onclick="App.confirmRemoveStudentFromClassroom('${s.id}', '${currentGroup.id}', '${s.full_name.replace(/'/g, "\\'")}')" title="Remove from this classroom">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              Remove
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

  // --------------------------------------------------------------------------
  // SUB-TAB 4: DATE-WISE RECORDS & REPORTS
  // --------------------------------------------------------------------------
  async renderReportsTab(currentSection, sectionGroups, currentGroup) {
    const reportData = await window.AttendanceService.getClassroomReport(currentGroup.id);
    const { group, sessions, students, stats } = reportData;

    return `
      <!-- Classroom Performance KPI Cards -->
      <div class="stats-grid" style="margin-bottom:1.5rem;">
        <div class="stat-card">
          <div class="stat-label">Total Recorded Sessions</div>
          <div class="stat-value">${stats.totalSessions}</div>
          <div class="stat-trend" style="color:var(--text-muted);">Recorded class meetings</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Enrolled Students</div>
          <div class="stat-value">${stats.enrolledStudents}</div>
          <div class="stat-trend" style="color:var(--primary-700);">Current classroom roster</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Overall Attendance Rate</div>
          <div class="stat-value" style="color:${stats.overallRate >= 85 ? '#059669' : (stats.overallRate >= 70 ? '#d97706' : '#dc2626')};">
            ${stats.overallRate}%
          </div>
          <div class="stat-trend" style="color:var(--text-muted);">Cumulative presence rate</div>
        </div>
      </div>

      <!-- Report Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              Attendance Register: ${currentGroup.group_name}
            </h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Section: ${currentSection.name} • ${sessions.length} Recorded Sessions</p>
          </div>

          <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
            <button class="btn btn-outline-primary btn-sm" onclick="App.exportClassroomAttendanceExcel('${currentGroup.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              Export Excel
            </button>
            <button class="btn btn-outline-primary btn-sm" onclick="App.exportClassroomAttendanceCSV('${currentGroup.id}')">
              Export CSV
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.print()">
              🖨️ Print Sheet
            </button>
          </div>
        </div>

        <div class="card-body" style="padding:0;">
          ${students.length === 0 ? `
            <div style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted);">
              No student attendance records recorded yet for this classroom.
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Admission No</th>
                    <th>Class</th>
                    <th>Sessions</th>
                    <th>Present (P)</th>
                    <th>Absent (A)</th>
                    <th>Leave (L)</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  ${students.map(item => {
                    const s = item.student;
                    const pct = item.percentage;
                    const color = pct >= 85 ? '#059669' : (pct >= 70 ? '#d97706' : '#dc2626');
                    return `
                      <tr>
                        <td><strong>${s.full_name}</strong></td>
                        <td style="font-family:monospace; font-size:0.8rem;">${s.admission_no}</td>
                        <td>${s.school_class}</td>
                        <td>${item.total}</td>
                        <td style="color:#059669; font-weight:700;">${item.present}</td>
                        <td style="color:#dc2626; font-weight:700;">${item.absent}</td>
                        <td style="color:#d97706; font-weight:700;">${item.leave}</td>
                        <td>
                          <div style="display:flex; align-items:center; gap:0.5rem;">
                            <span style="font-weight:800; color:${color}; width:38px;">${pct}%</span>
                            <div class="progress-bar-container" style="flex:1; min-width:60px;">
                              <div class="progress-bar-fill" style="width:${pct}%; background:${color};"></div>
                            </div>
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

  // --------------------------------------------------------------------------
  // SUB-TAB 5: CLASSROOMS DIRECTORY & SETTINGS
  // --------------------------------------------------------------------------
  renderClassroomsTab(currentSection, sectionGroups, teachers, isSuperAdmin) {
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <h3 style="margin:0; font-size:1.15rem; color:var(--text-primary);">
            Class Rooms in "${currentSection.name}"
          </h3>
          <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
            Manage timing, assigned faculty, study halls, and student quotas for each classroom.
          </p>
        </div>
        ${isSuperAdmin ? `
          <button class="btn btn-primary btn-sm" onclick="App.openCreateClassGroupModal('${this.selectedSectionId}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create New Class Room
          </button>
        ` : ''}
      </div>

      <div class="grid grid-2" style="gap:1.25rem;">
        ${sectionGroups.map(g => {
          const teacher = teachers.find(t => t.id === g.teacher_id);
          const studentCount = Array.isArray(g.assigned_student_ids) ? g.assigned_student_ids.length : 0;
          return `
            <div class="card" style="margin:0;">
              <div class="card-header">
                <div>
                  <h4 style="margin:0; font-size:1.05rem; font-weight:800; color:var(--text-primary);">${g.group_name}</h4>
                  <span class="badge badge-success" style="margin-top:4px; font-size:0.72rem;">${studentCount} Students Enrolled</span>
                </div>
                <span class="badge badge-neutral">${g.gender ? g.gender.toUpperCase() : 'ALL'}</span>
              </div>
              <div class="card-body">
                <div style="font-size:0.86rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:0.4rem; margin-bottom:1.25rem;">
                  <div>Assigned Teacher: <strong>${teacher ? teacher.full_name : 'Not Assigned'}</strong></div>
                  <div>Regular Timing: <strong>${g.start_time} – ${g.end_time}</strong></div>
                  <div>Room / Hall: <strong>${g.room_name || 'Study Hall'}</strong></div>
                </div>

                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                  <button class="btn btn-outline-primary btn-sm" onclick="App.onSelectAttendanceGroup('${g.id}'); App.onSelectAttendanceTab('timetable');">
                    ${this.getMinimalIcon('calendar', 13)} Timetable
                  </button>
                  <button class="btn btn-outline-primary btn-sm" onclick="App.onSelectAttendanceGroup('${g.id}'); App.onSelectAttendanceTab('roster');">
                    ${this.getMinimalIcon('users', 13)} Roster (${studentCount})
                  </button>
                  ${isSuperAdmin ? `
                    <button class="btn btn-secondary btn-sm" onclick="App.openEditClassGroupModal('${g.id}')">
                      ${this.getMinimalIcon('edit', 13)} Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="App.confirmDeleteClassGroup('${g.id}', '${g.group_name.replace(/'/g, "\\'")}', ${studentCount})">
                      ${this.getMinimalIcon('trash', 13)} Delete
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

window.AttendanceView = new AttendanceView();

