/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Dedicated Parent & Guardian Self-Service Portal Engine
 */

class ParentPortal {
  constructor() {
    this.activeTab = 'my_children';
    this.currentUser = null;
    this.myStudents = [];
  }

  async init() {
    this.currentUser = window.Auth.requireAuth(['parent', 'student', 'admin', 'super_admin']);
    if (!this.currentUser) return;

    this.renderHeader();
    await this.loadMyChildren();
    await this.render();
  }

  renderHeader() {
    const user = this.currentUser;
    const nameEl = document.getElementById('parent-user-name');
    const roleEl = document.getElementById('parent-user-role');
    const avatarEl = document.getElementById('parent-user-avatar');

    if (nameEl) nameEl.textContent = user.full_name || 'Parent / Guardian';
    if (roleEl) roleEl.textContent = `Parent Account • Phone: ${user.phone || 'Registered'}`;
    if (avatarEl) avatarEl.src = user.avatar_url || CONFIG.DEFAULT_AVATAR;
  }

  async loadMyChildren() {
    const allStudents = await window.db.getTable('students');
    const user = this.currentUser;

    // 1. Linked student IDs explicitly assigned by Admin
    let matched = [];
    if (user.linked_student_ids && Array.isArray(user.linked_student_ids) && user.linked_student_ids.length > 0) {
      matched = allStudents.filter(s => user.linked_student_ids.includes(s.id));
    } else if (user.linked_student_id) {
      matched = allStudents.filter(s => s.id === user.linked_student_id);
    }

    // 2. If no direct IDs, find by phone number (last 10 digits)
    if (matched.length === 0 && user.phone) {
      const userDigits = user.phone.replace(/[^0-9]/g, '').slice(-10);
      if (userDigits.length === 10) {
        matched = allStudents.filter(s => {
          const fPhone = (s.father_phone || '').replace(/[^0-9]/g, '');
          const mPhone = (s.mother_phone || '').replace(/[^0-9]/g, '');
          const fWa = (s.father_whatsapp || '').replace(/[^0-9]/g, '');
          return fPhone.endsWith(userDigits) || mPhone.endsWith(userDigits) || fWa.endsWith(userDigits);
        });
      }
    }

    this.myStudents = matched;
  }

  setTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.parent-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this.render();
  }

  async render() {
    const container = document.getElementById('parent-view-container');
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--primary-700); font-weight:600;">Loading Parent Portal...</div>`;

    try {
      const [allLeaves, leaveStudents, allHostels, allRooms, allBeds, allFines, notices] = await Promise.all([
        window.db.getTable('leaves'),
        window.db.getTable('leave_students'),
        window.db.getTable('hostels'),
        window.db.getTable('rooms'),
        window.db.getTable('beds'),
        window.db.getTable('fines'),
        window.db.getTable('notices')
      ]);

      const myStudentIds = this.myStudents.map(s => s.id);

      // Filter leaves for this parent's children
      const myLeaves = allLeaves.filter(l => {
        const isAuthor = l.parent_id === this.currentUser.id || l.created_by === this.currentUser.id;
        const hasChildInLeave = leaveStudents.some(ls => ls.leave_id === l.id && myStudentIds.includes(ls.student_id));
        return isAuthor || hasChildInLeave;
      });

      // Filter fines for this parent's children only
      const myFines = allFines.filter(f => myStudentIds.includes(f.student_id));

      let contentHtml = '';

      if (this.activeTab === 'my_children') {
        contentHtml = this.renderMyChildrenCards(this.myStudents, allHostels, allRooms, allBeds);
      } else if (this.activeTab === 'request_leave') {
        contentHtml = this.renderLeaveRequestForm(this.myStudents);
      } else if (this.activeTab === 'leave_status') {
        contentHtml = this.renderLeaveStatusTable(myLeaves, leaveStudents, this.myStudents);
      } else if (this.activeTab === 'fines_conduct') {
        contentHtml = this.renderFinesAndConduct(myFines, this.myStudents);
      } else if (this.activeTab === 'notices') {
        contentHtml = this.renderNotices(notices);
      }

      container.innerHTML = contentHtml;
    } catch (err) {
      container.innerHTML = `<div class="status-alert-banner danger">Failed to load view: ${err.message}</div>`;
    }
  }

  renderMyChildrenCards(students, hostels, rooms, beds) {
    if (students.length === 0) {
      return `
        <div style="background:var(--bg-surface-secondary); padding:3.5rem 1.5rem; text-align:center; border-radius:18px; border:1px solid var(--border-color); max-width:680px; margin:0 auto;">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">👨‍👩‍👧‍👦</div>
          <h3 style="color:var(--text-primary); margin:0 0 6px 0;">No Student Linked to Phone (${this.currentUser.phone || 'N/A'})</h3>
          <p style="color:var(--text-muted); font-size:0.88rem; line-height:1.6; margin:0 0 1.25rem 0;">
            We could not automatically match your mobile number to an admitted student record. Please contact the <strong>Hostel Warden</strong> or <strong>Super Admin</strong> (<code>abdulhaseebkt2@gmail.com</code>) with your child's Admission ID.
          </p>
        </div>
      `;
    }

    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>My Enrolled Children (${students.length})</h2>
          <p>Live hostel status, room placement, and residential profile</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:1.25rem;">
        ${students.map(s => {
          const hostel = hostels.find(h => h.id === s.hostel_id);
          const room = rooms.find(r => r.id === s.room_id);
          const bed = beds.find(b => b.id === s.bed_id);
          const photoUrl = CONFIG.getStudentPhoto(s);

          return `
            <div class="card" style="border-radius:20px; box-shadow:0 8px 24px rgba(0,0,0,0.06); border:1px solid var(--border-color); overflow:hidden;">
              <div style="background:linear-gradient(135deg, #0d5c3a 0%, #064e3b 100%); color:#fff; padding:1.25rem; display:flex; align-items:center; gap:1rem;">
                <img src="${photoUrl}" style="width:64px; height:64px; border-radius:50%; object-fit:cover; border:3px solid #ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.25);" alt="${s.full_name}" onerror="this.src='${CONFIG.DEFAULT_STUDENT_PHOTO}'">
                <div>
                  <h3 style="margin:0 0 3px 0; font-size:1.15rem; color:#ffffff;">${s.full_name}</h3>
                  <div style="font-size:0.8rem; opacity:0.85; font-family:monospace;">ID: ${s.admission_no}</div>
                  <div style="font-size:0.75rem; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:20px; display:inline-block; margin-top:4px; font-weight:700;">
                    Class ${s.school_class} (${s.gender === 'female' ? 'Girl' : 'Boy'})
                  </div>
                </div>
              </div>

              <div class="card-body" style="padding:1.25rem; font-size:0.88rem; line-height:1.7;">
                <div style="background:var(--bg-surface-secondary); padding:0.85rem 1rem; border-radius:12px; margin-bottom:1rem; border:1px solid var(--border-subtle);">
                  <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--primary-700); margin-bottom:4px;">Hostel Placement</div>
                  <div>Facility: <strong>${hostel ? hostel.name : 'Hostel'} (${hostel ? hostel.building : ''})</strong></div>
                  <div>Room & Bed: <strong>${room ? 'Room ' + room.room_number : '—'} • ${bed ? bed.bed_number + ' (' + (bed.side || 'Bed') + ')' : 'Assigned Bed'}</strong></div>
                  <div>Warden: <strong>${hostel ? hostel.warden_name || 'Usthad / Warden' : 'Warden Office'}</strong> (<a href="tel:${hostel ? hostel.warden_phone : ''}" style="color:var(--primary-700); text-decoration:none;">${hostel ? hostel.warden_phone : ''}</a>)</div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem;">
                  <button class="btn btn-outline-primary btn-sm" onclick="Parent.setTab('request_leave')" style="border-radius:10px; font-weight:700;">
                    📝 Apply Leave
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="Parent.setTab('fines_conduct')" style="border-radius:10px; font-weight:700;">
                    ⚠️ View Fines
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderLeaveRequestForm(students) {
    const today = new Date().toISOString().split('T')[0];
    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>Apply for Student Leave / Vacation Pass</h2>
          <p>Submit a formal leave request to the Hostel Warden for approval</p>
        </div>
      </div>

      <div class="card" style="max-width:640px; margin:0 auto; border-radius:20px; box-shadow:0 8px 24px rgba(0,0,0,0.06);">
        <div class="card-body" style="padding:1.75rem;">
          <form id="parent-leave-form" onsubmit="event.preventDefault(); Parent.submitLeaveRequest();">
            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Select Child <span class="required">*</span></label>
              <select class="form-control" id="pl-student" required style="height:44px; border-radius:12px; font-weight:600;">
                ${students.map(s => `<option value="${s.id}">${s.full_name} (${s.admission_no} - Class ${s.school_class})</option>`).join('')}
              </select>
            </div>

            <div class="form-group" style="margin-top:1rem;">
              <label class="form-label" style="font-weight:700;">Leave Type <span class="required">*</span></label>
              <select class="form-control" id="pl-type" style="height:44px; border-radius:12px;">
                <option value="hostel_leave">Weekend Home Visit</option>
                <option value="vacation">Term / Festival Vacation</option>
                <option value="medical_leave">Medical Treatment / Illness</option>
                <option value="emergency">Family Function / Emergency</option>
              </select>
            </div>

            <div class="form-grid" style="margin-top:1rem;">
              <div class="form-group">
                <label class="form-label" style="font-weight:700;">Departure Date & Time <span class="required">*</span></label>
                <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:0.5rem;">
                  <input type="date" class="form-control" id="pl-dep-date" value="${today}" required style="height:44px; border-radius:12px;">
                  <input type="time" class="form-control" id="pl-dep-time" value="16:00" required style="height:44px; border-radius:12px;">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:700;">Expected Return Date & Time <span class="required">*</span></label>
                <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:0.5rem;">
                  <input type="date" class="form-control" id="pl-ret-date" value="${today}" required style="height:44px; border-radius:12px;">
                  <input type="time" class="form-control" id="pl-ret-time" value="17:00" required style="height:44px; border-radius:12px;">
                </div>
              </div>
            </div>

            <div class="form-group" style="margin-top:1rem;">
              <label class="form-label" style="font-weight:700;">Detailed Reason <span class="required">*</span></label>
              <input type="text" class="form-control" id="pl-reason" placeholder="e.g. Attending uncle's marriage at Kottakkal" required style="height:44px; border-radius:12px;">
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; height:46px; border-radius:12px; font-weight:800; font-size:1rem; margin-top:1.5rem;">
              Submit Leave Request to Warden
            </button>
          </form>
        </div>
      </div>
    `;
  }

  renderLeaveStatusTable(leaves, leaveStudents, students) {
    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>My Leave Applications & Passes</h2>
          <p>Track Warden approval status and returning arrival records</p>
        </div>
      </div>

      <div class="table-responsive" style="background:var(--bg-card); border-radius:16px; border:1px solid var(--border-color); overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Child</th>
              <th>Leave Pass Code</th>
              <th>Departure</th>
              <th>Expected Return</th>
              <th>Reason</th>
              <th>Warden Approval Status</th>
            </tr>
          </thead>
          <tbody>
            ${leaves.length === 0 ? `
              <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No leave requests submitted yet.</td></tr>
            ` : leaves.map(l => {
              const lStudent = leaveStudents.find(ls => ls.leave_id === l.id);
              const s = students.find(item => item.id === lStudent?.student_id) || students[0] || { full_name: 'Child' };
              
              let statusBadge = `<span class="badge badge-warning">⏳ Pending Warden Review</span>`;
              if (l.status === 'approved' || l.status === 'active') statusBadge = `<span class="badge badge-success">✓ Approved by Warden</span>`;
              else if (l.status === 'rejected') statusBadge = `<span class="badge badge-danger">✕ Rejected (${l.rejection_reason || 'Denied'})</span>`;
              else if (l.status === 'returned' || l.status === 'closed') statusBadge = `<span class="badge badge-neutral">● Checked In / Returned</span>`;

              return `
                <tr>
                  <td><strong>${s.full_name}</strong></td>
                  <td><code style="font-size:0.8rem; font-weight:700;">${l.leave_code || 'REQ'}</code></td>
                  <td>${l.leaving_date} ${l.leaving_time || ''}</td>
                  <td>${l.expected_return_date} ${l.expected_return_time || ''}</td>
                  <td>${l.reason}</td>
                  <td>${statusBadge}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderFinesAndConduct(fines, students) {
    const pendingFines = fines.filter(f => f.status !== 'paid');
    const totalPending = pendingFines.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
    const totalMarks = fines.reduce((sum, f) => sum + (parseInt(f.black_marks) || 0), 0);

    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>Discipline, Fines & Conduct Ledger</h2>
          <p>Transparency ledger for late arrival fines and black mark penalties for your children only</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem;">
        <div style="background:rgba(225,29,72,0.08); border:1px solid rgba(225,29,72,0.2); padding:1rem 1.25rem; border-radius:14px;">
          <div style="font-size:0.75rem; font-weight:700; color:var(--danger-solid);">OUTSTANDING LATE FINES</div>
          <div style="font-size:1.5rem; font-weight:800; color:var(--danger-solid);">₹${totalPending}</div>
        </div>
        <div style="background:rgba(124,58,237,0.08); border:1px solid rgba(124,58,237,0.2); padding:1rem 1.25rem; border-radius:14px;">
          <div style="font-size:0.75rem; font-weight:700; color:var(--purple-700, #7c3aed);">TOTAL BLACK MARKS</div>
          <div style="font-size:1.5rem; font-weight:800; color:var(--purple-700, #7c3aed);">${totalMarks} Mark(s)</div>
        </div>
      </div>

      <div class="table-responsive" style="background:var(--bg-card); border-radius:16px; border:1px solid var(--border-color); overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Child</th>
              <th>Violation / Reason</th>
              <th>Date</th>
              <th>Fine Amount</th>
              <th>Black Marks</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${fines.length === 0 ? `
              <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--success-solid); font-weight:700;">🌟 Clean Record! No disciplinary fines or black marks registered.</td></tr>
            ` : fines.map(f => {
              const s = students.find(item => item.id === f.student_id) || { full_name: 'Child' };
              return `
                <tr>
                  <td><strong>${s.full_name}</strong></td>
                  <td>${f.reason}</td>
                  <td>${f.issue_date || '—'}</td>
                  <td><strong style="color:var(--danger-solid);">₹${f.amount}</strong></td>
                  <td><span class="badge badge-purple">${f.black_marks || 0} Marks</span></td>
                  <td><span class="badge ${f.status === 'paid' ? 'badge-success' : 'badge-danger'}">${f.status || 'Pending'}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderNotices(notices) {
    const parentNotices = notices.filter(n => !n.audience || n.audience === 'all' || n.audience === 'parents');
    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>Hostel & School Announcements</h2>
          <p>Official broadcasts from the Thaiba Public School Warden Office</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:1.25rem;">
        ${parentNotices.length === 0 ? `
          <div style="grid-column:1 / -1; text-align:center; padding:3rem; background:var(--bg-surface-secondary); border-radius:16px;">
            No announcements published currently.
          </div>
        ` : parentNotices.map(n => `
          <div class="card" style="border-radius:16px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.04);">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
              <h3 style="font-size:0.95rem; margin:0;">${n.title}</h3>
              <span class="badge ${n.priority === 'urgent' ? 'badge-danger' : (n.priority === 'high' ? 'badge-warning' : 'badge-primary')}">${n.priority || 'Normal'}</span>
            </div>
            <div class="card-body" style="padding:1rem; font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
              <p style="margin:0 0 0.75rem 0;">${n.content}</p>
              <div style="font-size:0.75rem; color:var(--text-muted); border-top:1px solid var(--border-subtle); padding-top:0.5rem; display:flex; justify-content:space-between;">
                <span>By ${n.author_name || 'Warden Office'}</span>
                <span>${n.published_date || ''}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async submitLeaveRequest() {
    const studentId = document.getElementById('pl-student')?.value;
    const leaveType = document.getElementById('pl-type')?.value;
    const depDate = document.getElementById('pl-dep-date')?.value;
    const depTime = document.getElementById('pl-dep-time')?.value;
    const retDate = document.getElementById('pl-ret-date')?.value;
    const retTime = document.getElementById('pl-ret-time')?.value;
    const reason = document.getElementById('pl-reason')?.value;

    if (!studentId || !depDate || !retDate || !reason) {
      alert('Please fill in all mandatory fields.');
      return;
    }

    try {
      const student = this.myStudents.find(s => s.id === studentId);
      const leaveRecord = {
        id: 'lv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        leave_code: 'REQ-' + String(Math.floor(1000 + Math.random() * 9000)),
        leave_type: leaveType,
        leaving_date: depDate,
        leaving_time: depTime,
        expected_return_date: retDate,
        expected_return_time: retTime,
        reason: reason,
        status: 'pending',
        parent_id: this.currentUser.id,
        parent_name: this.currentUser.full_name,
        parent_phone: this.currentUser.phone,
        created_by: this.currentUser.id,
        created_at: new Date().toISOString()
      };

      await window.db.insertRecord('leaves', leaveRecord);
      await window.db.insertRecord('leave_students', {
        leave_id: leaveRecord.id,
        student_id: studentId,
        is_returned: false,
        created_at: new Date().toISOString()
      });

      // Notify Warden
      await window.db.insertRecord('notifications', {
        recipient_role: 'warden',
        title: 'New Parent Leave Request',
        message: `${this.currentUser.full_name} submitted a leave request for ${student ? student.full_name : 'their child'}.`,
        type: 'leave_request',
        related_id: leaveRecord.id,
        is_read: false,
        created_at: new Date().toISOString()
      });

      alert('Leave application submitted to the Hostel Warden! You can check the approval status in the "Leave Status" tab.');
      this.setTab('leave_status');
    } catch (err) {
      alert('Failed to submit leave request: ' + err.message);
    }
  }
}

window.Parent = new ParentPortal();
window.addEventListener('DOMContentLoaded', () => window.Parent.init());
