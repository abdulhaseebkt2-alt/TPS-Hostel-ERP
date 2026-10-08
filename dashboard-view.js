/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Dashboard View: Dynamic Role-Tailored Dashboards, Realtime Metrics, Outside Tracker, Smart Alerts
 */

class DashboardView {
  async render() {
    const role = window.Auth.currentUser ? window.Auth.currentUser.role : CONFIG.ROLES.SUPER_ADMIN;
    const stats = await window.HostelService.getHostelStats();
    const outsideList = await window.HostelService.getCurrentlyOutsideStudents();
    const allStudents = await window.StudentService.getAllStudents();
    const fines = await window.DisciplineService.getAllFines();
    const notices = await db.getTable('notices');
    const leaves = (await db.getTable('leaves')) || [];
    const leaveStudents = (await db.getTable('leave_students')) || [];
    const pendingFinesCount = fines.filter(f => f.status === 'pending').length;
    const pendingRegistrations = window.Auth ? await window.Auth.getPendingUsers() : [];

    // Group outside list: consolidate batch leave students into a single card row
    const groupedOutsideItems = [];
    const processedEntryIds = new Set();
    const processedStudentIds = new Set();

    // 1. Group active Batch Leaves (Separate by Boys and Girls)
    const activeBatchLeaves = leaves.filter(l => l.is_batch && l.status !== 'closed' && l.status !== 'returned');
    for (const leave of activeBatchLeaves) {
      const unretLeaveStudents = leaveStudents.filter(ls => ls.leave_id === leave.id && !ls.is_returned);
      if (unretLeaveStudents.length > 0) {
        const studentObjs = unretLeaveStudents
          .map(ls => allStudents.find(s => s.id === ls.student_id || s.admission_no === ls.student_id))
          .filter(Boolean);

        studentObjs.forEach(s => processedStudentIds.add(s.id));
        const matchedEntries = outsideList.filter(e => unretLeaveStudents.some(ls => ls.student_id === e.student_id || e.purpose === leave.reason));
        matchedEntries.forEach(e => processedEntryIds.add(e.id));

        const boys = studentObjs.filter(s => s.gender === 'male' || s.gender === 'boys');
        const girls = studentObjs.filter(s => s.gender === 'female' || s.gender === 'girls');

        const genderGroups = [];
        if (boys.length > 0) genderGroups.push({ gender: 'boys', list: boys });
        if (girls.length > 0) genderGroups.push({ gender: 'girls', list: girls });

        for (const g of genderGroups) {
          const primaryStudent = g.list[0] || { full_name: 'Student', admission_no: '', school_class: '', photo_url: '' };
          const totalCount = g.list.length;
          const otherCount = totalCount - 1;
          const isBoy = g.gender === 'boys';

          groupedOutsideItems.push({
            type: 'batch_leave',
            gender: g.gender,
            genderLabel: isBoy ? 'Boys' : 'Girls',
            leaveId: leave.id,
            leaveCode: leave.leave_code || 'Batch Leave',
            primaryStudent,
            allStudents: g.list,
            totalCount,
            otherCount,
            exit_date: leave.leaving_date || (matchedEntries[0]?.exit_date || 'Today'),
            exit_time: leave.leaving_time || (matchedEntries[0]?.exit_time || '16:00'),
            purpose: leave.reason || leave.leave_type || 'Batch Vacation / Leave',
            entryIds: matchedEntries.map(e => e.id)
          });
        }
      }
    }

    // 2. Process remaining outside entries (Individual leaves or manual gate exits)
    const remainingOutside = outsideList.filter(e => !processedEntryIds.has(e.id) && !processedStudentIds.has(e.student_id));
    
    // Group remaining entries by (purpose + exit_date + exit_time + gender)
    const manualGroupMap = new Map();
    for (const entry of remainingOutside) {
      const student = allStudents.find(s => s.id === entry.student_id);
      const gender = (student?.gender === 'female' || student?.gender === 'girls') ? 'girls' : 'boys';
      const key = `${entry.purpose || ''}_${entry.exit_date || ''}_${entry.exit_time || ''}_${gender}`;
      if (!manualGroupMap.has(key)) manualGroupMap.set(key, { gender, entries: [] });
      manualGroupMap.get(key).entries.push(entry);
    }

    for (const [key, group] of manualGroupMap.entries()) {
      const entries = group.entries;
      const isBoy = group.gender === 'boys';
      if (entries.length > 1) {
        const studentObjs = entries.map(e => allStudents.find(s => s.id === e.student_id)).filter(Boolean);
        const primaryStudent = studentObjs[0] || { full_name: 'Student', admission_no: '', school_class: '', photo_url: '' };
        const totalCount = entries.length;
        const otherCount = totalCount - 1;
        groupedOutsideItems.push({
          type: 'batch_manual',
          gender: group.gender,
          genderLabel: isBoy ? 'Boys' : 'Girls',
          leaveId: null,
          leaveCode: `${isBoy ? 'Boys' : 'Girls'} Batch Exit`,
          primaryStudent,
          allStudents: studentObjs,
          totalCount,
          otherCount,
          exit_date: entries[0].exit_date,
          exit_time: entries[0].exit_time,
          purpose: entries[0].purpose || 'Hostel Leave',
          entryIds: entries.map(e => e.id)
        });
      } else {
        const entry = entries[0];
        const student = allStudents.find(s => s.id === entry.student_id);
        groupedOutsideItems.push({
          type: 'individual',
          gender: group.gender,
          entryId: entry.id,
          studentId: entry.student_id,
          student,
          exit_date: entry.exit_date,
          exit_time: entry.exit_time,
          purpose: entry.purpose || 'Individual Leave',
          totalCount: 1,
          otherCount: 0
        });
      }
    }

    window.__inspectedBatches = groupedOutsideItems;

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            ${this.getDashboardTitle(role)}
          </h2>
          <p>Thaiba Public School – Hostel Integrated Resource & Management Platform</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline-primary btn-sm" onclick="App.navigateTo('attendance')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Mark Attendance
          </button>
          <button class="btn btn-primary btn-sm" onclick="App.openAdmissionModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Admission
          </button>
        </div>
      </div>

      <!-- Smart Alert Center -->
      ${(window.Auth && window.Auth.isSuperAdmin() && pendingRegistrations.length > 0) ? `
        <div class="status-alert-banner warning" style="background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08)); border:1.5px solid rgba(245,158,11,0.4); margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem; padding:0.85rem 1.25rem; border-radius:12px;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <div style="width:36px; height:36px; border-radius:10px; background:rgba(245,158,11,0.2); display:flex; align-items:center; justify-content:center; color:#b45309; font-weight:700; font-size:1.1rem; flex-shrink:0;">
              🔔
            </div>
            <div>
              <strong style="color:var(--warning-700, #b45309); font-size:0.95rem;">Pending Account Approvals:</strong>
              <span style="color:var(--text-primary); font-size:0.88rem;"> There are <strong>${pendingRegistrations.length}</strong> new user registration request(s) awaiting your role/position assignment.</span>
            </div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="App.navigateTo('users')" style="white-space:nowrap; border-radius:8px; font-weight:600; padding:6px 14px;">Review & Assign Positions</button>
        </div>
      ` : ''}

      ${outsideList.length > 0 ? `
        <div class="status-alert-banner warning">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <div>
              <strong>Hostel Perimeter Notice:</strong> <span>${outsideList.length} student(s) currently recorded outside campus.</span>
            </div>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="App.navigateTo('hostel')">View Entry Register</button>
        </div>
      ` : ''}

      <!-- Top Statistical Cards Grid -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-card-info">
            <h4>Total Enrolled</h4>
            <div class="stat-card-value">${stats.totalStudents}</div>
            <div class="stat-card-sub positive">● ${stats.presentTotalCount ?? stats.activeStudents} Present in Hostel</div>
          </div>
          <div class="stat-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
        </div>

        <div class="stat-card boys">
          <div class="stat-card-info">
            <h4>Boys Hostel</h4>
            <div class="stat-card-value">${stats.boysCount}</div>
            <div class="stat-card-sub positive">● ${stats.presentBoysCount ?? (stats.boysCount - (stats.boysLeaveCount || 0))} Present in Hostel</div>
          </div>
          <div class="stat-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
        </div>

        <div class="stat-card girls">
          <div class="stat-card-info">
            <h4>Girls Hostel</h4>
            <div class="stat-card-value">${stats.girlsCount}</div>
            <div class="stat-card-sub positive">● ${stats.presentGirlsCount ?? (stats.girlsCount - (stats.girlsLeaveCount || 0))} Present in Hostel</div>
          </div>
          <div class="stat-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"></circle><path d="M12 13v8"></path><path d="M9 18h6"></path></svg>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-card-info">
            <h4>On Leave / Away</h4>
            <div class="stat-card-value">${stats.onLeaveStudents}</div>
            <div class="stat-card-sub negative">${stats.currentlyOutside} Outside Campus</div>
          </div>
          <div class="stat-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-info">
            <h4>Bed Occupancy</h4>
            <div class="stat-card-value">${stats.occupiedBeds} / ${stats.totalBeds}</div>
            <div class="stat-card-sub positive">${stats.availableBeds} Vacant Beds (${stats.occupancyRate}%)</div>
          </div>
          <div class="stat-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>
          </div>
        </div>

        <div class="stat-card danger">
          <div class="stat-card-info">
            <h4>Pending Fines</h4>
            <div class="stat-card-value">${pendingFinesCount}</div>
            <div class="stat-card-sub negative">Requires Settlement</div>
          </div>
          <div class="stat-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="margin-bottom: 1.75rem;">
        <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.85rem; color: var(--text-secondary); letter-spacing: -0.01em;">Quick Action Launcher</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.85rem;">
          <div class="quick-action-btn" onclick="App.navigateTo('students')">
            <div class="quick-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="quick-action-label">All Students</div>
          </div>
          <div class="quick-action-btn" onclick="App.navigateTo('attendance')">
            <div class="quick-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            </div>
            <div class="quick-action-label">Daily Attendance</div>
          </div>
          <div class="quick-action-btn" onclick="App.openBatchLeaveModal()">
            <div class="quick-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            </div>
            <div class="quick-action-label">Batch Leave</div>
          </div>
          <div class="quick-action-btn" onclick="App.openIncidentModal()">
            <div class="quick-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <div class="quick-action-label">Log Incident</div>
          </div>
          <div class="quick-action-btn" onclick="App.navigateTo('timetable')">
            <div class="quick-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div class="quick-action-label">Timetables</div>
          </div>
          <div class="quick-action-btn" onclick="App.navigateTo('reports')">
            <div class="quick-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </div>
            <div class="quick-action-label">Report Center</div>
          </div>
        </div>
      </div>

      <!-- Two Column Section: Currently Outside & Recent Notices -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
        <!-- Currently Outside Hostel Widget -->
        <div class="card">
          <div class="card-header">
            <h3>
              <span class="badge badge-warning" style="margin-right: 4px;">Live</span>
              Students Currently Outside Hostel
            </h3>
            <span class="badge badge-neutral">${outsideList.length} Outside</span>
          </div>
          <div class="card-body" style="padding: 0;">
            ${groupedOutsideItems.length === 0 ? `
              <div class="empty-state" style="padding: 2rem 1rem;">
                <p style="color: var(--success-text); font-weight: 600;">✓ All enrolled students are safely inside their hostel blocks.</p>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Exit Time</th>
                      <th>Purpose</th>
                      <th style="text-align:right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${groupedOutsideItems.map((item, idx) => {
                      if (item.type === 'batch_leave' || item.type === 'batch_manual') {
                        const isBoy = item.gender === 'boys';
                        const badgeClass = isBoy ? 'badge-info' : 'badge-purple';
                        const countBg = isBoy ? 'var(--info-solid, #0284c7)' : '#db2777';
                        const photoUrl = item.primaryStudent.photo_url || (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '');
                        const nameText = item.otherCount > 0
                          ? `${item.primaryStudent.full_name} and ${item.otherCount} other ${isBoy ? (item.otherCount > 1 ? 'boys' : 'boy') : (item.otherCount > 1 ? 'girls' : 'girl')}`
                          : item.primaryStudent.full_name;

                        return `
                          <tr>
                            <td>
                              <div class="table-user-cell">
                                <div style="position:relative; width:36px; height:36px; flex-shrink:0;">
                                  <img src="${photoUrl}" class="table-avatar" style="width:36px; height:36px; border-radius:var(--radius-full); object-fit:cover; border:1.5px solid ${isBoy ? 'rgba(2,132,199,0.3)' : 'rgba(219,39,119,0.3)'};" alt="photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                                  ${item.otherCount > 0 ? `
                                    <span style="position:absolute; bottom:-2px; right:-3px; background:${countBg}; color:#ffffff; font-size:0.64rem; font-weight:800; border-radius:9999px; padding:1px 4px; border:1.5px solid var(--bg-surface, #ffffff); line-height:1;">+${item.otherCount}</span>
                                  ` : ''}
                                </div>
                                <div>
                                  <div class="table-user-name" style="font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                                    <span>${nameText}</span>
                                    <span class="badge ${badgeClass}" style="font-size:0.68rem; padding:1px 6px;">${item.genderLabel} Batch</span>
                                  </div>
                                  <div class="table-user-sub">
                                    ${item.primaryStudent.admission_no ? `${item.primaryStudent.admission_no} • ` : ''}${item.primaryStudent.school_class ? `${item.primaryStudent.school_class} • ` : ''}<strong>${item.totalCount} ${item.genderLabel} Away</strong>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>${item.exit_date} <span style="font-size:0.75rem; color:var(--text-muted);">${item.exit_time}</span></td>
                            <td>
                              <span style="font-weight:500; font-size:0.85rem;">${item.purpose}</span>
                            </td>
                            <td style="text-align:right;">
                              <button class="btn btn-sm btn-outline-primary" onclick="App.openInspectBatchStudentsModal('${idx}')" style="display:inline-flex; align-items:center; gap:5px; font-weight:600; border-radius:var(--radius-full); padding:3px 9px; font-size:0.78rem;">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                <span>View Students</span>
                              </button>
                            </td>
                          </tr>
                        `;
                      } else {
                        const student = item.student;
                        const isBoy = (student?.gender === 'male' || student?.gender === 'boys');
                        const photoUrl = student?.photo_url || (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '');
                        const genderBadge = isBoy ? '<span class="badge badge-info" style="font-size:0.68rem; padding:1px 5px;">Boy</span>' : '<span class="badge badge-purple" style="font-size:0.68rem; padding:1px 5px;">Girl</span>';

                        return `
                          <tr>
                            <td>
                              <div class="table-user-cell">
                                <img src="${photoUrl}" class="table-avatar" alt="photo" onerror="this.src=(typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_STUDENT_PHOTO : '')">
                                <div>
                                  <div class="table-user-name" style="display:flex; align-items:center; gap:6px;">
                                    <span>${student ? student.full_name : 'Student'}</span>
                                    ${genderBadge}
                                  </div>
                                  <div class="table-user-sub">${student ? student.admission_no : ''} • ${student ? student.school_class : ''}</div>
                                </div>
                              </div>
                            </td>
                            <td>${item.exit_date} <span style="font-size:0.75rem; color:var(--text-muted);">${item.exit_time}</span></td>
                            <td>${item.purpose}</td>
                            <td style="text-align:right;">
                              <button class="btn btn-sm btn-outline-primary" onclick="App.openInspectBatchStudentsModal('${idx}')" style="display:inline-flex; align-items:center; gap:5px; font-weight:600; border-radius:var(--radius-full); padding:3px 9px; font-size:0.78rem;">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                <span>View Student</span>
                              </button>
                            </td>
                          </tr>
                        `;
                      }
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>

        <!-- Hostel Notices Widget -->
        <div class="card">
          <div class="card-header">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              Notice Board & Announcements
            </h3>
            <button class="btn btn-sm btn-secondary" onclick="App.navigateTo('notices')">View All</button>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${notices.slice(0, 3).map(n => `
                <div style="padding: 0.85rem; border-radius: var(--radius-md); background-color: var(--bg-surface-secondary); border-left: 4px solid ${n.priority === 'high' ? 'var(--danger-solid)' : 'var(--primary-600)'};">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                    <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary);">${n.title}</h4>
                    <span class="badge ${n.priority === 'high' ? 'badge-danger' : 'badge-neutral'}">${n.priority}</span>
                  </div>
                  <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">${n.content}</p>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">
                    Posted by: ${n.author_name} • ${n.published_date}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getDashboardTitle(role) {
    switch (role) {
      case CONFIG.ROLES.SUPER_ADMIN: return 'Super Admin Dashboard';
      case CONFIG.ROLES.ADMIN: return 'Hostel Admin Operations';
      case CONFIG.ROLES.WARDEN: return 'Hostel Warden / Mentor Console';
      case CONFIG.ROLES.TEACHER: return 'Teacher Teaching & Attendance Portal';
      case CONFIG.ROLES.PARENT: return 'Parent Portal – Child Overview';
      case CONFIG.ROLES.STUDENT: return 'Student Portal – My Hostel Desk';
      default: return 'Hostel Management Dashboard';
    }
  }
}

window.DashboardView = new DashboardView();
