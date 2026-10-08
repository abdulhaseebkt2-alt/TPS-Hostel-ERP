/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Dedicated Hostel Warden Portal Controller & View Engine
 */

class WardenPortal {
  constructor() {
    this.activeTab = 'leave_requests';
    this.currentUser = null;
  }

  async init() {
    this.currentUser = window.Auth.requireAuth(['warden', 'admin', 'super_admin']);
    if (!this.currentUser) return;

    this.renderHeader();
    await this.render();
  }

  renderHeader() {
    const user = this.currentUser;
    const nameEl = document.getElementById('warden-user-name');
    const roleEl = document.getElementById('warden-user-role');
    const avatarEl = document.getElementById('warden-user-avatar');

    if (nameEl) nameEl.textContent = user.full_name || 'Hostel Warden';
    if (roleEl) roleEl.textContent = 'Hostel Warden • Residential In-Charge';
    if (avatarEl) avatarEl.src = user.avatar_url || CONFIG.DEFAULT_MALE_TEACHER;
  }

  setTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.warden-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this.render();
  }

  async render() {
    const container = document.getElementById('warden-view-container');
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--primary-700); font-weight:600;">Loading Warden Portal...</div>`;

    try {
      const [allStudents, allLeaves, leaveStudents, outsideEntries, fineRecords] = await Promise.all([
        window.db.getTable('students'),
        window.db.getTable('leaves'),
        window.db.getTable('leave_students'),
        window.HostelService ? window.HostelService.getCurrentlyOutsideStudents() : [],
        window.db.getTable('fines')
      ]);

      // Pending parent leave requests (leaves with status === 'pending')
      const pendingParentRequests = allLeaves.filter(l => l.status === 'pending');
      const activeOutsideCount = outsideEntries.length;

      let contentHtml = '';

      if (this.activeTab === 'leave_requests') {
        contentHtml = this.renderParentLeaveRequests(pendingParentRequests, allStudents, leaveStudents);
      } else if (this.activeTab === 'outside_tracker') {
        contentHtml = this.renderOutsideStudentsTracker(outsideEntries, allStudents, allLeaves, leaveStudents);
      } else if (this.activeTab === 'issue_leave') {
        contentHtml = this.renderIssueLeaveSection(allStudents);
      } else if (this.activeTab === 'record_arrival') {
        contentHtml = this.renderRecordArrivalSection(allLeaves, leaveStudents, allStudents);
      } else if (this.activeTab === 'discipline') {
        contentHtml = this.renderDisciplineLoggingSection(allStudents, fineRecords);
      }

      container.innerHTML = contentHtml;
    } catch (err) {
      container.innerHTML = `<div class="status-alert-banner danger">Failed to load portal view: ${err.message}</div>`;
    }
  }

  renderParentLeaveRequests(pendingLeaves, students, leaveStudents) {
    return `
      <div class="page-header" style="margin-bottom: 1.25rem;">
        <div class="page-title-group">
          <h2>Parent Leave Requests Queue</h2>
          <p>Review and approve or reject leave/vacation applications submitted by parents</p>
        </div>
        <div class="page-actions">
          <span class="badge ${pendingLeaves.length > 0 ? 'badge-warning' : 'badge-success'}" style="font-size:0.85rem; padding:6px 12px;">
            ${pendingLeaves.length} Pending Application(s)
          </span>
        </div>
      </div>

      ${pendingLeaves.length === 0 ? `
        <div style="background:var(--bg-surface-secondary); border:1px solid var(--border-color); border-radius:16px; padding:3.5rem 1.5rem; text-align:center;">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">🎉</div>
          <h4 style="color:var(--text-primary); margin:0 0 4px 0;">No Pending Parent Leave Requests</h4>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">All parent applications have been reviewed and resolved.</p>
        </div>
      ` : `
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:1.25rem;">
          ${pendingLeaves.map(l => {
            const lStudents = leaveStudents.filter(ls => ls.leave_id === l.id);
            const studentObjs = lStudents.map(ls => students.find(s => s.id === ls.student_id)).filter(Boolean);
            const student = studentObjs[0] || { full_name: 'Student', admission_no: '', school_class: '' };

            return `
              <div class="card" style="box-shadow:0 4px 14px rgba(0,0,0,0.05); border-radius:18px; overflow:hidden; border:1px solid var(--border-color);">
                <div style="background:linear-gradient(135deg, rgba(217,119,6,0.12), rgba(217,119,6,0.04)); padding:1rem 1.25rem; border-bottom:1px solid rgba(217,119,6,0.2); display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <span class="badge badge-warning" style="font-weight:700;">● Pending Parent Request</span>
                    <div style="font-family:monospace; font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Pass: ${l.leave_code || 'REQ'}</div>
                  </div>
                  <div style="font-size:0.78rem; font-weight:700; color:var(--primary-700);">${l.leave_type ? l.leave_type.replace('_', ' ').toUpperCase() : 'LEAVE'}</div>
                </div>

                <div class="card-body" style="padding:1.25rem;">
                  <div style="display:flex; align-items:center; gap:0.85rem; margin-bottom:1rem;">
                    <img src="${CONFIG.getStudentPhoto(student)}" style="width:52px; height:52px; border-radius:50%; object-fit:cover; border:2px solid var(--primary-600);" alt="${student.full_name}">
                    <div>
                      <strong style="font-size:1.05rem; color:var(--text-primary);">${student.full_name}</strong>
                      <div style="font-size:0.8rem; color:var(--text-muted);">${student.admission_no} • Class ${student.school_class}</div>
                      <div style="font-size:0.76rem; color:var(--primary-700);">Parent: <strong>${l.parent_name || student.father_name || 'Registered Parent'}</strong> (${l.parent_phone || student.father_phone || '—'})</div>
                    </div>
                  </div>

                  <div style="background:var(--bg-surface-secondary); padding:0.85rem; border-radius:12px; font-size:0.84rem; line-height:1.6; margin-bottom:1rem; border:1px solid var(--border-subtle);">
                    <div><strong>Reason:</strong> ${l.reason || 'Family visit'}</div>
                    <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:0.8rem;">
                      <span>Departure: <strong>${l.leaving_date} ${l.leaving_time || ''}</strong></span>
                      <span>Return: <strong style="color:var(--primary-700);">${l.expected_return_date} ${l.expected_return_time || ''}</strong></span>
                    </div>
                  </div>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem;">
                    <button class="btn btn-outline-danger btn-sm" onclick="Warden.rejectParentLeave('${l.id}', '${student.full_name}')" style="font-weight:700; border-radius:10px;">
                      ✕ Reject Request
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="Warden.approveParentLeave('${l.id}', '${student.full_name}')" style="font-weight:700; border-radius:10px;">
                      ✓ Approve Leave Pass
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  }

  renderOutsideStudentsTracker(outsideEntries, students, leaves, leaveStudents) {
    return `
      <div class="page-header" style="margin-bottom: 1.25rem;">
        <div class="page-title-group">
          <h2>Currently Outside Students (Live Roster)</h2>
          <p>Real-time register of hostel residents currently away on approved leave or vacation</p>
        </div>
        <div class="page-actions">
          <span class="badge badge-warning" style="font-size:0.85rem; padding:6px 12px;">
            ${outsideEntries.length} Student(s) Away
          </span>
        </div>
      </div>

      <div class="table-responsive" style="background:var(--bg-card); border-radius:16px; border:1px solid var(--border-color); overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Hostel & Room</th>
              <th>Departure</th>
              <th>Expected Return</th>
              <th>Pass Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${outsideEntries.length === 0 ? `
              <tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">All enrolled hostel students are currently inside campus.</td></tr>
            ` : outsideEntries.map(e => {
              const s = students.find(item => item.id === e.student_id) || { full_name: e.student_name, admission_no: '', school_class: '' };
              return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <img src="${CONFIG.getStudentPhoto(s)}" style="width:34px; height:34px; border-radius:50%; object-fit:cover;" alt="Photo">
                      <div>
                        <strong>${s.full_name}</strong>
                        <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">${s.admission_no}</div>
                      </div>
                    </div>
                  </td>
                  <td><strong>${s.school_class || '—'}</strong></td>
                  <td>${e.hostel_name || 'Hostel'}</td>
                  <td>${e.exit_date} ${e.exit_time || ''}</td>
                  <td><strong style="color:var(--primary-700);">${e.expected_return_date} ${e.expected_return_time || ''}</strong></td>
                  <td>${e.purpose || 'Leave'}</td>
                  <td>
                    <button class="btn btn-primary btn-xs" onclick="Warden.openRecordArrivalModal('${e.student_id}', '${s.full_name.replace(/'/g, "\\'")}')" style="border-radius:8px; font-weight:700;">
                      Record Arrival
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderIssueLeaveSection(students) {
    const today = new Date().toISOString().split('T')[0];
    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>Apply & Issue Hostel Leave Pass</h2>
          <p>Generate authorized individual or batch leave passes for resident students</p>
        </div>
      </div>

      <div class="card" style="max-width:760px; margin:0 auto; border-radius:20px; box-shadow:0 8px 25px rgba(0,0,0,0.06);">
        <div class="card-body" style="padding:1.75rem;">
          <form id="warden-leave-form" onsubmit="event.preventDefault(); Warden.submitIssueLeave();">
            <div class="form-grid">
              <div class="form-group" style="grid-column:1 / -1;">
                <label class="form-label" style="font-weight:700;">Select Student <span class="required">*</span></label>
                <select class="form-control" id="w-leave-student" required style="height:44px; border-radius:12px; font-weight:600;">
                  <option value="">-- Choose Resident Student --</option>
                  ${students.map(s => `<option value="${s.id}">${s.full_name} (${s.admission_no} - Class ${s.school_class})</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:700;">Leave Type <span class="required">*</span></label>
                <select class="form-control" id="w-leave-type" style="height:44px; border-radius:12px;">
                  <option value="hostel_leave">Weekend Home Visit</option>
                  <option value="vacation">Term Vacation</option>
                  <option value="medical_leave">Medical Emergency</option>
                  <option value="emergency">Family Function</option>
                  <option value="academic">Special Academic Leave</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:700;">Late Penalty Rate / Day (₹)</label>
                <input type="number" class="form-control" id="w-leave-fine-rate" value="100" min="0" step="10" style="height:44px; border-radius:12px; font-family:monospace; font-weight:700;">
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:700;">Departure Date & Time <span class="required">*</span></label>
                <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:0.5rem;">
                  <input type="date" class="form-control" id="w-leave-dep-date" value="${today}" required style="height:44px; border-radius:12px;">
                  <input type="time" class="form-control" id="w-leave-dep-time" value="16:00" required style="height:44px; border-radius:12px;">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:700;">Expected Return Date & Time <span class="required">*</span></label>
                <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:0.5rem;">
                  <input type="date" class="form-control" id="w-leave-ret-date" value="${today}" required style="height:44px; border-radius:12px;">
                  <input type="time" class="form-control" id="w-leave-ret-time" value="17:00" required style="height:44px; border-radius:12px;">
                </div>
              </div>

              <div class="form-group" style="grid-column:1 / -1;">
                <label class="form-label" style="font-weight:700;">Reason for Leave <span class="required">*</span></label>
                <input type="text" class="form-control" id="w-leave-reason" placeholder="e.g. Attending sister's wedding / Medical checkup" required style="height:44px; border-radius:12px;">
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; height:46px; border-radius:12px; font-weight:800; font-size:1rem; margin-top:1.25rem;">
              Issue Official Leave Pass
            </button>
          </form>
        </div>
      </div>
    `;
  }

  renderRecordArrivalSection(leaves, leaveStudents, students) {
    const unreturnedStudents = [];
    const activeLeaves = leaves.filter(l => l.status !== 'closed' && l.status !== 'returned');

    for (const l of activeLeaves) {
      const items = leaveStudents.filter(ls => ls.leave_id === l.id && !ls.is_returned);
      for (const item of items) {
        const s = students.find(st => st.id === item.student_id);
        if (s) {
          unreturnedStudents.push({
            leaveStudentId: item.id,
            leaveId: l.id,
            leave: l,
            student: s
          });
        }
      }
    }

    const today = new Date().toISOString().split('T')[0];

    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>Record Returning Student Arrival</h2>
          <p>Check in students returning to hostel and automatically calculate late arrival fines and black marks</p>
        </div>
      </div>

      <div class="card" style="max-width:760px; margin:0 auto; border-radius:20px; box-shadow:0 8px 25px rgba(0,0,0,0.06);">
        <div class="card-body" style="padding:1.75rem;">
          ${unreturnedStudents.length === 0 ? `
            <div style="text-align:center; padding:2.5rem 1rem; color:var(--text-muted);">
              <div style="font-size:2rem; margin-bottom:0.5rem;">✓</div>
              <strong>No Unreturned Students Found</strong>
              <p style="font-size:0.85rem; margin-top:4px;">All issued leave passes have already been checked back into the hostel.</p>
            </div>
          ` : `
            <form id="warden-arrival-form" onsubmit="event.preventDefault(); Warden.submitRecordArrival();">
              <div class="form-group">
                <label class="form-label" style="font-weight:700;">Select Returning Student <span class="required">*</span></label>
                <select class="form-control" id="arr-student-select" required style="height:44px; border-radius:12px; font-weight:600;" onchange="Warden.onArrivalStudentChange(this.value)">
                  <option value="">-- Choose Returning Student --</option>
                  ${unreturnedStudents.map(us => `
                    <option value="${us.leaveStudentId}" data-ret-date="${us.leave.expected_return_date}" data-fine-rate="${us.leave.fine_per_day || 100}">
                      ${us.student.full_name} (${us.student.admission_no} • Class ${us.student.school_class} • Expected: ${us.leave.expected_return_date})
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-grid" style="margin-top:1rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight:700;">Actual Return Date <span class="required">*</span></label>
                  <input type="date" class="form-control" id="arr-actual-date" value="${today}" required style="height:44px; border-radius:12px;" onchange="Warden.calculateArrivalLateFee()">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-weight:700;">Actual Return Time <span class="required">*</span></label>
                  <input type="time" class="form-control" id="arr-actual-time" value="16:00" required style="height:44px; border-radius:12px;">
                </div>
              </div>

              <!-- Live Late Fee Calculator Banner -->
              <div id="arr-fee-preview" style="background:var(--bg-surface-secondary); padding:0.9rem 1.15rem; border-radius:14px; border:1px solid var(--border-color); margin:1rem 0; display:none;">
                <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">Arrival Assessment:</div>
                <div id="arr-fee-text" style="font-size:0.82rem; color:var(--text-secondary);">On time: ₹0 penalty.</div>
              </div>

              <div class="form-group" style="margin-top:0.75rem;">
                <label class="form-label" style="font-weight:700;">Remarks / Luggage & Health Inspection</label>
                <input type="text" class="form-control" id="arr-remarks" placeholder="e.g. Returned in good health, luggage checked" value="Reported in good condition" style="height:44px; border-radius:12px;">
              </div>

              <button type="submit" class="btn btn-primary" style="width:100%; height:46px; border-radius:12px; font-weight:800; font-size:1rem; margin-top:1.25rem;">
                Confirm Student Arrival
              </button>
            </form>
          `}
        </div>
      </div>
    `;
  }

  renderDisciplineLoggingSection(students, fines) {
    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>Hostel Conduct & Fine Register</h2>
          <p>Issue disciplinary warnings, black marks, or fines for residential violations</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:1.5rem;">
        <div class="card" style="border-radius:18px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
          <div class="card-header"><h3 style="font-size:1rem;">Issue Disciplinary Fine / Black Mark</h3></div>
          <div class="card-body" style="padding:1.25rem;">
            <form id="warden-discipline-form" onsubmit="event.preventDefault(); Warden.submitDiscipline();">
              <div class="form-group">
                <label class="form-label" style="font-weight:700;">Student <span class="required">*</span></label>
                <select class="form-control" id="disc-student" required style="height:40px; border-radius:10px;">
                  <option value="">-- Choose Student --</option>
                  ${students.map(s => `<option value="${s.id}">${s.full_name} (${s.admission_no})</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:700;">Violation Category <span class="required">*</span></label>
                <select class="form-control" id="disc-cat" required style="height:40px; border-radius:10px;">
                  <option value="Unauthorized Hostel Exit">Unauthorized Hostel Exit</option>
                  <option value="Property & Furniture Damage">Property & Furniture Damage</option>
                  <option value="Late Return After Expiry">Late Return After Expiry</option>
                  <option value="Prohibited Electronic Device">Prohibited Electronic Device</option>
                  <option value="Fighting / Misconduct">Fighting / Misconduct</option>
                  <option value="General Hostel Rule Breach">General Hostel Rule Breach</option>
                </select>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" style="font-weight:700;">Fine (₹)</label>
                  <input type="number" class="form-control" id="disc-fine" value="100" min="0" step="50" style="height:40px; border-radius:10px; font-family:monospace;">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-weight:700;">Black Marks (0-5)</label>
                  <input type="number" class="form-control" id="disc-marks" value="1" min="0" max="5" style="height:40px; border-radius:10px;">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight:700;">Incident Description <span class="required">*</span></label>
                <textarea class="form-control" id="disc-reason" rows="3" required placeholder="Describe location, witness or circumstance..." style="border-radius:10px;"></textarea>
              </div>

              <button type="submit" class="btn btn-danger" style="width:100%; height:42px; border-radius:10px; font-weight:700; margin-top:0.75rem;">
                Register Violation
              </button>
            </form>
          </div>
        </div>

        <div class="card" style="border-radius:18px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
          <div class="card-header"><h3 style="font-size:1rem;">Recent Hostel Fines Ledger</h3></div>
          <div class="card-body" style="padding:0;">
            <div class="table-responsive" style="max-height:420px; overflow-y:auto;">
              <table class="data-table" style="font-size:0.84rem;">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Violation</th>
                    <th>Fine</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${fines.length === 0 ? `
                    <tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No recorded fines.</td></tr>
                  ` : fines.slice(0, 20).map(f => {
                    const s = students.find(item => item.id === f.student_id) || { full_name: 'Student' };
                    return `
                      <tr>
                        <td><strong>${s.full_name}</strong></td>
                        <td>${f.reason}</td>
                        <td><strong style="color:var(--danger-solid);">₹${f.amount}</strong></td>
                        <td><span class="badge ${f.status === 'paid' ? 'badge-success' : 'badge-danger'}">${f.status || 'Pending'}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async approveParentLeave(leaveId, studentName) {
    if (!confirm(`Approve leave pass for ${studentName}?`)) return;
    try {
      await window.LeaveService.approveLeave(leaveId);
      alert(`Leave pass approved for ${studentName}!`);
      this.render();
    } catch (err) {
      alert('Failed to approve leave: ' + err.message);
    }
  }

  async rejectParentLeave(leaveId, studentName) {
    const reason = prompt(`Enter rejection reason for ${studentName}:`, 'Hostel schedule / Exams scheduled');
    if (reason === null) return;
    try {
      await window.LeaveService.rejectLeave(leaveId, reason);
      alert(`Leave request rejected.`);
      this.render();
    } catch (err) {
      alert('Failed to reject leave: ' + err.message);
    }
  }

  async submitIssueLeave() {
    const studentId = document.getElementById('w-leave-student')?.value;
    const leaveType = document.getElementById('w-leave-type')?.value;
    const fineRate = parseFloat(document.getElementById('w-leave-fine-rate')?.value) || 100;
    const depDate = document.getElementById('w-leave-dep-date')?.value;
    const depTime = document.getElementById('w-leave-dep-time')?.value;
    const retDate = document.getElementById('w-leave-ret-date')?.value;
    const retTime = document.getElementById('w-leave-ret-time')?.value;
    const reason = document.getElementById('w-leave-reason')?.value;

    if (!studentId || !depDate || !retDate || !reason) {
      alert('Please fill in all mandatory fields.');
      return;
    }

    try {
      await window.LeaveService.createLeave({
        leave_type: leaveType,
        leaving_date: depDate,
        leaving_time: depTime,
        expected_return_date: retDate,
        expected_return_time: retTime,
        fine_per_day: fineRate,
        reason: reason
      }, [studentId]);

      alert('Leave pass issued successfully!');
      this.setTab('outside_tracker');
    } catch (err) {
      alert('Failed to issue leave: ' + err.message);
    }
  }

  onArrivalStudentChange(val) {
    this.calculateArrivalLateFee();
  }

  calculateArrivalLateFee() {
    const select = document.getElementById('arr-student-select');
    const preview = document.getElementById('arr-fee-preview');
    const text = document.getElementById('arr-fee-text');
    if (!select || !preview || !text) return;

    const opt = select.selectedOptions[0];
    if (!opt || !opt.value) {
      preview.style.display = 'none';
      return;
    }

    const expDateStr = opt.dataset.retDate;
    const fineRate = parseFloat(opt.dataset.fineRate) || 100;
    const actualDateStr = document.getElementById('arr-actual-date')?.value || new Date().toISOString().split('T')[0];

    const exp = new Date(expDateStr);
    const act = new Date(actualDateStr);
    const diffDays = Math.ceil((act - exp) / (1000 * 60 * 60 * 24));

    preview.style.display = 'block';
    if (diffDays > 0) {
      const fine = diffDays * fineRate;
      const marks = diffDays >= 3 ? 2 : 1;
      preview.style.borderColor = 'var(--danger-solid)';
      text.innerHTML = `<span style="color:var(--danger-solid); font-weight:700;">⚠️ ${diffDays} Day(s) Late:</span> Fine of <strong>₹${fine}</strong> and <strong>${marks} black mark(s)</strong> will be registered.`;
    } else {
      preview.style.borderColor = 'var(--success-solid)';
      text.innerHTML = `<span style="color:var(--success-solid); font-weight:700;">✓ Reported on time.</span> 0 fines and 0 penalties.`;
    }
  }

  async submitRecordArrival() {
    const leaveStudentId = document.getElementById('arr-student-select')?.value;
    const date = document.getElementById('arr-actual-date')?.value;
    const time = document.getElementById('arr-actual-time')?.value;
    const remarks = document.getElementById('arr-remarks')?.value || 'Reported back';

    if (!leaveStudentId) {
      alert('Please select a student.');
      return;
    }

    try {
      const res = await window.LeaveService.recordStudentReturn(leaveStudentId, date, time, 'Good', remarks);
      if (res.lateDays > 0) {
        alert(`Arrival recorded: ${res.lateDays} day(s) late. Fine of ₹${res.fineAmount} registered.`);
      } else {
        alert('Student arrival successfully logged on time!');
      }
      this.setTab('outside_tracker');
    } catch (err) {
      alert('Failed to record arrival: ' + err.message);
    }
  }

  async submitDiscipline() {
    const studentId = document.getElementById('disc-student')?.value;
    const cat = document.getElementById('disc-cat')?.value;
    const fine = parseFloat(document.getElementById('disc-fine')?.value) || 0;
    const marks = parseInt(document.getElementById('disc-marks')?.value) || 0;
    const reason = document.getElementById('disc-reason')?.value;

    if (!studentId || !reason) {
      alert('Please select student and write violation reason.');
      return;
    }

    try {
      await window.DisciplineService.recordIncident({
        student_id: studentId,
        category: cat,
        incident_date: new Date().toISOString().split('T')[0],
        fine_amount: fine,
        black_marks: marks,
        description: reason
      });
      alert('Violation logged into conduct ledger.');
      this.render();
    } catch (err) {
      alert('Failed to log violation: ' + err.message);
    }
  }
}

window.Warden = new WardenPortal();
window.addEventListener('DOMContentLoaded', () => window.Warden.init());
