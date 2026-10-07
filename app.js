/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Master App Controller, Router, Modal Windows Engine & Complete UI Actions
 */

class AppController {
  constructor() {
    this.currentRoute = 'dashboard';
    this.init();
  }

  init() {
    this.applySavedTheme();
    this.applyBranding();
    this.bindEvents();
    this.updateSidebarUser();
    this.renderCurrentView();

    // Register Service Worker for PWA (HTTP/HTTPS only)
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
          console.log('[TPS IRP SW] Registration skipped:', err.message);
        });
      });
    }
  }

  applySavedTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  applyBranding() {
    const branding = CONFIG.getBranding ? CONFIG.getBranding() : CONFIG.DEFAULT_BRANDING;
    
    // 1. Sidebar Brand Text & Logo
    const brandTitleEl = document.getElementById('sidebar-brand-title');
    const brandSubEl = document.getElementById('sidebar-brand-subtitle');
    const brandLogoEl = document.getElementById('sidebar-brand-logo');
    const brandEditBtn = document.getElementById('sidebar-brand-edit-btn');
    
    if (brandTitleEl) brandTitleEl.textContent = branding.appName || 'TPS HOSTEL';
    if (brandSubEl) brandSubEl.textContent = branding.schoolName || 'THAIBAPUBLICSCHOOL';
    if (brandLogoEl && branding.logoUrl) {
      brandLogoEl.src = branding.logoUrl;
      brandLogoEl.alt = branding.schoolName || 'Logo';
    }

    // 2. Favicons
    const favicons = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
    favicons.forEach(fav => {
      if (branding.logoUrl) fav.href = branding.logoUrl;
    });

    // 3. Super Admin quick edit button visibility in sidebar header
    const isSuperAdmin = window.Auth && window.Auth.isSuperAdmin();
    if (brandEditBtn) {
      brandEditBtn.style.display = isSuperAdmin ? 'inline-flex' : 'none';
    }

    // 4. Document Title
    document.title = `${branding.appName || 'TPS Hostel'} – ${branding.schoolName || 'Thaiba Public School'}`;
  }

  onSidebarBrandClick() {
    if (window.Auth && window.Auth.isSuperAdmin()) {
      this.openEditBrandingModal();
    } else {
      this.navigateTo('dashboard');
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, next);
    this.showToast(`Theme switched to ${next} mode`, 'info');
  }

  bindEvents() {
    window.addEventListener('tps_auth_changed', () => {
      this.applyBranding();
      this.updateSidebarUser();
      this.renderCurrentView();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.glass-dropdown')) {
        document.querySelectorAll('.glass-dropdown.open').forEach(d => d.classList.remove('open'));
      }
      if (!e.target.closest('.glass-datepicker-wrapper')) {
        document.querySelectorAll('.glass-datepicker-wrapper.open').forEach(d => d.classList.remove('open'));
      }
      if (!e.target.closest('.glass-timepicker-wrapper')) {
        document.querySelectorAll('.glass-timepicker-wrapper.open').forEach(d => d.classList.remove('open'));
      }
    });
  }

  updateSidebarUser() {
    const user = window.Auth.currentUser;
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    const selectEl = document.getElementById('header-role-select');

    if (nameEl) {
      let displayName = user ? (user.full_name || user.email) : 'Guest User';
      if (displayName) {
        displayName = displayName.replace(/\s*\((?:Super\s*Admin|Admin|Warden|Teacher|Student|Parent)\)/gi, '').trim();
      }
      nameEl.textContent = displayName;
    }
    if (roleEl) roleEl.textContent = user ? user.role.replace('_', ' ') : 'Not Logged In';
    if (avatarEl && user && user.avatar_url) {
      avatarEl.innerHTML = `<img src="${user.avatar_url}" alt="Avatar">`;
    }
    if (selectEl && user) selectEl.value = user.role;
  }

  navigateTo(route, isBack = false) {
    if (!isBack && this.currentRoute && this.currentRoute !== route) {
      if (!this.routeHistory) this.routeHistory = [];
      this.routeHistory.push(this.currentRoute);
    }
    this.currentRoute = route;

    // Update active nav links
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-route') === route);
    });

    document.querySelectorAll('.mob-nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-route') === route);
    });

    // Close mobile sidebar if open
    const sidebar = document.querySelector('.app-sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');

    this.renderCurrentView();
  }

  navigateBack() {
    if (this.routeHistory && this.routeHistory.length > 0) {
      const prev = this.routeHistory.pop();
      this.navigateTo(prev || 'dashboard', true);
    } else {
      this.navigateTo('dashboard', true);
    }
  }

  handleGlobalHeaderSearch(query) {
    if (this.currentRoute === 'timetable' && window.TimetableView) {
      this.onTimetableSearch(query);
    } else if (this.currentRoute === 'students' && window.StudentsView) {
      this.onStudentSearch(query);
    } else if (this.currentRoute === 'staff' && window.StaffView) {
      this.onStaffSearch(query);
    } else if (this.currentRoute === 'users' && window.UsersView) {
      this.onUserSearch(query);
    } else {
      if (window.StudentsView) {
        window.StudentsView.searchQuery = query;
      }
      if (this.currentRoute === 'students') {
        this.renderCurrentView();
      }
    }
  }

  toggleMobileSidebar() {
    const sidebar = document.querySelector('.app-sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (sidebar) sidebar.classList.toggle('open');
    if (backdrop) backdrop.classList.remove('active');
  }

  async renderCurrentView() {
    const container = document.getElementById('main-view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px;">
        <div style="font-weight:600; color:var(--primary-700);">Loading Thaiba Hostel Portal...</div>
      </div>
    `;

    try {
      let html = '';
      switch (this.currentRoute) {
        case 'dashboard': html = await window.DashboardView.render(); break;
        case 'students': html = await window.StudentsView.render(); break;
        case 'staff': html = await window.StaffView.render(); break;
        case 'attendance': html = await window.AttendanceView.render(); break;
        case 'leave': html = await window.LeaveView.render(); break;
        case 'discipline': html = await window.DisciplineView.render(); break;
        case 'hostel': html = await window.HostelView.render(); break;
        case 'timetable': html = await window.TimetableView.render(); break;
        case 'reports': html = await window.ReportsView.render(); break;
        case 'notices': html = await window.NoticesView.render(); break;
        case 'users': html = await window.UsersView.render(); break;
        case 'settings': html = await window.SettingsView.render(); break;
        default: html = await window.DashboardView.render();
      }
      container.innerHTML = html;
    } catch (err) {
      console.error('[Render View Error]', err);
      container.innerHTML = `<div class="status-alert-banner danger">Failed to load view: ${err.message}</div>`;
    }
  }

  // Toast Notifications
  showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const titles = { success: 'Success', error: 'Error', warning: 'Attention', info: 'Notification' };
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ'}</div>
      <div class="toast-content">
        <div class="toast-title">${title || titles[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Reusable Modal Window
  openModal(title, bodyHtml, footerHtml = '', sizeClass = '') {
    const modalEl = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    const modalCard = modalEl.querySelector('.modal-card');

    modalCard.className = `modal-card ${sizeClass}`;
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modalFooter.innerHTML = footerHtml || `
      <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
    `;

    modalEl.classList.add('active');
  }

  closeModal() {
    const modalEl = document.getElementById('app-modal');
    if (modalEl) modalEl.classList.remove('active');
  }

  // ==========================================================================
  // ==========================================================================
  // TIMETABLE & COACHING ACTIONS & TABLE HANDLERS
  // ==========================================================================

  onTimetableSearch(query) {
    if (window.TimetableView) {
      window.TimetableView.searchQuery = query;
      this.renderCurrentView().then(() => {
        const input = document.querySelector('.filter-search input');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      });
    }
  }

  onTimetableFilter(key, value) {
    if (!window.TimetableView) return;
    if (key === 'section') {
      window.TimetableView.filterSection = value;
      window.TimetableView.filterGroup = 'all'; // Reset sub-section when section changes
    } else if (key === 'group') {
      window.TimetableView.filterGroup = value;
    } else if (key === 'day') {
      window.TimetableView.filterDay = value;
    } else if (key === 'teacher') {
      window.TimetableView.filterTeacher = value;
    } else if (key === 'status') {
      window.TimetableView.filterStatus = value;
    }
    this.renderCurrentView();
  }

  resetTimetableFilters() {
    if (window.TimetableView) {
      window.TimetableView.searchQuery = '';
      window.TimetableView.filterSection = 'all';
      window.TimetableView.filterGroup = 'all';
      window.TimetableView.filterDay = 'all';
      window.TimetableView.filterTeacher = 'all';
      window.TimetableView.filterStatus = 'all';
      this.renderCurrentView();
    }
  }

  setSelectedTimetableDay(day) {
    if (window.TimetableView) {
      window.TimetableView.filterDay = day;
      this.renderCurrentView();
    }
  }

  async openAddTimetableModal(selectedTeacherId = null) {
    const [sections, allGroups, teachers, rawTimetables] = await Promise.all([
      window.AttendanceService.getSections(),
      window.AttendanceService.getClassGroups(),
      db.getTable('teachers'),
      db.getTable('timetables')
    ]);

    if (!teachers || teachers.length === 0) {
      this.showToast('No faculty or usthads found in the staff directory.', 'warning');
      return;
    }

    const currentTeacher = (selectedTeacherId ? teachers.find(t => t.id === selectedTeacherId) : null) || teachers[0];
    const defaultSecId = sections[0]?.id || 'moral_section';
    const currentSecObj = sections.find(s => s.id === defaultSecId) || sections[0];
    const groupsForSec = allGroups.filter(g => {
      const gSec = window.AttendanceService.normalizeSectionId(g.category || g.section_id);
      return gSec === defaultSecId;
    });

    const teacherPeriods = (rawTimetables || []).filter(t => t.teacher_id === currentTeacher.id);

    const bodyHtml = `
      <form id="new-timetable-slot-form" onsubmit="event.preventDefault(); App.saveNewTimetableSlot(false);" style="display:flex; flex-direction:column; gap:1.25rem;">
        
        <!-- 1. TOP TEACHER HERO CAPSULE WITH BALANCED FIXED DIMENSIONS -->
        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(240,248,243,0.7) 100%); border:1px solid rgba(255,255,255,0.95); backdrop-filter:blur(24px) saturate(190%); -webkit-backdrop-filter:blur(24px) saturate(190%); box-shadow:0 8px 32px 0 rgba(13,92,58,0.06), inset 0 1px 0 0 rgba(255,255,255,0.95); border-radius:18px; padding:0.9rem 1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1.25rem; flex-wrap:wrap; position:relative; z-index:20;">
          
          <div style="display:flex; align-items:center; gap:0.95rem; min-width:0;">
            <div style="position:relative; flex-shrink:0;">
              <img 
                id="tt-teacher-avatar-preview" 
                src="${(currentTeacher.avatar_url && !currentTeacher.avatar_url.includes('unsplash.com')) ? currentTeacher.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')}" 
                alt="Teacher Photo" 
                style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2.5px solid rgba(255,255,255,0.95); box-shadow:0 4px 14px rgba(13,92,58,0.2); display:block;"
                onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')"
              >
              <div style="position:absolute; bottom:-1px; right:-1px; width:13px; height:13px; background:#10b981; border:2px solid #fff; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.15);" title="Active Faculty"></div>
            </div>

            <div style="min-width:0;">
              <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.8px; font-weight:800; color:var(--primary-800); opacity:0.85; margin-bottom:4px;">
                Faculty / Usthad
              </div>
              <!-- Custom Liquid Glass Teacher Dropdown (Fixed Width 280px) -->
              <div class="glass-dropdown" id="tt-teacher-dropdown" style="width:280px; position:relative;">
                <input type="hidden" name="teacher_id" id="tt-modal-teacher-input" value="${currentTeacher.id}">
                <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-teacher-dropdown', event)" style="font-weight:700; font-size:0.92rem; padding:0.5rem 1.05rem; border-radius:var(--radius-full); background:rgba(255,255,255,0.9); border:1px solid rgba(13,92,58,0.22); box-shadow:0 2px 8px rgba(0,0,0,0.03), inset 0 1px 0 0 rgba(255,255,255,0.9); width:100%; display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
                  <span id="tt-teacher-dropdown-label" style="font-weight:700; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                    ${currentTeacher.full_name}
                  </span>
                  <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="glass-dropdown-menu" style="width:280px; max-width:90vw; max-height:240px; overflow-y:auto;">
                  ${teachers.map(t => `
                    <div class="glass-dropdown-item ${t.id === currentTeacher.id ? 'active' : ''}" data-teacher-id="${t.id}" onclick="App.selectTeacherFromGlassDropdown('${t.id}', '${t.full_name.replace(/'/g, "\\'")}', '${t.avatar_url || ''}', '${(t.specialization || 'Faculty').replace(/'/g, "\\'")}', '${t.employee_id || 'Staff'}', event, 'modal')">
                      <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                        <img src="${(t.avatar_url && !t.avatar_url.includes('unsplash.com')) ? t.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid var(--border-color); flex-shrink:0;" alt="avatar">
                        <div style="min-width:0;">
                          <div style="font-weight:700; font-size:0.86rem; color:var(--text-primary);">${t.full_name}</div>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <span id="tt-teacher-workload-badge" class="badge badge-success" style="font-size:0.75rem; font-weight:700; padding:6px 14px; border-radius:var(--radius-full); box-shadow:0 2px 8px rgba(5,150,105,0.15);">
              📅 ${teacherPeriods.length} Active Class Slot(s)
            </span>
          </div>
        </div>

        <!-- 2. SECTION & SUB-SECTION (CLASSROOM) - FROSTED GLASS FORM GRID WITH CUSTOM DROPDOWNS -->
        <div style="background:rgba(255,255,255,0.55); border:1px solid rgba(255,255,255,0.8); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border-radius:18px; padding:1.25rem; box-shadow:0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 0 rgba(255,255,255,0.85); position:relative; z-index:10;">
          <div class="form-grid">
            <!-- Academic / Coaching Section (Custom Glass Dropdown) -->
            <div class="form-group" style="margin-bottom:0.85rem; position:relative;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Academic / Coaching Section <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <div class="glass-dropdown full-width" id="tt-section-dropdown">
                <input type="hidden" name="section_id" id="tt-modal-section-input" value="${defaultSecId}">
                <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-section-dropdown', event)" style="background:rgba(255,255,255,0.85); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem; width:100%; display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 0 rgba(255,255,255,0.9); cursor:pointer;">
                  <span id="tt-section-dropdown-label">${currentSecObj?.name || 'Moral Section'}</span>
                  <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="glass-dropdown-menu" style="width:100%; min-width:100%;">
                  ${sections.map(sec => `
                    <div class="glass-dropdown-item ${sec.id === defaultSecId ? 'active' : ''}" data-sec-id="${sec.id}" onclick="App.selectSectionFromGlassDropdown('${sec.id}', '${sec.name.replace(/'/g, "\\'")}', event, 'modal')">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:6px; background:${sec.badgeBg || 'rgba(13,92,58,0.1)'}; color:${sec.color || 'var(--primary-700)'};">
                          ${window.AttendanceView ? window.AttendanceView.getMinimalIcon(sec.icon || 'book', 14) : '📚'}
                        </span>
                        <span style="font-weight:600;">${sec.name}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Sub-Section (Classroom) (Custom Glass Dropdown) -->
            <div class="form-group" style="margin-bottom:0.85rem; position:relative;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Sub-Section (Classroom / Group) <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <div class="glass-dropdown full-width" id="tt-group-dropdown">
                <input type="hidden" name="group_id" id="tt-modal-group-input" value="${groupsForSec[0]?.id || ''}">
                <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-group-dropdown', event)" style="background:rgba(255,255,255,0.85); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem; width:100%; display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 0 rgba(255,255,255,0.9); cursor:pointer;">
                  <span id="tt-group-dropdown-label">${groupsForSec[0]?.group_name || 'Select Classroom'}</span>
                  <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="glass-dropdown-menu" id="tt-group-dropdown-menu" style="width:100%; min-width:100%; max-height:220px; overflow-y:auto;">
                  ${groupsForSec.length > 0 ? groupsForSec.map((g, idx) => `
                    <div class="glass-dropdown-item ${idx === 0 ? 'active' : ''}" data-group-id="${g.id}" onclick="App.selectGroupFromGlassDropdown('${g.id}', '${g.group_name.replace(/'/g, "\\'")}', event, 'modal')">
                      <div style="font-weight:600;">${g.group_name}</div>
                    </div>
                  `).join('') : `<div style="padding:8px 12px; font-size:0.8rem; color:var(--text-muted); text-align:center;">No classrooms found in this section</div>`}
                </div>
              </div>
            </div>

            <!-- Subject / Activity -->
            <div class="form-group" style="margin-bottom:0.85rem;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Subject / Activity Name <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <input 
                type="text" 
                class="form-control" 
                name="subject" 
                id="tt-modal-subject" 
                required 
                placeholder="e.g. Quran Recitation & Tajweed, Mathematics"
                value="${defaultSecId === 'moral_section' ? 'Quran Recitation & Tajweed' : (defaultSecId === 'coaching_section' ? 'Mathematics Coaching' : 'School Science Revision')}"
                style="background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem; box-shadow:0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 0 rgba(255,255,255,0.9);"
              >
            </div>

            <!-- Period Label -->
            <div class="form-group" style="margin-bottom:0.85rem;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Period Label / Slot Tag
              </label>
              <input 
                type="text" 
                class="form-control" 
                name="period_name" 
                id="tt-modal-period-name" 
                value="Period 1" 
                placeholder="e.g. Period 1, Evening Slot"
                style="background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem; box-shadow:0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 0 rgba(255,255,255,0.9);"
              >
            </div>

            <!-- Start Time (Liquid Glass Time Input with Direct Typing) -->
            <div class="form-group" style="margin-bottom:0.85rem; position:relative;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Start Time <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <input type="time" class="glass-time-input" name="start_time" id="tt-modal-start-time" value="18:00" required>
            </div>

            <!-- End Time (Liquid Glass Time Input with Direct Typing) -->
            <div class="form-group" style="margin-bottom:0.85rem; position:relative;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                End Time <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <input type="time" class="glass-time-input" name="end_time" id="tt-modal-end-time" value="19:00" required>
            </div>

            <!-- Room / Location -->
            <div class="form-group" style="margin-bottom:0.85rem;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Room / Hall Location
              </label>
              <input 
                type="text" 
                class="form-control" 
                name="room_name" 
                id="tt-modal-room" 
                value="Prayer Hall A" 
                placeholder="e.g. Prayer Hall A, Study Hall 1"
                style="background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem; box-shadow:0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 0 rgba(255,255,255,0.9);"
              >
            </div>

            <!-- Lesson Focus / Curriculum Notes -->
            <div class="form-group" style="margin-bottom:0.85rem;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Curriculum Focus / Notes
              </label>
              <input 
                type="text" 
                class="form-control" 
                name="notes" 
                id="tt-modal-notes" 
                placeholder="e.g. Surah An-Naba & Makharij drills"
                style="background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem; box-shadow:0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 0 rgba(255,255,255,0.9);"
              >
            </div>
          </div>

          <!-- 3. INTERACTIVE MULTI-DAY LIQUID GLASS CHIPS -->
          <div style="margin-top:0.85rem; padding-top:0.85rem; border-top:1px solid rgba(255,255,255,0.65);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
              <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary);">
                📅 Apply Schedule Across Days
              </span>
              <div style="display:flex; gap:5px;">
                <button type="button" class="btn btn-xs btn-secondary" onclick="App.setModalDaysPreset('all')" style="border-radius:var(--radius-full); font-size:0.72rem; padding:2px 8px; background:rgba(255,255,255,0.8); border:1px solid rgba(0,0,0,0.08);">All 7 Days</button>
                <button type="button" class="btn btn-xs btn-secondary" onclick="App.setModalDaysPreset('mon-thu')" style="border-radius:var(--radius-full); font-size:0.72rem; padding:2px 8px; background:rgba(255,255,255,0.8); border:1px solid rgba(0,0,0,0.08);">Mon - Thu</button>
                <button type="button" class="btn btn-xs btn-secondary" onclick="App.setModalDaysPreset('fri-sun')" style="border-radius:var(--radius-full); font-size:0.72rem; padding:2px 8px; background:rgba(255,255,255,0.8); border:1px solid rgba(0,0,0,0.08);">Fri - Sun</button>
              </div>
            </div>

            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, i) => `
                <label style="display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:var(--radius-full); background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); box-shadow:0 2px 6px rgba(0,0,0,0.03); font-size:0.82rem; font-weight:700; color:var(--text-primary); cursor:pointer; transition:all 0.15s ease;">
                  <input type="checkbox" name="apply_days" value="${d}" ${i === 0 ? 'checked' : ''} class="tt-day-checkbox" style="accent-color:var(--primary-600); cursor:pointer;">
                  <span>${d.slice(0, 3)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 4. LIVE TEACHER SCHEDULE WORKLOAD PREVIEW STRIP -->
        <div id="tt-teacher-live-schedule" style="background:rgba(255,255,255,0.45); border:1px solid rgba(255,255,255,0.7); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border-radius:16px; padding:0.95rem 1.15rem; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
          ${this.renderTeacherLiveSchedulePreview(currentTeacher, teacherPeriods, allGroups, sections)}
        </div>
      </form>
    `;

    this.openModal('Schedule Class by Teacher', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()" style="border-radius:var(--radius-full); padding:0.6rem 1.35rem; font-weight:600; background:rgba(255,255,255,0.65); border:1px solid var(--border-color);">
        Cancel
      </button>
      <button class="btn btn-outline-primary" onclick="App.saveNewTimetableSlot(true)" title="Save this class and assign another" style="border-radius:var(--radius-full); padding:0.6rem 1.45rem; font-weight:700; border:1.5px solid var(--primary-500); background:rgba(13,92,58,0.06); color:var(--primary-700); display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(13,92,58,0.08);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        <span>Save & Add Another</span>
      </button>
      <button class="btn btn-primary" onclick="App.saveNewTimetableSlot(false)" title="Save class" style="border-radius:var(--radius-full); padding:0.6rem 1.65rem; font-weight:700; background:linear-gradient(135deg, #0d5c3a 0%, #064e3b 100%); color:#fff; border:1px solid rgba(255,255,255,0.3); display:inline-flex; align-items:center; gap:6px; box-shadow:0 6px 20px rgba(13,92,58,0.35);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        <span>Save Class</span>
      </button>
    `, 'large');
  }

  selectTeacherFromGlassDropdown(teacherId, teacherName, avatarUrl, spec, employeeId, event, context = 'modal') {
    if (event) event.stopPropagation();
    const input = document.getElementById(context === 'edit' ? 'tt-edit-teacher-input' : 'tt-modal-teacher-input');
    const label = document.getElementById(context === 'edit' ? 'tt-edit-teacher-dropdown-label' : 'tt-teacher-dropdown-label');
    const badge = document.getElementById(context === 'edit' ? 'tt-edit-teacher-dropdown-badge' : 'tt-teacher-dropdown-badge');
    const dropdown = document.getElementById(context === 'edit' ? 'tt-edit-teacher-dropdown' : 'tt-teacher-dropdown');
    const avatar = document.getElementById(context === 'edit' ? 'tt-edit-teacher-avatar' : 'tt-teacher-avatar-preview');

    if (input) input.value = teacherId;
    if (label) label.textContent = teacherName;
    if (badge) badge.textContent = employeeId;
    if (avatar && avatarUrl) avatar.src = avatarUrl;

    if (dropdown) {
      dropdown.querySelectorAll('.glass-dropdown-item').forEach(item => {
        item.classList.toggle('active', item.dataset.teacherId === teacherId);
      });
      dropdown.classList.remove('open');
    }

    if (context !== 'edit') {
      this.onModalTeacherChange(teacherId);
    }
  }

  selectSectionFromGlassDropdown(secId, secName, event, context = 'modal') {
    if (event) event.stopPropagation();
    const input = document.getElementById(context === 'edit' ? 'tt-edit-section-input' : 'tt-modal-section-input');
    const label = document.getElementById(context === 'edit' ? 'tt-edit-section-dropdown-label' : 'tt-section-dropdown-label');
    const dropdown = document.getElementById(context === 'edit' ? 'tt-edit-section-dropdown' : 'tt-section-dropdown');

    if (input) input.value = secId;
    if (label) label.textContent = secName;

    if (dropdown) {
      dropdown.querySelectorAll('.glass-dropdown-item').forEach(item => {
        item.classList.toggle('active', item.dataset.secId === secId);
      });
      dropdown.classList.remove('open');
    }

    this.onModalSectionChange(secId, context);
  }

  selectGroupFromGlassDropdown(groupId, groupName, event, context = 'modal') {
    if (event) event.stopPropagation();
    const input = document.getElementById(context === 'edit' ? 'tt-edit-group-input' : 'tt-modal-group-input');
    const label = document.getElementById(context === 'edit' ? 'tt-edit-group-dropdown-label' : 'tt-group-dropdown-label');
    const dropdown = document.getElementById(context === 'edit' ? 'tt-edit-group-dropdown' : 'tt-group-dropdown');

    if (input) input.value = groupId;
    if (label) label.textContent = groupName;

    if (dropdown) {
      dropdown.querySelectorAll('.glass-dropdown-item').forEach(item => {
        item.classList.toggle('active', item.dataset.groupId === groupId);
      });
      dropdown.classList.remove('open');
    }
  }

  async onModalTeacherChange(teacherId) {
    const [teachers, rawTimetables, allGroups, sections] = await Promise.all([
      db.getTable('teachers'),
      db.getTable('timetables'),
      window.AttendanceService.getClassGroups(),
      window.AttendanceService.getSections()
    ]);

    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    // Update Photo
    const avatarEl = document.getElementById('tt-teacher-avatar-preview');
    if (avatarEl) {
      avatarEl.src = (teacher.avatar_url && !teacher.avatar_url.includes('unsplash.com')) ? teacher.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '');
    }

    // Update Subtitles
    const specEl = document.getElementById('tt-teacher-sub-spec');
    const emailEl = document.getElementById('tt-teacher-sub-email');
    if (specEl) specEl.textContent = teacher.specialization || 'Faculty';
    if (emailEl) emailEl.textContent = teacher.email || 'campus@thaibapublicschool.com';

    // Update Meta & Workload
    const teacherPeriods = (rawTimetables || []).filter(t => t.teacher_id === teacher.id);
    const workloadBadge = document.getElementById('tt-teacher-workload-badge');
    if (workloadBadge) {
      workloadBadge.innerText = `📅 ${teacherPeriods.length} Active Class Slot(s)`;
    }

    // Update live schedule strip
    const scheduleContainer = document.getElementById('tt-teacher-live-schedule');
    if (scheduleContainer) {
      scheduleContainer.innerHTML = this.renderTeacherLiveSchedulePreview(teacher, teacherPeriods, allGroups, sections);
    }
  }

  renderTeacherLiveSchedulePreview(teacher, teacherPeriods, allGroups, sections) {
    if (!teacherPeriods || teacherPeriods.length === 0) {
      return `
        <div style="padding:6px 4px; font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
          <span>✨</span>
          <span><strong>${teacher.full_name}</strong> has no other scheduled classes. Free for new assignments.</span>
        </div>
      `;
    }

    return `
      <div>
        <div style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span>Current Weekly Schedule • ${teacher.full_name}</span>
          <span style="color:var(--primary-700); font-weight:700;">${teacherPeriods.length} Classes Assigned</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:5px; max-height:140px; overflow-y:auto; padding-right:4px;">
          ${teacherPeriods.map(p => {
            const grp = allGroups.find(g => g.id === p.group_id);
            const normSec = window.AttendanceService.normalizeSectionId(grp?.category || grp?.section_id);
            const sec = sections.find(s => s.id === normSec);
            const subjectLabel = p.subject || grp?.group_name || 'Class Session';

            return `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.7); padding:6px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.9); box-shadow:0 2px 6px rgba(0,0,0,0.02); font-size:0.8rem; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px; min-width:0; flex-wrap:wrap;">
                  <span class="badge badge-neutral" style="font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:var(--radius-full);">${p.day || p.day_of_week}</span>
                  <span style="font-weight:800; color:var(--primary-700); font-family:monospace; font-size:0.86rem;">${p.start_time} - ${p.end_time}</span>
                  <span style="color:var(--text-primary); font-weight:700;">${subjectLabel}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                  <span style="font-size:0.74rem; color:var(--text-muted); font-weight:600;">
                    ${grp ? grp.group_name : 'Class'} (${sec ? sec.name : 'Dept'}) • ${p.room_location || p.room_name || 'Room'}
                  </span>
                  <div style="display:inline-flex; align-items:center; gap:3px;">
                    <button type="button" class="icon-btn" onclick="App.openEditTimetableSlotModal('${p.id}', '${p.group_id || ''}')" title="Edit Schedule Slot" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(13,92,58,0.2); background:rgba(255,255,255,0.85); color:var(--primary-700); display:inline-flex; align-items:center; justify-content:center; cursor:pointer;" onmouseover="this.style.background='rgba(13,92,58,0.1)';" onmouseout="this.style.background='rgba(255,255,255,0.85)';">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button type="button" class="icon-btn" onclick="App.confirmDeleteTimetableSlot('${p.id}', '${p.group_id || ''}')" title="Delete Schedule Slot" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(220,38,38,0.2); background:rgba(255,255,255,0.85); color:var(--danger-solid); display:inline-flex; align-items:center; justify-content:center; cursor:pointer;" onmouseover="this.style.background='rgba(220,38,38,0.1)';" onmouseout="this.style.background='rgba(255,255,255,0.85)';">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  setModalDaysPreset(preset) {
    const checkboxes = document.querySelectorAll('.tt-day-checkbox');
    if (!checkboxes || checkboxes.length === 0) return;

    checkboxes.forEach(cb => {
      if (preset === 'all') cb.checked = true;
      else if (preset === 'mon-thu') cb.checked = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'].includes(cb.value);
      else if (preset === 'fri-sun') cb.checked = ['Friday', 'Saturday', 'Sunday'].includes(cb.value);
      else cb.checked = false;
    });
  }

  async onModalSectionChange(sectionId, context = 'modal') {
    const allGroups = await window.AttendanceService.getClassGroups();
    const normSec = window.AttendanceService.normalizeSectionId(sectionId);
    const filteredGroups = allGroups.filter(g => {
      const gSec = window.AttendanceService.normalizeSectionId(g.category || g.section_id);
      return gSec === normSec;
    });

    const menu = document.getElementById(context === 'edit' ? 'tt-edit-group-dropdown-menu' : 'tt-group-dropdown-menu');
    const input = document.getElementById(context === 'edit' ? 'tt-edit-group-input' : 'tt-modal-group-input');
    const label = document.getElementById(context === 'edit' ? 'tt-edit-group-dropdown-label' : 'tt-group-dropdown-label');

    if (filteredGroups.length === 0) {
      if (menu) menu.innerHTML = `<div style="padding:8px 12px; font-size:0.8rem; color:var(--text-muted); text-align:center;">No classrooms found in this section</div>`;
      if (input) input.value = '';
      if (label) label.textContent = 'No classroom available';
    } else {
      const firstGrp = filteredGroups[0];
      if (input) input.value = firstGrp.id;
      if (label) label.textContent = firstGrp.group_name;
      if (menu) {
        menu.innerHTML = filteredGroups.map((g, idx) => `
          <div class="glass-dropdown-item ${idx === 0 ? 'active' : ''}" data-group-id="${g.id}" onclick="App.selectGroupFromGlassDropdown('${g.id}', '${g.group_name.replace(/'/g, "\\'")}', event, '${context}')">
            <div style="font-weight:600;">${g.group_name}</div>
          </div>
        `).join('');
      }
    }

    // Also update default subject placeholder based on section
    if (context !== 'edit') {
      const subjectInput = document.getElementById('tt-modal-subject');
      if (subjectInput && !subjectInput.value.trim()) {
        if (normSec === 'moral_section') subjectInput.value = 'Quran Recitation & Tajweed';
        else if (normSec === 'coaching_section') subjectInput.value = 'Mathematics Coaching';
        else subjectInput.value = 'Special Coaching & Tuition';
      }
    }
  }

  async saveNewTimetableSlot(keepTeacherOpen = false) {
    const form = document.getElementById('new-timetable-slot-form');
    if (!form) return;

    const formData = new FormData(form);
    const teacherId = formData.get('teacher_id') || document.getElementById('tt-modal-teacher-input')?.value;
    const groupId = formData.get('group_id') || document.getElementById('tt-modal-group-input')?.value;
    const subject = (formData.get('subject') || '').trim();
    const periodName = (formData.get('period_name') || 'Period 1').trim();
    const startTime = formData.get('start_time') || document.getElementById('tt-modal-start-time-input')?.value || '18:00';
    const endTime = formData.get('end_time') || document.getElementById('tt-modal-end-time-input')?.value || '19:00';
    const roomName = (formData.get('room_name') || 'Study Hall').trim();
    const notes = (formData.get('notes') || '').trim();

    if (!teacherId) {
      this.showToast('Please select a teacher / usthad.', 'warning');
      return;
    }
    if (!groupId) {
      this.showToast('Please select a sub-section / classroom.', 'warning');
      return;
    }
    if (!subject) {
      this.showToast('Please enter a subject / activity name.', 'warning');
      return;
    }
    if (!startTime || !endTime) {
      this.showToast('Please specify valid start and end times.', 'warning');
      return;
    }

    const selectedDays = formData.getAll('apply_days');
    if (selectedDays.length === 0) {
      this.showToast('Please check at least one day for the schedule.', 'warning');
      return;
    }

    try {
      const teachers = await db.getTable('teachers');
      const teacher = teachers.find(t => t.id === teacherId);

      for (const day of selectedDays) {
        const slotData = {
          group_id: groupId,
          day: day,
          day_of_week: day,
          period_name: periodName,
          subject: subject,
          start_time: startTime,
          end_time: endTime,
          teacher_id: teacherId,
          teacher_name: teacher ? teacher.full_name : 'Teacher',
          room_name: roomName,
          room_location: roomName,
          notes: notes,
          is_active: true
        };

        await window.AttendanceService.saveClassroomPeriod(slotData);
      }

      if (keepTeacherOpen) {
        this.showToast(`Saved "${subject}" (${selectedDays.length} days)! Ready to assign another class for ${teacher ? teacher.full_name : 'this teacher'}.`, 'success');
        // Refresh modal for the same teacher
        this.openAddTimetableModal(teacherId);
      } else {
        this.closeModal();
        this.showToast(`Successfully scheduled "${subject}" for ${teacher ? teacher.full_name : 'Teacher'} across ${selectedDays.length} day(s)!`, 'success');
      }

      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error', 'Schedule Validation Error');
    }
  }

  async openEditTimetableSlotModal(slotId, fallbackGroupId) {
    const allTimetables = await db.getTable('timetables');
    const allGroups = await window.AttendanceService.getClassGroups();
    const sections = window.AttendanceService.getSections();
    const teachers = await db.getTable('teachers');

    let slot = allTimetables.find(t => t.id === slotId);

    // If synthetic slot, build temporary object from group defaults
    if (!slot && slotId && slotId.startsWith('synthetic-')) {
      const match = slotId.match(/^synthetic-([a-zA-Z0-9_-]+)-([a-z]+)$/i);
      const groupId = match ? match[1] : (fallbackGroupId || allGroups[0]?.id);
      const dayRaw = match ? match[2] : 'monday';
      const dayName = dayRaw.charAt(0).toUpperCase() + dayRaw.slice(1);
      const group = allGroups.find(g => g.id === groupId) || allGroups[0];
      if (group) {
        slot = {
          id: null,
          group_id: group.id,
          day: dayName,
          day_of_week: dayName,
          period_name: 'Period 1',
          subject: group.group_name || 'Class Session',
          start_time: group.start_time || '18:00',
          end_time: group.end_time || '19:00',
          teacher_id: group.teacher_id || teachers[0]?.id,
          room_name: group.room_name || 'Study Hall',
          notes: '',
          is_active: true
        };
      }
    }

    if (!slot && fallbackGroupId) {
      const group = allGroups.find(g => g.id === fallbackGroupId) || allGroups[0];
      if (group) {
        slot = {
          id: null,
          group_id: group.id,
          day: 'Monday',
          day_of_week: 'Monday',
          period_name: 'Period 1',
          subject: group.group_name || 'Class Session',
          start_time: group.start_time || '18:00',
          end_time: group.end_time || '19:00',
          teacher_id: group.teacher_id || teachers[0]?.id,
          room_name: group.room_name || 'Study Hall',
          notes: '',
          is_active: true
        };
      }
    }

    if (!slot) {
      this.showToast('Schedule slot not found.', 'error');
      return;
    }

    const currentGroup = allGroups.find(g => g.id === slot.group_id) || allGroups[0];
    const currentNormSec = window.AttendanceService.normalizeSectionId(currentGroup?.category || currentGroup?.section_id);
    const currentSecObj = sections.find(s => s.id === currentNormSec) || sections[0];
    const currentTeacher = teachers.find(t => t.id === slot.teacher_id) || teachers[0];

    const groupsForSec = allGroups.filter(g => {
      const gSec = window.AttendanceService.normalizeSectionId(g.category || g.section_id);
      return gSec === currentNormSec;
    });

    const bodyHtml = `
      <form id="edit-timetable-slot-form" onsubmit="event.preventDefault(); App.saveEditedTimetableSlot('${slot.id || ''}');" style="display:flex; flex-direction:column; gap:1.15rem;">
        <input type="hidden" name="slot_id" value="${slot.id || ''}">

        <!-- TOP TEACHER CARD WITH BALANCED FIXED DIMENSIONS -->
        <div style="background:linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(240,248,243,0.7) 100%); border:1px solid rgba(255,255,255,0.95); backdrop-filter:blur(24px) saturate(190%); -webkit-backdrop-filter:blur(24px) saturate(190%); box-shadow:0 8px 32px 0 rgba(13,92,58,0.06), inset 0 1px 0 0 rgba(255,255,255,0.95); border-radius:18px; padding:0.9rem 1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1.25rem; flex-wrap:wrap; position:relative; z-index:20;">
          <div style="display:flex; align-items:center; gap:0.95rem; min-width:0;">
            <img 
              id="tt-edit-teacher-avatar" 
              src="${(currentTeacher.avatar_url && !currentTeacher.avatar_url.includes('unsplash.com')) ? currentTeacher.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')}" 
              alt="Teacher Photo" 
              style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2.5px solid rgba(255,255,255,0.95); box-shadow:0 4px 14px rgba(13,92,58,0.2); flex-shrink:0;"
              onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')"
            >
            <div style="min-width:0;">
              <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.8px; font-weight:800; color:var(--primary-800); opacity:0.85; margin-bottom:4px;">
                Assigned Faculty / Usthad
              </div>
              <div class="glass-dropdown" id="tt-edit-teacher-dropdown" style="width:280px; position:relative;">
                <input type="hidden" name="teacher_id" id="tt-edit-teacher-input" value="${currentTeacher.id}">
                <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-edit-teacher-dropdown', event)" style="font-weight:700; font-size:0.92rem; padding:0.5rem 1.05rem; border-radius:var(--radius-full); background:rgba(255,255,255,0.85); border:1px solid rgba(13,92,58,0.22); box-shadow:0 2px 10px rgba(0,0,0,0.03), inset 0 1px 0 0 rgba(255,255,255,0.9); width:100%; display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
                  <span id="tt-edit-teacher-dropdown-label" style="font-weight:700; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                    ${currentTeacher.full_name}
                  </span>
                  <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="glass-dropdown-menu" style="width:280px; max-width:90vw; max-height:240px; overflow-y:auto;">
                  ${teachers.map(t => `
                    <div class="glass-dropdown-item ${t.id === currentTeacher.id ? 'active' : ''}" data-teacher-id="${t.id}" onclick="App.selectTeacherFromGlassDropdown('${t.id}', '${t.full_name.replace(/'/g, "\\'")}', '${t.avatar_url || ''}', '${(t.specialization || 'Faculty').replace(/'/g, "\\'")}', '${t.employee_id || 'Staff'}', event, 'edit')">
                      <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                        <img src="${(t.avatar_url && !t.avatar_url.includes('unsplash.com')) ? t.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid var(--border-color); flex-shrink:0;" alt="avatar">
                        <div style="min-width:0;">
                          <div style="font-weight:700; font-size:0.86rem; color:var(--text-primary);">${t.full_name}</div>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FORM GRID WITH CUSTOM LIQUID GLASS DROPDOWNS -->
        <div style="background:rgba(255,255,255,0.55); border:1px solid rgba(255,255,255,0.8); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border-radius:18px; padding:1.25rem; box-shadow:0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 0 rgba(255,255,255,0.85); position:relative; z-index:10;">
          <div class="form-grid">
            <!-- 1st Dropdown: Section (Custom Glass Dropdown) -->
            <div class="form-group" style="position:relative;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Academic / Coaching Section <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <div class="glass-dropdown full-width" id="tt-edit-section-dropdown">
                <input type="hidden" name="section_id" id="tt-edit-section-input" value="${currentNormSec}">
                <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-edit-section-dropdown', event)" style="background:rgba(255,255,255,0.85); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem; width:100%; display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 0 rgba(255,255,255,0.9); cursor:pointer;">
                  <span id="tt-edit-section-dropdown-label">${currentSecObj?.name || 'Section'}</span>
                  <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="glass-dropdown-menu" style="width:100%; min-width:100%;">
                  ${sections.map(sec => `
                    <div class="glass-dropdown-item ${sec.id === currentNormSec ? 'active' : ''}" data-sec-id="${sec.id}" onclick="App.selectSectionFromGlassDropdown('${sec.id}', '${sec.name.replace(/'/g, "\\'")}', event, 'edit')">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:6px; background:${sec.badgeBg || 'rgba(13,92,58,0.1)'}; color:${sec.color || 'var(--primary-700)'};">
                          ${window.AttendanceView ? window.AttendanceView.getMinimalIcon(sec.icon || 'book', 14) : '📚'}
                        </span>
                        <span style="font-weight:600;">${sec.name}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 2nd Dropdown: Sub-Section (Classroom) (Custom Glass Dropdown) -->
            <div class="form-group" style="position:relative;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Sub-Section (Classroom / Group) <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <div class="glass-dropdown full-width" id="tt-edit-group-dropdown">
                <input type="hidden" name="group_id" id="tt-edit-group-input" value="${slot.group_id || currentGroup?.id || ''}">
                <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('tt-edit-group-dropdown', event)" style="background:rgba(255,255,255,0.85); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem; width:100%; display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 0 rgba(255,255,255,0.9); cursor:pointer;">
                  <span id="tt-edit-group-dropdown-label">${currentGroup?.group_name || 'Select Classroom'}</span>
                  <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="glass-dropdown-menu" id="tt-edit-group-dropdown-menu" style="width:100%; min-width:100%; max-height:220px; overflow-y:auto;">
                  ${groupsForSec.map(g => `
                    <div class="glass-dropdown-item ${g.id === (slot.group_id || currentGroup?.id) ? 'active' : ''}" data-group-id="${g.id}" onclick="App.selectGroupFromGlassDropdown('${g.id}', '${g.group_name.replace(/'/g, "\\'")}', event, 'edit')">
                      <div style="font-weight:600;">${g.group_name}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Day of Week -->
            <div class="form-group">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Day of Week <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <select class="form-control" name="day" required style="background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem;">
                ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => `
                  <option value="${d}" ${(slot.day || slot.day_of_week) === d ? 'selected' : ''}>${d}</option>
                `).join('')}
              </select>
            </div>

            <!-- Period Label -->
            <div class="form-group">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Period Label / Slot Tag
              </label>
              <input type="text" class="form-control" name="period_name" value="${slot.period_name || 'Period 1'}" required style="background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem;">
            </div>

            <!-- Subject / Activity -->
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Subject / Activity Name <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <input type="text" class="form-control" name="subject" value="${slot.subject || currentGroup?.group_name || 'Class Session'}" required placeholder="e.g. Quran Recitation & Tajweed, Mathematics" style="background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem;">
            </div>

            <!-- Start Time (Liquid Glass Time Input with Direct Typing) -->
            <div class="form-group" style="position:relative;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Start Time <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <input type="time" class="glass-time-input" name="start_time" id="tt-edit-start-time" value="${slot.start_time || '18:00'}" required>
            </div>
            <!-- End Time (Liquid Glass Time Input with Direct Typing) -->
            <div class="form-group" style="position:relative;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                End Time <span class="required" style="color:var(--danger-solid);">*</span>
              </label>
              <input type="time" class="glass-time-input" name="end_time" id="tt-edit-end-time" value="${slot.end_time || '19:00'}" required>
            </div>

            <!-- Room / Location -->
            <div class="form-group">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Room / Hall Location
              </label>
              <input type="text" class="form-control" name="room_name" value="${slot.room_location || slot.room_name || 'Study Hall 1'}" placeholder="e.g. Prayer Hall A" style="background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem;">
            </div>

            <!-- Status -->
            <div class="form-group">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Status
              </label>
              <select class="form-control" name="is_active" style="background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem;">
                <option value="true" ${slot.is_active !== false ? 'selected' : ''}>Active</option>
                <option value="false" ${slot.is_active === false ? 'selected' : ''}>Inactive / Suspended</option>
              </select>
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label" style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:5px;">
                Lesson Notes / Curriculum Topic
              </label>
              <input type="text" class="form-control" name="notes" value="${slot.notes || ''}" placeholder="e.g. Bring study materials" style="background:rgba(255,255,255,0.75); border:1px solid rgba(255,255,255,0.9); border-radius:12px; font-weight:600; padding:0.6rem 0.95rem;">
            </div>
          </div>
        </div>
      </form>
    `;

    this.openModal(`Edit Schedule Slot: ${slot.subject || currentGroup?.group_name || 'Class Period'}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()" style="border-radius:var(--radius-full); padding:0.6rem 1.35rem; font-weight:600; background:rgba(255,255,255,0.65); border:1px solid var(--border-color);">
        Cancel
      </button>
      <button class="btn btn-primary" onclick="App.saveEditedTimetableSlot('${slot.id || ''}')" style="border-radius:var(--radius-full); padding:0.6rem 1.65rem; font-weight:700; background:linear-gradient(135deg, #0d5c3a 0%, #064e3b 100%); color:#fff; border:1px solid rgba(255,255,255,0.3); display:inline-flex; align-items:center; gap:6px; box-shadow:0 6px 20px rgba(13,92,58,0.35);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        <span>Save Changes</span>
      </button>
    `, 'large');
  }

  async saveEditedTimetableSlot(originalSlotId) {
    const form = document.getElementById('edit-timetable-slot-form');
    if (!form) return;

    const formData = new FormData(form);
    const slotId = formData.get('slot_id') || (originalSlotId && !originalSlotId.startsWith('synthetic-') ? originalSlotId : null);
    const groupId = formData.get('group_id') || document.getElementById('tt-edit-group-input')?.value;
    const day = formData.get('day');
    const subject = (formData.get('subject') || '').trim();
    const periodName = (formData.get('period_name') || 'Period 1').trim();
    const startTime = formData.get('start_time') || document.getElementById('tt-edit-start-time')?.value || '18:00';
    const endTime = formData.get('end_time') || document.getElementById('tt-edit-end-time')?.value || '19:00';
    const teacherId = formData.get('teacher_id') || document.getElementById('tt-edit-teacher-input')?.value;
    const roomName = (formData.get('room_name') || 'Study Hall').trim();
    const notes = (formData.get('notes') || '').trim();
    const isActive = formData.get('is_active') !== 'false';

    try {
      const teachers = await db.getTable('teachers');
      const teacher = teachers.find(t => t.id === teacherId);

      const slotData = {
        id: slotId,
        group_id: groupId,
        day: day,
        day_of_week: day,
        period_name: periodName,
        subject: subject,
        start_time: startTime,
        end_time: endTime,
        teacher_id: teacherId,
        teacher_name: teacher ? teacher.full_name : 'Teacher',
        room_name: roomName,
        room_location: roomName,
        notes: notes,
        is_active: isActive
      };

      await window.AttendanceService.saveClassroomPeriod(slotData);
      this.closeModal();
      this.showToast('Schedule slot successfully updated!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error', 'Error Updating Schedule');
    }
  }

  confirmDeleteTimetableSlot(slotId, groupId = '') {
    if (!slotId) return;

    this.openModal('Confirm Schedule Slot Removal', `
      <div style="text-align:center; padding:1.25rem 0.5rem;">
        <div style="font-size:2.5rem; color:var(--danger-solid); margin-bottom:0.5rem;">🗑️</div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Delete Timetable Schedule Slot?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); max-width:400px; margin:0 auto 1.25rem auto;">
          Are you sure you want to remove this scheduled class period from the timetable? This action cannot be undone.
        </p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeDeleteTimetableSlot('${slotId}', '${groupId || ''}')">Yes, Delete Slot</button>
    `);
  }

  async executeDeleteTimetableSlot(slotId, fallbackGroupId = '') {
    try {
      if (slotId && slotId.startsWith('synthetic-')) {
        const match = slotId.match(/^synthetic-([a-zA-Z0-9_-]+)-([a-z]+)$/i);
        const groupId = match ? match[1] : fallbackGroupId;
        const dayRaw = match ? match[2].toLowerCase() : '';

        const allGroups = await window.AttendanceService.getClassGroups();
        const group = allGroups.find(g => g.id === groupId);

        if (group) {
          // Mark group timetable as configured so deleted days don't auto-regenerate
          await db.updateRecord('class_groups', group.id, { timetable_configured: true });

          // Seed the remaining 6 days into timetables database if not already present
          const existingTimetables = await db.getTable('timetables');
          const groupSlots = existingTimetables.filter(t => t.group_id === group.id);

          if (groupSlots.length === 0) {
            const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            for (const d of allDays) {
              if (d.toLowerCase() !== dayRaw) {
                await db.insertRecord('timetables', {
                  group_id: group.id,
                  day: d,
                  day_of_week: d,
                  period_name: 'Session Slot',
                  subject: group.group_name,
                  start_time: group.start_time || '18:00',
                  end_time: group.end_time || '19:00',
                  teacher_id: group.teacher_id || null,
                  room_name: group.room_name || 'Study Hall',
                  room_location: group.room_name || 'Study Hall',
                  notes: 'Classroom session',
                  is_active: group.status !== 'inactive'
                });
              }
            }
          }
        }
      } else {
        // Real database record
        const allTimetables = await db.getTable('timetables');
        const slot = allTimetables.find(t => t.id === slotId);
        const targetGroupId = slot ? slot.group_id : fallbackGroupId;

        await window.AttendanceService.deleteClassroomPeriod(slotId);

        if (targetGroupId) {
          await db.updateRecord('class_groups', targetGroupId, { timetable_configured: true });
        }
      }

      this.closeModal();
      this.showToast('Schedule slot removed from timetable.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  toggleSelectAllTimetableSlots(checked) {
    const checkboxes = document.querySelectorAll('.tt-slot-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = checked;
    });
    const headerCb = document.getElementById('tt-select-all');
    if (headerCb) {
      headerCb.checked = checked;
      headerCb.indeterminate = false;
    }
    this.onTimetableSlotSelectionChange();
  }

  onTimetableSlotSelectionChange() {
    const checked = document.querySelectorAll('.tt-slot-checkbox:checked');
    const total = document.querySelectorAll('.tt-slot-checkbox');
    const bulkBar = document.getElementById('tt-bulk-bar');
    const badge = document.getElementById('tt-selected-count-badge');
    const headerCb = document.getElementById('tt-select-all');

    if (badge) badge.textContent = `${checked.length} Selected`;

    if (bulkBar) {
      bulkBar.style.display = checked.length > 0 ? 'inline-flex' : 'none';
    }

    if (headerCb && total.length > 0) {
      if (checked.length === 0) {
        headerCb.checked = false;
        headerCb.indeterminate = false;
      } else if (checked.length === total.length) {
        headerCb.checked = true;
        headerCb.indeterminate = false;
      } else {
        headerCb.checked = false;
        headerCb.indeterminate = true;
      }
    }
  }

  confirmBulkDeleteTimetableSlots() {
    const checked = document.querySelectorAll('.tt-slot-checkbox:checked');
    if (!checked || checked.length === 0) {
      this.showToast('Please select at least one schedule slot to delete.', 'warning');
      return;
    }

    const count = checked.length;
    this.openModal(`Bulk Delete ${count} Schedule Slot${count > 1 ? 's' : ''}`, `
      <div style="text-align:center; padding:1.25rem 0.5rem;">
        <div style="font-size:2.5rem; color:var(--danger-solid); margin-bottom:0.5rem;">🗑️</div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Delete ${count} Selected Schedule Slot${count > 1 ? 's' : ''}?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); max-width:400px; margin:0 auto 1.25rem auto;">
          Are you sure you want to permanently delete the <strong>${count}</strong> selected scheduled periods from the timetable? This action cannot be undone.
        </p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeBulkDeleteTimetableSlots()">Yes, Delete ${count} Slots</button>
    `);
  }

  async executeBulkDeleteTimetableSlots() {
    const checked = Array.from(document.querySelectorAll('.tt-slot-checkbox:checked'));
    if (checked.length === 0) return;

    try {
      this.closeModal();

      const syntheticSlots = [];
      const realSlotIds = [];
      const touchedGroupIds = new Set();

      checked.forEach(cb => {
        const slotId = cb.value;
        const groupId = cb.dataset.groupId || '';
        if (slotId.startsWith('synthetic-')) {
          syntheticSlots.push({ slotId, groupId });
        } else {
          realSlotIds.push(slotId);
        }
        if (groupId) touchedGroupIds.add(groupId);
      });

      // Handle synthetic slots deletion
      if (syntheticSlots.length > 0) {
        const allGroups = await window.AttendanceService.getClassGroups();
        const existingTimetables = await db.getTable('timetables');

        const groupDeletedDaysMap = {};
        syntheticSlots.forEach(({ slotId, groupId }) => {
          const match = slotId.match(/^synthetic-([a-zA-Z0-9_-]+)-([a-z]+)$/i);
          const gid = match ? match[1] : groupId;
          const day = match ? match[2].toLowerCase() : '';
          if (!groupDeletedDaysMap[gid]) groupDeletedDaysMap[gid] = new Set();
          if (day) groupDeletedDaysMap[gid].add(day);
        });

        for (const [gid, deletedDaysSet] of Object.entries(groupDeletedDaysMap)) {
          const group = allGroups.find(g => g.id === gid);
          if (!group) continue;

          await db.updateRecord('class_groups', group.id, { timetable_configured: true });

          const groupSlots = existingTimetables.filter(t => t.group_id === group.id);
          if (groupSlots.length === 0) {
            const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            for (const d of allDays) {
              if (!deletedDaysSet.has(d.toLowerCase())) {
                await db.insertRecord('timetables', {
                  group_id: group.id,
                  day: d,
                  day_of_week: d,
                  period_name: 'Session Slot',
                  subject: group.group_name,
                  start_time: group.start_time || '18:00',
                  end_time: group.end_time || '19:00',
                  teacher_id: group.teacher_id || null,
                  room_name: group.room_name || 'Study Hall',
                  room_location: group.room_name || 'Study Hall',
                  notes: 'Classroom session',
                  is_active: group.status !== 'inactive'
                });
              }
            }
          }
        }
      }

      // Handle real DB records deletion
      for (const slotId of realSlotIds) {
        await window.AttendanceService.deleteClassroomPeriod(slotId);
      }

      for (const gid of touchedGroupIds) {
        await db.updateRecord('class_groups', gid, { timetable_configured: true });
      }

      this.showToast(`Successfully deleted ${checked.length} schedule slot(s)!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openDuplicateTimetableSlotModal(slotId, groupId) {
    const allTimetables = await db.getTable('timetables');
    let slot = allTimetables.find(t => t.id === slotId);

    if (!slot) {
      const allGroups = await window.AttendanceService.getClassGroups();
      const group = allGroups.find(g => g.id === groupId);
      if (group) {
        slot = {
          id: null,
          group_id: group.id,
          day: 'Monday',
          period_name: 'Session Slot',
          subject: group.group_name,
          start_time: group.start_time || '18:00',
          end_time: group.end_time || '19:00',
          teacher_id: group.teacher_id,
          room_name: group.room_name || 'Study Hall',
          notes: ''
        };
      }
    }

    if (!slot) {
      this.showToast('Slot not found to duplicate.', 'error');
      return;
    }

    const currentDay = slot.day || slot.day_of_week || 'Monday';
    const otherDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].filter(d => d !== currentDay);

    const bodyHtml = `
      <div style="padding:0.5rem 0;">
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
          Duplicate <strong>"${slot.subject}"</strong> (${slot.start_time} - ${slot.end_time}) from <strong>${currentDay}</strong> to other days:
        </p>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.75rem;">
          ${otherDays.map(d => `
            <label style="display:flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface-secondary); cursor:pointer;">
              <input type="checkbox" name="dup_day" value="${d}" checked>
              <span style="font-weight:600; font-size:0.88rem;">${d}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    this.openModal(`Duplicate Schedule: ${slot.subject}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.executeDuplicateTimetableSlot('${slotId}', '${slot.group_id}')">Duplicate to Selected Days</button>
    `);
  }

  async executeDuplicateTimetableSlot(slotId, groupId) {
    const checkboxes = document.querySelectorAll('input[name="dup_day"]:checked');
    const targetDays = Array.from(checkboxes).map(c => c.value);

    if (targetDays.length === 0) {
      this.showToast('Please select at least one day to copy to.', 'warning');
      return;
    }

    try {
      const allTimetables = await db.getTable('timetables');
      const allGroups = await window.AttendanceService.getClassGroups();
      let slot = allTimetables.find(t => t.id === slotId);

      if (!slot) {
        const group = allGroups.find(g => g.id === groupId);
        if (group) {
          slot = {
            group_id: group.id,
            day: 'Monday',
            period_name: 'Session Slot',
            subject: group.group_name,
            start_time: group.start_time || '18:00',
            end_time: group.end_time || '19:00',
            teacher_id: group.teacher_id,
            room_name: group.room_name || 'Study Hall',
            notes: ''
          };
        }
      }

      if (!slot) throw new Error('Slot details not found.');

      for (const day of targetDays) {
        const clone = {
          group_id: slot.group_id,
          day: day,
          day_of_week: day,
          period_name: slot.period_name || 'Period 1',
          subject: slot.subject,
          start_time: slot.start_time,
          end_time: slot.end_time,
          teacher_id: slot.teacher_id,
          teacher_name: slot.teacher_name,
          room_name: slot.room_name || slot.room_location,
          room_location: slot.room_location || slot.room_name,
          notes: slot.notes || '',
          is_active: true
        };
        await window.AttendanceService.saveClassroomPeriod(clone);
      }

      this.closeModal();
      this.showToast(`Duplicated to ${targetDays.length} day(s) successfully!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async exportTimetableCSV() {
    const rawTimetables = await db.getTable('timetables');
    const groups = await window.AttendanceService.getClassGroups();
    const teachers = await db.getTable('teachers');
    const sections = window.AttendanceService.getSections();

    let csvContent = 'Day,Section,Classroom,Period,Subject,Start Time,End Time,Teacher,Room,Notes,Status\n';

    rawTimetables.forEach(t => {
      const group = groups.find(g => g.id === t.group_id);
      const normSec = window.AttendanceService.normalizeSectionId(group?.category || group?.section_id);
      const section = sections.find(s => s.id === normSec);
      const teacher = teachers.find(tch => tch.id === t.teacher_id);

      const row = [
        `"${t.day || t.day_of_week || 'Monday'}"`,
        `"${section ? section.name : 'Section'}"`,
        `"${group ? group.group_name : 'Classroom'}"`,
        `"${t.period_name || 'Period'}"`,
        `"${(t.subject || '').replace(/"/g, '""')}"`,
        `"${t.start_time || ''}"`,
        `"${t.end_time || ''}"`,
        `"${teacher ? teacher.full_name : (t.teacher_name || '')}"`,
        `"${t.room_location || t.room_name || ''}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        `"${t.is_active !== false ? 'Active' : 'Inactive'}"`
      ];

      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TPS_Hostel_Timetable_Schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Timetable CSV export downloaded.', 'success');
  }

  printFullTimetable() {
    window.print();
  }

  // ==========================================================================
  // HOSTEL & 8-BED ALLOCATION ACTIONS
  // ==========================================================================

  setHostelTab(tab) {
    window.HostelView.activeTab = tab;
    this.renderCurrentView();
  }

  onHostelFilterChange(val) {
    window.HostelView.selectedHostelFilter = val;
    this.renderCurrentView();
  }

  async openAssignBedModal(bedId, roomId) {
    const [beds, rooms, hostels, students] = await Promise.all([
      window.HostelService.getAllBeds(),
      window.HostelService.getAllRooms(),
      window.HostelService.getAllHostels(),
      window.StudentService.getAllStudents()
    ]);

    const targetBed = beds.find(b => b.id === bedId);
    if (!targetBed) return;

    const room = rooms.find(r => r.id === roomId);
    const hostel = room ? hostels.find(h => h.id === room.hostel_id) : null;

    const initialGender = hostel ? (hostel.gender === 'boys' ? 'male' : (hostel.gender === 'girls' ? 'female' : 'all')) : 'all';

    const currentStudent = targetBed.current_student_id ? students.find(s => s.id === targetBed.current_student_id) : null;

    // Save active state for modal filtering
    this.activeAssignBed = {
      bedId,
      roomId,
      targetBed,
      room,
      hostel,
      beds,
      rooms,
      allStudents: students,
      selectedStudentId: targetBed.current_student_id || null,
      searchQuery: '',
      filterTab: 'all',
      genderFilter: initialGender,
      classFilter: 'all'
    };

    // Extract unique classes for filter
    const classes = Array.from(new Set(students.map(s => s.school_class).filter(Boolean))).sort();

    const initialEligible = students.filter(s => {
      const sG = (s.gender || '').toLowerCase().trim();
      if (initialGender === 'male') return ['male', 'boy', 'boys', 'm'].includes(sG);
      if (initialGender === 'female') return ['female', 'girl', 'girls', 'f'].includes(sG);
      return true;
    });

    const bodyHtml = `
      <div class="bed-assign-container">
        <!-- Bed Context Header Card -->
        <div style="background:var(--glass-bg-subtle); padding:0.9rem 1.15rem; border-radius:var(--radius-lg); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.1rem; font-weight:800; color:var(--primary-700);">${targetBed.bed_number}</span>
              <span class="badge badge-neutral" style="font-size:0.75rem;">${targetBed.side || 'Bed Space'}</span>
              <span class="badge ${targetBed.status === 'occupied' ? 'badge-success' : 'badge-neutral'}" style="font-size:0.75rem;">
                ${targetBed.status === 'occupied' ? '● Occupied' : '○ Vacant'}
              </span>
            </div>
            <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:3px;">
              <strong>${hostel ? hostel.name : 'Hostel'}</strong> • Room <strong>${room ? room.room_number : ''}</strong> (${room ? room.floor : ''})
            </div>
          </div>

          ${currentStudent ? `
            <div style="display:flex; align-items:center; gap:0.5rem; background:rgba(251,191,36,0.12); border:1px solid rgba(251,191,36,0.3); padding:0.35rem 0.75rem; border-radius:var(--radius-md);">
              <img src="${(currentStudent.photo_url && !currentStudent.photo_url.includes('unsplash.com')) ? currentStudent.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')}" style="width:28px; height:28px; border-radius:var(--radius-full); object-fit:cover;" alt="avatar">
              <div style="font-size:0.78rem;">
                <div style="font-weight:700; color:var(--text-primary);">${currentStudent.full_name}</div>
                <div style="color:var(--text-muted); font-size:0.7rem;">Current Occupant</div>
              </div>
            </div>
          ` : `
            <div style="font-size:0.78rem; color:#059669; font-weight:600; background:rgba(16,185,129,0.08); padding:0.35rem 0.75rem; border-radius:var(--radius-md); border:1px solid rgba(16,185,129,0.2);">
              ✨ Ready for assignment
            </div>
          `}
        </div>

        <!-- Search & Filter Controls -->
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <div style="position:relative; flex:1; min-width:180px;">
              <input type="text" class="form-control" style="padding-left:2.2rem; font-size:0.85rem;" placeholder="Search by student name, admission no, village..." id="assign-bed-search-input" oninput="App.onSearchAssignBed(this.value)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>

            <!-- Gender Filter Dropdown -->
            <select class="form-control" style="width:auto; font-size:0.85rem;" id="assign-bed-gender-select" onchange="App.onFilterAssignBedGender(this.value)">
              <option value="all" ${initialGender === 'all' ? 'selected' : ''}>All Genders</option>
              <option value="male" ${initialGender === 'male' ? 'selected' : ''}>Boys</option>
              <option value="female" ${initialGender === 'female' ? 'selected' : ''}>Girls</option>
            </select>

            <!-- Class Filter Dropdown -->
            <select class="form-control" style="width:auto; font-size:0.85rem;" id="assign-bed-class-select" onchange="App.onFilterAssignBedClass(this.value)">
              <option value="all">All Classes</option>
              ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>

          <!-- Filter Pills (All / Unassigned) -->
          <div style="display:flex; gap:0.35rem; align-items:center;">
            <button class="btn btn-xs btn-primary" id="assign-bed-tab-all" onclick="App.onFilterAssignBedTab('all')" style="border-radius:var(--radius-full); padding:0.25rem 0.75rem;">
              All Eligible (${initialEligible.length})
            </button>
            <button class="btn btn-xs btn-secondary" id="assign-bed-tab-unassigned" onclick="App.onFilterAssignBedTab('unassigned')" style="border-radius:var(--radius-full); padding:0.25rem 0.75rem;">
              Unassigned Only (${initialEligible.filter(s => !s.bed_id || s.id === targetBed.current_student_id).length})
            </button>
          </div>
        </div>

        <!-- Interactive Student Cards List Container -->
        <div style="font-size:0.78rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">
          Select Student to Assign:
        </div>

        <div class="bed-student-list" id="assign-bed-student-list">
          ${this.renderAssignBedStudentListHtml()}
        </div>
      </div>
    `;

    const footerHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <div>
          ${currentStudent ? `
            <button class="btn btn-outline-danger btn-sm" onclick="App.executeVacateBed('${bedId}')" title="Unassign current occupant">
              Vacate Bed
            </button>
          ` : ''}
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" id="assign-bed-submit-btn" onclick="App.confirmBedAssignment('${bedId}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Assign Student to Bed
          </button>
        </div>
      </div>
    `;

    this.openModal(`Assign Bed: ${targetBed.bed_number} (Room ${room ? room.room_number : ''})`, bodyHtml, footerHtml);
  }

  renderAssignBedStudentListHtml() {
    if (!this.activeAssignBed) return '';

    const { allStudents, beds, rooms, selectedStudentId, targetBed, searchQuery, filterTab, classFilter, genderFilter } = this.activeAssignBed;

    const filtered = (allStudents || []).filter(s => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchQ = !q ||
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.admission_no && s.admission_no.toLowerCase().includes(q)) ||
        (s.village && s.village.toLowerCase().includes(q));

      const sG = (s.gender || '').toLowerCase().trim();
      const matchGender = genderFilter === 'all' ||
        (genderFilter === 'male' && ['male', 'boy', 'boys', 'm'].includes(sG)) ||
        (genderFilter === 'female' && ['female', 'girl', 'girls', 'f'].includes(sG));

      const matchClass = classFilter === 'all' || s.school_class === classFilter;
      const isCurrent = targetBed.current_student_id === s.id;
      const matchTab = filterTab === 'all' || !s.bed_id || isCurrent;

      return matchQ && matchGender && matchClass && matchTab;
    });

    if (filtered.length === 0) {
      return `
        <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); background:rgba(0,0,0,0.02); border-radius:var(--radius-lg); border:1px dashed var(--border-color);">
          <div style="font-size:1.5rem; margin-bottom:4px;">🔍</div>
          <div style="font-weight:600; font-size:0.88rem; color:var(--text-primary);">No matching students found</div>
          <div style="font-size:0.78rem; margin-top:2px;">Try adjusting your gender, class filter, or search query.</div>
        </div>
      `;
    }

    return filtered.map(s => {
      const isSelected = selectedStudentId === s.id;
      const isCurrent = targetBed.current_student_id === s.id;
      
      let otherBedInfo = '';
      if (s.bed_id && !isCurrent) {
        const otherBed = beds.find(b => b.id === s.bed_id);
        const otherRoom = otherBed ? rooms.find(r => r.id === otherBed.room_id) : null;
        otherBedInfo = otherRoom ? `Room ${otherRoom.room_number} • ${otherBed.bed_number}` : 'Assigned Elsewhere';
      }

      const isMale = ['male', 'boy', 'boys', 'm'].includes((s.gender || '').toLowerCase().trim());

      return `
        <div class="bed-student-card ${isSelected ? 'selected' : ''}" onclick="App.onSelectAssignBedStudent('${s.id}')">
          <div style="display:flex; align-items:center; gap:0.75rem; min-width:0;">
            <img src="${(s.photo_url && !s.photo_url.includes('unsplash.com')) ? s.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')}" class="bed-student-avatar" alt="${s.full_name}">
            <div style="min-width:0;">
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <strong style="font-size:0.92rem; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${s.full_name}
                </strong>
                <span class="badge badge-neutral" style="font-family:monospace; font-size:0.72rem; padding:1px 5px;">
                  ${s.admission_no}
                </span>
                <span class="badge badge-info" style="font-size:0.7rem; padding:1px 6px;">
                  ${s.school_class || 'STD'}
                </span>
                <span class="badge ${isMale ? 'badge-primary' : 'badge-warning'}" style="font-size:0.68rem; padding:1px 5px;">
                  ${isMale ? 'Boy' : 'Girl'}
                </span>
              </div>
              <div style="font-size:0.76rem; color:var(--text-muted); margin-top:2px; display:flex; align-items:center; gap:6px;">
                <span>${s.village ? `${s.village}, ` : ''}${s.district || 'Kerala'}</span>
                ${isCurrent ? `
                  <span class="badge badge-success" style="font-size:0.68rem;">Current Occupant</span>
                ` : otherBedInfo ? `
                  <span class="badge badge-warning" style="font-size:0.68rem;" title="Will transfer from ${otherBedInfo}">🔄 ${otherBedInfo}</span>
                ` : `
                  <span class="badge badge-success" style="font-size:0.68rem;">✨ Unassigned Bed</span>
                `}
              </div>
            </div>
          </div>

          <div class="bed-student-check">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
      `;
    }).join('');
  }

  onSearchAssignBed(val) {
    if (!this.activeAssignBed) return;
    this.activeAssignBed.searchQuery = val;
    this.refreshAssignBedList();
  }

  onFilterAssignBedGender(val) {
    if (!this.activeAssignBed) return;
    this.activeAssignBed.genderFilter = val;
    this.updateAssignBedCounts();
    this.refreshAssignBedList();
  }

  onFilterAssignBedClass(val) {
    if (!this.activeAssignBed) return;
    this.activeAssignBed.classFilter = val;
    this.updateAssignBedCounts();
    this.refreshAssignBedList();
  }

  updateAssignBedCounts() {
    if (!this.activeAssignBed) return;
    const { allStudents, genderFilter, classFilter, targetBed } = this.activeAssignBed;

    const matched = (allStudents || []).filter(s => {
      const sG = (s.gender || '').toLowerCase().trim();
      const matchGender = genderFilter === 'all' ||
        (genderFilter === 'male' && ['male', 'boy', 'boys', 'm'].includes(sG)) ||
        (genderFilter === 'female' && ['female', 'girl', 'girls', 'f'].includes(sG));
      const matchClass = classFilter === 'all' || s.school_class === classFilter;
      return matchGender && matchClass;
    });

    const tabAll = document.getElementById('assign-bed-tab-all');
    const tabUnassigned = document.getElementById('assign-bed-tab-unassigned');
    if (tabAll) tabAll.textContent = `All Eligible (${matched.length})`;
    if (tabUnassigned) tabUnassigned.textContent = `Unassigned Only (${matched.filter(s => !s.bed_id || s.id === targetBed.current_student_id).length})`;
  }

  onFilterAssignBedTab(tab) {
    if (!this.activeAssignBed) return;
    this.activeAssignBed.filterTab = tab;

    const tabAll = document.getElementById('assign-bed-tab-all');
    const tabUnassigned = document.getElementById('assign-bed-tab-unassigned');
    if (tabAll && tabUnassigned) {
      if (tab === 'all') {
        tabAll.className = 'btn btn-xs btn-primary';
        tabUnassigned.className = 'btn btn-xs btn-secondary';
      } else {
        tabAll.className = 'btn btn-xs btn-secondary';
        tabUnassigned.className = 'btn btn-xs btn-primary';
      }
    }

    this.refreshAssignBedList();
  }

  onSelectAssignBedStudent(studentId) {
    if (!this.activeAssignBed) return;
    this.activeAssignBed.selectedStudentId = studentId;
    this.refreshAssignBedList();
  }

  refreshAssignBedList() {
    const listEl = document.getElementById('assign-bed-student-list');
    if (listEl) {
      listEl.innerHTML = this.renderAssignBedStudentListHtml();
    }
  }

  async confirmBedAssignment(bedId) {
    const studentId = this.activeAssignBed ? this.activeAssignBed.selectedStudentId : null;

    if (!studentId) {
      this.showToast('Please select a student from the list to assign.', 'warning');
      return;
    }

    try {
      const result = await window.HostelService.assignStudentToBed(bedId, studentId);
      this.closeModal();
      this.showToast(`Assigned ${result.student.full_name} to Room ${result.room.room_number} (${result.bed.bed_number})!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  vacateBed(bedId, studentName) {
    this.openModal('Vacate Bed Slot', `
      <div style="text-align:center; padding:1rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">🛏️</div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Vacate this bed slot?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
          This will unassign <strong>${studentName}</strong> from this bed and mark the slot as available.
        </p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeVacateBed('${bedId}')">Yes, Vacate Bed</button>
    `);
  }

  async executeVacateBed(bedId) {
    try {
      await window.HostelService.vacateBed(bedId);
      this.closeModal();
      this.showToast('Bed slot is now vacant and available.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openAddRoomModal() {
    const hostels = await window.HostelService.getAllHostels();
    const currentHostelFilter = window.HostelView.selectedHostelFilter;

    const bodyHtml = `
      <form id="add-room-form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Hostel Facility <span class="required">*</span></label>
            <select class="form-control" name="hostel_id" required>
              ${hostels.map(h => `
                <option value="${h.id}" ${currentHostelFilter === h.id ? 'selected' : ''}>
                  ${h.name} (${h.gender})
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Room Number / Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="room_number" placeholder="e.g. 103, 204, G-103" required>
          </div>
          <div class="form-group">
            <label class="form-label">Floor Location</label>
            <select class="form-control" name="floor">
              <option value="Ground Floor">Ground Floor</option>
              <option value="First Floor">First Floor</option>
              <option value="Second Floor">Second Floor</option>
              <option value="Third Floor">Third Floor</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Room Layout Preset</label>
            <select class="form-control" id="room-preset-select" onchange="App.onRoomLayoutPresetChange(this.value)">
              <option value="4_4">4 Left Side + 4 Window Side (8 Beds Standard)</option>
              <option value="5_3">5 Left Side + 3 Window Side (8 Beds)</option>
              <option value="4_3">4 Left Side + 3 Window Side (7 Beds)</option>
              <option value="3_3">3 Left Side + 3 Window Side (6 Beds)</option>
              <option value="custom">Custom Layout Configuration</option>
            </select>
          </div>
        </div>

        <div style="background:var(--bg-surface-secondary); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-top:0.75rem;">
          <h4 style="font-size:0.9rem; margin-bottom:0.75rem; color:var(--primary-700);">Bed Spaces & Side Zone Allocation</h4>
          <div class="form-grid-3">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">📍 Left Side Beds</label>
              <input type="number" class="form-control" name="left_side_beds" id="room-left-beds" value="4" min="0" max="20" oninput="App.updateRoomTotalBedsPreview()" required>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">🪟 Window Side Beds</label>
              <input type="number" class="form-control" name="window_side_beds" id="room-window-beds" value="4" min="0" max="20" oninput="App.updateRoomTotalBedsPreview()" required>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">🛏️ Right / Extra Beds</label>
              <input type="number" class="form-control" name="right_side_beds" id="room-right-beds" value="0" min="0" max="20" oninput="App.updateRoomTotalBedsPreview()">
            </div>
          </div>
          <div style="margin-top:0.85rem; display:flex; justify-content:space-between; align-items:center; font-size:0.88rem;">
            <span>Calculated Room Capacity:</span>
            <strong id="room-total-capacity-preview" style="color:var(--primary-700); font-size:1.05rem;">8 Total Bed Spaces</strong>
          </div>
        </div>
      </form>
    `;

    this.openModal('Create New Bedroom & Side Layout', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveNewRoom()">Create Room & Generate Bed Spaces</button>
    `, 'large');
  }

  onRoomLayoutPresetChange(val) {
    const leftInput = document.getElementById('room-left-beds');
    const windowInput = document.getElementById('room-window-beds');
    const rightInput = document.getElementById('room-right-beds');

    if (!leftInput || !windowInput) return;

    if (val === '4_4') {
      leftInput.value = 4;
      windowInput.value = 4;
      if (rightInput) rightInput.value = 0;
    } else if (val === '5_3') {
      leftInput.value = 5;
      windowInput.value = 3;
      if (rightInput) rightInput.value = 0;
    } else if (val === '4_3') {
      leftInput.value = 4;
      windowInput.value = 3;
      if (rightInput) rightInput.value = 0;
    } else if (val === '3_3') {
      leftInput.value = 3;
      windowInput.value = 3;
      if (rightInput) rightInput.value = 0;
    }
    this.updateRoomTotalBedsPreview();
  }

  updateRoomTotalBedsPreview() {
    const left = parseInt(document.getElementById('room-left-beds')?.value || 0);
    const win = parseInt(document.getElementById('room-window-beds')?.value || 0);
    const right = parseInt(document.getElementById('room-right-beds')?.value || 0);
    const total = left + win + right;

    const el = document.getElementById('room-total-capacity-preview');
    if (el) el.textContent = `${total} Total Bed Spaces`;
  }

  async saveNewRoom() {
    const form = document.getElementById('add-room-form');
    if (!form) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!data.room_number) {
      this.showToast('Please enter a room number.', 'error');
      return;
    }

    try {
      const newRoom = await window.HostelService.createRoom(data);
      this.closeModal();
      this.showToast(`Room ${data.room_number} with ${newRoom.capacity} beds created successfully!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // Add individual Bed Space to an existing room
  async openAddBedModal(roomId, roomNumber) {
    const roomBeds = await window.HostelService.getAllBeds(roomId);
    const nextIndex = roomBeds.length + 1;

    const bodyHtml = `
      <form id="add-bed-form">
        <div style="background:var(--bg-surface-secondary); padding:0.85rem 1rem; border-radius:var(--radius-md); margin-bottom:1rem; font-size:0.88rem;">
          Target Bedroom: <strong style="color:var(--primary-700);">Room ${roomNumber}</strong> (Currently ${roomBeds.length} Beds)
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Bed Space Label / Number <span class="required">*</span></label>
            <input type="text" class="form-control" name="bed_number" id="new-bed-number" value="Bed ${nextIndex}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Side / Location in Room <span class="required">*</span></label>
            <select class="form-control" name="side" id="new-bed-side">
              <option value="Left Side">📍 Left Side</option>
              <option value="Window Side">🪟 Window Side</option>
              <option value="Right Side">👉 Right Side</option>
              <option value="Door Side">🚪 Door Side</option>
            </select>
          </div>
        </div>
      </form>
    `;

    this.openModal(`Add Bed Space to Room ${roomNumber}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveNewBed('${roomId}', '${roomNumber}')">Add Bed Space</button>
    `);
  }

  async saveNewBed(roomId, roomNumber) {
    const form = document.getElementById('add-bed-form');
    if (!form) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      await window.HostelService.addBedToRoom(roomId, data);
      this.closeModal();
      this.showToast(`Added ${data.bed_number} (${data.side}) to Room ${roomNumber}!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // Delete Bed confirmation
  confirmDeleteBed(bedId, bedNumber, roomNumber, isOccupied = 0) {
    this.openModal('Delete Bed Space', `
      <div style="text-align:center; padding:1rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem; color:var(--danger-solid);">🗑️</div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Delete ${bedNumber}?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
          Are you sure you want to remove this bed space from <strong>Room ${roomNumber}</strong>?
        </p>
        ${isOccupied ? `
          <div class="status-alert-banner danger" style="text-align:left; font-size:0.82rem; margin-top:0.75rem;">
            ⚠️ <strong>Student Assigned:</strong> A student is currently occupying this bed. Deleting this bed will automatically vacate the student and set their bed to unassigned.
          </div>
        ` : ''}
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeDeleteBed('${bedId}')">Yes, Delete Bed</button>
    `);
  }

  async executeDeleteBed(bedId) {
    try {
      const res = await window.HostelService.deleteBed(bedId);
      this.closeModal();
      this.showToast(`Bed space ${res.bedNumber} removed successfully.`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // Delete Room confirmation
  confirmDeleteRoom(roomId, roomNumber, occupiedCount = 0) {
    this.openModal(`Delete Room ${roomNumber}`, `
      <div style="text-align:center; padding:1rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem; color:var(--danger-solid);">🏢</div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Permanently Delete Room ${roomNumber}?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
          This will permanently delete <strong>Room ${roomNumber}</strong> and all of its bed spaces.
        </p>
        ${occupiedCount > 0 ? `
          <div class="status-alert-banner danger" style="text-align:left; font-size:0.82rem; margin-top:0.75rem;">
            ⚠️ <strong>${occupiedCount} Student(s) Assigned:</strong> All students currently assigned to this room will be automatically vacated and unassigned safely.
          </div>
        ` : ''}
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeDeleteRoom('${roomId}')">Yes, Delete Entire Room</button>
    `);
  }

  async executeDeleteRoom(roomId) {
    try {
      const res = await window.HostelService.deleteRoom(roomId);
      this.closeModal();
      this.showToast(`Room ${res.roomNumber} and its ${res.deletedBeds} bed spaces deleted successfully.`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openEntryExitModal() {
    const students = await window.StudentService.getAllStudents();
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const bodyHtml = `
      <form id="entry-exit-form">
        <div class="form-group">
          <label class="form-label">Select Student <span class="required">*</span></label>
          <select class="form-control" name="student_id" required>
            ${students.map(s => `<option value="${s.id}">${s.full_name} (${s.admission_no} - Class ${s.school_class})</option>`).join('')}
          </select>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Exit Date</label>
            <input type="date" class="form-control" name="exit_date" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-group" style="position:relative;">
            <label class="form-label">Exit Time</label>
            <input type="time" class="glass-time-input" name="exit_time" value="${nowTime}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Outing Purpose <span class="required">*</span></label>
          <input type="text" class="form-control" name="purpose" placeholder="e.g. Doctor Visit / Local Purchase" required>
        </div>
      </form>
    `;

    this.openModal('Record Outing / Exit Entry', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveEntryExit()">Record Exit</button>
    `);
  }

  async saveEntryExit() {
    const form = document.getElementById('entry-exit-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const student = await window.StudentService.getStudentById(data.student_id);
      data.hostel_id = student ? student.hostel_id : null;
      await window.HostelService.recordEntryExit(data);
      this.closeModal();
      this.showToast('Student exit logged. Tracked as Currently Outside.', 'warning');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async saveDiaryEntry() {
    const hostelId = document.getElementById('diary-hostel-id') ? document.getElementById('diary-hostel-id').value : 'bh-01';
    const morning = document.getElementById('diary-morning') ? document.getElementById('diary-morning').value : '';
    const moral = document.getElementById('diary-moral') ? document.getElementById('diary-moral').value : '';
    const coaching = document.getElementById('diary-coaching') ? document.getElementById('diary-coaching').value : '';
    const remarks = document.getElementById('diary-remarks') ? document.getElementById('diary-remarks').value : '';

    try {
      await window.HostelService.saveDiaryEntry({
        hostel_id: hostelId,
        diary_date: new Date().toISOString().split('T')[0],
        morning_status: morning,
        moral_class_summary: moral,
        coaching_summary: coaching,
        general_remarks: remarks,
        recorded_by: window.Auth.currentUser ? window.Auth.currentUser.full_name : 'Warden'
      });
      this.showToast('Hostel daily diary record saved!', 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // DISCIPLINE & FINES ACTIONS
  // ==========================================================================

  setDisciplineTab(tab) {
    window.DisciplineView.activeTab = tab;
    this.renderCurrentView();
  }

  async markFinePaid(fineId) {
    try {
      await window.DisciplineService.markFinePaid(fineId);
      this.showToast('Fine marked as paid.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // LEAVE MANAGEMENT ACTIONS
  // ==========================================================================

  async openLeavePassModal(defaultMode = 'individual') {
    const students = await window.StudentService.getAllStudents();
    const schoolClasses = CONFIG.SCHOOL_CLASSES || [];
    const today = new Date().toISOString().split('T')[0];

    // Cache students for dynamic gender & class filtering
    this._cachedLeaveStudents = students;

    // Student names only
    const studentOptions = students.map(s => ({
      value: s.id,
      label: s.full_name
    }));

    // Extract unique sorted classes
    const classSet = new Set();
    students.forEach(s => {
      if (s.school_class) classSet.add(s.school_class.trim());
    });
    const sortedClasses = Array.from(classSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const classOptions = [
      { value: 'all', label: 'All Classes' },
      ...sortedClasses.map(c => ({ value: c, label: c }))
    ];

    const genderOptions = [
      { value: 'all', label: 'All Genders' },
      { value: 'boys', label: 'Boys Only' },
      { value: 'girls', label: 'Girls Only' }
    ];

    const batchLeaveClassOptions = [
      { value: 'all', label: 'All Classes' },
      ...schoolClasses.map(c => ({ value: c, label: c }))
    ];

    const batchLeaveGenderOptions = [
      { value: 'all', label: 'All Genders' },
      { value: 'male', label: 'Boys' },
      { value: 'female', label: 'Girls' }
    ];

    const batchLeaveTypeOptions = [
      { value: 'vacation', label: 'Vacation / Term Holidays' },
      { value: 'hostel_leave', label: 'Hostel Weekend Leave' },
      { value: 'medical_leave', label: 'Medical Leave' },
      { value: 'emergency', label: 'Emergency Home Visit' },
      { value: 'academic', label: 'Special Academic Leave' }
    ];

    const currentMode = defaultMode;
    window.__leaveModalState = {
      currentMode,
      students
    };

    const bodyHtml = `
      <div style="display:flex; flex-direction:column; gap:1.1rem; flex:1; min-height:0; justify-content:flex-start; overflow:visible;">
        <!-- Top Segmented Mode Switcher -->
        <div style="display:flex; gap:0.5rem; background:var(--bg-surface-secondary); padding:4px; border-radius:var(--radius-full); border:1px solid var(--border-color); flex-shrink:0;">
          <button type="button" id="leave-tab-ind" class="btn btn-sm ${currentMode === 'individual' ? 'btn-primary' : 'btn-ghost'}" onclick="App.switchLeaveMode('individual')" style="flex:1; border-radius:var(--radius-full); font-weight:700; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Individual Leave
          </button>
          <button type="button" id="leave-tab-batch" class="btn btn-sm ${currentMode === 'batch' ? 'btn-primary' : 'btn-ghost'}" onclick="App.switchLeaveMode('batch')" style="flex:1; border-radius:var(--radius-full); font-weight:700; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Batch Leave Card
          </button>
        </div>

        <!-- ================= INDIVIDUAL LEAVE PANEL ================= -->
        <div id="leave-ind-panel" style="display:${currentMode === 'individual' ? 'flex' : 'none'}; flex-direction:column; gap:1.25rem; flex:1; min-height:0; overflow:visible;">
          <form id="individual-leave-form" style="overflow:visible; width:100%; display:flex; flex-direction:column; gap:1.25rem;">
            <!-- Row 1: Student Filters & Selection (3 Columns across 100% width) -->
            <div style="display:grid; grid-template-columns: 1fr 1fr 2fr; gap: 1rem; width:100%; align-items:flex-end; overflow:visible;">
              <div class="form-group" style="margin-bottom:0; overflow:visible; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Gender</label>
                ${this.renderLiquidGlassSelect('ind-leave-gender', 'filter_gender', genderOptions, 'all', 'onIndividualLeaveFilterChange', true)}
              </div>
              <div class="form-group" style="margin-bottom:0; overflow:visible; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Class / Standard</label>
                ${this.renderLiquidGlassSelect('ind-leave-class', 'filter_class', classOptions, 'all', 'onIndividualLeaveFilterChange', true)}
              </div>
              <div class="form-group" style="margin-bottom:0; overflow:visible; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Select Student <span class="required" style="color:var(--danger-500, #ef4444);">*</span></label>
                ${this.renderLiquidGlassSelect('ind-student-select', 'student_id', studentOptions, studentOptions[0]?.value || '', '', true)}
              </div>
            </div>

            <!-- Row 2: Departure Schedule & Expected Return Schedule (2 Columns across 100% width) -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; width:100%; overflow:visible;">
              <div class="form-group" style="margin-bottom:0; overflow:visible; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Departure Date & Time <span class="required" style="color:var(--danger-500, #ef4444);">*</span></label>
                <div style="display:grid; grid-template-columns: 1.25fr 1fr; gap:0.6rem; align-items:center; width:100%; overflow:visible;">
                  ${this.renderLiquidGlassDatePicker('ind-depart-date-picker', 'leaving_date', today, true)}
                  <input type="time" class="glass-time-input" name="leaving_time" value="16:00" required style="height:42px; border-radius:var(--radius-full, 9999px); width:100%;">
                </div>
              </div>
              <div class="form-group" style="margin-bottom:0; overflow:visible; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Expected Return Date & Time <span class="required" style="color:var(--danger-500, #ef4444);">*</span></label>
                <div style="display:grid; grid-template-columns: 1.25fr 1fr; gap:0.6rem; align-items:center; width:100%; overflow:visible;">
                  ${this.renderLiquidGlassDatePicker('ind-return-date-picker', 'expected_return_date', today, true)}
                  <input type="time" class="glass-time-input" name="expected_return_time" value="17:00" required style="height:42px; border-radius:var(--radius-full, 9999px); width:100%;">
                </div>
              </div>
            </div>

            <!-- Row 3: Leave Type (Typing & Selection) & Late Fine Rate (Under Date and Time) -->
            <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap: 1rem; width:100%; align-items:flex-end; overflow:visible;">
              <div class="form-group" style="margin-bottom:0; overflow:visible; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Leave Type <span class="required" style="color:var(--danger-500, #ef4444);">*</span></label>
                <div style="position:relative; width:100%;">
                  <input type="text" class="form-control" name="leave_type" id="ind-leave-type-input" list="ind-leave-type-list" value="Hostel Weekend Leave" placeholder="Type or select leave type..." style="height:42px; border-radius:var(--radius-full, 9999px); width:100%; font-weight:600; font-size:0.88rem; padding:0.55rem 1.15rem;" required>
                  <datalist id="ind-leave-type-list">
                    <option value="Hostel Weekend Leave">Hostel Weekend Leave</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Vacation / Term Holidays">Vacation / Term Holidays</option>
                    <option value="Emergency Home Visit">Emergency Home Visit</option>
                    <option value="Special Academic Leave">Special Academic Leave</option>
                    <option value="Family Function Leave">Family Function Leave</option>
                    <option value="Official School Duty">Official School Duty</option>
                  </datalist>
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom:0; overflow:visible; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Late Fine / Day (₹) <span class="required" style="color:var(--danger-500, #ef4444);">*</span></label>
                <div style="position:relative; width:100%;">
                  <span style="position:absolute; left:1rem; top:50%; transform:translateY(-50%); font-weight:700; color:var(--text-muted); font-size:0.95rem; pointer-events:none;">₹</span>
                  <input type="number" class="form-control" name="fine_per_day" id="ind-fine-per-day" value="50" min="0" step="10" placeholder="50" style="padding-left:2.2rem; font-weight:700; font-family:var(--font-mono, monospace); font-size:0.92rem; height:42px; border-radius:var(--radius-full, 9999px); width:100%;" required>
                </div>
              </div>
            </div>

            <!-- Row 4: Reason for Leave -->
            <div class="form-group" style="margin-bottom:0; width:100%;">
              <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Reason for Leave <span class="required" style="color:var(--danger-500, #ef4444);">*</span></label>
              <input type="text" class="form-control" name="reason" placeholder="e.g. Attending sister's wedding / Family function" required style="border-radius:12px; height:42px; width:100%; font-size:0.88rem; padding:0.6rem 1rem;">
            </div>
          </form>
        </div>

        <!-- ================= BATCH LEAVE PANEL ================= -->
        <div id="leave-batch-panel" style="display:${currentMode === 'batch' ? 'flex' : 'none'}; flex-direction:column; gap:0.9rem; flex:1; min-height:0; overflow:visible;">
          <form id="batch-leave-form" style="overflow:visible; width:100%; display:flex; flex-direction:column; gap:0.9rem;">
            <!-- Row 1: Departure Schedule (Left) & Expected Return Schedule (Right) -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; width:100%; overflow:visible;">
              <div class="form-group" style="margin-bottom:0; overflow:visible; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Departure Date & Time <span class="required" style="color:var(--danger-500, #ef4444);">*</span></label>
                <div style="display:grid; grid-template-columns: 1.25fr 1fr; gap:0.6rem; align-items:center; width:100%; overflow:visible;">
                  ${this.renderLiquidGlassDatePicker('batch-depart-date-picker', 'leaving_date', today, true)}
                  <input type="time" class="glass-time-input" name="leaving_time" value="16:00" required style="height:42px; border-radius:var(--radius-full, 9999px); width:100%;">
                </div>
              </div>
              <div class="form-group" style="margin-bottom:0; overflow:visible; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Expected Return Date & Time <span class="required" style="color:var(--danger-500, #ef4444);">*</span></label>
                <div style="display:grid; grid-template-columns: 1.25fr 1fr; gap:0.6rem; align-items:center; width:100%; overflow:visible;">
                  ${this.renderLiquidGlassDatePicker('batch-return-date-picker', 'expected_return_date', today, true)}
                  <input type="time" class="glass-time-input" name="expected_return_time" value="17:00" required style="height:42px; border-radius:var(--radius-full, 9999px); width:100%;">
                </div>
              </div>
            </div>

            <!-- Row 2: Leave Type (Left) & Reason / Vacation Description (Right) -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; width:100%; align-items:flex-end; overflow:visible;">
              <div class="form-group" style="margin-bottom:0; overflow:visible; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Leave Type <span class="required" style="color:var(--danger-500, #ef4444);">*</span></label>
                <div style="position:relative; width:100%;">
                  <input type="text" class="form-control" name="leave_type" id="batch-leave-type-input" list="batch-leave-type-list" value="Vacation / Term Holidays" placeholder="Type or select leave type..." style="height:42px; border-radius:var(--radius-full, 9999px); width:100%; font-weight:600; font-size:0.88rem; padding:0.55rem 1.15rem;" required>
                  <datalist id="batch-leave-type-list">
                    <option value="Vacation / Term Holidays">Vacation / Term Holidays</option>
                    <option value="Hostel Weekend Leave">Hostel Weekend Leave</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Emergency Home Visit">Emergency Home Visit</option>
                    <option value="Special Academic Leave">Special Academic Leave</option>
                    <option value="Family Function Leave">Family Function Leave</option>
                  </datalist>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:0; width:100%;">
                <label class="form-label" style="font-weight:600; font-size:0.84rem; margin-bottom:0.4rem; display:block;">Reason / Vacation Description <span class="required" style="color:var(--danger-500, #ef4444);">*</span></label>
                <input type="text" class="form-control" name="reason" placeholder="e.g. Eid Vacation / Term End Holidays" required style="border-radius:var(--radius-full, 9999px); height:42px; width:100%; font-size:0.88rem; padding:0.6rem 1.15rem;">
              </div>
            </div>

            <!-- Student Selection Checklist -->
            <div style="margin-top:0.75rem; border-top:1px solid var(--border-color); padding-top:0.75rem; overflow:visible;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
                <div>
                  <h4 style="margin:0; font-size:0.92rem; color:var(--primary-700); display:flex; align-items:center; gap:6px;">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    Select Students for Batch Leave Card
                  </h4>
                  <p style="font-size:0.76rem; color:var(--text-muted); margin:2px 0 0 0;">Pick students departing for this leave/vacation pass</p>
                </div>
                <div style="display:flex; align-items:center; gap:0.4rem;">
                  <span id="batch-selected-count" class="badge badge-primary" style="font-size:0.78rem; font-weight:700;">0 Students Selected</span>
                  <button type="button" class="btn btn-xs btn-outline-primary" onclick="App.toggleAllBatchStudents(true)" style="border-radius:var(--radius-full); font-weight:600;">Select All</button>
                  <button type="button" class="btn btn-xs btn-secondary" onclick="App.toggleAllBatchStudents(false)" style="border-radius:var(--radius-full); font-weight:600;">Clear</button>
                </div>
              </div>

              <!-- Quick Filters with Liquid Glass Dropdowns -->
              <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.5rem; margin-bottom:0.5rem; overflow:visible; align-items:center;">
                <input type="text" id="batch-leave-search" class="form-control" style="font-size:0.82rem; padding:0.4rem 0.65rem;" placeholder="Search student name or ID..." oninput="App.filterBatchLeaveStudents()">
                ${this.renderLiquidGlassSelect('batch-leave-class-filter', 'leave_class', batchLeaveClassOptions, 'all', 'filterBatchLeaveStudents', false)}
                ${this.renderLiquidGlassSelect('batch-leave-gender-filter', 'leave_gender', batchLeaveGenderOptions, 'all', 'filterBatchLeaveStudents', false)}
              </div>

              <!-- Scrollable Students Roster List -->
              <div id="batch-students-list" style="height:210px; max-height:210px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface);">
                ${students.map(s => {
                  const photoUrl = (s.photo_url && !s.photo_url.includes('unsplash.com')) ? s.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '');
                  const genderBadge = s.gender === 'female' ? '<span class="badge badge-purple" style="font-size:0.68rem; padding:1px 5px;">Girl</span>' : '<span class="badge badge-info" style="font-size:0.68rem; padding:1px 5px;">Boy</span>';
                  return `
                    <label class="batch-leave-student-item" data-name="${(s.full_name || '').toLowerCase()}" data-admission="${(s.admission_no || '').toLowerCase()}" data-class="${s.school_class || ''}" data-gender="${s.gender || 'male'}" style="display:flex; align-items:center; gap:0.75rem; padding:0.45rem 0.75rem; border-bottom:1px solid var(--border-subtle); cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='var(--bg-surface-secondary)'" onmouseout="this.style.background='transparent'">
                      <input type="checkbox" name="selected_students" value="${s.id}" onchange="App.updateBatchStudentCount()" style="width:16px; height:16px; accent-color:var(--primary-600); cursor:pointer; flex-shrink:0;">
                      <img src="${photoUrl}" style="width:28px; height:28px; border-radius:var(--radius-full); object-fit:cover; border:1.5px solid var(--border-color); flex-shrink:0;" alt="photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                      <div style="flex:1; min-width:0;">
                        <div style="display:flex; align-items:center; gap:6px;">
                          <strong style="font-size:0.85rem; color:var(--text-primary);">${s.full_name}</strong>
                          ${genderBadge}
                          <span class="badge badge-neutral" style="font-size:0.68rem; padding:1px 5px;">${s.school_class || '—'}</span>
                        </div>
                        <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">${s.admission_no || ''}</div>
                      </div>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    this.openModal('Hostel Leave Pass Register', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="leave-submit-btn" onclick="App.submitLeaveModal()" style="display:inline-flex; align-items:center; gap:6px; font-weight:700;">
        ${currentMode === 'individual' ? 'Issue Leave Pass' : 'Generate Batch Leave'}
      </button>
    `, 'modal-fixed-size');
  }

  switchLeaveMode(mode) {
    if (!window.__leaveModalState) return;
    window.__leaveModalState.currentMode = mode;

    const indTab = document.getElementById('leave-tab-ind');
    const batchTab = document.getElementById('leave-tab-batch');
    const indPanel = document.getElementById('leave-ind-panel');
    const batchPanel = document.getElementById('leave-batch-panel');
    const submitBtn = document.getElementById('leave-submit-btn');

    if (mode === 'individual') {
      if (indTab) indTab.className = 'btn btn-sm btn-primary';
      if (batchTab) batchTab.className = 'btn btn-sm btn-ghost';
      if (indPanel) indPanel.style.display = 'flex';
      if (batchPanel) batchPanel.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Issue Leave Pass';
    } else {
      if (indTab) indTab.className = 'btn btn-sm btn-ghost';
      if (batchTab) batchTab.className = 'btn btn-sm btn-primary';
      if (indPanel) indPanel.style.display = 'none';
      if (batchPanel) batchPanel.style.display = 'flex';
      if (submitBtn) submitBtn.textContent = 'Generate Batch Leave';
    }
  }

  submitLeaveModal() {
    const mode = window.__leaveModalState?.currentMode || 'individual';
    if (mode === 'individual') {
      this.saveIndividualLeave();
    } else {
      this.saveBatchLeave();
    }
  }

  openIndividualLeaveModal() {
    return this.openLeavePassModal('individual');
  }

  openBatchLeaveModal() {
    return this.openLeavePassModal('batch');
  }

  onIndividualLeaveFilterChange() {
    const gender = document.getElementById('ind-leave-gender-input')?.value || 'all';
    const schoolClass = document.getElementById('ind-leave-class-input')?.value || 'all';
    const students = this._cachedLeaveStudents || [];

    const filtered = students.filter(s => {
      const matchGender = (gender === 'all') ||
        (gender === 'boys' && (s.gender === 'male' || s.gender === 'boys')) ||
        (gender === 'girls' && (s.gender === 'female' || s.gender === 'girls'));
      const matchClass = (schoolClass === 'all') || (s.school_class === schoolClass);
      return matchGender && matchClass;
    });

    const menu = document.querySelector('#ind-student-select .glass-dropdown-menu');
    const labelEl = document.getElementById('ind-student-select-label');
    const inputEl = document.getElementById('ind-student-select-input');

    if (filtered.length === 0) {
      if (menu) menu.innerHTML = `<div class="glass-dropdown-item" style="color:var(--text-muted);">No matching students found</div>`;
      if (labelEl) labelEl.textContent = 'No matching students';
      if (inputEl) inputEl.value = '';
      return;
    }

    const first = filtered[0];
    if (labelEl) labelEl.textContent = first.full_name;
    if (inputEl) inputEl.value = first.id;

    if (menu) {
      menu.innerHTML = filtered.map((s, idx) => `
        <div class="glass-dropdown-item ${idx === 0 ? 'active' : ''}" onclick="App.selectLiquidGlassOption('ind-student-select', '${s.id}', '${s.full_name.replace(/'/g, "\\'")}', '', event)">
          ${s.full_name}
        </div>
      `).join('');
    }
  }

  async saveIndividualLeave() {
    const form = document.getElementById('individual-leave-form');
    const formData = new FormData(form);
    const studentId = formData.get('student_id');
    const finePerDay = parseFloat(formData.get('fine_per_day')) || 50;

    const leaveData = {
      leave_type: formData.get('leave_type'),
      leaving_date: formData.get('leaving_date'),
      leaving_time: formData.get('leaving_time'),
      expected_return_date: formData.get('expected_return_date'),
      expected_return_time: formData.get('expected_return_time'),
      reason: formData.get('reason'),
      fine_per_day: finePerDay
    };

    try {
      await window.LeaveService.createLeave(leaveData, [studentId]);
      this.closeModal();
      this.showToast('Individual leave pass issued successfully!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openLeaveDetails(leaveId) {
    const leaves = await window.LeaveService.getAllLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return;

    const leaveStudents = await window.LeaveService.getLeaveStudents(leaveId);
    const allStudents = await window.StudentService.getAllStudents();

    const bodyHtml = `
      <div>
        <div style="background:var(--bg-surface-secondary); padding:1rem; border-radius:var(--radius-md); margin-bottom:1rem; line-height:1.6;">
          <div>Leave Code: <strong style="font-family:monospace;">${leave.leave_code}</strong></div>
          <div>Type: <strong style="text-transform:capitalize;">${leave.leave_type.replace('_', ' ')}</strong></div>
          <div>Reason: <strong>${leave.reason}</strong></div>
          <div>Departure: <strong>${leave.leaving_date} ${leave.leaving_time}</strong></div>
          <div>Expected Return: <strong>${leave.expected_return_date} ${leave.expected_return_time}</strong></div>
          <div>Status: <span class="badge badge-warning">${leave.status}</span></div>
        </div>

        <h4 style="margin-bottom:0.5rem; color:var(--primary-700);">Students Enrolled in this Leave Card</h4>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr><th>Student</th><th>Return Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${leaveStudents.map(ls => {
                const s = allStudents.find(st => st.id === ls.student_id);
                return `
                  <tr>
                    <td><strong>${s ? s.full_name : 'Student'}</strong> (${s ? s.admission_no : ''})</td>
                    <td><span class="badge ${ls.is_returned ? 'badge-success' : 'badge-warning'}">${ls.is_returned ? 'Returned' : 'Not Returned'}</span></td>
                    <td>
                      ${!ls.is_returned ? `
                        <button class="btn btn-sm btn-primary" onclick="App.openRecordLeaveStudentReturn('${ls.id}', '${s ? s.full_name : ''}')">
                          Record Return
                        </button>
                      ` : `
                        <span style="font-size:0.8rem; color:var(--text-muted);">${ls.actual_return_date || ''} (${ls.late_days || 0}d late)</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.openModal(`Leave Pass Details: ${leave.leave_code}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
    `, 'large');
  }

  async openRecordLeaveStudentReturn(leaveStudentId, studentName) {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const bodyHtml = `
      <div>
        <p style="margin-bottom:1rem; font-size:0.92rem;">
          Record hostel return for <strong>${studentName}</strong>. Late fines will be calculated automatically by calendar date.
        </p>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Actual Return Date</label>
            <input type="date" class="form-control" id="ls-ret-date" value="${today}">
          </div>
          <div class="form-group" style="position:relative;">
            <label class="form-label">Actual Return Time</label>
            <input type="time" class="glass-time-input" id="ls-ret-time" value="${nowTime}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Condition & Return Remarks</label>
          <input type="text" class="form-control" id="ls-ret-remarks" placeholder="e.g. Good health, reported on time">
        </div>
      </div>
    `;

    this.openModal(`Confirm Return: ${studentName}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.submitLeaveStudentReturn('${leaveStudentId}')">Save Return & Calculate Late</button>
    `);
  }

  async submitLeaveStudentReturn(leaveStudentId) {
    const date = document.getElementById('ls-ret-date').value;
    const time = document.getElementById('ls-ret-time-input')?.value || document.getElementById('ls-ret-time')?.value || '16:00';
    const remarks = document.getElementById('ls-ret-remarks').value;

    try {
      const calc = await window.LeaveService.recordStudentReturn(leaveStudentId, date, time, 'Good', remarks);
      this.closeModal();
      if (calc.lateDays > 0) {
        this.showToast(`Returned ${calc.lateDays} days late. Fine of ₹${calc.fineAmount} and ${calc.blackMarks} black mark(s) recorded.`, 'warning');
      } else {
        this.showToast('Student return recorded successfully with 0 fines.', 'success');
      }
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // UNIFIED ARRIVAL & RETURN RECORDING MODAL (INDIVIDUAL & BATCH)
  // ==========================================================================

  async openRecordArrivalModal(defaultMode = 'individual', preselectedLeaveId = null) {
    const leaves = await window.LeaveService.getAllLeaves();
    const leaveStudents = await window.LeaveService.getLeaveStudents();
    const allStudents = await window.StudentService.getAllStudents();
    const hostels = await window.HostelService.getAllHostels();
    const rooms = await window.HostelService.getAllRooms();
    const beds = await window.HostelService.getAllBeds();

    // Map unreturned students and filter out orphaned records
    const unreturnedStudents = leaveStudents
      .filter(ls => !ls.is_returned)
      .map(ls => {
        const student = allStudents.find(s => 
          s.id === ls.student_id || 
          s.admission_no === ls.student_id || 
          (s.admission_no && String(s.admission_no).toLowerCase() === String(ls.student_id).toLowerCase())
        );
        if (!student) return null; // Exclude orphaned entries where student does not exist

        const leave = leaves.find(l => l.id === ls.leave_id) || { leave_code: '—', reason: '—', leaving_date: '—', expected_return_date: '—', expected_return_time: '16:00', fine_per_day: 100 };
        const hostel = hostels.find(h => h.id === student.hostel_id);
        const room = rooms.find(r => r.id === student.room_id);
        const bed = beds.find(b => b.id === student.bed_id);
        return {
          ...ls,
          student,
          leave,
          hostelName: hostel ? hostel.name : 'Hostel',
          roomBed: (room ? `Room ${room.room_number}` : '') + (bed ? ` • ${bed.bed_number}` : '')
        };
      })
      .filter(Boolean);

    // Active leave cards that have at least 1 valid unreturned student
    const activeLeaves = leaves.filter(l => unreturnedStudents.some(us => us.leave_id === l.id));

    if (unreturnedStudents.length === 0) {
      this.openModal('Hostel Arrival & Return', `
        <div style="text-align:center; padding:2.5rem 1rem;">
          <div style="font-size:3rem; margin-bottom:0.75rem; color:var(--success-solid);">🏡</div>
          <h3 style="margin-bottom:0.5rem; color:var(--text-primary); font-size:1.25rem;">All Students Present on Campus</h3>
          <p style="font-size:0.92rem; color:var(--text-secondary); max-width:440px; margin:0 auto; line-height:1.6;">
            There are currently no active leave passes or students away from hostel. All hostel residents are safely on campus.
          </p>
        </div>
      `, `
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      `);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    // Extract unique classes for filter
    const uniqueClasses = [...new Set(unreturnedStudents.map(us => us.student.school_class).filter(Boolean))].sort();

    // Initial state
    const currentMode = preselectedLeaveId ? 'batch' : defaultMode;
    const initialLeaveId = preselectedLeaveId || (activeLeaves[0]?.id || '');
    const initialStudentLeaveId = unreturnedStudents[0]?.id || '';

    // Cache lookup in global for dynamic switching
    window.__arrivalModalState = {
      unreturnedStudents,
      activeLeaves,
      uniqueClasses,
      today,
      nowTime,
      currentMode
    };

    // Dropdown options lists
    const indGenderOptions = [
      { value: 'all', label: 'All Genders' },
      { value: 'male', label: 'Boys' },
      { value: 'female', label: 'Girls' }
    ];
    const indClassOptions = [
      { value: 'all', label: 'All Classes' },
      ...uniqueClasses.map(c => ({ value: c, label: c }))
    ];
    const indStudentOptions = unreturnedStudents.map(us => ({
      value: us.id,
      label: us.student.full_name
    }));

    const activeLeaveOptions = activeLeaves.map(l => {
      const unretCount = unreturnedStudents.filter(us => us.leave_id === l.id).length;
      return {
        value: l.id,
        label: `${l.leave_code} — ${l.reason || l.leave_type} (${unretCount} away • Return: ${l.expected_return_date})`
      };
    });

    const bodyHtml = `
      <div style="display:flex; flex-direction:column; gap:1.1rem; flex:1; min-height:0; justify-content:flex-start; overflow:visible;">
        <!-- Top Segmented Mode Switcher -->
        <div style="display:flex; gap:0.5rem; background:var(--bg-surface-secondary); padding:4px; border-radius:var(--radius-full); border:1px solid var(--border-color); flex-shrink:0;">
          <button type="button" id="arrival-tab-ind" class="btn btn-sm ${currentMode === 'individual' ? 'btn-primary' : 'btn-ghost'}" onclick="App.switchArrivalMode('individual')" style="flex:1; border-radius:var(--radius-full); font-weight:700; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Individual Student (${unreturnedStudents.length} Away)
          </button>
          <button type="button" id="arrival-tab-batch" class="btn btn-sm ${currentMode === 'batch' ? 'btn-primary' : 'btn-ghost'}" onclick="App.switchArrivalMode('batch')" style="flex:1; border-radius:var(--radius-full); font-weight:700; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Batch Leave Card (${activeLeaves.length} Active)
          </button>
        </div>

        <!-- ================= INDIVIDUAL ARRIVAL PANEL ================= -->
        <div id="arrival-ind-panel" style="display:${currentMode === 'individual' ? 'flex' : 'none'}; flex-direction:column; gap:0.9rem; flex:1; min-height:0; overflow:visible;">
          <!-- Dropdown Filter Grid (Gender, Class, Student) with Liquid Glass -->
          <div style="display:grid; grid-template-columns:1fr 1fr 2fr; gap:0.75rem; overflow:visible;">
            <div style="overflow:visible;">
              <label class="form-label" style="font-weight:700;">Gender</label>
              ${this.renderLiquidGlassSelect('arrival-ind-gender-filter', 'gender', indGenderOptions, 'all', 'onArrivalFilterChanged', true)}
            </div>
            <div style="overflow:visible;">
              <label class="form-label" style="font-weight:700;">Class</label>
              ${this.renderLiquidGlassSelect('arrival-ind-class-filter', 'school_class', indClassOptions, 'all', 'onArrivalFilterChanged', true)}
            </div>
            <div style="overflow:visible;">
              <label class="form-label" style="font-weight:700;">Select Student on Leave <span class="required">*</span></label>
              ${this.renderLiquidGlassSelect('arrival-ind-student-select', 'student_leave_id', indStudentOptions, initialStudentLeaveId, 'onArrivalStudentChanged', true)}
            </div>
          </div>

          <!-- Student Info & Leave Details Box -->
          <div id="arrival-ind-student-info" style="background:var(--bg-surface-secondary); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:0.9rem; min-height:104px; display:flex; flex-direction:column; justify-content:center;">
            <!-- Rendered dynamically -->
          </div>

          <!-- Return Date & Time Grid -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; overflow:visible;">
            <div style="overflow:visible;">
              <label class="form-label" style="font-weight:700;">Actual Return Date <span class="required">*</span></label>
              ${this.renderLiquidGlassDatePicker('arrival-ind-date-picker', 'arrival_date', today, true)}
            </div>
            <div style="overflow:visible;">
              <label class="form-label" style="font-weight:700;">Actual Return Time <span class="required">*</span></label>
              ${this.renderLiquidGlassTimePicker('arrival-ind-time-picker', 'arrival_time', nowTime, true)}
            </div>
          </div>

          <!-- Remarks / Health Condition -->
          <div class="form-group" style="margin:0;">
            <label class="form-label">Student Health Condition & Return Remarks</label>
            <input type="text" class="form-control" id="arrival-ind-remarks" placeholder="e.g. Good health, accompanied by guardian" value="Good health, reported on time">
          </div>
        </div>

        <!-- ================= BATCH ARRIVAL PANEL ================= -->
        <div id="arrival-batch-panel" style="display:${currentMode === 'batch' ? 'flex' : 'none'}; flex-direction:column; gap:0.85rem; flex:1; min-height:0; overflow:visible;">
          <div class="form-group" style="margin:0; overflow:visible;">
            <label class="form-label" style="font-weight:700;">Select Active Leave Card <span class="required">*</span></label>
            ${this.renderLiquidGlassSelect('arrival-batch-leave-select', 'leave_id', activeLeaveOptions, initialLeaveId, 'onArrivalBatchCardChanged', true)}
          </div>

          <!-- Batch Return Date, Time & Remarks Grid (Positioned Upon / Above Select Returning Students) -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1.35fr; gap:0.75rem; overflow:visible; align-items:flex-end;">
            <div style="overflow:visible;">
              <label class="form-label" style="font-weight:700; margin-bottom:0.35rem;">Batch Return Date <span class="required">*</span></label>
              ${this.renderLiquidGlassDatePicker('arrival-batch-date-picker', 'batch_arrival_date', today, true)}
            </div>
            <div style="overflow:visible;">
              <label class="form-label" style="font-weight:700; margin-bottom:0.35rem;">Batch Return Time <span class="required">*</span></label>
              ${this.renderLiquidGlassTimePicker('arrival-batch-time-picker', 'batch_arrival_time', nowTime, true)}
            </div>
            <div style="overflow:visible;">
              <label class="form-label" style="margin-bottom:0.35rem;">Batch Return Remarks</label>
              <input type="text" class="form-control" id="arrival-batch-remarks" placeholder="e.g. Batch return on schedule" value="Batch arrival recorded" style="height:38px; font-size:0.85rem;">
            </div>
          </div>

          <!-- Batch Student Selection Roster (Matching Classroom Students Style) -->
          <div style="flex:1; display:flex; flex-direction:column; min-height:0; overflow:visible;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
              <div>
                <h4 style="margin:0; font-size:0.92rem; color:var(--primary-700); display:flex; align-items:center; gap:6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  Select Returning Students
                </h4>
                <p style="font-size:0.75rem; color:var(--text-muted); margin:2px 0 0 0;">Pick students returning to hostel in this batch</p>
              </div>
              <div style="display:flex; gap:0.4rem; align-items:center;">
                <span class="badge badge-primary" id="arrival-batch-counter" style="font-size:0.78rem; font-weight:700;">0 Students Selected</span>
                <button type="button" class="btn btn-xs btn-outline-primary" onclick="App.toggleSelectAllBatchArrival(true)" style="border-radius:var(--radius-full); font-weight:600;">Select All</button>
                <button type="button" class="btn btn-xs btn-secondary" onclick="App.toggleSelectAllBatchArrival(false)" style="border-radius:var(--radius-full); font-weight:600;">Clear</button>
              </div>
            </div>

            <!-- Quick Filters with Liquid Glass Dropdowns -->
            <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.5rem; margin-bottom:0.5rem; overflow:visible; align-items:center;">
              <input type="text" id="arrival-batch-search" class="form-control" style="font-size:0.82rem; padding:0.4rem 0.65rem;" placeholder="Search student name or ID..." oninput="App.filterArrivalBatchStudents()">
              ${this.renderLiquidGlassSelect('arrival-batch-class-filter', 'batch_class', indClassOptions, 'all', 'filterArrivalBatchStudents', false)}
              ${this.renderLiquidGlassSelect('arrival-batch-gender-filter', 'batch_gender', indGenderOptions, 'all', 'filterArrivalBatchStudents', false)}
            </div>

            <!-- Scrollable Student Roster Container - Expanded Height -->
            <div id="arrival-batch-students-list" style="height:250px; max-height:260px; min-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface);">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.openModal('Hostel Arrival & Return Register', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="arrival-submit-btn" onclick="App.submitArrivalModal()" style="display:inline-flex; align-items:center; gap:6px; font-weight:700;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Confirm Arrival</span>
      </button>
    `, 'modal-fixed-size');

    // Trigger initial render of sub panels
    if (currentMode === 'individual') {
      this.onArrivalFilterChanged(initialStudentLeaveId);
    } else {
      this.onArrivalBatchCardChanged(initialLeaveId);
    }
  }

  onArrivalFilterChanged(preferredSelectId = null) {
    if (!window.__arrivalModalState) return;
    const gender = document.getElementById('arrival-ind-gender-filter-input')?.value || document.getElementById('arrival-ind-gender-filter')?.value || 'all';
    const sClass = document.getElementById('arrival-ind-class-filter-input')?.value || document.getElementById('arrival-ind-class-filter')?.value || 'all';

    let filtered = window.__arrivalModalState.unreturnedStudents;
    if (gender !== 'all') {
      filtered = filtered.filter(us => us.student.gender === gender);
    }
    if (sClass !== 'all') {
      filtered = filtered.filter(us => us.student.school_class === sClass);
    }

    const studentSelectDropdown = document.getElementById('arrival-ind-student-select');
    const studentSelectInput = document.getElementById('arrival-ind-student-select-input');
    const studentSelectLabel = document.getElementById('arrival-ind-student-select-label');
    const infoContainer = document.getElementById('arrival-ind-student-info');

    if (filtered.length === 0) {
      if (studentSelectInput) studentSelectInput.value = '';
      if (studentSelectLabel) studentSelectLabel.textContent = 'No on-leave students match criteria';
      if (studentSelectDropdown) {
        const menu = studentSelectDropdown.querySelector('.glass-dropdown-menu');
        if (menu) menu.innerHTML = '<div class="glass-dropdown-item" style="color:var(--text-muted); cursor:default;">No on-leave students match criteria</div>';
      }
      if (infoContainer) {
        infoContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:0.5rem;">No students found matching the selected Gender and Class filters.</div>';
      }
      return;
    }

    const targetId = (preferredSelectId && filtered.some(us => us.id === preferredSelectId)) 
      ? preferredSelectId 
      : filtered[0].id;
    const targetItem = filtered.find(us => us.id === targetId) || filtered[0];

    if (studentSelectInput) studentSelectInput.value = targetId;
    if (studentSelectLabel) studentSelectLabel.textContent = targetItem.student.full_name;

    if (studentSelectDropdown) {
      const menu = studentSelectDropdown.querySelector('.glass-dropdown-menu');
      if (menu) {
        menu.innerHTML = filtered.map(us => {
          const lbl = us.student.full_name;
          const isActive = us.id === targetId;
          return `
            <div class="glass-dropdown-item ${isActive ? 'active' : ''}" data-val="${us.id}" onclick="App.selectLiquidGlassOption('arrival-ind-student-select', '${us.id}', '${lbl.replace(/'/g, "\\'")}', 'onArrivalStudentChanged', event)">
              ${lbl}
            </div>
          `;
        }).join('');
      }
    }

    this.onArrivalStudentChanged(targetId);
  }

  switchArrivalMode(mode) {
    if (!window.__arrivalModalState) return;
    window.__arrivalModalState.currentMode = mode;

    const indTab = document.getElementById('arrival-tab-ind');
    const batchTab = document.getElementById('arrival-tab-batch');
    const indPanel = document.getElementById('arrival-ind-panel');
    const batchPanel = document.getElementById('arrival-batch-panel');

    if (mode === 'individual') {
      if (indTab) { indTab.className = 'btn btn-sm btn-primary'; }
      if (batchTab) { batchTab.className = 'btn btn-sm btn-ghost'; }
      if (indPanel) indPanel.style.display = 'flex';
      if (batchPanel) batchPanel.style.display = 'none';
      this.onArrivalFilterChanged();
      const submitBtn = document.getElementById('arrival-submit-btn');
      if (submitBtn) {
        submitBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Confirm Arrival</span>
        `;
      }
    } else {
      if (indTab) { indTab.className = 'btn btn-sm btn-ghost'; }
      if (batchTab) { batchTab.className = 'btn btn-sm btn-primary'; }
      if (indPanel) indPanel.style.display = 'none';
      if (batchPanel) batchPanel.style.display = 'flex';
      const leaveSelect = document.getElementById('arrival-batch-leave-select');
      if (leaveSelect) this.onArrivalBatchCardChanged(leaveSelect.value);
    }
  }

  onArrivalStudentChanged(leaveStudentId) {
    const infoContainer = document.getElementById('arrival-ind-student-info');
    if (!infoContainer || !window.__arrivalModalState) return;

    const item = window.__arrivalModalState.unreturnedStudents.find(us => us.id === leaveStudentId);
    if (!item) {
      infoContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; text-align:center;">Select a student from the list.</div>';
      return;
    }

    const s = item.student;
    const l = item.leave;
    const photoUrl = (s.photo_url && !s.photo_url.includes('unsplash.com')) ? s.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '');

    infoContainer.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.9rem;">
        <img src="${photoUrl}" style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid var(--primary-600); flex-shrink:0;" alt="${s.full_name}" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:2px;">
            <strong style="font-size:1.02rem; color:var(--text-primary);">${s.full_name}</strong>
            <span class="badge badge-neutral" style="font-size:0.75rem;">Class ${s.school_class}</span>
            <span style="font-family:monospace; font-size:0.8rem; background:var(--bg-surface); padding:2px 6px; border-radius:4px; border:1px solid var(--border-color);">${s.admission_no}</span>
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary); display:flex; gap:0.85rem; flex-wrap:wrap;">
            <span>📍 ${item.hostelName} (${item.roomBed || 'No Bed'})</span>
            <span>🎫 Pass: <strong style="font-family:monospace;">${l.leave_code}</strong></span>
          </div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; margin-top:0.7rem; padding-top:0.65rem; border-top:1px solid var(--border-subtle); font-size:0.8rem;">
        <div>
          <span style="color:var(--text-muted);">Departure:</span>
          <strong>${l.leaving_date} ${l.leaving_time || ''}</strong>
        </div>
        <div>
          <span style="color:var(--text-muted);">Expected Return:</span>
          <strong style="color:var(--primary-700);">${l.expected_return_date} ${l.expected_return_time || ''}</strong>
        </div>
      </div>
    `;
  }

  onArrivalBatchCardChanged(leaveId) {
    const listContainer = document.getElementById('arrival-batch-students-list');
    if (!listContainer || !window.__arrivalModalState) return;

    const items = window.__arrivalModalState.unreturnedStudents.filter(us => us.leave_id === leaveId);
    if (items.length === 0) {
      listContainer.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.88rem;">No unreturned students found in this leave pass.</div>';
      this.onBatchArrivalCheckboxChanged();
      return;
    }

    listContainer.innerHTML = items.map(us => {
      const s = us.student;
      const photoUrl = (s.photo_url && !s.photo_url.includes('unsplash.com')) ? s.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '');
      const genderBadge = s.gender === 'female' ? '<span class="badge badge-purple" style="font-size:0.68rem; padding:1px 5px;">Girl</span>' : '<span class="badge badge-info" style="font-size:0.68rem; padding:1px 5px;">Boy</span>';
      return `
        <label class="arrival-batch-student-item" data-name="${(s.full_name || '').toLowerCase()}" data-admission="${(s.admission_no || '').toLowerCase()}" data-class="${s.school_class || ''}" data-gender="${s.gender || 'male'}" style="display:flex; align-items:center; gap:0.75rem; padding:0.45rem 0.75rem; border-bottom:1px solid var(--border-subtle); cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='var(--bg-surface-secondary)'" onmouseout="this.style.background='transparent'">
          <input type="checkbox" class="arrival-batch-student-cb" value="${us.id}" checked onchange="App.onBatchArrivalCheckboxChanged()" style="width:16px; height:16px; accent-color:var(--primary-600); cursor:pointer; flex-shrink:0;">
          <img src="${photoUrl}" style="width:28px; height:28px; border-radius:var(--radius-full); object-fit:cover; border:1.5px solid var(--border-color); flex-shrink:0;" alt="photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px;">
              <strong style="font-size:0.86rem; color:var(--text-primary);">${s.full_name}</strong>
              ${genderBadge}
              <span class="badge badge-neutral" style="font-size:0.68rem; padding:1px 5px;">${s.school_class || '—'}</span>
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">${s.admission_no || ''}${us.roomBed ? ' • ' + us.roomBed : ''}</div>
          </div>
        </label>
      `;
    }).join('');

    this.filterArrivalBatchStudents();
    this.onBatchArrivalCheckboxChanged();
  }

  filterArrivalBatchStudents() {
    const q = (document.getElementById('arrival-batch-search')?.value || '').toLowerCase().trim();
    const c = document.getElementById('arrival-batch-class-filter-input')?.value || document.getElementById('arrival-batch-class-filter')?.value || 'all';
    const g = document.getElementById('arrival-batch-gender-filter-input')?.value || document.getElementById('arrival-batch-gender-filter')?.value || 'all';
    const items = document.querySelectorAll('.arrival-batch-student-item');
    items.forEach(item => {
      const name = item.getAttribute('data-name') || '';
      const adm = item.getAttribute('data-admission') || '';
      const sClass = item.getAttribute('data-class') || '';
      const gender = item.getAttribute('data-gender') || '';

      const matchesQ = !q || name.includes(q) || adm.includes(q);
      const matchesC = c === 'all' || sClass === c;
      const matchesG = g === 'all' || gender === g;

      item.style.display = (matchesQ && matchesC && matchesG) ? 'flex' : 'none';
    });
  }

  toggleSelectAllBatchArrival(checked) {
    const items = document.querySelectorAll('.arrival-batch-student-item');
    items.forEach(item => {
      if (item.style.display !== 'none') {
        const cb = item.querySelector('.arrival-batch-student-cb');
        if (cb) cb.checked = checked;
      }
    });
    this.onBatchArrivalCheckboxChanged();
  }

  onBatchArrivalCheckboxChanged() {
    const checked = document.querySelectorAll('.arrival-batch-student-cb:checked');
    const counterBadge = document.getElementById('arrival-batch-counter');
    if (counterBadge) {
      counterBadge.textContent = `${checked.length} Students Selected`;
    }
    const submitBtn = document.getElementById('arrival-submit-btn');
    if (submitBtn && window.__arrivalModalState?.currentMode === 'batch') {
      submitBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Confirm Arrival (${checked.length} Students)</span>
      `;
    }
  }

  async submitArrivalModal() {
    if (!window.__arrivalModalState) return;
    const mode = window.__arrivalModalState.currentMode || 'individual';

    if (mode === 'individual') {
      const leaveStudentId = document.getElementById('arrival-ind-student-select-input')?.value || document.getElementById('arrival-ind-student-select')?.value;
      if (!leaveStudentId) {
        this.showToast('Please select a student.', 'warning');
        return;
      }

      const date = document.getElementById('arrival-ind-date-picker-input')?.value || new Date().toISOString().split('T')[0];
      const time = document.getElementById('arrival-ind-time-picker-input')?.value || '16:00';
      const remarks = (document.getElementById('arrival-ind-remarks')?.value || '').trim() || 'Good health, reported on time';

      try {
        const calc = await window.LeaveService.recordStudentReturn(leaveStudentId, date, time, 'Good', remarks);
        this.closeModal();
        if (calc.lateDays > 0) {
          this.showToast(`Arrival recorded: ${calc.lateDays} days late. Fine of ₹${calc.fineAmount} and ${calc.blackMarks} black mark(s) registered.`, 'warning');
        } else {
          this.showToast('Student arrival successfully recorded with 0 fines.', 'success');
        }
        this.renderCurrentView();
      } catch (err) {
        this.showToast('Failed to record arrival: ' + err.message, 'error');
      }
    } else {
      const checked = Array.from(document.querySelectorAll('.arrival-batch-student-cb:checked'));
      if (checked.length === 0) {
        this.showToast('Please select at least one student in the batch to record arrival.', 'warning');
        return;
      }

      const date = document.getElementById('arrival-batch-date-picker-input')?.value || new Date().toISOString().split('T')[0];
      const time = document.getElementById('arrival-batch-time-picker-input')?.value || '16:00';
      const remarks = (document.getElementById('arrival-batch-remarks')?.value || '').trim() || 'Batch arrival recorded';

      let totalLateFines = 0;
      let lateCount = 0;

      try {
        for (const cb of checked) {
          const res = await window.LeaveService.recordStudentReturn(cb.value, date, time, 'Good', remarks);
          if (res.lateDays > 0) {
            totalLateFines += res.fineAmount;
            lateCount++;
          }
        }
        this.closeModal();
        if (lateCount > 0) {
          this.showToast(`Arrival recorded for ${checked.length} students (${lateCount} late, total fine: ₹${totalLateFines}).`, 'warning');
        } else {
          this.showToast(`Successfully recorded arrival for all ${checked.length} students on time.`, 'success');
        }
        this.renderCurrentView();
      } catch (err) {
        this.showToast('Failed to record batch arrival: ' + err.message, 'error');
      }
    }
  }

  async openInspectBatchStudentsModal(batchKey) {
    const item = window.__inspectedBatches?.[batchKey];
    if (!item) {
      this.showToast('Unable to find details for this entry.', 'warning');
      return;
    }

    try {
      const [hostels, rooms, beds] = await Promise.all([
        window.HostelService.getAllHostels().catch(() => []),
        window.HostelService.getAllRooms().catch(() => []),
        window.HostelService.getAllBeds().catch(() => [])
      ]);

      const hostelMap = new Map(hostels.map(h => [h.id, h.name]));
      const roomMap = new Map(rooms.map(r => [r.id, r]));
      const bedMap = new Map(beds.map(b => [b.id, b]));

      const students = item.allStudents || (item.student ? [item.student] : []);
      const isBatch = item.type === 'batch_leave' || item.type === 'batch_manual' || students.length > 1;
      const isBoy = item.gender === 'boys';
      const totalCount = item.totalCount || students.length;
      const genderLabel = item.genderLabel || (isBoy ? 'Boys' : 'Girls');
      const badgeClass = isBoy ? 'badge-info' : 'badge-purple';

      const modalTitle = isBatch
        ? `${genderLabel} Leave Roster (${totalCount} Students)`
        : `Student Leave Profile: ${item.student?.full_name || 'Student'}`;

      const bodyHtml = `
        <div style="display:flex; flex-direction:column; gap:1.1rem;">
          <!-- Summary Header Box -->
          <div style="background:var(--bg-surface-secondary); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:1rem 1.15rem; display:flex; flex-direction:column; gap:0.6rem;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <span class="badge ${badgeClass}" style="font-size:0.75rem; padding:3px 8px; font-weight:700;">
                  ${isBatch ? `${genderLabel} Batch Exit` : `${genderLabel} Individual Exit`}
                </span>
                <span style="font-weight:700; font-size:1rem; color:var(--text-primary);">${item.purpose || 'Hostel Leave'}</span>
              </div>
              <span class="badge badge-warning" style="font-size:0.75rem; padding:3px 8px;">
                ● ${totalCount} Student${totalCount > 1 ? 's' : ''} Currently Away
              </span>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:0.6rem; font-size:0.82rem; color:var(--text-secondary); padding-top:0.5rem; border-top:1px solid var(--border-subtle);">
              <div>
                <span style="color:var(--text-muted);">Exit Date:</span>
                <strong style="color:var(--text-primary); margin-left:4px;">${item.exit_date || 'Today'}</strong>
              </div>
              <div>
                <span style="color:var(--text-muted);">Exit Time:</span>
                <strong style="color:var(--text-primary); margin-left:4px;">${item.exit_time || '—'}</strong>
              </div>
              ${item.leaveCode ? `
                <div>
                  <span style="color:var(--text-muted);">Leave Code:</span>
                  <strong style="color:var(--text-primary); margin-left:4px; font-family:monospace;">${item.leaveCode}</strong>
                </div>
              ` : ''}
            </div>
          </div>

          ${isBatch ? `
            <!-- Search / Filter bar for Batch Students -->
            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap;">
              <div class="filter-search" style="flex:1; min-width:200px; margin:0;">
                <input type="text" id="inspect-roster-search" class="form-control" placeholder="Search by name, admission no, class..." oninput="App.filterInspectRoster(this.value)" style="height:36px; font-size:0.85rem;">
              </div>
              <div id="inspect-roster-count" style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">
                Showing ${students.length} of ${students.length} students
              </div>
            </div>
          ` : ''}

          <!-- Students List Container -->
          <div id="inspect-roster-list" style="display:flex; flex-direction:column; gap:0.6rem; max-height:360px; overflow-y:auto; padding-right:4px;">
            ${students.map(s => {
              const bed = s.bed_id ? bedMap.get(s.bed_id) : null;
              const room = (bed && bed.room_id) ? roomMap.get(bed.room_id) : null;
              const hostel = (room && room.hostel_id) ? hostelMap.get(room.hostel_id) : null;
              const locStr = [hostel, room ? `Rm ${room.room_number}` : '', bed ? `Bed ${bed.bed_number}` : ''].filter(Boolean).join(' • ');

              const photoUrl = (s.photo_url && !s.photo_url.includes('unsplash.com')) ? s.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '');
              const sBoy = (s.gender === 'male' || s.gender === 'boys');
              const sBadgeClass = sBoy ? 'badge-info' : 'badge-purple';

              return `
                <div class="inspect-student-row" data-name="${(s.full_name || '').toLowerCase()}" data-admission="${(s.admission_no || '').toLowerCase()}" data-class="${(s.school_class || '').toLowerCase()}" style="display:flex; align-items:center; justify-content:space-between; gap:0.9rem; padding:0.7rem 0.9rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface); transition:background 0.15s;">
                  <div style="display:flex; align-items:center; gap:0.85rem; min-width:0; flex:1;">
                    <img src="${photoUrl}" style="width:40px; height:40px; border-radius:var(--radius-full); object-fit:cover; border:1.5px solid ${sBoy ? 'rgba(2,132,199,0.3)' : 'rgba(219,39,119,0.3)'}; flex-shrink:0;" alt="${s.full_name}" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                    <div style="min-width:0; flex:1;">
                      <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:2px;">
                        <strong style="font-size:0.92rem; color:var(--text-primary);">${s.full_name}</strong>
                        <span class="badge ${sBadgeClass}" style="font-size:0.66rem; padding:1px 5px;">${sBoy ? 'Boy' : 'Girl'}</span>
                        <span class="badge badge-neutral" style="font-size:0.66rem; padding:1px 5px;">Class ${s.school_class || '—'}</span>
                      </div>
                      <div style="font-size:0.75rem; color:var(--text-secondary); display:flex; gap:0.6rem; flex-wrap:wrap; font-family:monospace;">
                        <span>Adm: <strong>${s.admission_no || '—'}</strong></span>
                        ${locStr ? `<span style="font-family:inherit; color:var(--text-muted);">📍 ${locStr}</span>` : ''}
                      </div>
                    </div>
                  </div>
                  <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0;">
                    <span class="badge badge-warning" style="font-size:0.7rem; font-weight:600;">Away</span>
                    ${s.parent_phone ? `<span style="font-size:0.72rem; color:var(--text-muted);">📞 ${s.parent_phone}</span>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      const footerHtml = `
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
        ${(item.type === 'batch_leave' || item.leaveId) ? `
          <button class="btn btn-primary" onclick="App.closeModal(); setTimeout(() => App.openArrivalModal('batch', '${item.leaveId}'), 120);" style="display:inline-flex; align-items:center; gap:6px; font-weight:600;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Mark Batch Return</span>
          </button>
        ` : (item.type === 'individual' || item.entryId ? `
          <button class="btn btn-primary" onclick="App.closeModal(); setTimeout(() => App.openArrivalModal('individual'), 120);" style="display:inline-flex; align-items:center; gap:6px; font-weight:600;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Mark Return</span>
          </button>
        ` : '')}
      `;

      this.openModal(modalTitle, bodyHtml, footerHtml, 'modal-lg modal-fixed-size');
    } catch (err) {
      console.error('[Inspect Students Modal Error]', err);
      this.showToast('Failed to load student inspection roster: ' + err.message, 'error');
    }
  }

  filterInspectRoster(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.inspect-student-row');
    let visibleCount = 0;
    rows.forEach(row => {
      const name = row.getAttribute('data-name') || '';
      const adm = row.getAttribute('data-admission') || '';
      const sClass = row.getAttribute('data-class') || '';
      const matches = !q || name.includes(q) || adm.includes(q) || sClass.includes(q);
      row.style.display = matches ? 'flex' : 'none';
      if (matches) visibleCount++;
    });
    const countEl = document.getElementById('inspect-roster-count');
    if (countEl) {
      countEl.textContent = `Showing ${visibleCount} of ${rows.length} students`;
    }
  }

  async printLeavePass(leaveId) {
    const leaves = await window.LeaveService.getAllLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return;

    const leaveStudents = await window.LeaveService.getLeaveStudents(leaveId);
    const allStudents = await window.StudentService.getAllStudents();

    const bodyHtml = `
      <div class="leave-card-print">
        <div style="text-align:center; border-bottom:2px solid #0d5c3a; padding-bottom:10px; margin-bottom:14px;">
          <img src="logo.png" style="height:48px; max-width:180px; object-fit:contain; margin-bottom:4px;" alt="Thaiba Public School">
          <h2 style="color:#0d5c3a; font-size:1.3rem; margin:4px 0 2px 0;">THAIBA PUBLIC SCHOOL</h2>
          <p style="font-size:0.8rem; color:#4b5563; font-weight:700;">OFFICIAL HOSTEL LEAVE PASS • ${leave.leave_code}</p>
        </div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:14px; font-size:0.88rem;">
          <tr><td style="padding:6px; font-weight:700;">Leave Type:</td><td style="text-transform:capitalize;">${leave.leave_type.replace('_', ' ')}</td><td style="padding:6px; font-weight:700;">Reason:</td><td>${leave.reason}</td></tr>
          <tr><td style="padding:6px; font-weight:700;">Departure:</td><td>${leave.leaving_date} ${leave.leaving_time}</td><td style="padding:6px; font-weight:700;">Expected Return:</td><td>${leave.expected_return_date} ${leave.expected_return_time}</td></tr>
        </table>
        <h4 style="font-size:0.9rem; margin-bottom:6px; color:#0d5c3a;">Authorized Students List:</h4>
        <ul style="font-size:0.85rem; padding-left:20px; line-height:1.7;">
          ${leaveStudents.map(ls => {
            const s = allStudents.find(st => st.id === ls.student_id);
            return `<li><strong>${s ? s.full_name : 'Student'}</strong> (ID: ${s ? s.admission_no : ''} • Class ${s ? s.school_class : ''})</li>`;
          }).join('')}
        </ul>
        <div style="display:flex; justify-content:space-between; margin-top:40px; padding-top:12px; border-top:1px dashed #ccc; font-size:0.85rem;">
          <div>Student Signature</div>
          <div>Parent / Guardian</div>
          <div>Warden Signature & Seal</div>
        </div>
      </div>
    `;

    this.openModal(`Print Leave Pass: ${leave.leave_code}`, bodyHtml, `
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print Pass</button>
      <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
    `, 'large');
  }

  // ==========================================================================
  // REPORTS & NOTICES ACTIONS
  // ==========================================================================

  setReportCategory(category) {
    window.ReportsView.activeReport = category;
    this.renderCurrentView();
  }

  async openCreateNoticeModal() {
    const today = new Date().toISOString().split('T')[0];

    const bodyHtml = `
      <form id="create-notice-form">
        <div class="form-group">
          <label class="form-label">Notice Title <span class="required">*</span></label>
          <input type="text" class="form-control" name="title" placeholder="e.g. Vacation Schedule & Timing Guidelines" required>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Target Audience</label>
            <select class="form-control" name="audience">
              <option value="all">All (Students, Parents & Staff)</option>
              <option value="boys">Boys Hostel</option>
              <option value="girls">Girls Hostel</option>
              <option value="parents">Parents Only</option>
              <option value="teachers">Teachers Only</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority Level</label>
            <select class="form-control" name="priority">
              <option value="normal" selected>Normal</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notice Content / Announcement Body <span class="required">*</span></label>
          <textarea class="form-control" name="content" rows="4" placeholder="Write the announcement description..." required></textarea>
        </div>
      </form>
    `;

    this.openModal('Publish New Notice / Broadcast', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveNotice()">Publish Announcement</button>
    `, 'large');
  }

  async saveNotice() {
    const form = document.getElementById('create-notice-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.published_date = new Date().toISOString().split('T')[0];
    data.author_name = window.Auth.currentUser ? window.Auth.currentUser.full_name : 'Warden Office';

    try {
      await db.insertRecord('notices', data);
      this.closeModal();
      this.showToast('Announcement published successfully!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // AUTHENTICATION MODALS (LOGIN, SIGN UP, FORGOT PASSWORD)
  // ==========================================================================

  openLoginModal() {
    const bodyHtml = `
      <div style="text-align:center; margin-bottom:1.25rem;">
        <img src="logo.png" style="height:48px; max-width:100%; object-fit:contain;" alt="Thaiba Public School">
      </div>
      <form id="login-form">
        <div class="form-group">
          <label class="form-label">Email ID <span class="required">*</span></label>
          <input type="email" class="form-control" name="email" id="login-email" placeholder="e.g. abdulhaseebkt2@gmail.com" required value="abdulhaseebkt2@gmail.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password <span class="required">*</span></label>
          <input type="password" class="form-control" name="password" id="login-password" placeholder="Enter your password" required value="admin123">
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; font-size:0.85rem;">
          <a href="javascript:void(0)" onclick="App.openForgotPasswordModal()" style="color:var(--primary-700); font-weight:600; text-decoration:none;">
            Forgot Password?
          </a>
          <a href="javascript:void(0)" onclick="App.openSignUpModal()" style="color:var(--primary-700); font-weight:600; text-decoration:none;">
            Create New Account (Sign Up)
          </a>
        </div>
      </form>
    `;

    this.openModal('Sign In to TPS Hostel Portal', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.submitLogin()">Log In</button>
    `);
  }

  async submitLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    try {
      const user = await window.Auth.login(email, pass);
      this.closeModal();
      this.showToast(`Welcome back, ${user.full_name} (${user.role.toUpperCase()})!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  openSignUpModal() {
    const bodyHtml = `
      <div style="text-align:center; margin-bottom:1.25rem;">
        <img src="logo.png" style="height:48px; max-width:100%; object-fit:contain;" alt="Thaiba Public School">
      </div>
      <form id="signup-form">
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input type="text" class="form-control" name="full_name" id="signup-name" required placeholder="e.g. Khalid Al-Mansoor">
        </div>
        <div class="form-group">
          <label class="form-label">Email ID <span class="required">*</span></label>
          <input type="email" class="form-control" name="email" id="signup-email" required placeholder="your.email@gmail.com">
          <div class="form-hint">Super Admin will receive your registration and assign your role.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Mobile / WhatsApp Phone</label>
          <input type="text" class="form-control" name="phone" id="signup-phone" placeholder="+91 98XXX XXXXX">
        </div>
        <div class="form-group">
          <label class="form-label">Desired Position / Category</label>
          <select class="form-control" name="requested_role" id="signup-role">
            <option value="teacher">Teacher</option>
            <option value="warden">Hostel Warden / Mentor</option>
            <option value="student">Student</option>
            <option value="parent">Parent / Guardian</option>
            <option value="admin">Hostel Administrator</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Password <span class="required">*</span></label>
          <input type="password" class="form-control" name="password" id="signup-pass" required placeholder="Minimum 6 characters">
        </div>
        <div style="font-size:0.85rem; margin-top:0.5rem;">
          Already have an account? 
          <a href="javascript:void(0)" onclick="App.openLoginModal()" style="color:var(--primary-700); font-weight:600; text-decoration:none;">Log In</a>
        </div>
      </form>
    `;

    this.openModal('Create New Account (Sign Up)', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.submitSignUp()">Register Account</button>
    `);
  }

  async submitSignUp() {
    const fullName = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const requestedRole = document.getElementById('signup-role').value;
    const password = document.getElementById('signup-pass').value;

    try {
      const user = await window.Auth.signup({
        full_name: fullName,
        email: email,
        phone: phone,
        requested_role: requestedRole,
        password: password
      });

      this.closeModal();
      if (user.status === 'pending_approval') {
        this.showToast('Registration successful! Super Admin (Abdul Haseeb) will review and assign your role.', 'info', 'Pending Approval');
      } else {
        this.showToast('Super Admin account created and activated!', 'success');
      }
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  openForgotPasswordModal() {
    const bodyHtml = `
      <div>
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
          Enter your registered Email ID. A password recovery instruction and temporary reset key will be generated for your account.
        </p>
        <div class="form-group">
          <label class="form-label">Registered Email ID <span class="required">*</span></label>
          <input type="email" class="form-control" id="recovery-email" placeholder="e.g. abdulhaseebkt2@gmail.com" required>
        </div>
      </div>
    `;

    this.openModal('Password Recovery', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.submitForgotPassword()">Send Recovery Key</button>
    `);
  }

  async submitForgotPassword() {
    const email = document.getElementById('recovery-email').value;
    try {
      const res = await window.Auth.recoverPassword(email);
      this.closeModal();
      this.openModal('Password Reset Details', `
        <div style="text-align:center; padding:1rem;">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">🔑</div>
          <h4 style="color:var(--success-text); margin-bottom:0.5rem;">Recovery Instructions Generated</h4>
          <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
            A temporary password key has been assigned for <strong>${res.email}</strong>.
          </p>
          <div style="background:var(--bg-surface-secondary); padding:0.75rem; border-radius:var(--radius-md); font-family:monospace; font-size:1.1rem; font-weight:800; border:1px dashed var(--border-color); color:var(--primary-700);">
            ${res.tempPassword}
          </div>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-top:0.75rem;">
            You can now sign in using this temporary key and change your password in account settings.
          </p>
        </div>
      `, `
        <button class="btn btn-primary" onclick="App.openLoginModal()">Proceed to Log In</button>
      `);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // SUPER ADMIN USER MANAGEMENT & ROLE ASSIGNMENT MODALS
  // ==========================================================================

  async openAssignRoleModal(userId) {
    const users = await window.Auth.getAllUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const students = await window.StudentService.getAllStudents();
    const teachers = await db.getTable('teachers');
    const hostels = await window.HostelService.getAllHostels();

    const bodyHtml = `
      <form id="assign-role-form">
        <p style="font-size:0.88rem; margin-bottom:1rem; color:var(--text-secondary);">
          Assign designated institutional position for <strong>${user.full_name}</strong> (${user.email}).
        </p>

        <div class="form-group">
          <label class="form-label">Position / Role <span class="required">*</span></label>
          <select class="form-control" name="role" id="assign-role-select" onchange="App.onAssignRoleChange(this.value)">
            <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Teacher (Class Attendance & Schedule)</option>
            <option value="warden" ${user.role === 'warden' ? 'selected' : ''}>Hostel Warden / Mentor</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Hostel Admin (Day-to-day operations)</option>
            <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student (Hostel Resident)</option>
            <option value="parent" ${user.role === 'parent' ? 'selected' : ''}>Parent / Guardian</option>
            <option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>Super Admin (Full Control)</option>
          </select>
        </div>

        <div class="form-group" id="link-teacher-group">
          <label class="form-label">Link to Teacher / Faculty Profile</label>
          <select class="form-control" name="teacher_id" id="assign-teacher-id">
            <option value="">-- Select Faculty Record --</option>
            ${teachers.map(t => `<option value="${t.id}" ${user.linked_teacher_id === t.id ? 'selected' : ''}>${t.full_name} (${t.employee_id})</option>`).join('')}
          </select>
        </div>

        <div class="form-group" id="link-student-group" style="display:none;">
          <label class="form-label">Link to Student Profile</label>
          <select class="form-control" name="student_id" id="assign-student-id">
            <option value="">-- Select Student Record --</option>
            ${students.map(s => `<option value="${s.id}" ${user.linked_student_id === s.id ? 'selected' : ''}>${s.full_name} (${s.admission_no} - ${s.school_class})</option>`).join('')}
          </select>
        </div>

        <div class="form-group" id="link-hostel-group" style="display:none;">
          <label class="form-label">Assigned Hostel Facility</label>
          <select class="form-control" name="hostel_id" id="assign-hostel-id">
            <option value="">-- All Hostels / Campus --</option>
            ${hostels.map(h => `<option value="${h.id}" ${user.hostel_id === h.id ? 'selected' : ''}>${h.name}</option>`).join('')}
          </select>
        </div>
      </form>
    `;

    this.openModal(`Assign Position: ${user.full_name}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveUserRoleAssignment('${user.id}')">Approve & Assign Position</button>
    `);

    // Dynamically display only role-relevant linking fields
    this.onAssignRoleChange(user.role || 'teacher');
  }

  onAssignRoleChange(role) {
    const teacherGroup = document.getElementById('link-teacher-group');
    const studentGroup = document.getElementById('link-student-group');
    const hostelGroup = document.getElementById('link-hostel-group');

    if (!teacherGroup || !studentGroup || !hostelGroup) return;

    if (role === 'teacher') {
      teacherGroup.style.display = 'block';
      studentGroup.style.display = 'none';
      hostelGroup.style.display = 'none';
    } else if (role === 'warden') {
      teacherGroup.style.display = 'block';
      studentGroup.style.display = 'none';
      hostelGroup.style.display = 'block';
    } else if (role === 'admin') {
      teacherGroup.style.display = 'none';
      studentGroup.style.display = 'none';
      hostelGroup.style.display = 'block';
    } else if (role === 'student' || role === 'parent') {
      teacherGroup.style.display = 'none';
      studentGroup.style.display = 'block';
      hostelGroup.style.display = 'none';
    } else if (role === 'super_admin') {
      teacherGroup.style.display = 'none';
      studentGroup.style.display = 'none';
      hostelGroup.style.display = 'none';
    } else {
      teacherGroup.style.display = 'block';
      studentGroup.style.display = 'none';
      hostelGroup.style.display = 'none';
    }
  }

  async saveUserRoleAssignment(userId) {
    const role = document.getElementById('assign-role-select')?.value || 'teacher';
    const teacherId = (role === 'teacher' || role === 'warden') ? (document.getElementById('assign-teacher-id')?.value || null) : null;
    const studentId = (role === 'student' || role === 'parent') ? (document.getElementById('assign-student-id')?.value || null) : null;
    const hostelId = (role === 'warden' || role === 'admin') ? (document.getElementById('assign-hostel-id')?.value || null) : null;

    try {
      await window.Auth.approveUserAndAssignRole(userId, role, {
        teacher_id: teacherId,
        student_id: studentId,
        hostel_id: hostelId
      });

      this.closeModal();
      this.showToast(`User successfully updated to role: ${role.toUpperCase()}!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async toggleUserActive(userId, targetStatus) {
    try {
      if (targetStatus === 'disabled') {
        await window.Auth.disableUser(userId);
        this.showToast('User account has been deactivated.', 'warning');
      } else {
        await window.Auth.activateUser(userId);
        this.showToast('User account has been activated.', 'success');
      }
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  confirmRemoveUser(userId, userName) {
    this.openModal('Confirm Account Removal', `
      <div style="text-align:center; padding:1rem;">
        <div style="font-size:2.5rem; color:var(--danger-solid); margin-bottom:0.5rem;">⚠️</div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Are you sure you want to remove this user?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
          This will permanently delete the login account for <strong>${userName}</strong> from the TPS Hostel Platform.
        </p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeRemoveUser('${userId}')">Yes, Remove User</button>
    `);
  }

  async executeRemoveUser(userId) {
    try {
      await window.Auth.removeUser(userId);
      this.closeModal();
      this.showToast('User account removed from platform.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openCreateUserModal(preselectedStaffId = null) {
    const teachers = await db.getTable('teachers');
    const users = await window.Auth.getAllUsers();

    // Cache teachers for instant auto-filling
    this._cachedTeachersForUserModal = teachers;
    this._cachedUsersForUserModal = users;

    const bodyHtml = `
      <form id="create-user-form" onsubmit="event.preventDefault(); App.saveCreateUserAccount();">
        <div style="background: rgba(14, 116, 144, 0.08); border: 1px solid var(--border-color); border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: flex-start; gap: 0.6rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary-700); flex-shrink:0; margin-top:2px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.45;">
              <strong>Staff Login Provisioning:</strong> Select a staff member from the Staff Directory below. Their <strong>Gmail / Email ID</strong>, <strong>Name</strong>, and <strong>Phone</strong> will be populated automatically. Then assign their login <strong>Password</strong> to activate their portal access.
            </div>
          </div>
        </div>

        <!-- 1. Staff Directory Picker -->
        <div class="form-group">
          <label class="form-label" style="font-weight: 600; display:flex; justify-content:space-between; align-items:center;">
            <span>Select from Staff & Faculty Directory</span>
            <span class="badge badge-info" style="font-size:0.7rem; text-transform:none;">Auto-Fills Email & Details</span>
          </label>
          <select class="form-control" id="new-user-staff-select" onchange="App.onSelectStaffForUserCreation(this.value)" style="font-weight:500;">
            <option value="">-- Choose a Staff Member from Directory --</option>
            ${teachers.map(t => {
              const existingUser = users.find(u => u.linked_teacher_id === t.id || (t.email && u.email.toLowerCase() === t.email.toLowerCase()));
              const isSelected = preselectedStaffId === t.id;
              const statusBadge = existingUser ? '✓ [Has Account]' : '⚡ [Needs Account]';
              return `<option value="${t.id}" ${isSelected ? 'selected' : ''}>${t.full_name} (${t.employee_id || 'Staff'}) — ${t.email || 'No Gmail/Email'} ${statusBadge}</option>`;
            }).join('')}
            <option value="__manual__">➕ Manual User Entry / Non-Staff Account</option>
          </select>
        </div>

        <input type="hidden" id="new-user-linked-teacher-id" value="${preselectedStaffId || ''}">

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
          <!-- Full Name -->
          <div class="form-group">
            <label class="form-label">Full Name <span class="required">*</span></label>
            <input type="text" class="form-control" id="new-user-fullname" placeholder="Staff / User Name" required>
          </div>

          <!-- Gmail / Email ID -->
          <div class="form-group">
            <label class="form-label">Gmail / Email ID <span class="required">*</span></label>
            <input type="email" class="form-control" id="new-user-email" placeholder="e.g. staff@gmail.com" required style="font-family:monospace;">
            <small style="font-size:0.72rem; color:var(--text-muted); display:block; margin-top:3px;">Auto-fetched from Staff Directory or enter Gmail</small>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
          <!-- Phone Number -->
          <div class="form-group">
            <label class="form-label">Contact Phone</label>
            <input type="tel" class="form-control" id="new-user-phone" placeholder="e.g. +91 98765 43210">
          </div>

          <!-- Role / Position -->
          <div class="form-group">
            <label class="form-label">Assign Portal Role <span class="required">*</span></label>
            <select class="form-control" id="new-user-role" required>
              <option value="teacher">Teacher (Attendance, Timetable & Notes)</option>
              <option value="warden">Hostel Warden (Hostel, Attendance & Leaves)</option>
              <option value="admin">Hostel Admin (Operations & Management)</option>
              <option value="super_admin">Super Admin (Full Platform Control)</option>
              <option value="student">Student (Hostel Resident)</option>
              <option value="parent">Parent / Guardian</option>
            </select>
          </div>
        </div>

        <!-- Password Field with Quick Generate & Visibility Toggle -->
        <div class="form-group" style="margin-top: 0.25rem;">
          <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Assign Login Password <span class="required">*</span></span>
            <span id="new-user-account-hint" style="font-size:0.75rem; color:var(--text-muted);"></span>
          </label>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <div style="position: relative; flex: 1;">
              <input type="password" class="form-control" id="new-user-password" placeholder="Enter password (minimum 4 characters)" required style="padding-right: 2.75rem; font-family:monospace;">
              <button type="button" class="icon-btn" onclick="App.togglePasswordVisibility('new-user-password', this)" style="position:absolute; right:6px; top:50%; transform:translateY(-50%); border:none; background:transparent; cursor:pointer; color:var(--text-secondary); width:28px; height:28px;" title="Show / Hide Password">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="App.generateQuickPassword()" style="white-space:nowrap; padding:0.5rem 0.75rem;" title="Auto-generate a secure suggested password">
              🎲 Suggest Pass
            </button>
          </div>
          <small style="font-size:0.73rem; color:var(--text-muted); display:block; margin-top:4px;">
            The staff member will use their Gmail ID and this password to log in.
          </small>
        </div>
      </form>
    `;

    this.openModal('Create & Provision User Login Account', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveCreateUserAccount()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
        Save & Provision Login
      </button>
    `);

    // If preselectedStaffId is provided, trigger auto-fill immediately
    if (preselectedStaffId) {
      this.onSelectStaffForUserCreation(preselectedStaffId);
    }
  }

  onSelectStaffForUserCreation(staffId) {
    const fullNameInput = document.getElementById('new-user-fullname');
    const emailInput = document.getElementById('new-user-email');
    const phoneInput = document.getElementById('new-user-phone');
    const roleSelect = document.getElementById('new-user-role');
    const linkedTeacherInput = document.getElementById('new-user-linked-teacher-id');
    const passwordInput = document.getElementById('new-user-password');
    const hintSpan = document.getElementById('new-user-account-hint');

    if (!staffId || staffId === '__manual__') {
      if (linkedTeacherInput) linkedTeacherInput.value = '';
      if (hintSpan) hintSpan.innerHTML = '';
      return;
    }

    const teachers = this._cachedTeachersForUserModal || [];
    const users = this._cachedUsersForUserModal || [];

    const teacher = teachers.find(t => t.id === staffId);
    if (!teacher) return;

    if (linkedTeacherInput) linkedTeacherInput.value = teacher.id;
    if (fullNameInput) fullNameInput.value = teacher.full_name || '';
    if (emailInput) emailInput.value = teacher.email || '';
    if (phoneInput) phoneInput.value = teacher.phone || '';

    // Determine default role based on staff roles / specialization
    if (roleSelect) {
      if ((teacher.roles && teacher.roles.includes('warden')) || (teacher.specialization && teacher.specialization.toLowerCase().includes('warden')) || teacher.role === 'warden') {
        roleSelect.value = 'warden';
      } else if ((teacher.roles && teacher.roles.includes('admin')) || teacher.role === 'admin') {
        roleSelect.value = 'admin';
      } else {
        roleSelect.value = 'teacher';
      }
    }

    // Check if an existing account exists for this staff or email
    const existingUser = users.find(u => u.linked_teacher_id === teacher.id || (teacher.email && u.email.toLowerCase() === teacher.email.toLowerCase()));

    if (existingUser) {
      if (roleSelect && existingUser.role) {
        roleSelect.value = existingUser.role;
      }
      if (hintSpan) {
        hintSpan.innerHTML = `<span style="color:var(--accent-gold-500); font-weight:600;">⚠️ Updating existing account (${existingUser.email})</span>`;
      }
      if (passwordInput && !passwordInput.value) {
        passwordInput.placeholder = 'Enter new password to update';
      }
    } else {
      if (hintSpan) {
        hintSpan.innerHTML = `<span style="color:var(--success-500, #10b981); font-weight:600;">✨ New Account</span>`;
      }
      // Pre-fill a convenient initial password if empty
      if (passwordInput && !passwordInput.value) {
        const empCode = (teacher.employee_id || '2026').replace(/[^a-zA-Z0-9]/g, '');
        passwordInput.value = `TPS@${empCode}`;
      }
    }
  }

  generateQuickPassword() {
    const passInput = document.getElementById('new-user-password');
    if (!passInput) return;
    const num = Math.floor(1000 + Math.random() * 9000);
    const pass = `TPS@${num}`;
    passInput.value = pass;
    passInput.type = 'text'; // Show temporarily so admin can view/copy
    this.showToast(`Suggested password generated: ${pass}`, 'info');
  }

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    } else {
      input.type = 'password';
      if (btn) btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
  }

  async saveCreateUserAccount() {
    const fullName = (document.getElementById('new-user-fullname')?.value || '').trim();
    const email = (document.getElementById('new-user-email')?.value || '').trim().toLowerCase();
    const phone = (document.getElementById('new-user-phone')?.value || '').trim();
    const role = document.getElementById('new-user-role')?.value || 'teacher';
    const password = document.getElementById('new-user-password')?.value || '';
    const linkedTeacherId = document.getElementById('new-user-linked-teacher-id')?.value || null;

    if (!fullName) {
      this.showToast('Please enter the user full name.', 'warning');
      return;
    }
    if (!email || !email.includes('@')) {
      this.showToast('Please provide a valid Gmail / Email address.', 'warning');
      return;
    }
    if (!password || password.length < 4) {
      this.showToast('Please set a password with at least 4 characters.', 'warning');
      return;
    }

    try {
      const users = await window.Auth.getAllUsers();
      const existingUser = users.find(u => (linkedTeacherId && u.linked_teacher_id === linkedTeacherId) || u.email.toLowerCase() === email);

      let matchedTeacher = null;
      if (linkedTeacherId) {
        const teachers = await db.getTable('teachers');
        matchedTeacher = teachers.find(t => t.id === linkedTeacherId);
        // If teacher record doesn't have email/phone, sync them
        if (matchedTeacher && (!matchedTeacher.email || !matchedTeacher.phone)) {
          await db.updateRecord('teachers', matchedTeacher.id, {
            email: email,
            phone: phone || matchedTeacher.phone
          });
        }
      }

      if (existingUser) {
        // Update existing user credentials and ensure active
        await db.updateRecord('users', existingUser.id, {
          full_name: fullName,
          email: email,
          phone: phone,
          role: role,
          password_hash: password,
          linked_teacher_id: linkedTeacherId || existingUser.linked_teacher_id || null,
          status: 'active'
        });

        this.showToast(`Login credentials updated successfully for ${fullName} (${email})!`, 'success');
      } else {
        // Create brand new active user record
        const newUser = {
          id: 'usr_' + Date.now(),
          email: email,
          full_name: fullName,
          password_hash: password,
          role: role,
          status: 'active',
          phone: phone,
          linked_teacher_id: linkedTeacherId || null,
          avatar_url: (matchedTeacher && matchedTeacher.avatar_url && !matchedTeacher.avatar_url.includes('unsplash.com')) ? matchedTeacher.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : ''),
          created_at: new Date().toISOString()
        };

        await db.insertRecord('users', newUser);

        // Also record audit notification
        await db.insertRecord('notifications', {
          recipient_role: CONFIG.ROLES.SUPER_ADMIN,
          title: 'New Staff Login Provisioned',
          message: `Login account created for ${fullName} (${email}) with role: ${role.toUpperCase()}.`,
          type: 'general',
          related_id: newUser.id,
          is_read: false
        });

        this.showToast(`Account successfully created & activated for ${fullName}!`, 'success');
      }

      this.closeModal();
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  openQuickSetEmailModal(staffId, staffName, currentEmail = '') {
    const bodyHtml = `
      <form id="quick-email-form" onsubmit="event.preventDefault(); App.saveQuickStaffEmail('${staffId}');">
        <div style="background: rgba(14, 116, 144, 0.08); border: 1px solid var(--border-color); border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: flex-start; gap: 0.6rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary-700); flex-shrink:0; margin-top:2px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.45;">
              Enter the official <strong>Gmail / Institutional Email ID</strong> for <strong>${staffName}</strong>. This email will be linked to their faculty profile and used for logging into the portal.
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Gmail / Email ID <span class="required">*</span></label>
          <input type="email" class="form-control" id="quick-staff-email" value="${currentEmail || ''}" placeholder="e.g. name@gmail.com" required style="font-family:monospace;">
        </div>
      </form>
    `;

    this.openModal(`Set Gmail ID: ${staffName}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveQuickStaffEmail('${staffId}')">Save Gmail ID</button>
    `);
  }

  async saveQuickStaffEmail(staffId) {
    const email = (document.getElementById('quick-staff-email')?.value || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      this.showToast('Please enter a valid Gmail / Email address.', 'warning');
      return;
    }
    try {
      // 1. Update teachers table
      await db.updateRecord('teachers', staffId, { email: email });

      // 2. If a user record exists linked to this teacher, update user email as well
      const users = await db.getTable('users');
      const matchedUser = users.find(u => u.linked_teacher_id === staffId);
      if (matchedUser) {
        await db.updateRecord('users', matchedUser.id, { email: email });
      }

      this.closeModal();
      this.showToast('Gmail ID updated successfully!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  openResetPasswordModal(userId) {
    this.openModal('Reset User Password', `
      <div class="form-group">
        <label class="form-label">New Password</label>
        <input type="password" class="form-control" id="admin-new-pass" placeholder="Enter new password">
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveNewUserPassword('${userId}')">Update Password</button>
    `);
  }

  async saveNewUserPassword(userId) {
    const pass = document.getElementById('admin-new-pass').value;
    if (!pass) return;
    try {
      await db.updateRecord('users', userId, { password_hash: pass });
      this.closeModal();
      this.showToast('Password successfully updated!', 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // Filter Handlers
  onUserSearch(q) {
    window.UsersView.searchQuery = q;
    this.renderCurrentView();
  }

  onUserFilter(key, val) {
    if (key === 'role') window.UsersView.filterRole = val;
    if (key === 'status') window.UsersView.filterStatus = val;
    this.renderCurrentView();
  }

  onStudentSearch(query) {
    window.StudentsView.searchQuery = query;
    this.renderCurrentView();
  }

  onStudentFilter(key, value) {
    if (key === 'gender') window.StudentsView.filterGender = value;
    if (key === 'hostel') window.StudentsView.filterHostel = value;
    if (key === 'status') window.StudentsView.filterStatus = value;
    if (key === 'class') window.StudentsView.filterClass = value;
    this.renderCurrentView();
  }

  // Attendance Handlers
  onSelectAttendanceGroup(groupId) {
    window.AttendanceView.selectedGroupId = groupId;
    this.renderCurrentView();
  }

  // ==========================================================================
  // ATTENDANCE ENGINE & SECTION MANAGEMENT CONTROLLER
  // ==========================================================================

  onSelectAttendanceSection(sectionId) {
    window.AttendanceView.selectedSectionId = sectionId;
    window.AttendanceView.selectedGroupId = null;
    window.AttendanceView.isStateInitialized = false;
    this.renderCurrentView();
  }

  onSelectAttendanceTab(tabName) {
    window.AttendanceView.selectedTab = tabName;
    this.renderCurrentView();
  }

  onSelectAttendanceGroup(groupId) {
    window.AttendanceView.selectedGroupId = groupId;
    window.AttendanceView.isStateInitialized = false;
    window.AttendanceView.selectedPeriodId = null;
    this.renderCurrentView();
  }

  onSelectAttendancePeriod(periodId) {
    window.AttendanceView.selectedPeriodId = periodId;
    window.AttendanceView.isStateInitialized = false;
    this.renderCurrentView();
  }

  onSelectTimetableDay(day) {
    window.AttendanceView.selectedTimetableDay = day;
    window.AttendanceView.timetableFilterView = 'day';
    this.renderCurrentView();
  }

  onSetTimetableFilterView(viewMode) {
    window.AttendanceView.timetableFilterView = viewMode;
    this.renderCurrentView();
  }

  toggleAttendanceDatePicker(event) {
    if (event) event.stopPropagation();
    const target = document.getElementById('attendance-datepicker');
    if (!target) return;
    const wasOpen = target.classList.contains('open');
    document.querySelectorAll('.glass-datepicker-wrapper.open, .glass-dropdown.open, .glass-timepicker-wrapper.open').forEach(d => d.classList.remove('open'));
    if (!wasOpen) {
      target.classList.add('open');
      const popover = target.querySelector('.glass-datepicker-popover');
      if (popover) {
        popover.classList.remove('popover-align-right');
        const rect = target.getBoundingClientRect();
        if (rect.left + 300 > window.innerWidth - 16 && rect.right - 300 >= 16) {
          popover.classList.add('popover-align-right');
        }
      }
    }
  }

  navAttendanceCal(delta, event) {
    if (event) event.stopPropagation();
    if (!window.AttendanceView) return;
    if (window.AttendanceView.calViewMonth === undefined) {
      const d = new Date(window.AttendanceView.selectedDate || Date.now());
      window.AttendanceView.calViewYear = d.getFullYear();
      window.AttendanceView.calViewMonth = d.getMonth();
    }
    window.AttendanceView.calViewMonth += delta;
    if (window.AttendanceView.calViewMonth < 0) {
      window.AttendanceView.calViewMonth = 11;
      window.AttendanceView.calViewYear -= 1;
    } else if (window.AttendanceView.calViewMonth > 11) {
      window.AttendanceView.calViewMonth = 0;
      window.AttendanceView.calViewYear += 1;
    }
    this.renderCurrentView();
    // Keep datepicker popover open while navigating months
    setTimeout(() => {
      const target = document.getElementById('attendance-datepicker');
      if (target) {
        target.classList.add('open');
        const popover = target.querySelector('.glass-datepicker-popover');
        if (popover) {
          popover.classList.remove('popover-align-right');
          const rect = target.getBoundingClientRect();
          if (rect.left + 300 > window.innerWidth - 16 && rect.right - 300 >= 16) {
            popover.classList.add('popover-align-right');
          }
        }
      }
    }, 20);
  }

  selectAttendanceDate(newDate, event) {
    if (event) event.stopPropagation();
    if (!window.AttendanceView) return;
    window.AttendanceView.selectedDate = newDate;
    window.AttendanceView.isStateInitialized = false;
    window.AttendanceView.selectedPeriodId = null;
    const d = new Date(newDate);
    window.AttendanceView.calViewYear = d.getFullYear();
    window.AttendanceView.calViewMonth = d.getMonth();
    this.renderCurrentView();
  }

  onAttendanceDateChange(newDate) {
    window.AttendanceView.selectedDate = newDate;
    window.AttendanceView.isStateInitialized = false;
    window.AttendanceView.selectedPeriodId = null;
    this.renderCurrentView();
  }

  resetAttendanceToDefault() {
    window.AttendanceView.isStateInitialized = false;
    this.renderCurrentView();
    this.showToast('Reset attendance states to Present', 'info');
  }

  setStudentAttendance(studentId, status) {
    window.AttendanceView.attendanceState[studentId] = status;
    this.renderCurrentView();
  }

  setAllAttendance(status) {
    Object.keys(window.AttendanceView.attendanceState).forEach(sId => {
      window.AttendanceView.attendanceState[sId] = status;
    });
    this.renderCurrentView();
    this.showToast(`Marked all students in classroom as "${status.toUpperCase()}"`, 'info');
  }

  async submitCurrentAttendance() {
    const groupId = window.AttendanceView.selectedGroupId;
    const group = await window.AttendanceService.getGroupById(groupId);
    if (!group) return;

    const date = window.AttendanceView.selectedDate || new Date().toISOString().split('T')[0];
    const studentRecords = Object.entries(window.AttendanceView.attendanceState).map(([sId, st]) => ({
      student_id: sId,
      status: st,
      remarks: ''
    }));

    let sessionTeacherId = group.teacher_id;
    let periodName = null;
    let subject = null;

    if (window.AttendanceView.selectedPeriodId) {
      const allTimetables = await window.AttendanceService.getClassroomTimetables(groupId);
      const slot = allTimetables.find(t => t.id === window.AttendanceView.selectedPeriodId);
      if (slot) {
        if (slot.teacher_id) sessionTeacherId = slot.teacher_id;
        periodName = slot.period_name;
        subject = slot.subject;
      }
    }

    try {
      await window.AttendanceService.submitAttendanceSession({
        group_id: groupId,
        category: group.category,
        teacher_id: sessionTeacherId,
        hostel_id: group.hostel_id,
        session_date: date,
        period_id: window.AttendanceView.selectedPeriodId || null,
        period_name: periodName,
        subject: subject,
        start_time: group.start_time,
        end_time: group.end_time
      }, studentRecords);

      const periodNote = subject ? ` [${periodName}: ${subject}]` : '';
      this.showToast(`Attendance for ${group.group_name}${periodNote} (${date}) recorded successfully!`, 'success');
      window.AttendanceView.isStateInitialized = false;
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async checkAutoAbsences() {
    const flagged = await window.AttendanceService.checkAndFlagMissingTeacherAttendance();
    if (flagged.length > 0) {
      this.showToast(`Flagged ${flagged.length} unsubmitted class sessions for teacher absence audit.`, 'warning');
    } else {
      this.showToast('All scheduled class attendances for today are up to date.', 'success');
    }
  }

  // ==========================================================================
  // SECTION MANAGEMENT & CLASSROOM CREATION MODALS
  // ==========================================================================

  // ==========================================================================
  // SECTION MANAGEMENT & CLASSROOM CREATION MODALS
  // ==========================================================================

  openCreateSectionModal() {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Section management is restricted to Super Admin.', 'error');
      return;
    }

    const iconOptions = [
      { value: 'book', label: '📖 Open Book (Moral / Islamic)' },
      { value: 'academic', label: '🎓 Academic Cap (Coaching / Tuition)' },
      { value: 'sparkle', label: '✨ Sparkle / Science (STEM / Extra)' },
      { value: 'folder', label: '📁 Folder / Archive (General Stream)' },
      { value: 'users', label: '👥 Users / Group (Activity / Batch)' },
      { value: 'calendar', label: '📅 Calendar / Timetable' }
    ];

    const colorOptions = [
      { value: '#059669', label: '🟢 Emerald Green (Moral Studies)' },
      { value: '#0284c7', label: '🔵 Ocean Blue (Hostel Coaching)' },
      { value: '#7c3aed', label: '🟣 Royal Purple (Extra Tutoring)' },
      { value: '#d97706', label: '🟠 Warm Amber (Special Sessions)' },
      { value: '#e11d48', label: '🔴 Rose Crimson (Intensive Revision)' },
      { value: '#0d5c3a', label: '🌲 Forest Dark Green (General)' }
    ];

    const bodyHtml = `
      <form id="create-section-form" onsubmit="event.preventDefault(); App.executeSaveCreateSection();">
        <div class="form-grid">
          <div class="form-group" style="grid-column:span 2;">
            <label class="form-label">Section Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="name" placeholder="e.g. Tahfeez Section, STEM Coaching, Islamic Jurisprudence" required autofocus>
          </div>

          <div class="form-group" style="grid-column:span 2;">
            <label class="form-label">Description</label>
            <input type="text" class="form-control" name="description" placeholder="e.g. Specialized Quran Memorization & Revision Schedule">
          </div>

          <div class="form-group" style="position:relative;">
            <label class="form-label">Minimal Icon Style</label>
            ${this.renderLiquidGlassSelect('create-section-icon-select', 'icon', iconOptions, 'book')}
          </div>

          <div class="form-group" style="position:relative;">
            <label class="form-label">Accent Theme Color</label>
            ${this.renderLiquidGlassSelect('create-section-color-select', 'color', colorOptions, '#059669')}
          </div>
        </div>
      </form>
    `;

    this.openModal('Add New Section', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.executeSaveCreateSection()">Create Section</button>
    `);
  }

  executeSaveCreateSection() {
    const form = document.getElementById('create-section-form');
    if (!form) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!data.name || !data.name.trim()) {
      this.showToast('Please enter a section name.', 'warning');
      return;
    }

    try {
      const newSec = window.AttendanceService.addSection(data);
      this.closeModal();
      window.AttendanceView.selectedSectionId = newSec.id;
      this.showToast(`Section "${newSec.name}" created successfully!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  openEditSectionModal(sectionId) {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Section management is restricted to Super Admin.', 'error');
      return;
    }

    const section = window.AttendanceService.getSectionById(sectionId);
    if (!section) return;

    const iconOptions = [
      { value: 'book', label: '📖 Open Book (Moral / Islamic)' },
      { value: 'academic', label: '🎓 Academic Cap (Coaching / Tuition)' },
      { value: 'sparkle', label: '✨ Sparkle / Science (STEM / Extra)' },
      { value: 'folder', label: '📁 Folder / Archive (General Stream)' },
      { value: 'users', label: '👥 Users / Group (Activity / Batch)' },
      { value: 'calendar', label: '📅 Calendar / Timetable' }
    ];

    const colorOptions = [
      { value: '#059669', label: '🟢 Emerald Green (Moral Studies)' },
      { value: '#0284c7', label: '🔵 Ocean Blue (Hostel Coaching)' },
      { value: '#7c3aed', label: '🟣 Royal Purple (Extra Tutoring)' },
      { value: '#d97706', label: '🟠 Warm Amber (Special Sessions)' },
      { value: '#e11d48', label: '🔴 Rose Crimson (Intensive Revision)' },
      { value: '#0d5c3a', label: '🌲 Forest Dark Green (General)' }
    ];

    const bodyHtml = `
      <form id="edit-section-form" onsubmit="event.preventDefault(); App.executeSaveEditSection('${section.id}');">
        <div class="form-grid">
          <div class="form-group" style="grid-column:span 2;">
            <label class="form-label">Section Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="name" value="${section.name}" required>
          </div>

          <div class="form-group" style="grid-column:span 2;">
            <label class="form-label">Description</label>
            <input type="text" class="form-control" name="description" value="${section.description || ''}">
          </div>

          <div class="form-group" style="position:relative;">
            <label class="form-label">Minimal Icon Style</label>
            ${this.renderLiquidGlassSelect('edit-section-icon-select', 'icon', iconOptions, section.icon || 'book')}
          </div>

          <div class="form-group" style="position:relative;">
            <label class="form-label">Accent Theme Color</label>
            ${this.renderLiquidGlassSelect('edit-section-color-select', 'color', colorOptions, section.color || '#059669')}
          </div>
        </div>
      </form>
    `;

    this.openModal(`Edit Section: ${section.name}`, bodyHtml, `
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
        <button class="btn btn-outline-danger btn-sm" onclick="App.confirmDeleteSection('${section.id}', '${section.name.replace(/'/g, "\\'")}')">
          Delete Section
        </button>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="App.executeSaveEditSection('${section.id}')">Save Changes</button>
        </div>
      </div>
    `);
  }

  executeSaveEditSection(sectionId) {
    const form = document.getElementById('edit-section-form');
    if (!form) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!data.name || !data.name.trim()) {
      this.showToast('Please enter a section name.', 'warning');
      return;
    }

    try {
      const updated = window.AttendanceService.updateSection(sectionId, data);
      this.closeModal();
      this.showToast(`Section "${updated.name}" updated successfully!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  confirmDeleteSection(sectionId, sectionName) {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Section management is restricted to Super Admin.', 'error');
      return;
    }

    const sections = window.AttendanceService.getSections();
    if (sections.length <= 1) {
      this.showToast('You must keep at least one section in the system.', 'warning');
      return;
    }

    this.openModal(`Delete Section: ${sectionName}`, `
      <div style="text-align:center; padding:1.25rem 0.5rem;">
        <div style="font-size:2.5rem; color:var(--danger-solid); margin-bottom:0.5rem;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Delete Section "${sectionName}"?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem; max-width:440px; margin-left:auto; margin-right:auto;">
          Are you sure you want to delete this section? Any classrooms currently under this section will be safely reassigned to your primary section.
        </p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeDeleteSection('${sectionId}')">Yes, Delete Section</button>
    `);
  }

  async executeDeleteSection(sectionId) {
    try {
      await window.AttendanceService.deleteSection(sectionId);
      this.closeModal();
      const remaining = window.AttendanceService.getSections();
      window.AttendanceView.selectedSectionId = remaining[0]?.id || 'moral_section';
      this.showToast('Section removed successfully.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openManageSectionsModal() {
    const sections = window.AttendanceService.getSections();
    const allGroups = await window.AttendanceService.getClassGroups();

    const bodyHtml = `
      <div style="margin-bottom:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
          <div>
            <h4 style="margin:0; color:var(--text-primary);">Active Academic & Coaching Sections</h4>
            <p style="font-size:0.82rem; color:var(--text-muted); margin:2px 0 0 0;">
              Sections group classrooms into distinct daily streams.
            </p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.openCreateSectionModal()">
            + Add New Section
          </button>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          ${sections.map(s => {
            const count = allGroups.filter(g => {
              const gSec = window.AttendanceService.normalizeSectionId(g.category || g.section_id);
              return gSec === s.id;
            }).length;
            return `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:0.85rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle); background:var(--bg-surface-secondary); gap:0.75rem; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                  <div style="width:36px; height:36px; border-radius:var(--radius-sm); background:${s.badgeBg || 'rgba(13,92,58,0.1)'}; color:${s.color || 'var(--primary-700)'}; display:flex; align-items:center; justify-content:center;">
                    ${window.AttendanceView.getMinimalIcon(s.icon || 'book', 18)}
                  </div>
                  <div>
                    <strong style="color:var(--text-primary); font-size:0.95rem;">${s.name}</strong>
                    <div style="font-size:0.78rem; color:var(--text-muted);">${s.description || 'Educational Section'}</div>
                  </div>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span class="badge badge-success" style="font-size:0.75rem;">${count} Class Rooms</span>
                  <button class="btn btn-secondary btn-xs" onclick="App.openEditSectionModal('${s.id}')">
                    Edit
                  </button>
                  <button class="btn btn-outline-danger btn-xs" onclick="App.confirmDeleteSection('${s.id}', '${s.name.replace(/'/g, "\\'")}')">
                    Delete
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.openModal('Section Management Suite', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
    `, 'large');
  }

  saveCustomSectionForm() {
    this.executeSaveCreateSection();
  }

  async openCreateClassGroupModal(preselectedSectionId = null) {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Classroom customization is restricted to Super Admin only.', 'error');
      return;
    }

    const sections = window.AttendanceService.getSections();
    const teachers = await db.getTable('teachers');
    const hostels = await window.HostelService.getAllHostels();
    const students = await window.StudentService.getAllStudents();
    const schoolClasses = CONFIG.SCHOOL_CLASSES || [];
    const activeSection = preselectedSectionId || window.AttendanceView.selectedSectionId || 'moral_section';

    const bodyHtml = `
      <form id="class-group-form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Class Room / Group Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="group_name" placeholder="e.g. Moral Class STD-VIII Boys" required>
          </div>
          <div class="form-group">
            <label class="form-label">Academic Section <span class="required">*</span></label>
            <select class="form-control" name="category" required>
              ${sections.map(s => `
                <option value="${s.id}" ${s.id === activeSection ? 'selected' : ''}>
                  ${s.name}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Class Room Location / Hall</label>
            <input type="text" class="form-control" name="room_name" placeholder="e.g. Prayer Hall A, Study Hall 2" value="Study Hall A">
          </div>
          <div class="form-group" style="position:relative;">
            <label class="form-label">Start Time <span class="required">*</span></label>
            <input type="time" class="glass-time-input" name="start_time" id="cr-add-start-time" value="18:00" required>
          </div>
          <div class="form-group" style="position:relative;">
            <label class="form-label">End Time <span class="required">*</span></label>
            <input type="time" class="glass-time-input" name="end_time" id="cr-add-end-time" value="19:00" required>
          </div>
        </div>

        <!-- Student Selection for this Classroom -->
        <div style="margin-top:1.25rem; border-top:1px solid var(--border-color); padding-top:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
            <div>
              <h4 style="margin:0; color:var(--primary-700); display:flex; align-items:center; gap:6px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Select Classroom Students
              </h4>
              <p style="font-size:0.78rem; color:var(--text-muted); margin:2px 0 0 0;">Pick students who will attend this classroom session</p>
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center;">
              <span class="badge badge-primary" id="group-selected-counter" style="font-size:0.8rem;">0 Students Selected</span>
              <button type="button" class="btn btn-xs btn-outline-primary" onclick="App.toggleSelectAllGroupStudents(true)">Select All</button>
              <button type="button" class="btn btn-xs btn-secondary" onclick="App.toggleSelectAllGroupStudents(false)">Clear</button>
            </div>
          </div>

          <!-- Quick Filters -->
          <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.5rem; margin-bottom:0.6rem;">
            <input type="text" class="form-control" style="font-size:0.82rem; padding:0.4rem 0.65rem;" placeholder="Search student name or ID..." oninput="App.filterGroupStudentCheckboxes(this.value)">
            <select class="form-control" id="group-filter-class" style="font-size:0.82rem; padding:0.4rem 0.65rem;" onchange="App.filterGroupStudentCheckboxes()">
              <option value="all">All Classes</option>
              ${schoolClasses.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <select class="form-control" id="group-filter-gender" style="font-size:0.82rem; padding:0.4rem 0.65rem;" onchange="App.filterGroupStudentCheckboxes()">
              <option value="all">All Genders</option>
              <option value="male">Boys</option>
              <option value="female">Girls</option>
            </select>
          </div>

          <!-- Scrollable Students Roster List -->
          <div style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface);">
            ${students.map(s => `
              <label class="group-student-item" data-student-id="${s.id}" data-name="${s.full_name.toLowerCase()}" data-admission="${(s.admission_no || '').toLowerCase()}" data-class="${s.school_class}" data-gender="${s.gender}" style="display:flex; align-items:center; gap:0.75rem; padding:0.45rem 0.75rem; border-bottom:1px solid var(--border-subtle); cursor:pointer;">
                <input type="checkbox" name="selected_student_ids" value="${s.id}" onchange="App.updateGroupSelectedCounter()" style="width:16px; height:16px; accent-color:var(--primary-600); cursor:pointer;">
                <img src="${typeof CONFIG !== 'undefined' ? CONFIG.getStudentPhoto(s) : (s.photo_url || '')}" style="width:28px; height:28px; border-radius:var(--radius-full); object-fit:cover; border:1.5px solid var(--border-color);" alt="photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                <div style="flex:1; min-width:0;">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <strong style="font-size:0.85rem; color:var(--text-primary);">${s.full_name}</strong>
                    <span class="badge ${s.gender === 'female' ? 'badge-purple' : 'badge-info'}" style="font-size:0.68rem; padding:1px 5px;">${s.gender === 'female' ? 'Girl' : 'Boy'}</span>
                    <span class="badge badge-neutral" style="font-size:0.68rem; padding:1px 5px;">${s.school_class}</span>
                  </div>
                  <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">${s.admission_no}</div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
      </form>
    `;

    this.openModal('Create New Class Room & Student Roster', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveClassGroupForm()">Create Class Room</button>
    `, 'large');
  }

  async openEditClassGroupModal(groupId) {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Classroom customization is restricted to Super Admin only.', 'error');
      return;
    }

    const group = await window.AttendanceService.getGroupById(groupId);
    if (!group) return;

    const teachers = await db.getTable('teachers');
    const hostels = await window.HostelService.getAllHostels();
    const students = await window.StudentService.getAllStudents();
    const schoolClasses = CONFIG.SCHOOL_CLASSES || [];

    // Determine currently assigned student IDs
    let assignedSet = new Set();
    if (Array.isArray(group.assigned_student_ids) && group.assigned_student_ids.length > 0) {
      assignedSet = new Set(group.assigned_student_ids);
    } else {
      students.forEach(s => {
        if (group.category === 'moral_class' && s.moral_group_id === group.id) assignedSet.add(s.id);
        else if (group.category === 'hostel_coaching' && s.hostel_coaching_id === group.id) assignedSet.add(s.id);
        else if (group.category === 'school_coaching' && s.school_coaching_id === group.id) assignedSet.add(s.id);
      });
    }

    const sections = window.AttendanceService.getSections();
    const groupNormSec = window.AttendanceService.normalizeSectionId(group.category);

    const bodyHtml = `
      <form id="class-group-form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Class Room / Group Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="group_name" value="${group.group_name}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Academic Section <span class="required">*</span></label>
            <select class="form-control" name="category" required>
              ${sections.map(s => `
                <option value="${s.id}" ${s.id === groupNormSec || s.id === group.category ? 'selected' : ''}>
                  ${s.name}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Class Room Location / Hall</label>
            <input type="text" class="form-control" name="room_name" value="${group.room_name || 'Prayer Hall A'}">
          </div>
          <div class="form-group" style="position:relative;">
            <label class="form-label">Start Time <span class="required">*</span></label>
            <input type="time" class="glass-time-input" name="start_time" id="cr-edit-start-time" value="${group.start_time || '18:00'}" required>
          </div>
          <div class="form-group" style="position:relative;">
            <label class="form-label">End Time <span class="required">*</span></label>
            <input type="time" class="glass-time-input" name="end_time" id="cr-edit-end-time" value="${group.end_time || '19:00'}" required>
          </div>
        </div>

        <!-- Student Selection for this Classroom -->
        <div style="margin-top:1.25rem; border-top:1px solid var(--border-color); padding-top:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
            <div>
              <h4 style="margin:0; color:var(--primary-700); display:flex; align-items:center; gap:6px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Classroom Student Roster
              </h4>
              <p style="font-size:0.78rem; color:var(--text-muted); margin:2px 0 0 0;">Check or uncheck students belonging to this classroom</p>
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center;">
              <span class="badge badge-primary" id="group-selected-counter" style="font-size:0.8rem;">${assignedSet.size} Students Selected</span>
              <button type="button" class="btn btn-xs btn-outline-primary" onclick="App.toggleSelectAllGroupStudents(true)">Select All</button>
              <button type="button" class="btn btn-xs btn-secondary" onclick="App.toggleSelectAllGroupStudents(false)">Clear</button>
            </div>
          </div>

          <!-- Quick Filters -->
          <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.5rem; margin-bottom:0.6rem;">
            <input type="text" class="form-control" style="font-size:0.82rem; padding:0.4rem 0.65rem;" placeholder="Search student name or ID..." oninput="App.filterGroupStudentCheckboxes(this.value)">
            <select class="form-control" id="group-filter-class" style="font-size:0.82rem; padding:0.4rem 0.65rem;" onchange="App.filterGroupStudentCheckboxes()">
              <option value="all">All Classes</option>
              ${schoolClasses.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <select class="form-control" id="group-filter-gender" style="font-size:0.82rem; padding:0.4rem 0.65rem;" onchange="App.filterGroupStudentCheckboxes()">
              <option value="all">All Genders</option>
              <option value="male">Boys</option>
              <option value="female">Girls</option>
            </select>
          </div>

          <!-- Scrollable Students Roster List -->
          <div style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface);">
            ${students.map(s => {
              const isChecked = assignedSet.has(s.id);
              return `
                <label class="group-student-item" data-student-id="${s.id}" data-name="${s.full_name.toLowerCase()}" data-admission="${(s.admission_no || '').toLowerCase()}" data-class="${s.school_class}" data-gender="${s.gender}" style="display:flex; align-items:center; gap:0.75rem; padding:0.45rem 0.75rem; border-bottom:1px solid var(--border-subtle); cursor:pointer;">
                  <input type="checkbox" name="selected_student_ids" value="${s.id}" ${isChecked ? 'checked' : ''} onchange="App.updateGroupSelectedCounter()" style="width:16px; height:16px; accent-color:var(--primary-600); cursor:pointer;">
                  <img src="${typeof CONFIG !== 'undefined' ? CONFIG.getStudentPhoto(s) : (s.photo_url || '')}" style="width:28px; height:28px; border-radius:var(--radius-full); object-fit:cover; border:1.5px solid var(--border-color);" alt="photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                  <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <strong style="font-size:0.85rem; color:var(--text-primary);">${s.full_name}</strong>
                      <span class="badge ${s.gender === 'female' ? 'badge-purple' : 'badge-info'}" style="font-size:0.68rem; padding:1px 5px;">${s.gender === 'female' ? 'Girl' : 'Boy'}</span>
                      <span class="badge badge-neutral" style="font-size:0.68rem; padding:1px 5px;">${s.school_class}</span>
                    </div>
                    <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">${s.admission_no}</div>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </form>
    `;

    this.openModal(`Edit Class Room: ${group.group_name}`, bodyHtml, `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:0.5rem; flex-wrap:wrap;">
        <button type="button" class="btn btn-outline-danger" onclick="App.confirmDeleteClassGroup('${group.id}', '${group.group_name.replace(/'/g, "\\'")}', ${assignedSet.size})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:4px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Delete Classroom
        </button>
        <div style="display:flex; gap:0.5rem;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="App.saveClassGroupForm('${group.id}')">Save Changes</button>
        </div>
      </div>
    `, 'large');
  }

  // Quick Modal dedicated purely to assigning/selecting students for a classroom
  async openSelectGroupStudentsModal(groupId) {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Classroom customization is restricted to Super Admin only.', 'error');
      return;
    }

    const group = await window.AttendanceService.getGroupById(groupId);
    if (!group) return;

    const students = await window.StudentService.getAllStudents();
    const schoolClasses = CONFIG.SCHOOL_CLASSES || [];

    let assignedSet = new Set();
    if (Array.isArray(group.assigned_student_ids) && group.assigned_student_ids.length > 0) {
      assignedSet = new Set(group.assigned_student_ids);
    } else {
      students.forEach(s => {
        if (group.category === 'moral_class' && s.moral_group_id === group.id) assignedSet.add(s.id);
        else if (group.category === 'hostel_coaching' && s.hostel_coaching_id === group.id) assignedSet.add(s.id);
        else if (group.category === 'school_coaching' && s.school_coaching_id === group.id) assignedSet.add(s.id);
      });
    }

    const bodyHtml = `
      <form id="group-students-form">
        <div style="background:var(--bg-surface-secondary); padding:0.85rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <strong style="color:var(--primary-700); font-size:0.95rem;">${group.group_name}</strong>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
              Select the students who belong to this classroom for attendance tracking.
            </div>
          </div>
          <div style="display:flex; gap:0.4rem; align-items:center;">
            <span class="badge badge-primary" id="group-selected-counter" style="font-size:0.82rem;">${assignedSet.size} Students Selected</span>
            <button type="button" class="btn btn-xs btn-outline-primary" onclick="App.toggleSelectAllGroupStudents(true)">Select All</button>
            <button type="button" class="btn btn-xs btn-secondary" onclick="App.toggleSelectAllGroupStudents(false)">Clear All</button>
          </div>
        </div>

        <!-- Quick Filters -->
        <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.5rem; margin-bottom:0.75rem;">
          <input type="text" class="form-control" style="font-size:0.82rem;" placeholder="Search student name or ID number..." oninput="App.filterGroupStudentCheckboxes(this.value)">
          <select class="form-control" id="group-filter-class" style="font-size:0.82rem;" onchange="App.filterGroupStudentCheckboxes()">
            <option value="all">All Classes</option>
            ${schoolClasses.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <select class="form-control" id="group-filter-gender" style="font-size:0.82rem;" onchange="App.filterGroupStudentCheckboxes()">
            <option value="all">All Genders</option>
            <option value="male">Boys Only</option>
            <option value="female">Girls Only</option>
          </select>
        </div>

        <!-- Students Roster Checklist -->
        <div style="max-height:340px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface);">
          ${students.map(s => {
            const isChecked = assignedSet.has(s.id);
            return `
              <label class="group-student-item" data-student-id="${s.id}" data-name="${s.full_name.toLowerCase()}" data-admission="${(s.admission_no || '').toLowerCase()}" data-class="${s.school_class}" data-gender="${s.gender}" style="display:flex; align-items:center; gap:0.75rem; padding:0.55rem 0.85rem; border-bottom:1px solid var(--border-subtle); cursor:pointer;">
                <input type="checkbox" name="selected_student_ids" value="${s.id}" ${isChecked ? 'checked' : ''} onchange="App.updateGroupSelectedCounter()" style="width:17px; height:17px; accent-color:var(--primary-600); cursor:pointer;">
                <img src="${typeof CONFIG !== 'undefined' ? CONFIG.getStudentPhoto(s) : (s.photo_url || '')}" style="width:34px; height:34px; border-radius:var(--radius-full); object-fit:cover; border:1.5px solid var(--border-color);" alt="photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                <div style="flex:1; min-width:0;">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <strong style="font-size:0.88rem; color:var(--text-primary);">${s.full_name}</strong>
                    <span class="badge ${s.gender === 'female' ? 'badge-purple' : 'badge-info'}" style="font-size:0.7rem; padding:1px 6px;">${s.gender === 'female' ? 'Girl' : 'Boy'}</span>
                    <span class="badge badge-neutral" style="font-size:0.7rem; padding:1px 6px;">${s.school_class}</span>
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">
                    ${s.admission_no} • Father: ${s.father_name || '—'}
                  </div>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </form>
    `;

    this.openModal(`Select Students: ${group.group_name}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveGroupStudentsSelection('${group.id}')">Save Student Roster</button>
    `, 'large');
  }

  filterGroupStudentCheckboxes(searchText = null) {
    const q = searchText !== null ? searchText.toLowerCase().trim() : (document.querySelector('input[placeholder*="Search student"]')?.value || '').toLowerCase().trim();
    const cVal = document.getElementById('group-filter-class')?.value || 'all';
    const gVal = document.getElementById('group-filter-gender')?.value || 'all';

    const items = document.querySelectorAll('.group-student-item');
    items.forEach(item => {
      const name = item.dataset.name || '';
      const adm = item.dataset.admission || '';
      const sClass = item.dataset.class || '';
      const gender = item.dataset.gender || '';

      const matchQ = !q || name.includes(q) || adm.includes(q);
      const matchC = cVal === 'all' || sClass === cVal;
      const matchG = gVal === 'all' || gender === gVal;

      if (matchQ && matchC && matchG) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  toggleSelectAllGroupStudents(checked) {
    const items = document.querySelectorAll('.group-student-item');
    items.forEach(item => {
      if (item.style.display !== 'none') {
        const cb = item.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = checked;
      }
    });
    this.updateGroupSelectedCounter();
  }

  updateGroupSelectedCounter() {
    const checked = document.querySelectorAll('input[name="selected_student_ids"]:checked');
    const counter = document.getElementById('group-selected-counter');
    if (counter) counter.textContent = `${checked.length} Students Selected`;
  }

  async saveClassGroupForm(groupId = null) {
    const form = document.getElementById('class-group-form');
    if (!form) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    if (!data.gender) data.gender = 'all';
    if (!data.hostel_id) data.hostel_id = '';

    const selectedCheckboxes = form.querySelectorAll('input[name="selected_student_ids"]:checked');
    const studentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    try {
      if (groupId) {
        await window.AttendanceService.updateClassGroup(groupId, data, studentIds);
        this.closeModal();
        this.showToast(`Class room "${data.group_name}" updated with ${studentIds.length} students!`, 'success');
      } else {
        const newGroup = await window.AttendanceService.createClassGroup(data, studentIds);
        this.closeModal();
        window.AttendanceView.selectedGroupId = newGroup.id;
        this.showToast(`Class room "${data.group_name}" created with ${studentIds.length} students!`, 'success');
      }
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async saveGroupStudentsSelection(groupId) {
    const form = document.getElementById('group-students-form');
    if (!form) return;
    const selectedCheckboxes = form.querySelectorAll('input[name="selected_student_ids"]:checked');
    const studentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    try {
      await window.AttendanceService.updateClassGroup(groupId, {}, studentIds);
      this.closeModal();
      this.showToast(`Assigned ${studentIds.length} students to classroom roster!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  confirmDeleteClassGroup(groupId, groupName, enrolledCount = 0) {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Only Super Admin can delete classrooms.', 'error');
      return;
    }

    this.openModal(`Delete Classroom: ${groupName}`, `
      <div style="text-align:center; padding:1rem;">
        <div style="font-size:2.5rem; color:var(--danger-solid); margin-bottom:0.5rem;">🗑️</div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Delete Classroom "${groupName}"?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
          Are you sure you want to permanently delete this classroom from the attendance engine?
        </p>
        ${enrolledCount > 0 ? `
          <div class="status-alert-banner danger" style="text-align:left; font-size:0.82rem;">
            ⚠️ <strong>${enrolledCount} Student(s) Enrolled:</strong> These students will remain safely in the student directory, but their assignment to this classroom will be cleared.
          </div>
        ` : ''}
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeDeleteClassGroup('${groupId}')">Yes, Delete Classroom</button>
    `);
  }

  async executeDeleteClassGroup(groupId) {
    try {
      await window.AttendanceService.deleteClassGroup(groupId);
      this.closeModal();
      this.showToast('Class room removed successfully.', 'success');
      const remaining = await window.AttendanceService.getClassGroups();
      if (remaining.length > 0) window.AttendanceView.selectedGroupId = remaining[0].id;
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // STUDENT ROSTER ALLOCATION & TRANSFER ENGINE
  // ==========================================================================

  async openAddStudentsToClassroomModal(groupId) {
    const group = await window.AttendanceService.getGroupById(groupId);
    if (!group) return;

    const allStudents = await window.StudentService.getAllStudents();
    const schoolClasses = CONFIG.SCHOOL_CLASSES || [];
    const currentAssigned = new Set(group.assigned_student_ids || []);

    const bodyHtml = `
      <form id="add-students-classroom-form">
        <div style="margin-bottom:1rem;">
          <h4 style="margin-bottom:0.25rem; color:var(--text-primary);">Assign Students to "${group.group_name}"</h4>
          <p style="font-size:0.82rem; color:var(--text-muted);">
            Check students to include in this classroom roster. Checked students will appear in the daily attendance register.
          </p>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; gap:0.5rem; flex-wrap:wrap;">
          <div style="display:flex; gap:0.4rem; flex:1; min-width:220px;">
            <input type="text" class="form-control" style="font-size:0.82rem;" placeholder="Search students..." oninput="App.filterGroupStudentCheckboxes(this.value)">
            <select class="form-control" id="group-filter-class" style="width:auto; font-size:0.82rem;" onchange="App.filterGroupStudentCheckboxes()">
              <option value="all">All Classes</option>
              ${schoolClasses.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex; gap:0.4rem; align-items:center;">
            <span class="badge badge-primary" id="group-selected-counter">${currentAssigned.size} Selected</span>
            <button type="button" class="btn btn-xs btn-outline-primary" onclick="App.toggleSelectAllGroupStudents(true)">Select All</button>
            <button type="button" class="btn btn-xs btn-secondary" onclick="App.toggleSelectAllGroupStudents(false)">Clear</button>
          </div>
        </div>

        <div style="max-height:300px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface);">
          ${allStudents.map(s => {
            const isChecked = currentAssigned.has(s.id);
            return `
              <label class="group-student-item" data-student-id="${s.id}" data-name="${s.full_name.toLowerCase()}" data-admission="${(s.admission_no || '').toLowerCase()}" data-class="${s.school_class}" data-gender="${s.gender}" style="display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0.75rem; border-bottom:1px solid var(--border-subtle); cursor:pointer;">
                <input type="checkbox" name="selected_student_ids" value="${s.id}" ${isChecked ? 'checked' : ''} onchange="App.updateGroupSelectedCounter()" style="width:16px; height:16px; accent-color:var(--primary-600); cursor:pointer;">
                <img src="${(s.photo_url && !s.photo_url.includes('unsplash.com')) ? s.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border:1.5px solid var(--border-color);" alt="${s.full_name}" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                <div style="flex:1; min-width:0;">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <strong style="font-size:0.85rem; color:var(--text-primary);">${s.full_name}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${s.admission_no}</span>
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-secondary);">
                    Class ${s.school_class} • ${s.gender === 'male' ? 'Boy' : 'Girl'}
                  </div>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </form>
    `;

    this.openModal(`Assign Students: ${group.group_name}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveAddStudentsToClassroom('${group.id}')">Save Student Roster</button>
    `, 'large');
  }

  async saveAddStudentsToClassroom(groupId) {
    const form = document.getElementById('add-students-classroom-form');
    if (!form) return;

    const selectedCheckboxes = form.querySelectorAll('input[name="selected_student_ids"]:checked');
    const studentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    try {
      await window.AttendanceService.updateClassGroup(groupId, {}, studentIds);
      this.closeModal();
      window.AttendanceView.isStateInitialized = false;
      this.showToast(`Updated classroom roster with ${studentIds.length} students!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openTransferStudentModal(studentId, currentGroupId) {
    const student = await window.StudentService.getStudentById(studentId);
    const currentGroup = await window.AttendanceService.getGroupById(currentGroupId);
    const allGroups = await window.AttendanceService.getClassGroups();
    const sections = window.AttendanceService.getSections();

    const otherGroups = allGroups.filter(g => g.id !== currentGroupId);

    const bodyHtml = `
      <div style="margin-bottom:1rem;">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem; padding:0.85rem; background:var(--bg-surface-secondary); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <img src="${(student && student.photo_url && !student.photo_url.includes('unsplash.com')) ? student.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
          <div>
            <h4 style="margin:0; font-size:0.95rem; color:var(--text-primary);">${student ? student.full_name : 'Student'}</h4>
            <div style="font-size:0.78rem; color:var(--text-muted);">${student ? student.admission_no : ''} • Class ${student ? student.school_class : ''}</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Current Classroom</label>
          <input type="text" class="form-control" value="${currentGroup ? currentGroup.group_name : 'None'}" readonly style="background:var(--bg-surface-secondary);">
        </div>

        <div class="form-group">
          <label class="form-label">Transfer To Destination Classroom <span class="required">*</span></label>
          <select class="form-control" id="transfer-destination-group" required>
            <option value="">-- Select Destination Classroom --</option>
            ${sections.map(sec => {
              const secGroups = otherGroups.filter(g => g.category === sec.id || (sec.id === 'extra_coaching' && g.category === 'school_coaching'));
              if (secGroups.length === 0) return '';
              return `
                <optgroup label="${sec.name}">
                  ${secGroups.map(g => `<option value="${g.id}">${g.group_name} (${Array.isArray(g.assigned_student_ids) ? g.assigned_student_ids.length : 0} Students)</option>`).join('')}
                </optgroup>
              `;
            }).join('')}
          </select>
          <div class="form-hint">The student will be removed from "${currentGroup ? currentGroup.group_name : ''}" and added to the destination classroom immediately.</div>
        </div>
      </div>
    `;

    this.openModal(`Transfer Student: ${student ? student.full_name : ''}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.executeTransferStudent('${studentId}', '${currentGroupId}')">
        Confirm Student Transfer
      </button>
    `);
  }

  async executeTransferStudent(studentId, currentGroupId) {
    const toGroupId = document.getElementById('transfer-destination-group')?.value;
    if (!toGroupId) {
      this.showToast('Please select a destination classroom.', 'warning');
      return;
    }

    try {
      await window.AttendanceService.transferStudent(studentId, currentGroupId, toGroupId);
      const student = await window.StudentService.getStudentById(studentId);
      const destGroup = await window.AttendanceService.getGroupById(toGroupId);

      this.closeModal();
      window.AttendanceView.isStateInitialized = false;
      this.showToast(`Transferred ${student ? student.full_name : 'student'} to ${destGroup ? destGroup.group_name : 'new classroom'}!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  confirmRemoveStudentFromClassroom(studentId, groupId, studentName) {
    this.openModal(`Remove Student from Roster`, `
      <div style="text-align:center; padding:1.25rem 0.5rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem; color:var(--danger-solid);">⚠️</div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Remove ${studentName}?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
          Are you sure you want to remove this student from this classroom roster? The student will remain in the school directory.
        </p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeRemoveStudentFromClassroom('${studentId}', '${groupId}')">Remove Student</button>
    `);
  }

  async executeRemoveStudentFromClassroom(studentId, groupId) {
    try {
      await window.AttendanceService.removeStudentFromGroup(groupId, studentId);
      this.closeModal();
      window.AttendanceView.isStateInitialized = false;
      this.showToast('Student removed from classroom roster.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // ATTENDANCE EXPORTS & PRINT
  // ==========================================================================

  async exportClassroomAttendanceExcel(groupId) {
    const report = await window.AttendanceService.getClassroomReport(groupId);
    const headers = ['Student Name', 'Admission No', 'Class', 'Sessions Held', 'Present (P)', 'Absent (A)', 'Leave (L)', 'Attendance %'];
    const rows = report.students.map(s => [
      s.student.full_name,
      s.student.admission_no,
      s.student.school_class,
      s.total,
      s.present,
      s.absent,
      s.leave,
      `${s.percentage}%`
    ]);

    window.ReportService.exportToExcel(`Attendance_${report.group?.group_name || 'Register'}`, 'Classroom Attendance Register', headers, rows);
    this.showToast('Exported classroom attendance to Excel', 'success');
  }

  async exportClassroomAttendanceCSV(groupId) {
    const report = await window.AttendanceService.getClassroomReport(groupId);
    const headers = ['Student Name', 'Admission No', 'Class', 'Sessions Held', 'Present (P)', 'Absent (A)', 'Leave (L)', 'Attendance %'];
    const rows = report.students.map(s => [
      s.student.full_name,
      s.student.admission_no,
      s.student.school_class,
      s.total,
      s.present,
      s.absent,
      s.leave,
      `${s.percentage}%`
    ]);

    window.ReportService.exportToCSV(`Attendance_${report.group?.group_name || 'Register'}`, headers, rows);
    this.showToast('Exported classroom attendance to CSV', 'success');
  }

  // ==========================================================================
  // WEEKLY TIMETABLE SCHEDULE MODALS & ACTIONS
  // ==========================================================================

  async openAddClassroomPeriodModal(groupId, defaultDay = 'Monday') {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Timetable editing is restricted to Super Admin.', 'error');
      return;
    }

    const group = await window.AttendanceService.getGroupById(groupId);
    if (!group) return;

    const teachers = await db.getTable('teachers');
    const days = CONFIG.TIMETABLE_DAYS || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const existingDayPeriods = await window.AttendanceService.getClassroomDayTimetable(groupId, defaultDay);
    const nextPeriodNum = existingDayPeriods.length + 1;

    const bodyHtml = `
      <form id="classroom-period-form">
        <input type="hidden" name="group_id" value="${groupId}">

        <div style="background:var(--bg-surface-secondary); padding:0.75rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:1.15rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <strong style="color:var(--primary-700); font-size:0.95rem;">${group.group_name}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">Classroom Weekly Schedule Engine</div>
          </div>
          <span class="badge badge-neutral">${(group.category || '').toUpperCase().replace('_', ' ')}</span>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Day of Week <span class="required">*</span></label>
            <select class="form-control" name="day" required>
              ${days.map(d => `<option value="${d}" ${d.toLowerCase() === defaultDay.toLowerCase() ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Period Name / Slot Label <span class="required">*</span></label>
            <input type="text" class="form-control" name="period_name" value="Period ${nextPeriodNum}" placeholder="e.g. Period 1, Evening Slot" required>
          </div>

          <div class="form-group">
            <label class="form-label">Subject / Activity Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="subject" placeholder="e.g. Quran & Tajweed, Mathematics, STEM Practice" required>
          </div>

          <div class="form-group">
            <label class="form-label">Assigned Teacher / Instructor</label>
            <select class="form-control" name="teacher_id">
              <option value="">-- Select Teacher --</option>
              ${teachers.map(t => `<option value="${t.id}" ${t.id === group.teacher_id ? 'selected' : ''}>${t.full_name} (${t.specialization || 'Staff'})</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="position:relative;">
            <label class="form-label">Start Time <span class="required">*</span></label>
            <input type="time" class="glass-time-input" name="start_time" id="cr-period-add-start-time" value="${group.start_time || '18:00'}" required>
          </div>

          <div class="form-group" style="position:relative;">
            <label class="form-label">End Time <span class="required">*</span></label>
            <input type="time" class="glass-time-input" name="end_time" id="cr-period-add-end-time" value="${group.end_time || '18:45'}" required>
          </div>

          <div class="form-group" style="grid-column:span 2;">
            <label class="form-label">Room / Study Hall / Location</label>
            <input type="text" class="form-control" name="room_location" value="${group.room_name || 'Prayer Hall A'}" placeholder="e.g. Prayer Hall A, Smart Room 2">
          </div>

          <div class="form-group" style="grid-column:span 2;">
            <label class="form-label">Notes / Instructions (Optional)</label>
            <input type="text" class="form-control" name="notes" placeholder="e.g. Bring Tajweed workbook, Surah Al-Kahf revision">
          </div>

          <div class="form-group" style="grid-column:span 2;">
            <label style="display:flex; align-items:center; gap:0.6rem; cursor:pointer; font-size:0.88rem; font-weight:600; color:var(--text-primary);">
              <input type="checkbox" name="is_active" value="true" checked style="width:16px; height:16px; accent-color:var(--primary-600);">
              Enable this period (Active in weekly schedule & live attendance)
            </label>
          </div>
        </div>
      </form>
    `;

    this.openModal(`Add Timetable Period: ${group.group_name}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveClassroomPeriodForm()">Save Timetable Period</button>
    `, 'large');
  }

  async openEditClassroomPeriodModal(periodId) {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Timetable editing is restricted to Super Admin.', 'error');
      return;
    }

    const all = await db.getTable('timetables');
    const period = all.find(t => t.id === periodId);
    if (!period) return;

    const group = await window.AttendanceService.getGroupById(period.group_id);
    const teachers = await db.getTable('teachers');
    const days = CONFIG.TIMETABLE_DAYS || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const bodyHtml = `
      <form id="classroom-period-form">
        <input type="hidden" name="id" value="${period.id}">
        <input type="hidden" name="group_id" value="${period.group_id}">
        <input type="hidden" name="order_index" value="${period.order_index || 1}">

        <div style="background:var(--bg-surface-secondary); padding:0.75rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:1.15rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <strong style="color:var(--primary-700); font-size:0.95rem;">${group ? group.group_name : 'Classroom'}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">Editing Timetable Slot</div>
          </div>
          <span class="badge badge-success">${period.day}</span>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Day of Week <span class="required">*</span></label>
            <select class="form-control" name="day" required>
              ${days.map(d => `<option value="${d}" ${d.toLowerCase() === (period.day || '').toLowerCase() ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Period Name / Slot Label <span class="required">*</span></label>
            <input type="text" class="form-control" name="period_name" value="${period.period_name || ''}" placeholder="e.g. Period 1, Evening Slot" required>
          </div>

          <div class="form-group">
            <label class="form-label">Subject / Activity Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="subject" value="${period.subject || ''}" placeholder="e.g. Quran & Tajweed, Mathematics" required>
          </div>

          <div class="form-group">
            <label class="form-label">Assigned Teacher / Instructor</label>
            <select class="form-control" name="teacher_id">
              <option value="">-- Select Teacher --</option>
              ${teachers.map(t => `<option value="${t.id}" ${t.id === period.teacher_id ? 'selected' : ''}>${t.full_name} (${t.specialization || 'Staff'})</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="position:relative;">
            <label class="form-label">Start Time <span class="required">*</span></label>
            <input type="time" class="glass-time-input" name="start_time" id="cr-period-edit-start-time" value="${period.start_time || '18:00'}" required>
          </div>

          <div class="form-group" style="position:relative;">
            <label class="form-label">End Time <span class="required">*</span></label>
            <input type="time" class="glass-time-input" name="end_time" id="cr-period-edit-end-time" value="${period.end_time || '18:45'}" required>
          </div>

          <div class="form-group" style="grid-column:span 2;">
            <label class="form-label">Room / Study Hall / Location</label>
            <input type="text" class="form-control" name="room_location" value="${period.room_location || ''}" placeholder="e.g. Prayer Hall A, Smart Room 2">
          </div>

          <div class="form-group" style="grid-column:span 2;">
            <label class="form-label">Notes / Instructions (Optional)</label>
            <input type="text" class="form-control" name="notes" value="${period.notes || ''}" placeholder="e.g. Bring Tajweed workbook">
          </div>

          <div class="form-group" style="grid-column:span 2;">
            <label style="display:flex; align-items:center; gap:0.6rem; cursor:pointer; font-size:0.88rem; font-weight:600; color:var(--text-primary);">
              <input type="checkbox" name="is_active" value="true" ${period.is_active !== false ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--primary-600);">
              Enable this period (Active in weekly schedule & live attendance)
            </label>
          </div>
        </div>
      </form>
    `;

    this.openModal(`Edit Timetable Period: ${period.subject}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveClassroomPeriodForm()">Save Changes</button>
    `, 'large');
  }

  async saveClassroomPeriodForm() {
    const form = document.getElementById('classroom-period-form');
    if (!form) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.is_active = formData.get('is_active') === 'true';

    try {
      await window.AttendanceService.saveClassroomPeriod(data);
      this.closeModal();
      this.showToast(`Saved period slot "${data.subject}" for ${data.day}!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async deleteClassroomPeriod(periodId) {
    if (!confirm('Are you sure you want to delete this timetable period slot?')) return;
    try {
      await window.AttendanceService.deleteClassroomPeriod(periodId);
      this.showToast('Timetable period removed.', 'info');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openDuplicateClassroomPeriodModal(periodId) {
    const all = await db.getTable('timetables');
    const period = all.find(t => t.id === periodId);
    if (!period) return;

    const days = CONFIG.TIMETABLE_DAYS || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const otherDays = days.filter(d => d.toLowerCase() !== (period.day || '').toLowerCase());

    const bodyHtml = `
      <form id="duplicate-period-form">
        <input type="hidden" name="period_id" value="${period.id}">

        <div style="background:var(--bg-surface-secondary); padding:0.85rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:1.15rem;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Source Period:</div>
          <h4 style="margin:2px 0 0 0; color:var(--text-primary);">${period.period_name}: ${period.subject}</h4>
          <div style="font-size:0.82rem; color:var(--primary-700); margin-top:2px;">
            ${period.day} • ${period.start_time} - ${period.end_time} • ${period.room_location || 'Study Hall'}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:700;">Select Target Days to Duplicate into <span class="required">*</span></label>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:0.5rem; margin-top:0.5rem;">
            ${otherDays.map(d => `
              <label style="display:flex; align-items:center; gap:0.5rem; padding:0.55rem 0.75rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface); cursor:pointer; font-size:0.88rem; font-weight:600;">
                <input type="checkbox" name="target_days" value="${d}" checked style="width:16px; height:16px; accent-color:var(--primary-600);">
                <span>${d}</span>
              </label>
            `).join('')}
          </div>
        </div>
      </form>
    `;

    this.openModal(`📋 Duplicate Period: ${period.subject}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.executeDuplicateClassroomPeriod()">Duplicate to Selected Days</button>
    `);
  }

  async executeDuplicateClassroomPeriod() {
    const form = document.getElementById('duplicate-period-form');
    if (!form) return;

    const periodId = form.querySelector('input[name="period_id"]')?.value;
    const checked = Array.from(form.querySelectorAll('input[name="target_days"]:checked')).map(cb => cb.value);

    if (checked.length === 0) {
      this.showToast('Please select at least one day to duplicate to.', 'warning');
      return;
    }

    try {
      await window.AttendanceService.duplicateClassroomPeriod(periodId, checked);
      this.closeModal();
      this.showToast(`Duplicated period slot into ${checked.length} days successfully!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openCopyDayScheduleModal(groupId) {
    const group = await window.AttendanceService.getGroupById(groupId);
    if (!group) return;

    const days = CONFIG.TIMETABLE_DAYS || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const bodyHtml = `
      <form id="copy-day-schedule-form">
        <input type="hidden" name="group_id" value="${groupId}">

        <div style="background:var(--bg-surface-secondary); padding:0.75rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:1.15rem;">
          <strong style="color:var(--primary-700);">${group.group_name}</strong>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
            Copy all periods from one day to multiple other days in this classroom schedule.
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Source Day (Copy From) <span class="required">*</span></label>
          <select class="form-control" name="source_day" required>
            ${days.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Target Days (Paste Into) <span class="required">*</span></label>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:0.5rem; margin-top:0.4rem;">
            ${days.map(d => `
              <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.75rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface); cursor:pointer; font-size:0.86rem; font-weight:600;">
                <input type="checkbox" name="target_days" value="${d}" ${d !== 'Monday' ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--primary-600);">
                <span>${d}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-group" style="margin-top:1rem;">
          <label style="display:flex; align-items:center; gap:0.6rem; cursor:pointer; font-size:0.85rem; color:var(--text-secondary);">
            <input type="checkbox" name="overwrite" value="true" style="width:16px; height:16px; accent-color:var(--primary-600);">
            <span>Overwrite existing periods on target days (Otherwise appends)</span>
          </label>
        </div>
      </form>
    `;

    this.openModal(`📋 Copy Day Schedule: ${group.group_name}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.executeCopyDaySchedule()">Execute Schedule Copy</button>
    `, 'large');
  }

  async executeCopyDaySchedule() {
    const form = document.getElementById('copy-day-schedule-form');
    if (!form) return;

    const groupId = form.querySelector('input[name="group_id"]')?.value;
    const sourceDay = form.querySelector('select[name="source_day"]')?.value;
    const targetDays = Array.from(form.querySelectorAll('input[name="target_days"]:checked')).map(cb => cb.value);
    const overwrite = form.querySelector('input[name="overwrite"]')?.checked;

    if (targetDays.length === 0) {
      this.showToast('Please select at least one target day.', 'warning');
      return;
    }

    try {
      await window.AttendanceService.copyDaySchedule(groupId, sourceDay, targetDays, overwrite);
      this.closeModal();
      this.showToast(`Successfully copied ${sourceDay}'s schedule to ${targetDays.length} days!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async togglePeriodActiveStatus(periodId, newStatus) {
    try {
      await window.AttendanceService.togglePeriodStatus(periodId, newStatus);
      this.showToast(`Period status updated to ${newStatus ? 'Active' : 'Disabled'}.`, 'info');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async movePeriodOrder(periodId, direction) {
    const all = await db.getTable('timetables');
    const target = all.find(t => t.id === periodId);
    if (!target) return;

    const dayPeriods = await window.AttendanceService.getClassroomDayTimetable(target.group_id, target.day);
    const idx = dayPeriods.findIndex(p => p.id === periodId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const swap = dayPeriods[idx - 1];
      dayPeriods[idx - 1] = target;
      dayPeriods[idx] = swap;
    } else if (direction === 'down' && idx < dayPeriods.length - 1) {
      const swap = dayPeriods[idx + 1];
      dayPeriods[idx + 1] = target;
      dayPeriods[idx] = swap;
    } else {
      return;
    }

    const orderedIds = dayPeriods.map(p => p.id);
    await window.AttendanceService.reorderClassroomPeriods(target.group_id, target.day, orderedIds);
    this.renderCurrentView();
  }

  async printClassroomTimetable(groupId) {
    window.print();
  }

  // Admissions Modal Handlers
  async openAdmissionModal() {
    const hostels = await window.HostelService.getAllHostels();
    const defaultPhoto = typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '';
    const today = new Date().toISOString().split('T')[0];

    const bodyHtml = `
      <!-- Quick Option to Import Multiple Students via CSV -->
      <div style="background:var(--primary-50); border:1.5px dashed var(--primary-300); padding:0.85rem 1rem; border-radius:var(--radius-md); margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.6rem;">
        <div>
          <div style="font-size:0.9rem; font-weight:700; color:var(--primary-800); display:flex; align-items:center; gap:6px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Batch Student Import Available
          </div>
          <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">
            Admitting multiple students? Upload a CSV / spreadsheet file to import all records at once.
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-primary" onclick="App.openImportStudentsModal()">
          Open Batch Import (CSV / Excel)
        </button>
      </div>

      <form id="admission-form">
        <!-- Photo Upload Banner -->
        <div style="display:flex; align-items:center; gap:1.25rem; background:var(--bg-surface-secondary); padding:1rem; border-radius:var(--radius-md); margin-bottom:1.25rem; border:1px solid var(--border-color);">
          <div style="position:relative; width:72px; height:72px; flex-shrink:0;">
            <img id="admission-photo-preview" src="${defaultPhoto}" style="width:72px; height:72px; border-radius:var(--radius-md); object-fit:cover; border:2px solid var(--primary-600);" alt="Student Photo">
          </div>
          <div style="flex:1;">
            <label class="form-label" style="font-weight:700; margin-bottom:3px;">Student Photo (Upload)</label>
            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
              <input type="file" id="admission-photo-file" accept="image/*" style="display:none;" onchange="App.handleAdmissionPhotoUpload(event)">
              <button type="button" class="btn btn-sm btn-outline-primary" onclick="document.getElementById('admission-photo-file').click()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:3px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                Select Photo File
              </button>
              <span style="font-size:0.75rem; color:var(--text-muted);">Supports JPG, PNG, WEBP passport photos</span>
            </div>
            <input type="hidden" name="photo_url" id="admission-photo-url" value="${defaultPhoto}">
          </div>
        </div>

        <!-- Section 1: Student Primary Identity -->
        <h4 style="color:var(--primary-700); margin-bottom:0.75rem; border-bottom:1px solid var(--border-color); padding-bottom:0.35rem;">1. Student Identification & Academic Details</h4>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">School ID Number</label>
            <input type="text" class="form-control" name="admission_no" placeholder="e.g. TPS2026056 (From School)">
            <div class="form-hint" style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Auto-generated if left blank.</div>
          </div>
          <div class="form-group">
            <label class="form-label">Student's Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="full_name" required placeholder="e.g. Mohammed Rayan">
          </div>
          <div class="form-group">
            <label class="form-label">Class <span class="required">*</span></label>
            <select class="form-control" name="school_class" required>
              ${CONFIG.SCHOOL_CLASSES.map(cls => `<option value="${cls}" ${cls === 'STD-VIII' ? 'selected' : ''}>${cls}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Gender <span class="required">*</span></label>
            <select class="form-control" name="gender" required onchange="App.onAdmissionGenderChange(this.value)">
              <option value="male">Male (Boy)</option>
              <option value="female">Female (Girl)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Category <span class="required">*</span></label>
            <select class="form-control" name="student_category" required>
              <option value="General">General</option>
              <option value="Orphan">Orphan</option>
              <option value="Staff ward">Staff ward</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status (Enrolled / Withdrawn) <span class="required">*</span></label>
            <select class="form-control" name="status" required>
              <option value="Enrolled">Enrolled</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        <!-- Section 2: Dates, Age & Hostel Facility -->
        <h4 style="color:var(--primary-700); margin:1.25rem 0 0.75rem 0; border-bottom:1px solid var(--border-color); padding-bottom:0.35rem;">2. Dates, Age & Hostel Unit</h4>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Date of Birth <span class="required">*</span></label>
            <input type="date" class="form-control" name="dob" id="admission-dob" required value="2012-01-01" onchange="App.onAdmissionDobChange(this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Age (Years)</label>
            <input type="number" class="form-control" name="age" id="admission-age" value="14" min="3" max="25" placeholder="Calculated from DOB">
          </div>
          <div class="form-group">
            <label class="form-label">Date of Admission (School) <span class="required">*</span></label>
            <input type="date" class="form-control" name="school_admission_date" required value="${today}">
          </div>
          <div class="form-group">
            <label class="form-label">Date of Admission (Hostel) <span class="required">*</span></label>
            <input type="date" class="form-control" name="hostel_admission_date" required value="${today}">
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Hostel Facility <span class="required">*</span></label>
            <select class="form-control" name="hostel_id" id="admission-hostel-id" required>
              ${hostels.map(h => `<option value="${h.id}">${h.name} (${h.gender === 'boys' ? 'Boys Hostel' : 'Girls Hostel'} • ${h.building})</option>`).join('')}
            </select>
            <div class="form-hint" style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;">
              • Bed space will be assigned by the admin in the <strong>Hostels & Beds</strong> visual allocation rack after admission.
            </div>
          </div>
        </div>

        <!-- Section 3: Parents & Contacts -->
        <h4 style="color:var(--primary-700); margin:1.25rem 0 0.75rem 0; border-bottom:1px solid var(--border-color); padding-bottom:0.35rem;">3. Parent & Communication Details</h4>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Father's Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="father_name" required placeholder="Father's full name">
          </div>
          <div class="form-group">
            <label class="form-label">Mother's Name</label>
            <input type="text" class="form-control" name="mother_name" placeholder="Mother's full name">
          </div>
          <div class="form-group">
            <label class="form-label">Mobile No <span class="required">*</span></label>
            <input type="tel" class="form-control" name="father_phone" id="admission-mobile" required placeholder="+91 98XXX XXXXX" oninput="App.onAdmissionMobileInput(this.value)">
          </div>
          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <label class="form-label">Whatsapp No</label>
              <a href="javascript:void(0)" onclick="App.syncWhatsappPhone()" style="font-size:0.72rem; color:var(--primary-700); text-decoration:none; font-weight:600;">Same as Mobile</a>
            </div>
            <input type="tel" class="form-control" name="father_whatsapp" id="admission-whatsapp" placeholder="+91 98XXX XXXXX">
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Address</label>
            <textarea class="form-control" name="address" rows="2" placeholder="House/Village, Post Office, District, State, PIN Code"></textarea>
          </div>
        </div>

        <!-- Section 4: Remarks & Notes -->
        <h4 style="color:var(--primary-700); margin:1.25rem 0 0.75rem 0; border-bottom:1px solid var(--border-color); padding-bottom:0.35rem;">4. Remarks & Background Notes</h4>
        <div class="form-group">
          <label class="form-label">Remarks</label>
          <textarea class="form-control" name="remarks" rows="2" placeholder="Special remarks, medical allergies/dietary requirements, emergency instructions, or background notes..."></textarea>
        </div>
      </form>
    `;

    this.openModal('Student Admission Wizard', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveAdmissionForm()">Complete Student Admission</button>
    `, 'large');
  }

  /**
   * Compress and resize uploaded image for fast and lightweight storage
   */
  async compressImageFile(file, maxWidth = 320, maxHeight = 320, quality = 0.78) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('Selected file is not an image.'));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid or corrupted image format.'));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / maxWidth > height / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          try {
            const webpUrl = canvas.toDataURL('image/webp', quality);
            if (webpUrl && webpUrl.startsWith('data:image/webp')) {
              return resolve(webpUrl);
            }
          } catch (err) {}

          const jpegUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(jpegUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async handleAdmissionPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const compressedDataUrl = await this.compressImageFile(file, 320, 320, 0.78);
      const preview = document.getElementById('admission-photo-preview');
      const hiddenInput = document.getElementById('admission-photo-url');
      if (preview) preview.src = compressedDataUrl;
      if (hiddenInput) hiddenInput.value = compressedDataUrl;
    } catch (err) {
      this.showToast('Could not process photo: ' + err.message, 'error');
    }
  }

  onAdmissionDobChange(dobValue) {
    if (!dobValue) return;
    const birth = new Date(dobValue);
    const ageDifMs = Date.now() - birth.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    const ageInput = document.getElementById('admission-age');
    if (ageInput && !isNaN(age)) ageInput.value = age;
  }

  onAdmissionMobileInput(mobileValue) {
    const waInput = document.getElementById('admission-whatsapp');
    if (waInput && (!waInput.value || waInput.dataset.autoSynced === 'true')) {
      waInput.value = mobileValue;
      waInput.dataset.autoSynced = 'true';
    }
  }

  syncWhatsappPhone() {
    const mobile = document.getElementById('admission-mobile')?.value;
    const wa = document.getElementById('admission-whatsapp');
    if (wa && mobile) {
      wa.value = mobile;
      wa.dataset.autoSynced = 'true';
    }
  }

  onAdmissionGenderChange(gender) {
    const hostelSelect = document.getElementById('admission-hostel-id');
    if (!hostelSelect) return;
    // Auto-select corresponding hostel
    if (gender === 'female') {
      const opt = Array.from(hostelSelect.options).find(o => o.text.toLowerCase().includes('girl'));
      if (opt) hostelSelect.value = opt.value;
    } else {
      const opt = Array.from(hostelSelect.options).find(o => o.text.toLowerCase().includes('boy'));
      if (opt) hostelSelect.value = opt.value;
    }
  }

  async saveAdmissionForm() {
    const form = document.getElementById('admission-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.room_id = null;
    data.bed_id = null;

    try {
      await window.StudentService.createStudent(data);
      this.closeModal();
      this.showToast(`Student ${data.full_name} successfully admitted! Assign bed in Hostels & Beds.`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // BULK STUDENT DATA IMPORT (CSV / EXCEL SPREADSHEET)
  // ==========================================================================

  downloadStudentImportTemplate() {
    window.ReportService.downloadStudentImportTemplate();
    this.showToast('Downloaded TPS_Student_Import_Template.csv', 'info');
  }

  async openImportStudentsModal() {
    this.parsedImportStudents = [];
    const hostels = await window.HostelService.getAllHostels();

    const bodyHtml = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- Header & Template Download -->
        <div style="background: var(--bg-surface-secondary); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <strong style="color: var(--primary-700); font-size: 0.92rem;">Import Students via CSV or Spreadsheet</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              Supports columns: <code>id_number, full_name, gender, dob, school_class, hostel_name, father_phone</code>
            </div>
          </div>
          <button class="btn btn-sm btn-outline-primary" onclick="App.downloadStudentImportTemplate()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download Sample CSV Template
          </button>
        </div>

        <!-- Default Overrides -->
        <div class="form-grid">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Default Hostel (if not in file)</label>
            <select class="form-control" id="import-default-hostel">
              <option value="auto">Auto-detect from Gender</option>
              ${hostels.map(h => `<option value="${h.id}">${h.name} (${h.gender})</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Default School Class (if not in file)</label>
            <select class="form-control" id="import-default-class">
              ${CONFIG.SCHOOL_CLASSES.map(cls => `<option value="${cls}" ${cls === 'STD-VIII' ? 'selected' : ''}>${cls}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Input Modes: File Upload or Direct Paste -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <!-- Option A: File Dropzone -->
          <div style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 1.25rem 1rem; text-align: center; background: var(--bg-surface); cursor: pointer;" onclick="document.getElementById('student-import-file-input').click()">
            <div style="margin-bottom: 0.35rem;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--primary-600);"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <strong style="font-size: 0.88rem; color: var(--primary-700);">Upload CSV File</strong>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Click to select .csv, .txt, or .json file</p>
            <input type="file" id="student-import-file-input" accept=".csv, .txt, .json" style="display:none;" onchange="App.handleStudentImportFile(event)">
          </div>

          <!-- Option B: Paste Text -->
          <div style="display: flex; flex-direction: column;">
            <label class="form-label" style="font-size: 0.8rem;">Or Paste CSV / Tabbed Spreadsheet Text:</label>
            <textarea class="form-control" id="import-pasted-text" rows="4" style="font-family:monospace; font-size:0.75rem;" placeholder="id_number,full_name,gender,dob,school_class,father_phone&#10;TPS2026056,Zainab Fathima,female,2012-04-12,STD-VIII,+91 98471 22334" oninput="App.parsePastedStudentData(this.value)"></textarea>
          </div>
        </div>

        <!-- Preview Area -->
        <div id="import-preview-container" style="display:none;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <strong style="font-size:0.88rem; color:var(--text-primary);" id="import-preview-title">Preview Data (0 Records)</strong>
            <span class="badge badge-success" id="import-preview-badge">Ready to import</span>
          </div>
          <div class="table-responsive" style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
            <table class="data-table" style="font-size:0.8rem;">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID Number</th>
                  <th>Full Name</th>
                  <th>Gender</th>
                  <th>Class</th>
                  <th>Father / Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="import-preview-tbody">
                <!-- Injected by preview handler -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.openModal('Import Students Data (CSV / Excel)', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-execute-import" onclick="App.executeStudentImport()" disabled>
        Import 0 Students
      </button>
    `, 'large');
  }

  handleStudentImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const pasteArea = document.getElementById('import-pasted-text');
      if (pasteArea) pasteArea.value = text;
      this.parsePastedStudentData(text);
    };
    reader.readAsText(file);
  }

  parseCSVText(text) {
    if (!text || !text.trim()) return [];

    // Try parsing as JSON first
    if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
      try {
        return JSON.parse(text);
      } catch (e) {}
    }

    const lines = text.trim().split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Intelligent delimiter detection (Tabs, Commas, Semicolons)
    const firstLine = lines[0];
    const countTabs = (firstLine.match(/\t/g) || []).length;
    const countCommas = (firstLine.match(/,/g) || []).length;
    const countSemi = (firstLine.match(/;/g) || []).length;

    let separator = ',';
    if (countTabs >= countCommas && countTabs >= countSemi && countTabs > 0) separator = '\t';
    else if (countSemi > countCommas && countSemi > 0) separator = ';';

    // CSV row splitter that preserves quotes and escaped quotes
    const splitRow = (rowStr) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      return result;
    };

    const rawHeaders = splitRow(lines[0]);
    const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = splitRow(lines[i]);
      if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

      const obj = {};
      // Store both snake_case and raw header keys for maximum compatibility
      headers.forEach((h, idx) => {
        const val = values[idx] || '';
        obj[h] = val;
        if (rawHeaders[idx]) obj[rawHeaders[idx]] = val;
      });
      rows.push(obj);
    }

    return rows;
  }

  parsePastedStudentData(text) {
    try {
      const parsedRows = this.parseCSVText(text);
      this.parsedImportStudents = parsedRows;
      this.renderImportPreview(parsedRows);
    } catch (err) {
      console.error('[CSV Parse Error]', err);
    }
  }

  renderImportPreview(rows) {
    const container = document.getElementById('import-preview-container');
    const tbody = document.getElementById('import-preview-tbody');
    const title = document.getElementById('import-preview-title');
    const btn = document.getElementById('btn-execute-import');

    if (!container || !tbody) return;

    if (!rows || rows.length === 0) {
      container.style.display = 'none';
      if (btn) {
        btn.disabled = true;
        btn.textContent = '📥 Import 0 Students';
      }
      return;
    }

    container.style.display = 'block';
    if (title) title.textContent = `Preview Data (${rows.length} Valid Records Detected)`;
    if (btn) {
      btn.disabled = false;
      btn.textContent = `Import ${rows.length} Students Now`;
    }

    const currentYear = new Date().getFullYear();

    tbody.innerHTML = rows.map((r, i) => {
      const name = window.StudentService.getRowField(r, [
        'students_name', 'student_name', 'studentsname', 'studentname',
        'full_name', 'fullname', 'name', 'student',
        /student.*name|name.*student/i, /^name$/i
      ]) || `Student #${i + 1}`;

      let adm = window.StudentService.getRowField(r, [
        'id_number', 'id_no', 'id', 'student_id', 'admission_no', 'adm_no', 'idno',
        /^id/i, /admission.*no/i, /id.*number/i
      ]);
      if (!adm) adm = `(Auto TPS${currentYear}...)`;

      let rawGender = (window.StudentService.getRowField(r, ['gender', 'sex', /^gen/i]) || 'male').toLowerCase();
      let isFemale = rawGender.startsWith('f') || rawGender.startsWith('g');

      let sClass = window.StudentService.getRowField(r, ['class', 'school_class', 'grade', 'standard', 'std', /class|grade|standard/i]);
      sClass = window.StudentService.normalizeClass(sClass || 'STD-VIII');

      const phone = window.StudentService.getRowField(r, ['mobile_no', 'mobile', 'phone', 'father_phone', 'mobile_number', /mobile|phone|contact/i]) || '—';
      const father = window.StudentService.getRowField(r, ['fathers_name', 'father_name', 'father', 'fathersname', /father/i]);

      return `
        <tr>
          <td>${i + 1}</td>
          <td><strong style="font-family:monospace; font-size:0.8rem;">${adm}</strong></td>
          <td><strong>${name}</strong></td>
          <td><span class="badge ${isFemale ? 'badge-purple' : 'badge-info'}">${isFemale ? 'Girl' : 'Boy'}</span></td>
          <td><strong style="color:var(--primary-700);">${sClass}</strong></td>
          <td>${father ? `${father} • ` : ''}${phone}</td>
          <td><span class="badge badge-success">Ready</span></td>
        </tr>
      `;
    }).join('');
  }

  async executeStudentImport() {
    if (!this.parsedImportStudents || this.parsedImportStudents.length === 0) {
      this.showToast('No parsed student records to import.', 'warning');
      return;
    }

    const defaultHostel = document.getElementById('import-default-hostel')?.value;
    const defaultClass = document.getElementById('import-default-class')?.value || 'STD-VIII';

    const overrides = {
      school_class: defaultClass,
      hostel_id: defaultHostel !== 'auto' ? defaultHostel : ''
    };

    try {
      const result = await window.StudentService.importStudents(this.parsedImportStudents, overrides);
      this.closeModal();
      this.showToast(`Successfully imported ${result.importedCount} student records into TPS Hostel Platform!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error', 'Import Failed');
    }
  }

  // Edit Student Modal
  async openEditStudentModal(studentId) {
    const student = await window.StudentService.getStudentById(studentId);
    if (!student) {
      this.showToast('Student record not found.', 'error');
      return;
    }

    const hostels = (await window.HostelService.getAllHostels()) || [];
    const rooms = (await window.HostelService.getAllRooms()) || [];
    const beds = (await window.HostelService.getAllBeds()) || [];
    const defaultPhoto = (student.photo_url && !student.photo_url.includes('unsplash.com')) ? student.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '');

    const categories = CONFIG.STUDENT_CATEGORIES || [
      { value: 'General', label: 'General' },
      { value: 'Orphan', label: 'Orphan' },
      { value: 'Staff ward', label: 'Staff ward' }
    ];

    const statuses = CONFIG.ENROLLMENT_STATUSES || [
      { value: 'Enrolled', label: 'Enrolled' },
      { value: 'Withdrawn', label: 'Withdrawn' }
    ];

    const schoolClasses = CONFIG.SCHOOL_CLASSES || [
      'LKG', 'UKG', 'STD-I', 'STD-II', 'STD-III', 'STD-IV', 'STD-V',
      'STD-VI', 'STD-VII', 'STD-VIII', 'STD-IX', 'STD-X', 'STD-XI', 'STD-XII'
    ];

    const bodyHtml = `
      <form id="edit-student-form">
        <!-- Photo Upload Banner -->
        <div style="display:flex; align-items:center; gap:1.25rem; background:var(--bg-surface-secondary); padding:1rem; border-radius:var(--radius-md); margin-bottom:1.25rem; border:1px solid var(--border-color);">
          <div style="position:relative; width:72px; height:72px; flex-shrink:0;">
            <img id="edit-photo-preview" src="${defaultPhoto}" style="width:72px; height:72px; border-radius:var(--radius-md); object-fit:cover; border:2px solid var(--primary-600);" alt="Student Photo">
          </div>
          <div style="flex:1;">
            <label class="form-label" style="font-weight:700; margin-bottom:3px;">Student Photo (Upload)</label>
            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
              <input type="file" id="edit-photo-file" accept="image/*" style="display:none;" onchange="App.handleEditPhotoUpload(event)">
              <button type="button" class="btn btn-sm btn-outline-primary" onclick="document.getElementById('edit-photo-file').click()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:3px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                Change Photo
              </button>
              <span style="font-size:0.75rem; color:var(--text-muted);">Supports JPG, PNG, WEBP passport photos</span>
            </div>
            <input type="hidden" name="photo_url" id="edit-photo-url" value="${student.photo_url || defaultPhoto}">
          </div>
        </div>

        <!-- Section 1: Student Primary Identity -->
        <h4 style="color:var(--primary-700); margin-bottom:0.75rem; border-bottom:1px solid var(--border-color); padding-bottom:0.35rem;">1. Student Identification & Academic Details</h4>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">School ID Number <span class="required">*</span></label>
            <input type="text" class="form-control" name="admission_no" value="${student.admission_no || ''}" required placeholder="e.g. TPS2026056">
          </div>
          <div class="form-group">
            <label class="form-label">Students Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="full_name" value="${student.full_name || ''}" required placeholder="Student's full name">
          </div>
          <div class="form-group">
            <label class="form-label">Class <span class="required">*</span></label>
            <select class="form-control" name="school_class" required>
              ${schoolClasses.map(cls => `<option value="${cls}" ${(student.school_class || 'STD-VIII') === cls ? 'selected' : ''}>${cls}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Gender <span class="required">*</span></label>
            <select class="form-control" name="gender" required>
              <option value="male" ${student.gender === 'male' ? 'selected' : ''}>Boy (Male)</option>
              <option value="female" ${student.gender === 'female' ? 'selected' : ''}>Girl (Female)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Student Category <span class="required">*</span></label>
            <select class="form-control" name="student_category" required>
              ${categories.map(cat => `<option value="${cat.value}" ${(student.student_category || 'General') === cat.value ? 'selected' : ''}>${cat.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Enrollment Status <span class="required">*</span></label>
            <select class="form-control" name="status" required>
              ${statuses.map(st => `<option value="${st.value}" ${student.status === st.value ? 'selected' : ''}>${st.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Section 2: Admissions & Demographics -->
        <h4 style="color:var(--primary-700); margin:1.25rem 0 0.75rem 0; border-bottom:1px solid var(--border-color); padding-bottom:0.35rem;">2. Demographics & Admission Dates</h4>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Date of Birth <span class="required">*</span></label>
            <input type="date" class="form-control" name="dob" id="edit-dob" value="${student.dob || ''}" required onchange="App.onEditDobChange(this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Age</label>
            <input type="number" class="form-control" name="age" id="edit-age" value="${student.age || ''}" placeholder="Auto-calculated">
          </div>
          <div class="form-group">
            <label class="form-label">Date of Admission (School)</label>
            <input type="date" class="form-control" name="school_admission_date" value="${student.school_admission_date || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Date of Admission (Hostel) <span class="required">*</span></label>
            <input type="date" class="form-control" name="hostel_admission_date" value="${student.hostel_admission_date || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Hostel Facility</label>
            <select class="form-control" name="hostel_id">
              ${hostels.map(h => `<option value="${h.id}" ${student.hostel_id === h.id ? 'selected' : ''}>${h.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Bed Space Allocation</label>
            <select class="form-control" name="bed_id">
              <option value="">-- Unassigned (Assign in Hostels & Beds) --</option>
              ${beds.map(b => `<option value="${b.id}" ${student.bed_id === b.id ? 'selected' : ''}>${b.bed_number} (${b.side || 'Bed'} • Room ${rooms.find(r=>r.id===b.room_id)?.room_number || ''})</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Section 3: Parents & Contacts -->
        <h4 style="color:var(--primary-700); margin:1.25rem 0 0.75rem 0; border-bottom:1px solid var(--border-color); padding-bottom:0.35rem;">3. Parent & Communication Details</h4>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Father's Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="father_name" value="${student.father_name || ''}" required placeholder="Father's full name">
          </div>
          <div class="form-group">
            <label class="form-label">Mother's Name</label>
            <input type="text" class="form-control" name="mother_name" value="${student.mother_name || ''}" placeholder="Mother's full name">
          </div>
          <div class="form-group">
            <label class="form-label">Mobile No <span class="required">*</span></label>
            <input type="tel" class="form-control" name="father_phone" value="${student.father_phone || ''}" required placeholder="+91 98XXX XXXXX">
          </div>
          <div class="form-group">
            <label class="form-label">Whatsapp No</label>
            <input type="tel" class="form-control" name="father_whatsapp" value="${student.father_whatsapp || student.father_phone || ''}" placeholder="+91 98XXX XXXXX">
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Address</label>
            <textarea class="form-control" name="address" rows="2" placeholder="House/Village, Post Office, District, State, PIN Code">${student.address || ''}</textarea>
          </div>
        </div>

        <!-- Section 4: Remarks & Notes -->
        <h4 style="color:var(--primary-700); margin:1.25rem 0 0.75rem 0; border-bottom:1px solid var(--border-color); padding-bottom:0.35rem;">4. Remarks & Background Notes</h4>
        <div class="form-group">
          <label class="form-label">Remarks</label>
          <textarea class="form-control" name="remarks" rows="2" placeholder="Special remarks, medical notes, emergency background...">${student.remarks || ''}</textarea>
        </div>
      </form>
    `;

    this.openModal(`Edit Student: ${student.full_name}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveEditStudent('${student.id}')">Save Changes</button>
    `, 'large');
  }

  async handleEditPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const compressedDataUrl = await this.compressImageFile(file, 320, 320, 0.78);
      const preview = document.getElementById('edit-photo-preview');
      const hiddenInput = document.getElementById('edit-photo-url');
      if (preview) preview.src = compressedDataUrl;
      if (hiddenInput) hiddenInput.value = compressedDataUrl;
    } catch (err) {
      this.showToast('Could not process photo: ' + err.message, 'error');
    }
  }

  onEditDobChange(dobValue) {
    if (!dobValue) return;
    const birth = new Date(dobValue);
    const ageDifMs = Date.now() - birth.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    const ageInput = document.getElementById('edit-age');
    if (ageInput && !isNaN(age)) ageInput.value = age;
  }

  async saveEditStudent(studentId) {
    const form = document.getElementById('edit-student-form');
    const formData = new FormData(form);
    const updates = Object.fromEntries(formData.entries());

    try {
      await window.StudentService.updateStudent(studentId, updates);
      this.closeModal();
      this.showToast('Student details updated successfully!', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // Delete Student Confirmation Modal
  confirmDeleteStudent(studentId, studentName, admissionNo = '') {
    this.openModal('Delete Student Record', `
      <div style="text-align:center; padding:1.25rem 1rem;">
        <div style="font-size:2.5rem; margin-bottom:0.65rem; color:var(--danger-solid);">🗑️</div>
        <h4 style="margin-bottom:0.4rem; color:var(--text-primary); font-size:1.15rem;">Permanently Delete ${studentName}?</h4>
        <div style="font-size:0.85rem; color:var(--text-muted); font-family:monospace; margin-bottom:1rem;">ID: ${admissionNo || studentId}</div>
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1.25rem; line-height:1.6;">
          Are you sure you want to remove <strong>${studentName}</strong> from the student admission register?
        </p>
        <div class="status-alert-banner danger" style="text-align:left; font-size:0.82rem;">
          ⚠️ <strong>Hostel Bed & Roster Release:</strong> Deleting this student will automatically vacate any occupied hostel bed slot and remove them from all assigned classroom attendance rosters.
        </div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeDeleteStudent('${studentId}')">Yes, Delete Student</button>
    `);
  }

  async executeDeleteStudent(studentId) {
    try {
      await window.StudentService.deleteStudent(studentId);
      this.closeModal();
      this.showToast('Student record successfully deleted.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  toggleSelectAllStudents(checked) {
    const checkboxes = document.querySelectorAll('.student-row-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = checked;
    });
    const headerCb = document.getElementById('student-select-all');
    if (headerCb) {
      headerCb.checked = checked;
      headerCb.indeterminate = false;
    }
    this.onStudentRowSelectionChange();
  }

  onStudentRowSelectionChange() {
    const checked = document.querySelectorAll('.student-row-checkbox:checked');
    const total = document.querySelectorAll('.student-row-checkbox');
    const bulkBar = document.getElementById('student-bulk-bar');
    const badge = document.getElementById('student-selected-count-badge');
    const headerCb = document.getElementById('student-select-all');

    if (badge) badge.textContent = `${checked.length} Selected`;

    if (bulkBar) {
      bulkBar.style.display = checked.length > 0 ? 'inline-flex' : 'none';
    }

    if (headerCb && total.length > 0) {
      if (checked.length === 0) {
        headerCb.checked = false;
        headerCb.indeterminate = false;
      } else if (checked.length === total.length) {
        headerCb.checked = true;
        headerCb.indeterminate = false;
      } else {
        headerCb.checked = false;
        headerCb.indeterminate = true;
      }
    }
  }

  confirmBulkDeleteStudents() {
    const checked = Array.from(document.querySelectorAll('.student-row-checkbox:checked'));
    if (!checked || checked.length === 0) {
      this.showToast('Please select at least one student to delete.', 'warning');
      return;
    }

    const count = checked.length;
    const namesSample = checked.slice(0, 3).map(cb => cb.dataset.studentName || 'Student').join(', ');
    const moreText = count > 3 ? ` and ${count - 3} more...` : '';

    this.openModal(`Bulk Delete ${count} Student${count > 1 ? 's' : ''}`, `
      <div style="text-align:center; padding:1.25rem 0.5rem;">
        <div style="font-size:2.5rem; color:var(--danger-solid); margin-bottom:0.5rem;">🗑️</div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary); font-size:1.15rem;">Permanently Delete ${count} Selected Student${count > 1 ? 's' : ''}?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); max-width:440px; margin:0 auto 1rem auto; line-height:1.6;">
          Are you sure you want to permanently delete the <strong>${count}</strong> selected students (<strong>${namesSample}${moreText}</strong>) from the system?
        </p>
        <div class="status-alert-banner danger" style="text-align:left; font-size:0.82rem; margin-top:0.75rem;">
          ⚠️ <strong>Bed & Roster Release:</strong> Deleting these students will instantly vacate any assigned hostel beds and remove them from all assigned class/attendance rosters. This action cannot be undone.
        </div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeBulkDeleteStudents()">Yes, Delete ${count} Students</button>
    `);
  }

  async executeBulkDeleteStudents() {
    const checked = Array.from(document.querySelectorAll('.student-row-checkbox:checked'));
    if (checked.length === 0) return;

    try {
      this.closeModal();
      const studentIds = checked.map(cb => cb.value);
      const res = await window.StudentService.deleteMultipleStudents(studentIds);
      this.showToast(`Successfully deleted ${res.count} student record${res.count > 1 ? 's' : ''}.`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast('Bulk delete failed: ' + err.message, 'error');
    }
  }

  // Comprehensive Student Profile View
  async openStudentProfile(studentId) {
    const student = await window.StudentService.getStudentById(studentId);
    if (!student) return;

    const hostel = (await window.HostelService.getAllHostels()).find(h => h.id === student.hostel_id);
    const room = (await window.HostelService.getAllRooms()).find(r => r.id === student.room_id);
    const bed = (await window.HostelService.getAllBeds()).find(b => b.id === student.bed_id);
    const discipline = await window.DisciplineService.getStudentDisciplineSummary(studentId);
    const attRate = await window.AttendanceService.calculateStudentAttendanceRate(studentId);

    const categoryBadgeColor = (student.student_category === 'Orphan') ? 'danger' : ((student.student_category === 'Staff ward') ? 'warning' : 'primary');
    const statusBadgeColor = (student.status === 'Withdrawn') ? 'danger' : 'success';

    const bodyHtml = `
      <!-- Header Banner -->
      <div style="display:flex; align-items:center; gap:1.25rem; margin-bottom:1.5rem; padding-bottom:1.25rem; border-bottom:1px solid var(--border-color);">
        <img src="${typeof CONFIG !== 'undefined' ? CONFIG.getStudentPhoto(student) : (student.photo_url || '')}" style="width:84px; height:84px; border-radius:var(--radius-md); object-fit:cover; border:3px solid var(--primary-600); box-shadow:var(--shadow-md);" alt="Photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
        <div>
          <h3 style="font-size:1.4rem; color:var(--text-primary); font-weight:800; margin-bottom:3px;">${student.full_name}</h3>
          <div style="font-size:0.88rem; color:var(--text-muted); display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
            <span>ID: <strong style="font-family:monospace; color:var(--primary-700);">${student.admission_no}</strong></span>
            <span>•</span>
            <span>Class: <strong>${student.school_class}</strong></span>
            <span>•</span>
            <span>Gender: <strong>${student.gender === 'female' ? 'Girl' : 'Boy'}</strong></span>
          </div>
          <div style="margin-top:8px; display:flex; gap:0.4rem; flex-wrap:wrap;">
            <span class="badge badge-${statusBadgeColor}">● ${student.status || 'Enrolled'}</span>
            <span class="badge badge-${categoryBadgeColor}">${student.student_category || 'General'}</span>
            <span class="badge badge-neutral">${hostel ? hostel.name : 'Hostel'} • ${room ? 'Room ' + room.room_number : 'No Room'} (${bed ? bed.bed_number : 'Unassigned Bed'})</span>
          </div>
        </div>
      </div>

      <!-- 17-Field Complete Data Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(290px, 1fr)); gap:1rem; font-size:0.88rem; line-height:1.7;">
        <!-- Card 1: Demographics & Admission Dates -->
        <div style="background:var(--bg-surface-secondary); padding:1rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
          <h4 style="color:var(--primary-700); margin-bottom:0.65rem; display:flex; align-items:center; gap:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Admission & Demographics
          </h4>
          <div>Date of Birth: <strong>${student.dob || '—'}</strong></div>
          <div>Age: <strong>${student.age ? student.age + ' Years' : '—'}</strong></div>
          <div>Admission Date (School): <strong>${student.school_admission_date || '—'}</strong></div>
          <div>Admission Date (Hostel): <strong>${student.hostel_admission_date || '—'}</strong></div>
          <div>Category: <strong>${student.student_category || 'General'}</strong></div>
          <div>Status: <strong style="color:var(--${statusBadgeColor}-solid);">${student.status || 'Enrolled'}</strong></div>
        </div>

        <!-- Card 2: Parent & Communication -->
        <div style="background:var(--bg-surface-secondary); padding:1rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
          <h4 style="color:var(--primary-700); margin-bottom:0.65rem; display:flex; align-items:center; gap:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Parent & Contact Details
          </h4>
          <div>Father's Name: <strong>${student.father_name || '—'}</strong></div>
          <div>Mother's Name: <strong>${student.mother_name || '—'}</strong></div>
          <div>Mobile No: <strong><a href="tel:${student.father_phone}" style="color:var(--primary-700); text-decoration:none;">${student.father_phone || '—'}</a></strong></div>
          <div>Whatsapp No: <strong><a href="https://wa.me/${(student.father_whatsapp || student.father_phone || '').replace(/[^0-9]/g, '')}" target="_blank" style="color:var(--success-solid); text-decoration:none;">${student.father_whatsapp || student.father_phone || '—'} 💬</a></strong></div>
          <div>Address: <strong>${student.address || '—'}</strong></div>
        </div>

        <!-- Card 3: Residence & Academic Attendance -->
        <div style="background:var(--bg-surface-secondary); padding:1rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color); grid-column: 1 / -1;">
          <h4 style="color:var(--primary-700); margin-bottom:0.65rem; display:flex; align-items:center; gap:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Residence, Remarks & Track Record
          </h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:0.75rem;">
            <div>Hostel: <strong>${hostel ? hostel.name : 'Unassigned'}</strong></div>
            <div>Room & Bed: <strong>${room ? 'Room ' + room.room_number : '—'} • ${bed ? bed.bed_number + ' (' + (bed.side || 'Bed') + ')' : 'Unassigned'}</strong></div>
            <div>Attendance Rate: <strong style="color:var(--success-solid);">${attRate.percentage}%</strong> (${attRate.present}/${attRate.total} Sessions)</div>
            <div>Black Marks / Fines: <strong style="color:var(--danger-solid);">${discipline.totalBlackMarks} marks (₹${discipline.pendingFines} fine)</strong></div>
          </div>
          <div style="border-top:1px solid var(--border-subtle); padding-top:0.65rem;">
            <strong>Remarks & Notes:</strong>
            <p style="margin:4px 0 0 0; color:var(--text-secondary); font-style:italic;">
              ${student.remarks || 'No special remarks recorded.'}
            </p>
          </div>
        </div>
      </div>
    `;

    this.openModal(`Student Profile: ${student.full_name}`, bodyHtml, `
      <button class="btn btn-outline-primary" onclick="App.printStudentCard('${student.id}')">🖨️ Print ID Card</button>
      <button class="btn btn-secondary" onclick="App.openEditStudentModal('${student.id}')">✏️ Edit Details</button>
      <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
    `, 'large');
  }

  // ==========================================================================
  // REUSABLE LIQUID GLASS FORM CONTROLS
  // ==========================================================================

  renderLiquidGlassSelect(id, name, options, selectedValue, onChangeFnName = '', fullWidth = true) {
    const selectedOption = options.find(o => o.value === selectedValue) || options[0] || { value: '', label: 'Select' };
    return `
      <div class="glass-dropdown ${fullWidth ? 'full-width' : ''}" id="${id}" style="${fullWidth ? 'width:100%; display:block;' : ''}">
        <input type="hidden" name="${name}" id="${id}-input" value="${selectedOption.value}">
        <button type="button" class="glass-dropdown-toggle" style="${fullWidth ? 'width:100%; justify-content:space-between;' : ''}" onclick="App.toggleGlassDropdown('${id}', event)">
          <span id="${id}-label" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:left; flex:1;">${selectedOption.label}</span>
          <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-left:6px;"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="glass-dropdown-menu" style="${fullWidth ? 'width:100%; min-width:100%;' : ''}">
          ${options.map(opt => `
            <div class="glass-dropdown-item ${opt.value === selectedOption.value ? 'active' : ''}" onclick="App.selectLiquidGlassOption('${id}', '${opt.value}', '${opt.label.replace(/'/g, "\\'")}', '${onChangeFnName}', event)">
              ${opt.label}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  toggleGlassDropdown(dropdownId, event) {
    if (event) event.stopPropagation();
    const target = document.getElementById(dropdownId);
    if (!target) return;
    const wasOpen = target.classList.contains('open');
    document.querySelectorAll('.glass-dropdown.open, .glass-datepicker-wrapper.open, .glass-timepicker-wrapper.open').forEach(d => {
      if (d !== target) d.classList.remove('open');
    });
    target.classList.toggle('open', !wasOpen);
  }

  selectLiquidGlassOption(dropdownId, value, label, onChangeFnName, event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    const input = document.getElementById(`${dropdownId}-input`);
    const labelEl = document.getElementById(`${dropdownId}-label`);
    if (input) input.value = value;
    if (labelEl) labelEl.textContent = label;
    
    dropdown.querySelectorAll('.glass-dropdown-item').forEach(item => {
      if (item.textContent.trim() === label.trim()) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    dropdown.classList.remove('open');
    if (onChangeFnName && typeof window[onChangeFnName] === 'function') {
      window[onChangeFnName](value);
    } else if (onChangeFnName && typeof App[onChangeFnName] === 'function') {
      App[onChangeFnName](value);
    }
  }

  renderLiquidGlassDatePicker(id, name, valueStr = '', fullWidth = false) {
    const val = valueStr || new Date().toISOString().split('T')[0];
    const dateObj = new Date(val);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthTitle = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    let daysHtml = '';
    for (let i = startOffset - 1; i >= 0; i--) {
      daysHtml += `<div class="glass-cal-day empty">${daysInPrevMonth - i}</div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = dStr === val;
      const isToday = dStr === todayStr;
      let cls = 'glass-cal-day';
      if (isSelected) cls += ' selected';
      if (isToday) cls += ' today';
      daysHtml += `<div class="${cls}" onclick="App.pickModalDate('${id}', '${dStr}', event)">${d}</div>`;
    }
    const totalRendered = startOffset + daysInMonth;
    const remaining = (7 - (totalRendered % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      daysHtml += `<div class="glass-cal-day empty">${n}</div>`;
    }

    const displayFormatted = new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return `
      <div class="glass-datepicker-wrapper ${fullWidth ? 'full-width' : ''}" id="${id}" data-current-date="${val}" data-cal-year="${year}" data-cal-month="${month}" style="${fullWidth ? 'width:100%; display:block;' : ''}">
        <input type="hidden" name="${name}" id="${id}-input" value="${val}">
        <button type="button" class="glass-datepicker-toggle" style="${fullWidth ? 'width:100%; justify-content:space-between; height:42px;' : ''}" onclick="App.toggleModalDatePicker('${id}', event)">
          <div style="display:flex; align-items:center; gap:0.5rem; overflow:hidden;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary-700); flex-shrink:0;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span id="${id}-display">${displayFormatted}</span>
          </div>
          <svg class="arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="glass-datepicker-popover">
          <div class="glass-cal-header">
            <button type="button" class="glass-cal-nav-btn" onclick="App.navModalCal('${id}', -1, event)" title="Previous Month">‹</button>
            <span class="glass-cal-title" id="${id}-cal-title">${monthTitle}</span>
            <button type="button" class="glass-cal-nav-btn" onclick="App.navModalCal('${id}', 1, event)" title="Next Month">›</button>
          </div>
          <div class="glass-cal-weekdays">
            <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
          </div>
          <div class="glass-cal-days" id="${id}-cal-days">
            ${daysHtml}
          </div>
          <div class="glass-cal-footer">
            <button type="button" class="glass-cal-today-btn" onclick="App.pickModalDate('${id}', '${todayStr}', event)">Today</button>
            <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;" id="${id}-footer-date">${val}</span>
          </div>
        </div>
      </div>
    `;
  }

  toggleModalDatePicker(id, event) {
    if (event) event.stopPropagation();
    const target = document.getElementById(id);
    if (!target) return;
    const wasOpen = target.classList.contains('open');
    document.querySelectorAll('.glass-datepicker-wrapper.open, .glass-dropdown.open, .glass-timepicker-wrapper.open').forEach(d => {
      if (d !== target) d.classList.remove('open');
    });
    if (!wasOpen) {
      target.classList.add('open');
      const popover = target.querySelector('.glass-datepicker-popover');
      if (popover) {
        popover.classList.remove('popover-align-right');
        const rect = target.getBoundingClientRect();
        const modalCard = target.closest('.modal-card');
        if (modalCard) {
          const cardRect = modalCard.getBoundingClientRect();
          if (rect.left + 300 > cardRect.right - 10 && rect.right - 300 >= cardRect.left + 10) {
            popover.classList.add('popover-align-right');
          }
        } else {
          if (rect.left + 300 > window.innerWidth - 16 && rect.right - 300 >= 16) {
            popover.classList.add('popover-align-right');
          }
        }
      }
    } else {
      target.classList.remove('open');
    }
  }

  navModalCal(id, delta, event) {
    if (event) event.stopPropagation();
    const wrapper = document.getElementById(id);
    if (!wrapper) return;
    let year = parseInt(wrapper.getAttribute('data-cal-year'));
    let month = parseInt(wrapper.getAttribute('data-cal-month'));
    month += delta;
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    wrapper.setAttribute('data-cal-year', year);
    wrapper.setAttribute('data-cal-month', month);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const titleEl = document.getElementById(`${id}-cal-title`);
    if (titleEl) titleEl.textContent = `${monthNames[month]} ${year}`;

    const selectedVal = wrapper.getAttribute('data-current-date') || '';
    const todayStr = new Date().toISOString().split('T')[0];
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let daysHtml = '';
    for (let i = startOffset - 1; i >= 0; i--) {
      daysHtml += `<div class="glass-cal-day empty">${daysInPrevMonth - i}</div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let cls = 'glass-cal-day';
      if (dStr === selectedVal) cls += ' selected';
      if (dStr === todayStr) cls += ' today';
      daysHtml += `<div class="${cls}" onclick="App.pickModalDate('${id}', '${dStr}', event)">${d}</div>`;
    }
    const totalRendered = startOffset + daysInMonth;
    const remaining = (7 - (totalRendered % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      daysHtml += `<div class="glass-cal-day empty">${n}</div>`;
    }
    const daysContainer = document.getElementById(`${id}-cal-days`);
    if (daysContainer) daysContainer.innerHTML = daysHtml;
  }

  pickModalDate(id, dateStr, event) {
    if (event) event.stopPropagation();
    const wrapper = document.getElementById(id);
    if (!wrapper) return;
    wrapper.setAttribute('data-current-date', dateStr);
    const input = document.getElementById(`${id}-input`);
    if (input) input.value = dateStr;
    const displayEl = document.getElementById(`${id}-display`);
    if (displayEl) {
      displayEl.textContent = new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    const footerEl = document.getElementById(`${id}-footer-date`);
    if (footerEl) footerEl.textContent = dateStr;

    wrapper.classList.remove('open');
  }

  // ==========================================================================
  // REUSABLE LIQUID GLASS TIMEPICKER
  // ==========================================================================

  renderLiquidGlassTimePicker(id, name, valueStr = '16:00') {
    let val = valueStr || '16:00';
    let parts = val.split(':');
    let h24 = parseInt(parts[0]) || 0;
    let m = parts[1] || '00';
    m = String(parseInt(m) || 0).padStart(2, '0');

    let ampm = h24 >= 12 ? 'PM' : 'AM';
    let h12Num = h24 % 12;
    if (h12Num === 0) h12Num = 12;
    let h12 = String(h12Num).padStart(2, '0');

    const hours = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];

    const presets = [
      { label: '06:00 AM', val: '06:00' },
      { label: '04:00 PM', val: '16:00' },
      { label: '06:00 PM', val: '18:00' },
      { label: '07:30 PM', val: '19:30' },
      { label: '08:30 PM', val: '20:30' }
    ];

    const displayFormatted = `${h12}:${m} ${ampm}`;

    return `
      <div class="glass-timepicker-wrapper full-width" id="${id}" data-time-h="${h12}" data-time-m="${m}" data-time-ampm="${ampm}">
        <input type="hidden" name="${name}" id="${id}-input" value="${val}">
        <button type="button" class="glass-timepicker-toggle" onclick="App.toggleModalTimePicker('${id}', event)">
          <div style="display:flex; align-items:center; gap:8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="color:var(--primary-700);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span id="${id}-display" style="font-weight:700; color:var(--text-primary); letter-spacing:0.3px;">${displayFormatted}</span>
          </div>
          <svg class="arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="glass-timepicker-popover" style="width:260px;">
          <!-- Quick Time Presets -->
          <div class="glass-time-presets">
            ${presets.map(p => `
              <button type="button" class="glass-time-chip" onclick="App.setTimeDirectly('${id}', '${p.val}', event)">${p.label}</button>
            `).join('')}
          </div>

          <div class="glass-time-cols">
            <!-- Hours Col -->
            <div class="glass-time-col" id="${id}-col-h">
              <div class="glass-time-col-title">Hour</div>
              ${hours.map(h => `<button type="button" class="glass-time-pill ${h === h12 ? 'active' : ''}" data-val="${h}" onclick="App.pickModalTimePart('${id}', 'h', '${h}', event)">${h}</button>`).join('')}
            </div>
            <!-- Minutes Col -->
            <div class="glass-time-col" id="${id}-col-m">
              <div class="glass-time-col-title">Min</div>
              ${minutes.map(minVal => `<button type="button" class="glass-time-pill ${minVal === m ? 'active' : ''}" data-val="${minVal}" onclick="App.pickModalTimePart('${id}', 'm', '${minVal}', event)">${minVal}</button>`).join('')}
            </div>
            <!-- AM/PM Col -->
            <div class="glass-time-col" id="${id}-col-ampm">
              <div class="glass-time-col-title">Period</div>
              <button type="button" class="glass-time-pill ${ampm === 'AM' ? 'active' : ''}" data-val="AM" onclick="App.pickModalTimePart('${id}', 'ampm', 'AM', event)">AM</button>
              <button type="button" class="glass-time-pill ${ampm === 'PM' ? 'active' : ''}" data-val="PM" onclick="App.pickModalTimePart('${id}', 'ampm', 'PM', event)">PM</button>
            </div>
          </div>
          <div class="glass-time-footer">
            <button type="button" class="glass-time-now-btn" onclick="App.setModalTimeNow('${id}', event)">Now</button>
            <button type="button" class="glass-time-done-btn" onclick="App.toggleModalTimePicker('${id}', event)">Done</button>
          </div>
        </div>
      </div>
    `;
  }

  toggleModalTimePicker(id, event) {
    if (event) event.stopPropagation();
    const target = document.getElementById(id);
    if (!target) return;
    const wasOpen = target.classList.contains('open');
    document.querySelectorAll('.glass-datepicker-wrapper.open, .glass-dropdown.open, .glass-timepicker-wrapper.open').forEach(d => {
      if (d !== target) d.classList.remove('open');
    });
    if (!wasOpen) {
      target.classList.add('open');
      const popover = target.querySelector('.glass-timepicker-popover');
      if (popover) {
        popover.classList.remove('popover-align-right');
        const rect = target.getBoundingClientRect();
        const modalCard = target.closest('.modal-card');
        const popoverWidth = 260;
        if (modalCard) {
          const cardRect = modalCard.getBoundingClientRect();
          if (rect.left + popoverWidth > cardRect.right - 10 && rect.right - popoverWidth >= cardRect.left + 10) {
            popover.classList.add('popover-align-right');
          }
        } else {
          if (rect.left + popoverWidth > window.innerWidth - 16 && rect.right - popoverWidth >= 16) {
            popover.classList.add('popover-align-right');
          }
        }
      }
    } else {
      target.classList.remove('open');
    }
  }

  setTimeDirectly(id, time24, event) {
    if (event) event.stopPropagation();
    const wrapper = document.getElementById(id);
    if (!wrapper) return;

    let parts = (time24 || '16:00').split(':');
    let h24 = parseInt(parts[0]) || 0;
    let m = parts[1] || '00';
    m = String(parseInt(m) || 0).padStart(2, '0');

    let ampm = h24 >= 12 ? 'PM' : 'AM';
    let h12Num = h24 % 12;
    if (h12Num === 0) h12Num = 12;
    let h12Str = String(h12Num).padStart(2, '0');

    this.pickModalTimePart(id, 'h', h12Str, event);
    this.pickModalTimePart(id, 'm', m, event);
    this.pickModalTimePart(id, 'ampm', ampm, event);
  }

  pickModalTimePart(id, part, val, event) {
    if (event) event.stopPropagation();
    const wrapper = document.getElementById(id);
    if (!wrapper) return;

    if (part === 'h') wrapper.setAttribute('data-time-h', val);
    if (part === 'm') wrapper.setAttribute('data-time-m', val);
    if (part === 'ampm') wrapper.setAttribute('data-time-ampm', val);

    const h = wrapper.getAttribute('data-time-h') || '12';
    const m = wrapper.getAttribute('data-time-m') || '00';
    const ampm = wrapper.getAttribute('data-time-ampm') || 'PM';

    // Highlight active pill in that column
    const col = document.getElementById(`${id}-col-${part}`);
    if (col) {
      col.querySelectorAll('.glass-time-pill').forEach(btn => {
        if (btn.getAttribute('data-val') === val) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Convert to 24h
    let hNum = parseInt(h);
    if (ampm === 'PM' && hNum < 12) hNum += 12;
    else if (ampm === 'AM' && hNum === 12) hNum = 0;
    const time24 = `${String(hNum).padStart(2, '0')}:${m}`;

    const input = document.getElementById(`${id}-input`);
    if (input) input.value = time24;

    const displayEl = document.getElementById(`${id}-display`);
    if (displayEl) displayEl.textContent = `${h}:${m} ${ampm}`;
  }

  setModalTimeNow(id, event) {
    if (event) event.stopPropagation();
    const wrapper = document.getElementById(id);
    if (!wrapper) return;

    const now = new Date();
    let h24 = now.getHours();
    let min = now.getMinutes();
    let minStr = String(Math.round(min / 5) * 5 % 60).padStart(2, '0');
    let ampm = h24 >= 12 ? 'PM' : 'AM';
    let h12Num = h24 % 12;
    if (h12Num === 0) h12Num = 12;
    let h12Str = String(h12Num).padStart(2, '0');

    this.pickModalTimePart(id, 'h', h12Str, event);
    this.pickModalTimePart(id, 'm', minStr, event);
    this.pickModalTimePart(id, 'ampm', ampm, event);
    wrapper.classList.remove('open');
  }

  filterBatchLeaveStudents() {
    const q = (document.getElementById('batch-leave-search')?.value || '').toLowerCase().trim();
    const c = document.getElementById('batch-leave-class-filter-input')?.value || document.getElementById('batch-leave-class-filter')?.value || 'all';
    const g = document.getElementById('batch-leave-gender-filter-input')?.value || document.getElementById('batch-leave-gender-filter')?.value || 'all';
    const items = document.querySelectorAll('.batch-leave-student-item');
    items.forEach(item => {
      const name = item.getAttribute('data-name') || '';
      const adm = item.getAttribute('data-admission') || '';
      const sClass = item.getAttribute('data-class') || '';
      const gender = item.getAttribute('data-gender') || '';

      const matchesQ = !q || name.includes(q) || adm.includes(q);
      const matchesC = c === 'all' || sClass === c;
      const matchesG = g === 'all' || gender === g;

      item.style.display = (matchesQ && matchesC && matchesG) ? 'flex' : 'none';
    });
  }

  toggleAllBatchStudents(selectAll = true) {
    const items = document.querySelectorAll('.batch-leave-student-item');
    items.forEach(item => {
      if (item.style.display !== 'none') {
        const cb = item.querySelector('input[name="selected_students"]');
        if (cb) cb.checked = selectAll;
      }
    });
    this.updateBatchStudentCount();
  }

  updateBatchStudentCount() {
    const checked = document.querySelectorAll('#batch-students-list input[name="selected_students"]:checked').length;
    const badge = document.getElementById('batch-selected-count');
    if (badge) badge.textContent = `${checked} Students Selected`;
  }

  // Batch Leave Modal - Liquid Glass Edition
  async openBatchLeaveModal() {
    const students = await window.StudentService.getAllStudents();
    const schoolClasses = CONFIG.SCHOOL_CLASSES || [];
    const today = new Date().toISOString().split('T')[0];

    const leaveTypeOptions = [
      { value: 'vacation', label: 'Vacation / Term Holidays' },
      { value: 'hostel_leave', label: 'Hostel Weekend Leave' },
      { value: 'medical_leave', label: 'Medical Leave' },
      { value: 'emergency', label: 'Emergency Home Visit' },
      { value: 'academic', label: 'Special Academic Leave' }
    ];

    const batchLeaveClassOptions = [
      { value: 'all', label: 'All Classes' },
      ...schoolClasses.map(c => ({ value: c, label: c }))
    ];

    const batchLeaveGenderOptions = [
      { value: 'all', label: 'All Genders' },
      { value: 'male', label: 'Boys' },
      { value: 'female', label: 'Girls' }
    ];

    const bodyHtml = `
      <form id="batch-leave-form" style="overflow:visible;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1.15rem; margin-bottom:1.15rem; overflow:visible;">
          <!-- Leave Type -->
          <div class="form-group" style="overflow:visible;">
            <label class="form-label" style="font-weight:600;">Leave Type <span class="required">*</span></label>
            ${this.renderLiquidGlassSelect('batch-leave-type', 'leave_type', leaveTypeOptions, 'vacation')}
          </div>

          <!-- Departure Date & Time -->
          <div class="form-group" style="overflow:visible;">
            <label class="form-label" style="font-weight:600;">Departure Date & Time <span class="required">*</span></label>
            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; overflow:visible;">
              ${this.renderLiquidGlassDatePicker('batch-depart-date-picker', 'leaving_date', today)}
              <div style="flex:1; min-width:130px;">
                <input type="time" class="glass-time-input" name="leaving_time" value="16:00" required>
              </div>
            </div>
          </div>

          <!-- Expected Return Date & Time -->
          <div class="form-group" style="overflow:visible;">
            <label class="form-label" style="font-weight:600;">Expected Return Date & Time <span class="required">*</span></label>
            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; overflow:visible;">
              ${this.renderLiquidGlassDatePicker('batch-return-date-picker', 'expected_return_date', today)}
              <div style="flex:1; min-width:130px;">
                <input type="time" class="glass-time-input" name="expected_return_time" value="17:00" required>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600;">Reason / Vacation Description <span class="required">*</span></label>
          <input type="text" class="form-control" name="reason" placeholder="e.g. Eid Vacation / Term End Holidays" required style="border-radius:var(--radius-md);">
        </div>

        <!-- Student Selection Checklist -->
        <div style="margin-top:1.25rem; border-top:1px solid var(--border-color); padding-top:1rem; overflow:visible;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.65rem;">
            <div>
              <h4 style="margin:0; font-size:0.92rem; color:var(--primary-700); display:flex; align-items:center; gap:6px;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Select Students for Batch Leave Card
              </h4>
              <p style="font-size:0.76rem; color:var(--text-muted); margin:2px 0 0 0;">Pick students departing for this leave/vacation pass</p>
            </div>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span id="batch-selected-count" class="badge badge-primary" style="font-size:0.78rem; font-weight:700;">0 Students Selected</span>
              <button type="button" class="btn btn-xs btn-outline-primary" onclick="App.toggleAllBatchStudents(true)" style="border-radius:var(--radius-full); font-weight:600;">Select All</button>
              <button type="button" class="btn btn-xs btn-secondary" onclick="App.toggleAllBatchStudents(false)" style="border-radius:var(--radius-full); font-weight:600;">Clear</button>
            </div>
          </div>

          <!-- Quick Filters with Liquid Glass Dropdowns -->
          <div style="display:grid; grid-template-columns:1fr auto auto; gap:0.5rem; margin-bottom:0.6rem; overflow:visible; align-items:center;">
            <input type="text" id="batch-leave-search" class="form-control" style="font-size:0.82rem; padding:0.4rem 0.65rem;" placeholder="Search student name or ID..." oninput="App.filterBatchLeaveStudents()">
            ${this.renderLiquidGlassSelect('batch-leave-class-filter', 'leave_class', batchLeaveClassOptions, 'all', 'filterBatchLeaveStudents', false)}
            ${this.renderLiquidGlassSelect('batch-leave-gender-filter', 'leave_gender', batchLeaveGenderOptions, 'all', 'filterBatchLeaveStudents', false)}
          </div>

          <!-- Scrollable Students Roster List -->
          <div id="batch-students-list" style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface);">
            ${students.map(s => {
              const photoUrl = (s.photo_url && !s.photo_url.includes('unsplash.com')) ? s.photo_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '');
              const genderBadge = s.gender === 'female' ? '<span class="badge badge-purple" style="font-size:0.68rem; padding:1px 5px;">Girl</span>' : '<span class="badge badge-info" style="font-size:0.68rem; padding:1px 5px;">Boy</span>';
              return `
                <label class="batch-leave-student-item" data-name="${(s.full_name || '').toLowerCase()}" data-admission="${(s.admission_no || '').toLowerCase()}" data-class="${s.school_class || ''}" data-gender="${s.gender || 'male'}" style="display:flex; align-items:center; gap:0.75rem; padding:0.45rem 0.75rem; border-bottom:1px solid var(--border-subtle); cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='var(--bg-surface-secondary)'" onmouseout="this.style.background='transparent'">
                  <input type="checkbox" name="selected_students" value="${s.id}" onchange="App.updateBatchStudentCount()" style="width:16px; height:16px; accent-color:var(--primary-600); cursor:pointer; flex-shrink:0;">
                  <img src="${photoUrl}" style="width:28px; height:28px; border-radius:var(--radius-full); object-fit:cover; border:1.5px solid var(--border-color); flex-shrink:0;" alt="photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                  <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <strong style="font-size:0.85rem; color:var(--text-primary);">${s.full_name}</strong>
                      ${genderBadge}
                      <span class="badge badge-neutral" style="font-size:0.68rem; padding:1px 5px;">${s.school_class || '—'}</span>
                    </div>
                    <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">${s.admission_no || ''}</div>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </form>
    `;

    this.openModal('Generate Batch Hostel Leave Card', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveBatchLeave()">Generate Batch Leave</button>
    `, 'large');
  }

  async saveBatchLeave() {
    const form = document.getElementById('batch-leave-form');
    const formData = new FormData(form);
    const selectedStudents = form.querySelectorAll('input[name="selected_students"]:checked');
    const studentIds = Array.from(selectedStudents).map(cb => cb.value);

    if (studentIds.length === 0) {
      this.showToast('Please select at least one student for batch leave.', 'error');
      return;
    }

    const leaveData = {
      leave_type: formData.get('leave_type'),
      leaving_date: formData.get('leaving_date'),
      leaving_time: formData.get('leaving_time'),
      expected_return_date: formData.get('expected_return_date'),
      expected_return_time: formData.get('expected_return_time'),
      reason: formData.get('reason')
    };

    try {
      await window.LeaveService.createLeave(leaveData, studentIds);
      this.closeModal();
      this.showToast(`Batch leave generated for ${studentIds.length} students!`, 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // Return Entry Recording Modal
  async openReturnModal(entryId, studentId) {
    const student = await window.StudentService.getStudentById(studentId);
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const bodyHtml = `
      <div>
        <p style="margin-bottom:1rem; font-size:0.92rem;">
          Recording hostel return for <strong>${student ? student.full_name : 'Student'}</strong>.
        </p>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Actual Return Date</label>
            <input type="date" class="form-control" id="ret-date" value="${today}">
          </div>
          <div class="form-group" style="position:relative;">
            <label class="form-label">Actual Return Time</label>
            <input type="time" class="glass-time-input" id="ret-time" value="${nowTime}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Student Health Condition / Remarks</label>
          <input type="text" class="form-control" id="ret-remarks" placeholder="e.g. Good condition, luggage inspected">
        </div>
      </div>
    `;

    this.openModal('Record Student Hostel Return', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.confirmReturn('${entryId}')">Confirm Return</button>
    `);
  }

  async confirmReturn(entryId) {
    const date = document.getElementById('ret-date').value;
    const time = document.getElementById('ret-time-input')?.value || document.getElementById('ret-time')?.value || '16:00';

    try {
      await window.HostelService.markEntryReturned(entryId, date, time);
      this.closeModal();
      this.showToast('Student return successfully logged.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // Printable ID Card
  async printStudentCard(studentId) {
    const student = await window.StudentService.getStudentById(studentId);
    if (!student) return;

    const hostel = (await window.HostelService.getAllHostels()).find(h => h.id === student.hostel_id);
    const room = (await window.HostelService.getAllRooms()).find(r => r.id === student.room_id);
    const bed = (await window.HostelService.getAllBeds()).find(b => b.id === student.bed_id);
    const branding = CONFIG.getBranding ? CONFIG.getBranding() : CONFIG.DEFAULT_BRANDING;

    const bodyHtml = `
      <div class="id-card-container">
        <div class="id-card-header">
          <img src="${branding.logoUrl}" onerror="this.src='logo.svg'" style="height:36px; max-width:140px; object-fit:contain; margin-bottom:2px;" alt="${branding.schoolName}">
          <h3>${branding.schoolName}</h3>
          <p>${branding.appName} RESIDENT IDENTITY CARD</p>
        </div>
        <img src="${typeof CONFIG !== 'undefined' ? CONFIG.getStudentPhoto(student) : (student.photo_url || '')}" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')" class="id-card-photo" alt="Photo">
        <div class="id-card-name">${student.full_name}</div>
        <div class="id-card-adm">${student.admission_no}</div>
        <div class="id-card-details">
          <div>Class: <strong>${student.school_class} (${student.section || 'A'})</strong></div>
          <div>Hostel: <strong>${hostel ? hostel.name : 'Hostel'}</strong></div>
          <div>Room & Bed: <strong>Room ${room ? room.room_number : '—'} • ${bed ? bed.bed_number : 'Bed Slot'}</strong></div>
          <div>Emergency Contact: <strong>${student.father_phone || branding.campusPhone || '+91 483 2750000'}</strong></div>
        </div>
      </div>
    `;

    this.openModal(`Student ID Card: ${student.full_name}`, bodyHtml, `
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print ID Card</button>
      <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
    `);
  }

  // Printable Fine Slip
  async printFineSlip(fineId) {
    const fines = await window.DisciplineService.getAllFines();
    const fine = fines.find(f => f.id === fineId);
    if (!fine) return;

    const student = await window.StudentService.getStudentById(fine.student_id);
    const branding = CONFIG.getBranding ? CONFIG.getBranding() : CONFIG.DEFAULT_BRANDING;

    const bodyHtml = `
      <div class="fine-slip-sheet">
        <div class="fine-slip-header">
          <img src="${branding.logoUrl}" onerror="this.src='logo.svg'" class="fine-slip-logo" alt="${branding.schoolName}">
          <div class="fine-slip-title">
            <h2>${branding.schoolName}</h2>
            <p>${branding.appName} DISCIPLINE & FINE SLIP • ${fine.fine_no}</p>
          </div>
        </div>
        <div class="fine-slip-body">
          <table>
            <tr><th>Student Name</th><td>${student ? student.full_name : 'Student'}</td><th>ID Number</th><td>${student ? student.admission_no : '—'}</td></tr>
            <tr><th>Class</th><td>${student ? student.school_class : '—'}</td><th>Date Issued</th><td>${fine.issue_date}</td></tr>
            <tr><th>Violation / Reason</th><td colspan="3">${fine.reason}</td></tr>
            <tr><th>Late Days Recorded</th><td>${fine.late_days || 0} Day(s)</td><th>Black Marks</th><td>${fine.black_marks || 0}</td></tr>
          </table>
          <div class="fine-amount-box">
            <div style="font-size:0.85rem; text-transform:uppercase; color:#991b1b; font-weight:700;">Penalty Payable Amount</div>
            <h3>₹${fine.amount}</h3>
          </div>
          <div class="fine-signatures">
            <div>Student Signature</div>
            <div>Warden / Authorized Signatory</div>
          </div>
        </div>
      </div>
    `;

    this.openModal(`Official Fine Slip: ${fine.fine_no}`, bodyHtml, `
      <button class="btn btn-primary" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:3px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>Print Fine Slip
      </button>
      <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
    `, 'large');
  }

  // Incident Modal
  async openIncidentModal() {
    const students = await window.StudentService.getAllStudents();
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const bodyHtml = `
      <form id="incident-form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Student Involved <span class="required">*</span></label>
            <select class="form-control" name="student_id" required>
              ${students.map(s => `<option value="${s.id}">${s.full_name} (${s.admission_no} - Class ${s.school_class})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Violation Category <span class="required">*</span></label>
            <select class="form-control" name="category" required>
              <option value="Unauthorized Hostel Exit">Unauthorized Hostel Exit</option>
              <option value="Property & Furniture Damage">Property & Furniture Damage</option>
              <option value="Prohibited Mobile Possession">Prohibited Mobile Possession</option>
              <option value="Fighting & Misconduct">Fighting & Misconduct</option>
              <option value="Repeated Late Return">Repeated Late Return</option>
              <option value="Other Disciplinary Violation">Other Disciplinary Violation</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Incident Date <span class="required">*</span></label>
            <input type="date" class="form-control" name="incident_date" value="${today}" required>
          </div>
          <div class="form-group" style="position:relative;">
            <label class="form-label">Incident Time <span class="required">*</span></label>
            <input type="time" class="glass-time-input" name="incident_time" value="${nowTime}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Severity Level</label>
            <select class="form-control" name="severity">
              <option value="minor">Minor</option>
              <option value="moderate" selected>Moderate</option>
              <option value="major">Major</option>
              <option value="severe">Severe</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Black Marks Issued</label>
            <input type="number" class="form-control" name="black_marks" value="1" min="0" max="10">
          </div>
          <div class="form-group">
            <label class="form-label">Fine Amount (₹)</label>
            <input type="number" class="form-control" name="fine_amount" value="0" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Parent Informed</label>
            <select class="form-control" name="parent_informed">
              <option value="false">Pending / Not Yet</option>
              <option value="true">Yes, Parent Informed</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Action Taken / Disciplinary Resolution</label>
          <input type="text" class="form-control" name="action_taken" placeholder="e.g. Warning letter issued & mobile confiscated for 1 week" value="Warning issued & recorded">
        </div>
        <div class="form-group">
          <label class="form-label">Incident Description & Evidence Notes <span class="required">*</span></label>
          <textarea class="form-control" name="description" rows="3" required placeholder="Detail the location, witness statements, property damage or circumstance..."></textarea>
        </div>
      </form>
    `;

    this.openModal('Log Disciplinary Incident', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveIncident()">Log Incident</button>
    `, 'large');
  }

  async saveIncident() {
    const form = document.getElementById('incident-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (data.parent_informed === 'true') data.parent_informed = true;
    else if (data.parent_informed === 'false') data.parent_informed = false;

    data.black_marks = parseInt(data.black_marks) || 0;
    data.fine_amount = parseFloat(data.fine_amount) || 0;

    try {
      await window.DisciplineService.recordIncident(data);
      this.closeModal();
      this.showToast('Incident logged into Conduct Register.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  confirmDeleteIncident(incidentId, incidentNo) {
    this.openModal('Delete Incident Record', `
      <div style="text-align:center; padding:1.25rem 0.5rem;">
        <div style="font-size:2.5rem; color:var(--danger-solid); margin-bottom:0.5rem;">🗑️</div>
        <h4 style="margin-bottom:0.4rem; color:var(--text-primary);">Delete Incident ${incidentNo}?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); max-width:380px; margin:0 auto 1rem auto; line-height:1.5;">
          Are you sure you want to permanently delete this incident record? Any linked fines or black marks created with this incident will also be removed.
        </p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeDeleteIncident('${incidentId}')">Yes, Delete Incident</button>
    `);
  }

  async executeDeleteIncident(incidentId) {
    try {
      await window.DisciplineService.deleteIncident(incidentId);
      this.closeModal();
      this.showToast('Discipline incident record deleted successfully.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  confirmDeleteFine(fineId, fineNo) {
    this.openModal('Delete Fine Record', `
      <div style="text-align:center; padding:1.25rem 0.5rem;">
        <div style="font-size:2.5rem; color:var(--danger-solid); margin-bottom:0.5rem;">🗑️</div>
        <h4 style="margin-bottom:0.4rem; color:var(--text-primary);">Delete Fine ${fineNo}?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); max-width:380px; margin:0 auto 1rem auto; line-height:1.5;">
          Are you sure you want to permanently remove this fine from the student's register?
        </p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeDeleteFine('${fineId}')">Yes, Delete Fine</button>
    `);
  }

  async executeDeleteFine(fineId) {
    try {
      await window.DisciplineService.deleteFine(fineId);
      this.closeModal();
      this.showToast('Fine record removed successfully.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  confirmDeleteBlackMark(markId, studentName) {
    this.openModal('Delete Black Mark', `
      <div style="text-align:center; padding:1.25rem 0.5rem;">
        <div style="font-size:2.5rem; color:var(--danger-solid); margin-bottom:0.5rem;">🗑️</div>
        <h4 style="margin-bottom:0.4rem; color:var(--text-primary);">Delete Black Mark for ${studentName}?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); max-width:380px; margin:0 auto 1rem auto; line-height:1.5;">
          Are you sure you want to remove this penalty mark from the student's conduct record?
        </p>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeDeleteBlackMark('${markId}')">Yes, Delete Mark</button>
    `);
  }

  async executeDeleteBlackMark(markId) {
    try {
      await window.DisciplineService.deleteBlackMark(markId);
      this.closeModal();
      this.showToast('Black mark removed from ledger.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================================================
  // STAFF & FACULTY MANAGEMENT ACTIONS
  // ==========================================================================

  toggleGlassDropdown(dropdownId, event) {
    if (event) event.stopPropagation();
    const target = document.getElementById(dropdownId);
    if (!target) return;
    const wasOpen = target.classList.contains('open');
    document.querySelectorAll('.glass-dropdown.open').forEach(d => {
      if (d !== target) d.classList.remove('open');
    });
    target.classList.toggle('open', !wasOpen);
  }

  selectStaffRoleFilter(role, event) {
    if (event) event.stopPropagation();
    if (window.StaffView) {
      window.StaffView.roleFilter = role || 'all';
      this.renderCurrentView();
    }
  }

  selectStaffStatusFilter(status, event) {
    if (event) event.stopPropagation();
    if (window.StaffView) {
      window.StaffView.statusFilter = status || 'all';
      this.renderCurrentView();
    }
  }

  onStaffSearch(val) {
    if (window.StaffView) {
      window.StaffView.searchQuery = val || '';
      this.renderCurrentView();
    }
  }

  onStaffRoleFilter(role) {
    if (window.StaffView) {
      window.StaffView.roleFilter = role || 'all';
      this.renderCurrentView();
    }
  }

  onStaffStatusFilter(status) {
    if (window.StaffView) {
      window.StaffView.statusFilter = status || 'all';
      this.renderCurrentView();
    }
  }

  setStaffViewMode(mode) {
    if (window.StaffView) {
      window.StaffView.viewMode = mode;
      this.renderCurrentView();
    }
  }

  async openAddStaffModal() {
    const [staffList, hostels] = await Promise.all([
      window.StaffService.getAllStaff(),
      window.HostelService.getAllHostels()
    ]);
    const nextEmpId = (window.StaffService && typeof window.StaffService.generateNextEmployeeId === 'function')
      ? window.StaffService.generateNextEmployeeId(staffList)
      : `TCH-${String((staffList || []).length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const genderOptions = [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' }
    ];

    const hostelOptions = [
      { value: '', label: '-- Campus / All Hostels --' },
      ...hostels.map(h => ({ value: h.id, label: `${h.name} (${h.gender})` }))
    ];

    const statusOptions = [
      { value: 'active', label: 'Active' },
      { value: 'on_leave', label: 'On Leave' },
      { value: 'inactive', label: 'Inactive' }
    ];

    const bodyHtml = `
      <form id="staff-form" style="overflow:visible;">
        <!-- Photo and Primary Identifiers -->
        <div style="display:flex; gap:1.25rem; align-items:center; margin-bottom:1.25rem; padding-bottom:1rem; border-bottom:1px solid var(--border-color);">
          <div style="position:relative; flex-shrink:0;">
            <img id="staff-photo-preview" src="${typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : ''}" style="width:72px; height:72px; border-radius:var(--radius-full); object-fit:cover; border:2.5px solid var(--primary-600); box-shadow:var(--shadow-sm);" alt="Staff Preview">
            <label style="position:absolute; bottom:0; right:0; background:var(--primary-700); color:#fff; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px;" title="Upload Photo">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              <input type="file" accept="image/*" style="display:none;" onchange="App.handleStaffPhotoUpload(event)">
            </label>
            <input type="hidden" name="avatar_url" id="staff-photo-url" value="">
          </div>
          <div style="flex:1;">
            <h4 style="margin:0 0 4px 0; color:var(--text-primary);">Faculty & Staff Profile Photo</h4>
            <p style="margin:0; font-size:0.78rem; color:var(--text-muted);">Upload a clear profile photo or use default portrait.</p>
          </div>
        </div>

        <div class="form-grid" style="overflow:visible;">
          <div class="form-group">
            <label class="form-label">Employee / Staff ID <span class="required">*</span></label>
            <input type="text" class="form-control" name="employee_id" value="${nextEmpId}" required placeholder="e.g. TCH-001" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group">
            <label class="form-label">Full Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="full_name" required placeholder="e.g. Usthad Bilal Ahmed" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label" style="font-weight:600;">Roles & Responsibilities <span class="required">*</span> <span style="font-size:0.75rem; font-weight:normal; color:var(--text-muted);">(Select all that apply)</span></label>
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.35rem;">
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="moral_teacher" checked style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Moral Teacher / Usthad</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="coaching_tutor" style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Hostel Coaching Tutor</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="mentor" style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Student Mentor / Guide</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="warden" style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Hostel Warden</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="teacher" style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Academic Teacher</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="incharge" style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Academic In-Charge</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Designation / Title</label>
            <input type="text" class="form-control" name="designation" placeholder="e.g. Senior Moral Usthad, Maths Tutor" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group">
            <label class="form-label">Specialization / Subjects <span class="required">*</span></label>
            <input type="text" class="form-control" name="specialization" required placeholder="e.g. Quran & Moral Studies, Science, Arabic" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group">
            <label class="form-label">Educational Qualification</label>
            <input type="text" class="form-control" name="qualification" placeholder="e.g. MA Arabic, Fazil, B.Ed, M.Sc" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group" style="overflow:visible;">
            <label class="form-label">Gender</label>
            ${this.renderLiquidGlassSelect('staff-gender-select', 'gender', genderOptions, 'male')}
          </div>
          <div class="form-group" style="overflow:visible;">
            <label class="form-label">Assigned Hostel Facility</label>
            ${this.renderLiquidGlassSelect('staff-hostel-select', 'hostel_id', hostelOptions, '')}
          </div>
          <div class="form-group">
            <label class="form-label">Mobile Number <span class="required">*</span></label>
            <input type="tel" class="form-control" name="phone" required placeholder="+91 94471 23456" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp Number</label>
            <input type="tel" class="form-control" name="whatsapp" placeholder="+91 94471 23456" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" name="email" placeholder="staff@thaibapublicschool.com" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group" style="overflow:visible;">
            <label class="form-label">Joining Date</label>
            ${this.renderLiquidGlassDatePicker('staff-joining-date-picker', 'joining_date', today)}
          </div>
          <div class="form-group" style="overflow:visible;">
            <label class="form-label">Employment Status</label>
            ${this.renderLiquidGlassSelect('staff-status-select', 'status', statusOptions, 'active')}
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Residential Address</label>
            <input type="text" class="form-control" name="address" placeholder="Staff Quarters / Town, District" style="border-radius:var(--radius-md);">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Administrative Remarks & Notes</label>
          <textarea class="form-control" name="remarks" rows="2" placeholder="Experience background, duty timings or special responsibilities..." style="border-radius:var(--radius-md);"></textarea>
        </div>
      </form>
    `;

    this.openModal('Add New Staff / Faculty Member', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveStaffForm()">Save & Add Staff</button>
    `, 'large');
  }

  async openEditStaffModal(staffId) {
    const staff = await window.StaffService.getStaffById(staffId);
    if (!staff) {
      this.showToast('Staff record not found.', 'error');
      return;
    }

    const hostels = await window.HostelService.getAllHostels();
    const today = new Date().toISOString().split('T')[0];
    const activeRoles = Array.isArray(staff.roles) && staff.roles.length > 0
      ? staff.roles
      : [staff.role || 'moral_teacher'];

    const genderOptions = [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' }
    ];

    const hostelOptions = [
      { value: '', label: '-- Campus / All Hostels --' },
      ...hostels.map(h => ({ value: h.id, label: `${h.name} (${h.gender})` }))
    ];

    const statusOptions = [
      { value: 'active', label: 'Active' },
      { value: 'on_leave', label: 'On Leave' },
      { value: 'inactive', label: 'Inactive' }
    ];

    const bodyHtml = `
      <form id="staff-form" style="overflow:visible;">
        <!-- Photo and Primary Identifiers -->
        <div style="display:flex; gap:1.25rem; align-items:center; margin-bottom:1.25rem; padding-bottom:1rem; border-bottom:1px solid var(--border-color);">
          <div style="position:relative; flex-shrink:0;">
            <img id="staff-photo-preview" src="${(staff.avatar_url && !staff.avatar_url.includes('unsplash.com')) ? staff.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')}" style="width:72px; height:72px; border-radius:var(--radius-full); object-fit:cover; border:2.5px solid var(--primary-600); box-shadow:var(--shadow-sm);" alt="Staff Preview">
            <label style="position:absolute; bottom:0; right:0; background:var(--primary-700); color:#fff; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px;" title="Upload Photo">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              <input type="file" accept="image/*" style="display:none;" onchange="App.handleStaffPhotoUpload(event)">
            </label>
            <input type="hidden" name="avatar_url" id="staff-photo-url" value="${staff.avatar_url || ''}">
          </div>
          <div style="flex:1;">
            <h4 style="margin:0 0 4px 0; color:var(--text-primary);">${staff.full_name}</h4>
            <p style="margin:0; font-size:0.78rem; color:var(--text-muted); font-family:monospace;">ID: ${staff.employee_id || 'TCH'}</p>
          </div>
        </div>

        <div class="form-grid" style="overflow:visible;">
          <div class="form-group">
            <label class="form-label">Employee / Staff ID <span class="required">*</span></label>
            <input type="text" class="form-control" name="employee_id" value="${staff.employee_id || ''}" required style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group">
            <label class="form-label">Full Name <span class="required">*</span></label>
            <input type="text" class="form-control" name="full_name" value="${staff.full_name || ''}" required style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label" style="font-weight:600;">Roles & Responsibilities <span class="required">*</span> <span style="font-size:0.75rem; font-weight:normal; color:var(--text-muted);">(Select all that apply)</span></label>
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.35rem;">
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="moral_teacher" ${activeRoles.includes('moral_teacher') ? 'checked' : ''} style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Moral Teacher / Usthad</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="coaching_tutor" ${activeRoles.includes('coaching_tutor') ? 'checked' : ''} style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Hostel Coaching Tutor</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="mentor" ${activeRoles.includes('mentor') ? 'checked' : ''} style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Student Mentor / Guide</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="warden" ${activeRoles.includes('warden') ? 'checked' : ''} style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Hostel Warden</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="teacher" ${activeRoles.includes('teacher') ? 'checked' : ''} style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Academic Teacher</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:0.45rem; padding:0.45rem 0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); cursor:pointer; font-size:0.85rem; user-select:none;">
                <input type="checkbox" name="roles" value="incharge" ${activeRoles.includes('incharge') ? 'checked' : ''} style="accent-color:var(--primary-600); width:16px; height:16px;">
                <span>Academic In-Charge</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Designation / Title</label>
            <input type="text" class="form-control" name="designation" value="${staff.designation || ''}" placeholder="e.g. Senior Moral Usthad, Maths Tutor" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group">
            <label class="form-label">Specialization / Subjects <span class="required">*</span></label>
            <input type="text" class="form-control" name="specialization" value="${staff.specialization || ''}" required style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group">
            <label class="form-label">Educational Qualification</label>
            <input type="text" class="form-control" name="qualification" value="${staff.qualification || ''}" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group" style="overflow:visible;">
            <label class="form-label">Gender</label>
            ${this.renderLiquidGlassSelect('edit-staff-gender-select', 'gender', genderOptions, staff.gender || 'male')}
          </div>
          <div class="form-group" style="overflow:visible;">
            <label class="form-label">Assigned Hostel Facility</label>
            ${this.renderLiquidGlassSelect('edit-staff-hostel-select', 'hostel_id', hostelOptions, staff.hostel_id || '')}
          </div>
          <div class="form-group">
            <label class="form-label">Mobile Number <span class="required">*</span></label>
            <input type="tel" class="form-control" name="phone" value="${staff.phone || ''}" required style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp Number</label>
            <input type="tel" class="form-control" name="whatsapp" value="${staff.whatsapp || staff.phone || ''}" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" name="email" value="${staff.email || ''}" style="border-radius:var(--radius-md);">
          </div>
          <div class="form-group" style="overflow:visible;">
            <label class="form-label">Joining Date</label>
            ${this.renderLiquidGlassDatePicker('edit-staff-joining-date-picker', 'joining_date', staff.joining_date || today)}
          </div>
          <div class="form-group" style="overflow:visible;">
            <label class="form-label">Employment Status</label>
            ${this.renderLiquidGlassSelect('edit-staff-status-select', 'status', statusOptions, staff.status || 'active')}
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Residential Address</label>
            <input type="text" class="form-control" name="address" value="${staff.address || ''}" style="border-radius:var(--radius-md);">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Administrative Remarks & Notes</label>
          <textarea class="form-control" name="remarks" rows="2" style="border-radius:var(--radius-md);">${staff.remarks || ''}</textarea>
        </div>
      </form>
    `;

    this.openModal(`Edit Staff: ${staff.full_name}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveStaffForm('${staff.id}')">Save Changes</button>
    `, 'large');
  }

  async handleStaffPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const compressedDataUrl = await this.compressImageFile(file, 320, 320, 0.78);
      const preview = document.getElementById('staff-photo-preview');
      const hiddenInput = document.getElementById('staff-photo-url');
      if (preview) preview.src = compressedDataUrl;
      if (hiddenInput) hiddenInput.value = compressedDataUrl;
    } catch (err) {
      this.showToast('Could not process photo: ' + err.message, 'error');
    }
  }

  async saveStaffForm(staffId = null) {
    const form = document.getElementById('staff-form');
    if (!form) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Collect all checked multi-roles
    const checkedRoles = Array.from(form.querySelectorAll('input[name="roles"]:checked')).map(cb => cb.value);
    if (checkedRoles.length === 0) {
      this.showToast('Please select at least one role/responsibility for the staff member.', 'warning');
      return;
    }
    data.roles = checkedRoles;
    data.role = checkedRoles[0]; // fallback / primary role

    try {
      if (staffId) {
        await window.StaffService.updateStaff(staffId, data);
        this.showToast('Staff member details updated successfully!', 'success');
      } else {
        await window.StaffService.createStaff(data);
        this.showToast('New staff member added to directory!', 'success');
      }
      this.closeModal();
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openStaffProfileModal(staffId) {
    const staff = await window.StaffService.getStaffById(staffId);
    if (!staff) return;

    const [assignedClasses, timetables, hostels] = await Promise.all([
      window.StaffService.getStaffAssignedClasses(staffId),
      window.StaffService.getStaffAssignedTimetables(staffId),
      window.HostelService.getAllHostels()
    ]);

    const assignedHostel = hostels.find(h => h.id === staff.hostel_id || (h.warden_name && h.warden_name.includes(staff.full_name)));

    const roleBadgeMap = {
      'moral_teacher': { label: 'Moral Usthad', cls: 'badge-primary' },
      'coaching_tutor': { label: 'Coaching Tutor', cls: 'badge-secondary' },
      'mentor': { label: 'Mentor / Guide', cls: 'badge-warning' },
      'warden': { label: 'Hostel Warden', cls: 'badge-danger' },
      'teacher': { label: 'Academic Teacher', cls: 'badge-info' },
      'incharge': { label: 'In-Charge', cls: 'badge-neutral' }
    };

    const staffRoles = Array.isArray(staff.roles) && staff.roles.length > 0 
      ? staff.roles 
      : (staff.role ? [staff.role] : ['teacher']);

    const rolesBadgesHtml = staffRoles.map(r => {
      const info = roleBadgeMap[r] || { label: r, cls: 'badge-neutral' };
      return `<span class="badge ${info.cls}" style="font-weight:600;">${info.label}</span>`;
    }).join(' ');

    const bodyHtml = `
      <!-- Header Banner -->
      <div style="display:flex; align-items:center; gap:1.25rem; margin-bottom:1.25rem; padding-bottom:1.25rem; border-bottom:1px solid var(--border-color);">
        <img src="${(staff.avatar_url && !staff.avatar_url.includes('unsplash.com')) ? staff.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')}" style="width:84px; height:84px; border-radius:var(--radius-full); object-fit:cover; border:3px solid var(--primary-600); box-shadow:var(--shadow-md);" alt="${staff.full_name}">
        <div>
          <h3 style="font-size:1.35rem; color:var(--text-primary); font-weight:800; margin-bottom:3px;">${staff.full_name}</h3>
          <div style="font-size:0.85rem; color:var(--text-muted); display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
            <span>ID: <strong style="font-family:monospace; color:var(--primary-700);">${staff.employee_id || 'TCH'}</strong></span>
            <span>•</span>
            <span>${staff.designation || 'Faculty Member'}</span>
            <span>•</span>
            <span>${staff.specialization || 'General'}</span>
          </div>
          <div style="margin-top:8px; display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
            <span class="badge ${staff.status === 'inactive' ? 'badge-danger' : 'badge-success'}">● ${staff.status || 'Active'}</span>
            ${rolesBadgesHtml}
            ${assignedHostel ? `<span class="badge badge-neutral">Hostel: ${assignedHostel.name}</span>` : ''}
            <span class="badge badge-info">${assignedClasses.length} Classes Assigned</span>
          </div>
        </div>
      </div>

      <!-- Info Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; font-size:0.88rem; line-height:1.7;">
        <!-- Card 1: Contact & Demographics -->
        <div style="background:var(--bg-surface-secondary); padding:1rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
          <h4 style="color:var(--primary-700); margin-bottom:0.65rem; display:flex; align-items:center; gap:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Contact & Personal Details
          </h4>
          <div>Mobile: <strong><a href="tel:${staff.phone}" style="color:var(--primary-700); text-decoration:none;">${staff.phone || '—'}</a></strong></div>
          <div>WhatsApp: <strong><a href="https://wa.me/${(staff.whatsapp || staff.phone || '').replace(/[^0-9]/g, '')}" target="_blank" style="color:var(--success-solid); text-decoration:none;">${staff.whatsapp || staff.phone || '—'}</a></strong></div>
          <div>Email: <strong><a href="mailto:${staff.email}" style="color:var(--primary-700); text-decoration:none;">${staff.email || '—'}</a></strong></div>
          <div>Qualification: <strong>${staff.qualification || '—'}</strong></div>
          <div>Joining Date: <strong>${staff.joining_date || '—'}</strong></div>
          <div>Address: <strong>${staff.address || 'Staff Quarters / On-Campus'}</strong></div>
        </div>

        <!-- Card 2: Assigned Class Rooms & Duties -->
        <div style="background:var(--bg-surface-secondary); padding:1rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
          <h4 style="color:var(--primary-700); margin-bottom:0.65rem; display:flex; align-items:center; gap:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            Assigned Class Rooms (${assignedClasses.length})
          </h4>
          ${assignedClasses.length === 0 ? `
            <p style="color:var(--text-muted); font-size:0.82rem; margin:0;">No classroom or moral session currently assigned to this faculty member.</p>
          ` : `
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${assignedClasses.map(cg => `
                <div style="background:var(--bg-surface); padding:0.5rem 0.75rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="color:var(--text-primary);">${cg.group_name}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${cg.room_name || 'Hall'} • ${cg.start_time} - ${cg.end_time}</div>
                  </div>
                  <span class="badge badge-primary" style="font-size:0.7rem;">${cg.assigned_student_ids ? cg.assigned_student_ids.length : 0} Students</span>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Card 3: Weekly Timetable & Coaching Slots -->
        <div style="background:var(--bg-surface-secondary); padding:1rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color); grid-column:1 / -1;">
          <h4 style="color:var(--primary-700); margin-bottom:0.65rem; display:flex; align-items:center; gap:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Weekly Timetable & Coaching Schedule (${timetables.length} Slots)
          </h4>
          ${timetables.length === 0 ? `
            <p style="color:var(--text-muted); font-size:0.82rem; margin:0;">No timetable slots specifically scheduled in Timetable Engine.</p>
          ` : `
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:0.6rem;">
              ${timetables.map(ts => `
                <div style="background:var(--bg-surface); padding:0.6rem 0.85rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                  <div style="font-weight:700; color:var(--primary-700); font-size:0.82rem;">${ts.day_of_week}</div>
                  <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary); margin-top:2px;">${ts.room_name || 'Classroom'}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${ts.start_time} – ${ts.end_time}</div>
                </div>
              `).join('')}
            </div>
          `}
          ${staff.remarks ? `
            <div style="margin-top:0.85rem; padding-top:0.65rem; border-top:1px solid var(--border-subtle); font-size:0.82rem; color:var(--text-secondary); font-style:italic;">
              <strong>Remarks:</strong> ${staff.remarks}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.openModal(`Faculty Profile: ${staff.full_name}`, bodyHtml, `
      <button class="btn btn-secondary" onclick="App.openEditStaffModal('${staff.id}')">✏️ Edit Details</button>
      <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
    `, 'large');
  }

  confirmDeleteStaff(staffId, staffName) {
    this.openModal('Delete Staff Member', `
      <div style="text-align:center; padding:1rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem; color:var(--danger-solid);">🗑️</div>
        <h4 style="margin-bottom:0.5rem; color:var(--text-primary);">Remove ${staffName}?</h4>
        <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem;">
          Are you sure you want to permanently remove this staff member from the faculty directory?
        </p>
        <div class="status-alert-banner danger" style="text-align:left; font-size:0.82rem;">
          ⚠️ <strong>Classroom Safety:</strong> Any classroom or timetable slots assigned to this staff member will be automatically unlinked safely.
        </div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.executeDeleteStaff('${staffId}')">Yes, Delete Staff</button>
    `);
  }

  async executeDeleteStaff(staffId) {
    try {
      await window.StaffService.deleteStaff(staffId);
      this.closeModal();
      this.showToast('Staff member removed from directory.', 'success');
      this.renderCurrentView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async exportStaffCSV() {
    const staff = await window.StaffService.getAllStaff();
    const headers = ['Employee ID', 'Full Name', 'Role', 'Designation', 'Specialization', 'Phone', 'Email', 'Status', 'Joining Date'];
    const rows = staff.map(s => [
      s.employee_id || '',
      s.full_name || '',
      s.role || '',
      s.designation || '',
      s.specialization || '',
      s.phone || '',
      s.email || '',
      s.status || 'active',
      s.joining_date || ''
    ]);
    window.ReportService.exportToCSV('TPS_Staff_Directory', headers, rows);
    this.showToast('Staff directory exported to CSV', 'success');
  }

  // Reports Exports
  async exportStudentsCSV() {
    const students = await window.StudentService.getAllStudents();
    const headers = ['ID Number', 'Full Name', 'Gender', 'Class', 'Hostel ID', 'Father Name', 'Father Phone', 'Status'];
    const rows = students.map(s => [s.admission_no, s.full_name, s.gender, s.school_class, s.hostel_id, s.father_name, s.father_phone, s.status]);
    window.ReportService.exportToCSV('TPS_Students_Register', headers, rows);
    this.showToast('Exported student directory to CSV', 'success');
  }

  async exportCurrentReportCSV() {
    const data = await window.ReportService.getMonthlyAttendanceReport('current');
    const headers = ['ID Number', 'Student Name', 'Class', 'Total Classes', 'Present', 'Absent', 'Leave', 'Percentage'];
    const rows = data.map(d => [d.admission_no, d.full_name, d.school_class, d.total_classes, d.present, d.absent, d.leave, d.percentage]);
    window.ReportService.exportToCSV('TPS_Monthly_Attendance', headers, rows);
    this.showToast('Exported attendance register to CSV', 'success');
  }

  async exportCurrentReportExcel() {
    const data = await window.ReportService.getMonthlyAttendanceReport('current');
    const headers = ['ID Number', 'Student Name', 'Class', 'Total Classes', 'Present', 'Absent', 'Leave', 'Percentage'];
    const rows = data.map(d => [d.admission_no, d.full_name, d.school_class, d.total_classes, d.present, d.absent, d.leave, d.percentage]);
    window.ReportService.exportToExcel('TPS_Monthly_Attendance', 'Monthly Attendance Register', headers, rows);
    this.showToast('Exported attendance register to Excel', 'success');
  }

  saveSupabaseConfig() {
    const key = document.getElementById('settings-anon-key').value;
    localStorage.setItem('tps_supabase_anon_key', key.trim());
    window.db.init();
    this.showToast(key.trim().length > 20 ? 'Supabase key saved and active!' : 'Saved. Using local offline cache.', 'success');
    this.renderCurrentView();
  }

  // ==========================================
  // SUPER ADMIN BRANDING & PROFILE CUSTOMIZATION
  // ==========================================

  openEditBrandingModal() {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Super Admin access is required to edit school branding.', 'warning');
      return;
    }

    const branding = CONFIG.getBranding ? CONFIG.getBranding() : CONFIG.DEFAULT_BRANDING;

    const bodyHtml = `
      <div style="background:linear-gradient(135deg, rgba(13,92,58,0.08), rgba(217,119,6,0.06)); border:1px solid rgba(13,92,58,0.15); border-radius:var(--radius-md); padding:0.85rem 1rem; margin-bottom:1.25rem; font-size:0.85rem; color:var(--text-primary); display:flex; align-items:center; gap:0.6rem;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary-700); flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <div>
          <strong>Super Admin Branding Suite:</strong> Changing the institution name, subtitle, and logo updates the sidebar header, student ID cards, printable fine slips, and official reports in real time.
        </div>
      </div>

      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.15rem; margin-bottom:1.25rem;">
        <div style="font-weight:700; font-size:0.92rem; margin-bottom:0.75rem; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          Logo & Header Icon Customization
        </div>
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:1.25rem;">
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.35rem;">
            <div id="modal-logo-preview-box" style="width:85px; height:85px; border-radius:var(--radius-md); border:2px dashed var(--border-glass); background:rgba(255,255,255,0.85); display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow:var(--shadow-sm);">
              <img id="modal-logo-preview" src="${branding.logoUrl}" style="max-width:85%; max-height:85%; object-fit:contain;" alt="Preview" onerror="this.src='logo.svg'">
            </div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">Live Preview</span>
          </div>

          <div style="flex:1; min-width:240px; display:flex; flex-direction:column; gap:0.65rem;">
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center;">
              <label class="btn btn-outline-primary btn-sm" style="cursor:pointer; display:inline-flex; align-items:center; gap:0.35rem; margin:0;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Upload Icon / SVG / Photo
                <input type="file" id="modal-logo-file-input" accept="image/*,.svg" style="display:none;" onchange="App.onLogoFileSelected(this, 'modal')">
              </label>
              <button type="button" class="btn btn-secondary btn-sm" onclick="App.resetBrandingLogo('modal')">
                Reset Default Icon
              </button>
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:0.78rem; margin-bottom:0.2rem;">Or Icon Image URL</label>
              <input type="text" class="form-control" id="modal-logo-url" value="${branding.logoUrl}" placeholder="logo.svg or https://..." oninput="App.onLogoUrlChanged(this.value, 'modal')">
            </div>
          </div>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Hostel / App Main Title <span class="required">*</span></label>
          <input type="text" class="form-control" id="modal-app-name" value="${branding.appName}" placeholder="e.g. TPS HOSTEL" required>
          <div class="form-hint">Displayed in bold at the top of the sidebar navigation.</div>
        </div>
        <div class="form-group">
          <label class="form-label">School / Subtitle Name <span class="required">*</span></label>
          <input type="text" class="form-control" id="modal-school-name" value="${branding.schoolName}" placeholder="e.g. THAIBAPUBLICSCHOOL" required>
          <div class="form-hint">Displayed under the main title and on ID cards.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Motto / Tagline</label>
          <input type="text" class="form-control" id="modal-motto" value="${branding.motto}" placeholder="e.g. Modern Education with Morality">
        </div>
        <div class="form-group">
          <label class="form-label">Campus Phone</label>
          <input type="text" class="form-control" id="modal-phone" value="${branding.campusPhone}" placeholder="e.g. +91 483 2750000">
        </div>
      </div>
    `;

    this.openModal('✏️ Edit Institution Name & Logo (Super Admin)', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveBrandingFromModal()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:4px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        Save & Apply Branding
      </button>
    `, 'large');
  }

  compressImageFile(file, maxWidth = 400, maxHeight = 400, quality = 0.85) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      // If SVG file, read directly as data URL to keep vector sharpness
      if (file.type === 'image/svg+xml' || (file.name && file.name.toLowerCase().endsWith('.svg'))) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read SVG file'));
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputType, quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Invalid or unsupported image format'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Could not read image file'));
      reader.readAsDataURL(file);
    });
  }

  async onLogoFileSelected(inputEl, context = 'modal') {
    if (inputEl.files && inputEl.files[0]) {
      const file = inputEl.files[0];
      try {
        const compressedDataUrl = await this.compressImageFile(file, 400, 400, 0.85);
        this.updateLogoPreview(compressedDataUrl, context);
      } catch (err) {
        this.showToast('Could not process logo: ' + err.message, 'error');
      }
    }
  }

  onLogoUrlChanged(url, context = 'modal') {
    this.updateLogoPreview(url.trim() || 'logo.svg', context);
  }

  updateLogoPreview(logoUrl, context = 'modal') {
    const previewEl = document.getElementById(`${context}-logo-preview`);
    const urlInputEl = document.getElementById(`${context}-logo-url`);
    if (previewEl) previewEl.src = logoUrl;
    if (urlInputEl && urlInputEl.value !== logoUrl) urlInputEl.value = logoUrl;
  }

  resetBrandingLogo(context = 'modal') {
    const defaultLogo = CONFIG.DEFAULT_BRANDING.logoUrl;
    this.updateLogoPreview(defaultLogo, context);
    this.showToast('Reset logo to default TPS icon', 'info');
  }

  async saveBrandingFromModal() {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Unauthorized: Super Admin access required.', 'danger');
      return;
    }

    const appName = (document.getElementById('modal-app-name')?.value || '').trim();
    const schoolName = (document.getElementById('modal-school-name')?.value || '').trim();
    const motto = (document.getElementById('modal-motto')?.value || '').trim();
    const campusPhone = (document.getElementById('modal-phone')?.value || '').trim();
    const logoUrl = (document.getElementById('modal-logo-url')?.value || '').trim() || (document.getElementById('modal-logo-preview')?.src) || CONFIG.DEFAULT_BRANDING.logoUrl;

    if (!appName || !schoolName) {
      this.showToast('Both Hostel Name and School Subtitle are required.', 'warning');
      return;
    }

    const brandingData = {
      appName,
      schoolName,
      motto,
      campusPhone,
      logoUrl
    };

    CONFIG.saveBranding(brandingData);
    this.applyBranding();

    // Log to audit trail
    try {
      await db.insertRecord('audit_logs', {
        user_email: window.Auth.currentUser?.email || CONFIG.SUPER_ADMIN_EMAIL,
        user_role: 'super_admin',
        action: 'UPDATE_BRANDING',
        module: 'branding',
        details: { appName, schoolName, motto, logoUpdated: !!logoUrl }
      });
    } catch (e) {
      console.warn('Could not record audit log:', e);
    }

    this.closeModal();
    this.showToast('Institution name and logo updated successfully!', 'success');

    if (this.currentRoute === 'settings') {
      this.renderCurrentView();
    }
  }

  async saveBrandingFromSettings() {
    if (!window.Auth || !window.Auth.isSuperAdmin()) {
      this.showToast('Unauthorized: Super Admin access required.', 'danger');
      return;
    }

    const appName = (document.getElementById('settings-app-name')?.value || '').trim();
    const schoolName = (document.getElementById('settings-school-name')?.value || '').trim();
    const motto = (document.getElementById('settings-motto')?.value || '').trim();
    const campusPhone = (document.getElementById('settings-phone')?.value || '').trim();
    const fineRate = parseFloat(document.getElementById('settings-fine-rate')?.value) || 100;
    const logoUrl = (document.getElementById('settings-logo-url')?.value || '').trim() || (document.getElementById('settings-logo-preview')?.src) || CONFIG.DEFAULT_BRANDING.logoUrl;

    if (!appName || !schoolName) {
      this.showToast('Both Hostel Name and School Subtitle are required.', 'warning');
      return;
    }

    const brandingData = {
      appName,
      schoolName,
      motto,
      campusPhone,
      logoUrl,
      fineRate
    };

    CONFIG.saveBranding(brandingData);
    this.applyBranding();

    // Log to audit trail
    try {
      await db.insertRecord('audit_logs', {
        user_email: window.Auth.currentUser?.email || CONFIG.SUPER_ADMIN_EMAIL,
        user_role: 'super_admin',
        action: 'UPDATE_BRANDING',
        module: 'branding',
        details: { appName, schoolName, motto, fineRate, logoUpdated: !!logoUrl }
      });
    } catch (e) {
      console.warn('Could not record audit log:', e);
    }

    this.showToast('School profile and branding saved successfully!', 'success');
    this.renderCurrentView();
  }

  // ==========================================
  // USER PROFILE EDITING MODAL & CONTROLLER
  // ==========================================

  openEditProfileModal() {
    const user = window.Auth.currentUser;
    if (!user) {
      this.openLoginModal();
      return;
    }

    let cleanName = user.full_name || '';
    cleanName = cleanName.replace(/\s*\((?:Super\s*Admin|Admin|Warden|Teacher|Student|Parent)\)/gi, '').trim();

    const avatarUrl = (user.avatar_url && !user.avatar_url.includes('unsplash.com')) ? user.avatar_url : (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '');
    const roleLabel = (user.role || 'user').replace('_', ' ').toUpperCase();

    const bodyHtml = `
      <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-surface-secondary); padding:0.85rem 1.15rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle); margin-bottom:1.25rem;">
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <div style="width:10px; height:10px; border-radius:50%; background:var(--success-solid);"></div>
          <div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--text-primary);">${cleanName}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${user.email}</div>
          </div>
        </div>
        <span class="badge ${user.role === 'super_admin' ? 'badge-success' : 'badge-info'}" style="text-transform:uppercase; letter-spacing:0.5px; font-weight:700;">
          ${roleLabel}
        </span>
      </div>

      <!-- Avatar Editor Box -->
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.15rem; margin-bottom:1.25rem;">
        <div style="font-weight:700; font-size:0.9rem; margin-bottom:0.75rem; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
          Profile Avatar & Photo
        </div>
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:1.25rem;">
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.35rem;">
            <div id="profile-avatar-preview-box" style="width:80px; height:80px; border-radius:50%; border:3px solid var(--primary-600); box-shadow:0 4px 12px rgba(13,92,58,0.15); overflow:hidden; display:flex; align-items:center; justify-content:center; background:var(--neutral-100);">
              <img id="profile-avatar-preview" src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;" alt="Avatar Preview" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '')">
            </div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">Active Photo</span>
          </div>

          <div style="flex:1; min-width:240px; display:flex; flex-direction:column; gap:0.65rem;">
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center;">
              <label class="btn btn-outline-primary btn-sm" style="cursor:pointer; display:inline-flex; align-items:center; gap:0.35rem; margin:0;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Upload Profile Picture
                <input type="file" id="profile-avatar-file-input" accept="image/*" style="display:none;" onchange="App.onProfileAvatarSelected(this)">
              </label>
              <button type="button" class="btn btn-secondary btn-sm" onclick="App.resetProfileAvatar()">
                Reset Photo
              </button>
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:0.78rem; margin-bottom:0.2rem;">Or Avatar Photo URL</label>
              <input type="text" class="form-control" id="profile-avatar-url" value="${avatarUrl}" placeholder="https://..." oninput="App.onProfileAvatarUrlChanged(this.value)">
            </div>
          </div>
        </div>
      </div>

      <!-- User Information Form Fields -->
      <form id="profile-edit-form" onsubmit="event.preventDefault(); App.saveProfileForm();">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Full Name <span class="required">*</span></label>
            <input type="text" class="form-control" id="profile-form-name" value="${cleanName}" required placeholder="Enter your full name">
            <div class="form-hint">Enter your actual name without position or role titles.</div>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address <span class="required">*</span></label>
            <input type="email" class="form-control" id="profile-form-email" value="${user.email || ''}" required placeholder="your.email@thaibapublicschool.com" ${user.role === 'super_admin' ? '' : 'readonly'}>
            <div class="form-hint">Primary login identifier for the portal.</div>
          </div>
          <div class="form-group">
            <label class="form-label">Mobile Phone Number</label>
            <input type="tel" class="form-control" id="profile-form-phone" value="${user.phone || ''}" placeholder="+91 98765 00001">
          </div>
          <div class="form-group">
            <label class="form-label">Assigned Role</label>
            <input type="text" class="form-control" value="${roleLabel}" readonly style="background:var(--bg-surface-secondary); font-weight:600;">
          </div>
        </div>

        <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-subtle);">
          <div class="form-group" style="margin:0;">
            <label class="form-label">Update Password (Optional)</label>
            <input type="password" class="form-control" id="profile-form-password" placeholder="Leave blank to keep your existing password">
            <div class="form-hint">Set a new password only if you wish to change your current credentials.</div>
          </div>
        </div>
      </form>
    `;

    this.openModal('👤 My Profile & Account Settings', bodyHtml, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="App.saveProfileForm()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:4px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        Save Profile Changes
      </button>
    `, 'large');
  }

  async onProfileAvatarSelected(inputEl) {
    if (inputEl.files && inputEl.files[0]) {
      const file = inputEl.files[0];
      try {
        const compressedDataUrl = await this.compressImageFile(file, 320, 320, 0.78);
        this.updateProfileAvatarPreview(compressedDataUrl);
      } catch (err) {
        this.showToast('Could not process avatar: ' + err.message, 'error');
      }
    }
  }

  onProfileAvatarUrlChanged(url) {
    this.updateProfileAvatarPreview(url.trim() || window.CONFIG?.DEFAULT_AVATAR || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>');
  }

  updateProfileAvatarPreview(avatarUrl) {
    const previewEl = document.getElementById('profile-avatar-preview');
    const urlInputEl = document.getElementById('profile-avatar-url');
    if (previewEl) previewEl.src = avatarUrl;
    if (urlInputEl && urlInputEl.value !== avatarUrl) urlInputEl.value = avatarUrl;
  }

  resetProfileAvatar() {
    const defaultAvatar = window.CONFIG?.DEFAULT_AVATAR || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    this.updateProfileAvatarPreview(defaultAvatar);
    this.showToast('Reset avatar to default placeholder', 'info');
  }

  async saveProfileForm() {
    const user = window.Auth.currentUser;
    if (!user) return;

    let fullName = (document.getElementById('profile-form-name')?.value || '').trim();
    const email = (document.getElementById('profile-form-email')?.value || '').trim();
    const phone = (document.getElementById('profile-form-phone')?.value || '').trim();
    const avatarUrl = (document.getElementById('profile-avatar-url')?.value || '').trim() || (document.getElementById('profile-avatar-preview')?.src) || user.avatar_url;
    const newPassword = (document.getElementById('profile-form-password')?.value || '').trim();

    if (!fullName) {
      this.showToast('Please enter your full name.', 'warning');
      return;
    }

    fullName = fullName.replace(/\s*\((?:Super\s*Admin|Admin|Warden|Teacher|Student|Parent)\)/gi, '').trim();

    const updates = {
      full_name: fullName,
      phone: phone,
      avatar_url: avatarUrl
    };

    if (email && user.role === 'super_admin') {
      updates.email = email;
    }

    if (newPassword) {
      updates.password_hash = newPassword;
    }

    try {
      await window.Auth.updateProfile(updates);
      this.updateSidebarUser();
      this.closeModal();
      this.showToast('Profile updated successfully!', 'success');
    } catch (err) {
      this.showToast(`Failed to update profile: ${err.message}`, 'danger');
    }
  }

  confirmResetFullSampleData() {
    this.openModal(
      'Restore Full Sample Dataset',
      `
        <div style="text-align:center; padding:1.25rem 0.5rem;">
          <div style="width:52px; height:52px; border-radius:var(--radius-full); background:rgba(13,92,58,0.1); color:var(--primary-700); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </div>
          <h4 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
            Restore Full Sample Dataset?
          </h4>
          <p style="font-size:0.88rem; color:var(--text-muted); max-width:420px; margin:0 auto 1.25rem auto; line-height:1.5;">
            This will populate <strong>12 complete student records</strong> (Boys & Girls with high-resolution portraits), <strong>6 faculty & usthads</strong>, 8-bed hostel rooms, and weekly class timetables.
          </p>
          <div style="display:flex; justify-content:center; gap:0.75rem;">
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="App.executeResetFullSampleData()">
              Yes, Restore All Sample Data
            </button>
          </div>
        </div>
      `,
      null
    );
  }

  executeResetFullSampleData() {
    db.resetToFullSampleData();
    this.closeModal();
    this.showToast('Full sample dataset (12 students, 6 staff & photos) restored successfully!', 'success');
    this.renderCurrentView();
  }
}

window.App = new AppController();

