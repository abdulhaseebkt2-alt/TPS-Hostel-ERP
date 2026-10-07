/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Hostel Management View: Hostels, 8-Bed Bedrooms Rack, Bed Allocation Console, Entry/Exit, Daily Diary
 */

class HostelView {
  constructor() {
    this.activeTab = 'hostels'; // 'hostels', 'entry_exit', 'diary'
    this.selectedHostelFilter = 'all';
  }

  async render() {
    const hostels = await window.HostelService.getAllHostels();
    const rooms = await window.HostelService.getAllRooms();
    const beds = await window.HostelService.getAllBeds();
    const students = await window.StudentService.getAllStudents();
    const entries = await db.getTable('hostel_entries');

    const canManageBeds = window.Auth.canManageBeds();

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Hostel & Bedroom Bed Allocation Management
          </h2>
          <p>8-bed dormitories inventory, direct student bed assignment, outside perimeter log, and daily diaries</p>
        </div>
        <div class="page-actions">
          ${canManageBeds ? `
            <button class="btn btn-primary btn-sm" onclick="App.openAddRoomModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              + Create New Bedroom & Layout
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-sm" onclick="App.openEntryExitModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            Record Outing / Exit
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button class="tab-btn ${this.activeTab === 'hostels' ? 'active' : ''}" onclick="App.setHostelTab('hostels')">
          Hostels & Bedroom Layouts Rack
        </button>
        <button class="tab-btn ${this.activeTab === 'entry_exit' ? 'active' : ''}" onclick="App.setHostelTab('entry_exit')">
          Live Entry / Exit Log (${entries.filter(e => e.status === 'outside').length} Outside)
        </button>
        <button class="tab-btn ${this.activeTab === 'diary' ? 'active' : ''}" onclick="App.setHostelTab('diary')">
          Daily Digital Diary / Register
        </button>
      </div>

      ${this.activeTab === 'hostels' ? this.renderHostelsTab(hostels, rooms, beds, students, canManageBeds) : ''}
      ${this.activeTab === 'entry_exit' ? this.renderEntryExitTab(entries, students) : ''}
      ${this.activeTab === 'diary' ? this.renderDiaryTab(hostels) : ''}
    `;
  }

  renderHostelsTab(hostels, rooms, beds, students, canManageBeds) {
    return `
      <!-- Hostels Capacity Overview Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        ${hostels.map(h => {
          const hRooms = rooms.filter(r => r.hostel_id === h.id);
          const hBeds = beds.filter(b => hRooms.some(r => r.id === b.room_id));
          const occupied = hBeds.filter(b => b.status === 'occupied').length;
          const available = hBeds.length - occupied;
          const pct = hBeds.length > 0 ? Math.round((occupied / hBeds.length) * 100) : 0;

          return `
            <div class="card">
              <div class="card-header" style="background: ${h.gender === 'boys' ? 'rgba(13, 92, 58, 0.06)' : 'rgba(219, 39, 119, 0.06)'}; border-bottom: 1px solid var(--border-color);">
                <div>
                  <h3 style="color:var(--text-primary);">${h.name} (${h.code})</h3>
                  <div style="font-size:0.8rem; color:var(--text-muted);">${h.building}</div>
                </div>
                <span class="badge badge-success">${h.status}</span>
              </div>
              <div class="card-body">
                <div style="margin-bottom: 1rem;">
                  <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.35rem;">
                    <span>Bed Occupancy</span>
                    <strong>${occupied} / ${hBeds.length} Beds (${pct}%)</strong>
                  </div>
                  <div style="width:100%; height:8px; background:var(--neutral-200); border-radius:4px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:${h.gender === 'boys' ? 'var(--primary-700)' : '#db2777'}; border-radius:4px;"></div>
                  </div>
                </div>

                <div style="font-size:0.85rem; line-height:1.6; color:var(--text-secondary);">
                  <div>Warden: <strong>${h.warden_name}</strong> (${h.warden_phone})</div>
                  <div>Total Bedrooms: <strong>${hRooms.length} Rooms</strong></div>
                  <div>Available Vacant Beds: <strong style="color:var(--success-solid); font-size:0.95rem;">${available} Beds</strong></div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Visual Bedroom & Bed Space Allocation Rack -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>
              Visual Bedroom & Bed Space Allocation Rack
            </h3>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
              Manage rooms, Left Side / Window Side bed spaces, student assignments, add new beds, or delete spaces.
            </div>
          </div>
            <!-- Liquid Glass Hostel Filter Dropdown -->
            <div class="glass-dropdown" id="hostel-rack-filter-dd">
              <button type="button" class="glass-dropdown-toggle" onclick="App.toggleGlassDropdown('hostel-rack-filter-dd', event)" title="Filter by Hostel Building">
                <span>${(hostels.find(h => h.id === this.selectedHostelFilter)?.name) || 'All Hostels'}</span>
                <svg class="arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div class="glass-dropdown-menu">
                <div class="glass-dropdown-item ${this.selectedHostelFilter === 'all' ? 'active' : ''}" onclick="App.onHostelFilterChange('all')">
                  All Hostels
                </div>
                ${hostels.map(h => `
                  <div class="glass-dropdown-item ${this.selectedHostelFilter === h.id ? 'active' : ''}" onclick="App.onHostelFilterChange('${h.id}')">
                    ${h.name}
                  </div>
                `).join('')}
              </div>
            </div>
            ${canManageBeds ? `
              <button class="btn btn-outline-primary btn-sm" onclick="App.openAddRoomModal()">
                + Add Room
              </button>
            ` : ''}
          </div>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 1.5rem;">
            ${rooms
              .filter(r => this.selectedHostelFilter === 'all' || r.hostel_id === this.selectedHostelFilter)
              .map(r => {
                const hostel = hostels.find(h => h.id === r.hostel_id);
                const rBeds = beds.filter(b => b.room_id === r.id);
                const occupiedCount = rBeds.filter(b => b.status === 'occupied').length;

                // Group beds by side / zone (e.g. Left Side, Window Side, Right Side, etc.)
                const zonesMap = {};
                rBeds.forEach(b => {
                  const sideName = b.side || 'Left Side';
                  if (!zonesMap[sideName]) zonesMap[sideName] = [];
                  zonesMap[sideName].push(b);
                });

                const zoneNames = Object.keys(zonesMap);

                return `
                  <div style="border: 2px solid ${occupiedCount === rBeds.length && rBeds.length > 0 ? 'var(--danger-border)' : 'var(--border-color)'}; border-radius: var(--radius-lg); background: var(--bg-card); overflow: hidden; box-shadow: var(--shadow-xs);">
                    <!-- Bedroom Header with Quick Room Actions -->
                    <div style="padding: 0.85rem 1rem; background: var(--bg-surface-secondary); border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                      <div>
                        <strong style="font-size: 1.05rem; color: var(--text-primary);">Room ${r.room_number}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${hostel ? hostel.name : ''} • ${r.floor}</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span class="badge ${occupiedCount === rBeds.length && rBeds.length > 0 ? 'badge-danger' : occupiedCount > 0 ? 'badge-warning' : 'badge-success'}">
                          ${occupiedCount} / ${rBeds.length} Beds
                        </span>
                        ${canManageBeds ? `
                          <button class="btn btn-sm btn-outline-primary" style="padding: 2px 7px; font-size: 0.72rem;" onclick="App.openAddBedModal('${r.id}', '${r.room_number}')" title="Add a Bed Space to this Room">
                            + Bed
                          </button>
                          <button class="btn btn-sm btn-outline-danger" style="padding: 2px 7px; font-size: 0.72rem;" onclick="App.confirmDeleteRoom('${r.id}', '${r.room_number}', ${occupiedCount})" title="Delete this Room">
                            ✕ Room
                          </button>
                        ` : ''}
                      </div>
                    </div>

                    <!-- Beds Grouped by Side / Zone (e.g. Left Side, Window Side) -->
                    <div style="padding: 0.85rem; display: flex; flex-direction: column; gap: 1rem;">
                      ${zoneNames.length === 0 ? `
                        <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">
                          No beds in this room yet.
                          ${canManageBeds ? `
                            <div style="margin-top:0.5rem;">
                              <button class="btn btn-sm btn-primary" onclick="App.openAddBedModal('${r.id}', '${r.room_number}')">+ Add Bed Space</button>
                            </div>
                          ` : ''}
                        </div>
                      ` : zoneNames.map(zoneName => {
                        const zBeds = zonesMap[zoneName] || [];
                        const isWindow = zoneName.toLowerCase().includes('window');
                        const isLeft = zoneName.toLowerCase().includes('left');
                        const iconSvg = isWindow
                          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line><line x1="3" y1="12" x2="21" y2="12"></line></svg>`
                          : isLeft
                          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`
                          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>`;

                        return `
                          <div style="background: var(--bg-surface-secondary); padding: 0.65rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem; padding-bottom: 4px; border-bottom: 1px dashed var(--border-color);">
                              <span style="font-size:0.8rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:5px;">
                                ${iconSvg} ${zoneName}
                              </span>
                              <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">
                                ${zBeds.length} ${zBeds.length === 1 ? 'Bed' : 'Beds'}
                              </span>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem;">
                              ${zBeds.map(b => {
                                const student = students.find(s => s.id === b.current_student_id);
                                const isOccupied = b.status === 'occupied' && student;

                                return `
                                  <div style="padding: 0.5rem; border-radius: var(--radius-md); border: 1.5px solid ${isOccupied ? 'var(--primary-300)' : 'var(--border-color)'}; background: ${isOccupied ? 'var(--primary-50)' : 'var(--bg-surface)'}; display: flex; flex-direction: column; justify-content: space-between; min-height: 86px; transition: all var(--transition-fast);">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                                      <span style="font-size: 0.78rem; font-weight: 800; color: ${isOccupied ? 'var(--primary-800)' : 'var(--text-muted)'};">
                                        ${b.bed_number}
                                      </span>
                                      <div style="display:flex; align-items:center; gap:2px;">
                                        ${isOccupied ? `
                                          <span class="badge badge-success" style="font-size: 0.62rem; padding: 1px 4px;">Occupied</span>
                                        ` : `
                                          <span class="badge badge-neutral" style="font-size: 0.62rem; padding: 1px 4px;">Vacant</span>
                                        `}
                                        ${canManageBeds ? `
                                          <button style="border:none; background:transparent; color:var(--text-muted); cursor:pointer; padding:2px; font-size:0.75rem; line-height:1; display:flex; align-items:center;" onclick="App.confirmDeleteBed('${b.id}', '${b.bed_number}', '${r.room_number}', ${isOccupied ? 1 : 0})" title="Delete Bed Space">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                          </button>
                                        ` : ''}
                                      </div>
                                    </div>

                                    ${isOccupied ? `
                                      <div style="display: flex; align-items: center; gap: 5px; margin: 3px 0;">
                                        <img src="${student.photo_url}" style="width: 22px; height: 22px; border-radius: var(--radius-full); object-fit: cover; border: 1px solid var(--primary-600);" alt="photo">
                                        <div style="overflow: hidden;">
                                          <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ${student.full_name}
                                          </div>
                                          <div style="font-size: 0.68rem; color: var(--text-muted);">${student.admission_no}</div>
                                        </div>
                                      </div>
                                      ${canManageBeds ? `
                                        <div style="display: flex; gap: 3px; margin-top: 4px;">
                                          <button class="btn btn-sm btn-secondary" style="padding: 2px 4px; font-size: 0.68rem; flex: 1;" onclick="App.openAssignBedModal('${b.id}', '${r.id}')" title="Change Student">
                                            Reassign
                                          </button>
                                          <button class="btn btn-sm btn-danger" style="padding: 2px 4px; font-size: 0.68rem;" onclick="App.vacateBed('${b.id}', '${student.full_name}')" title="Vacate Bed">
                                            Vacate
                                          </button>
                                        </div>
                                      ` : ''}
                                    ` : `
                                      <div style="font-size: 0.72rem; color: var(--text-muted); font-style: italic; margin: 4px 0;">
                                        Vacant Slot
                                      </div>
                                      ${canManageBeds ? `
                                        <button class="btn btn-sm btn-primary" style="padding: 2px 6px; font-size: 0.7rem; width: 100%;" onclick="App.openAssignBedModal('${b.id}', '${r.id}')">
                                          + Assign Student
                                        </button>
                                      ` : `
                                        <span style="font-size: 0.68rem; color: var(--text-muted);">Available</span>
                                      `}
                                    `}
                                  </div>
                                `;
                              }).join('')}
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderEntryExitTab(entries, students) {
    return `
      <div class="card">
        <div class="card-header">
          <h3>Hostel Entry & Exit Register</h3>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Exit Date & Time</th>
                  <th>Purpose</th>
                  <th>Permitted By</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${entries.map(e => {
                  const student = students.find(s => s.id === e.student_id);
                  return `
                    <tr>
                      <td>
                        <div class="table-user-cell">
                          <img src="${student ? student.photo_url : ''}" class="table-avatar" alt="Photo">
                          <div>
                            <div class="table-user-name">${student ? student.full_name : 'Student'}</div>
                            <div class="table-user-sub">${student ? student.admission_no : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>${e.exit_date} <span style="font-size:0.75rem; color:var(--text-muted);">${e.exit_time}</span></td>
                      <td>${e.purpose}</td>
                      <td>${e.permission_by}</td>
                      <td>
                        <span class="badge ${e.status === 'outside' ? 'badge-warning' : 'badge-success'}">
                          ${e.status === 'outside' ? 'Currently Outside' : 'Returned'}
                        </span>
                      </td>
                      <td style="text-align:right;">
                        ${e.status === 'outside' ? `
                          <button class="btn btn-sm btn-primary" onclick="App.openReturnModal('${e.id}', '${student ? student.id : ''}')">
                            Mark Return
                          </button>
                        ` : `
                          <span style="font-size:0.8rem; color:var(--text-muted);">${e.return_date || ''} ${e.return_time || ''}</span>
                        `}
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

  renderDiaryTab(hostels) {
    const today = new Date().toISOString().split('T')[0];
    return `
      <div class="card">
        <div class="card-header">
          <h3>Digital Hostel Diary (Daily Warden Register) - ${today}</h3>
          <button class="btn btn-sm btn-primary" onclick="App.saveDiaryEntry()">Save Diary Record</button>
        </div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Hostel Unit</label>
              <select class="form-control" id="diary-hostel-id">
                ${hostels.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Morning Inspection & Fajr Attendance</label>
              <input type="text" class="form-control" id="diary-morning" placeholder="e.g. All dormitories checked, 100% attendance recorded for Fajr prayer.">
            </div>
            <div class="form-group">
              <label class="form-label">Moral Class Summary</label>
              <input type="text" class="form-control" id="diary-moral" placeholder="e.g. Moral groups A & B completed lesson on honesty and brotherhood.">
            </div>
            <div class="form-group">
              <label class="form-label">Coaching & Study Session Summary</label>
              <input type="text" class="form-control" id="diary-coaching" placeholder="e.g. Mathematics coaching conducted in study hall from 07:30 PM.">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Discipline, Medical & General Observations</label>
            <textarea class="form-control" id="diary-remarks" rows="3" placeholder="Record student sick visits, maintenance needs, or special warden remarks..."></textarea>
          </div>
        </div>
      </div>
    `;
  }
}

window.HostelView = new HostelView();
