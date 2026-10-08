/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Dedicated Teacher, Usthad & Mentor Portal Engine
 */

class TeacherPortal {
  constructor() {
    this.activeTab = 'attendance';
    this.currentUser = null;
    this.selectedGroupId = null;
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.attendanceState = {};
  }

  async init() {
    this.currentUser = window.Auth.requireAuth(['teacher', 'mentor', 'admin', 'super_admin']);
    if (!this.currentUser) return;

    this.renderHeader();
    await this.render();
  }

  renderHeader() {
    const user = this.currentUser;
    const nameEl = document.getElementById('teacher-user-name');
    const roleEl = document.getElementById('teacher-user-role');
    const avatarEl = document.getElementById('teacher-user-avatar');

    if (nameEl) nameEl.textContent = user.full_name || 'Faculty Member';
    if (roleEl) roleEl.textContent = user.role === 'mentor' ? 'Student Mentor & Guide' : 'Moral & Coaching Faculty';
    if (avatarEl) avatarEl.src = user.avatar_url || CONFIG.DEFAULT_MALE_TEACHER;
  }

  setTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.teacher-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this.render();
  }

  async render() {
    const container = document.getElementById('teacher-view-container');
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--primary-700); font-weight:600;">Loading Faculty Workspace...</div>`;

    try {
      const [allGroups, allStudents, allTimetables] = await Promise.all([
        window.AttendanceService.getClassGroups(),
        window.StudentService.getAllStudents(),
        window.db.getTable('timetables')
      ]);

      // Filter groups for this teacher if linked
      const teacherId = this.currentUser.linked_teacher_id;
      const myGroups = teacherId 
        ? allGroups.filter(g => g.teacher_id === teacherId || g.assistant_teacher_id === teacherId)
        : allGroups;

      if (!this.selectedGroupId && myGroups.length > 0) {
        this.selectedGroupId = myGroups[0].id;
      }

      let contentHtml = '';

      if (this.activeTab === 'attendance') {
        contentHtml = await this.renderAttendanceSheet(myGroups, allStudents);
      } else if (this.activeTab === 'schedule') {
        contentHtml = this.renderScheduleView(allTimetables, myGroups);
      } else if (this.activeTab === 'report_concern') {
        contentHtml = this.renderConcernForm(allStudents);
      }

      container.innerHTML = contentHtml;
    } catch (err) {
      container.innerHTML = `<div class="status-alert-banner danger">Failed to load view: ${err.message}</div>`;
    }
  }

  async renderAttendanceSheet(groups, students) {
    if (groups.length === 0) {
      return `
        <div style="background:var(--bg-surface-secondary); padding:3rem; text-align:center; border-radius:18px; border:1px solid var(--border-color);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">📚</div>
          <h4>No Classrooms Assigned</h4>
          <p style="color:var(--text-muted); font-size:0.88rem;">Contact Super Admin (abdulhaseebkt2@gmail.com) to assign your classroom groups.</p>
        </div>
      `;
    }

    const currentGroup = groups.find(g => g.id === this.selectedGroupId) || groups[0];
    const assignedIds = currentGroup.assigned_student_ids || [];
    const roster = students.filter(s => assignedIds.includes(s.id));

    // Initialize attendance states to 'present' if empty
    if (Object.keys(this.attendanceState).length === 0 || this._lastLoadedGroupId !== currentGroup.id) {
      this.attendanceState = {};
      roster.forEach(s => {
        this.attendanceState[s.id] = 'present';
      });
      this._lastLoadedGroupId = currentGroup.id;
    }

    const presentCount = Object.values(this.attendanceState).filter(st => st === 'present').length;
    const absentCount = Object.values(this.attendanceState).filter(st => st === 'absent').length;
    const leaveCount = Object.values(this.attendanceState).filter(st => st === 'leave').length;

    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>Daily Class Attendance Register</h2>
          <p>Mark attendance for your designated moral sessions and evening coaching groups</p>
        </div>
        <div class="page-actions" style="display:flex; gap:0.5rem; align-items:center;">
          <input type="date" class="form-control" value="${this.selectedDate}" onchange="Teacher.onDateChange(this.value)" style="height:38px; border-radius:10px; font-weight:600;">
          <button class="btn btn-primary btn-sm" onclick="Teacher.submitAttendance()" style="border-radius:10px; font-weight:700; height:38px; padding:0 1.25rem;">
            Submit Attendance
          </button>
        </div>
      </div>

      <!-- Classroom Selection Bar -->
      <div style="display:flex; gap:0.6rem; overflow-x:auto; padding-bottom:0.6rem; margin-bottom:1.25rem;">
        ${groups.map(g => `
          <button class="btn btn-sm ${g.id === currentGroup.id ? 'btn-primary' : 'btn-secondary'}" onclick="Teacher.selectGroup('${g.id}')" style="border-radius:20px; font-weight:700; white-space:nowrap;">
            ${g.group_name} (${g.start_time} - ${g.end_time})
          </button>
        `).join('')}
      </div>

      <!-- Quick Metrics Strip -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:0.75rem; margin-bottom:1.25rem;">
        <div style="background:rgba(5,150,105,0.08); border:1px solid rgba(5,150,105,0.2); padding:0.75rem 1rem; border-radius:12px;">
          <div style="font-size:0.75rem; color:var(--success-solid); font-weight:700;">PRESENT</div>
          <div style="font-size:1.3rem; font-weight:800; color:var(--success-solid);">${presentCount}</div>
        </div>
        <div style="background:rgba(225,29,72,0.08); border:1px solid rgba(225,29,72,0.2); padding:0.75rem 1rem; border-radius:12px;">
          <div style="font-size:0.75rem; color:var(--danger-solid); font-weight:700;">ABSENT</div>
          <div style="font-size:1.3rem; font-weight:800; color:var(--danger-solid);">${absentCount}</div>
        </div>
        <div style="background:rgba(217,119,6,0.08); border:1px solid rgba(217,119,6,0.2); padding:0.75rem 1rem; border-radius:12px;">
          <div style="font-size:0.75rem; color:var(--warning-solid); font-weight:700;">ON LEAVE</div>
          <div style="font-size:1.3rem; font-weight:800; color:var(--warning-solid);">${leaveCount}</div>
        </div>
      </div>

      <!-- Attendance Roster Cards Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
        ${roster.length === 0 ? `
          <div style="grid-column:1 / -1; text-align:center; padding:2.5rem; background:var(--bg-surface-secondary); border-radius:16px;">
            No students currently allocated to ${currentGroup.group_name}.
          </div>
        ` : roster.map(s => {
          const currentStatus = this.attendanceState[s.id] || 'present';
          return `
            <div class="card" style="border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04); border:1px solid var(--border-color); padding:1rem; display:flex; flex-direction:column; justify-content:space-between; gap:0.75rem;">
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <img src="${CONFIG.getStudentPhoto(s)}" style="width:46px; height:46px; border-radius:50%; object-fit:cover; border:2px solid var(--primary-600);" alt="${s.full_name}">
                <div style="flex:1; min-width:0;">
                  <strong style="font-size:0.95rem; color:var(--text-primary); display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${s.full_name}</strong>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${s.admission_no} • Class ${s.school_class}</div>
                </div>
              </div>

              <!-- 3-Way Attendance Button Pill -->
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; background:var(--bg-surface-secondary); padding:4px; border-radius:10px; border:1px solid var(--border-subtle);">
                <button type="button" class="btn btn-xs ${currentStatus === 'present' ? 'btn-success' : 'btn-ghost'}" onclick="Teacher.setStudentStatus('${s.id}', 'present')" style="border-radius:8px; font-weight:700;">
                  Present
                </button>
                <button type="button" class="btn btn-xs ${currentStatus === 'absent' ? 'btn-danger' : 'btn-ghost'}" onclick="Teacher.setStudentStatus('${s.id}', 'absent')" style="border-radius:8px; font-weight:700;">
                  Absent
                </button>
                <button type="button" class="btn btn-xs ${currentStatus === 'leave' ? 'btn-warning' : 'btn-ghost'}" onclick="Teacher.setStudentStatus('${s.id}', 'leave')" style="border-radius:8px; font-weight:700;">
                  Leave
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderScheduleView(timetables, groups) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>My Weekly Teaching Schedule</h2>
          <p>Assigned teaching rooms, time slots, and period details</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1.25rem;">
        ${days.map(d => {
          const daySlots = timetables.filter(t => (t.day || t.day_of_week) === d);
          return `
            <div class="card" style="border-radius:16px; border:1px solid var(--border-color); overflow:hidden;">
              <div style="background:rgba(13,92,58,0.06); padding:0.75rem 1rem; border-bottom:1px solid var(--border-color); font-weight:800; color:var(--primary-800);">
                ${d}
              </div>
              <div class="card-body" style="padding:0.75rem;">
                ${daySlots.length === 0 ? `
                  <div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:1rem 0;">No periods scheduled.</div>
                ` : daySlots.map(s => `
                  <div style="background:var(--bg-surface-secondary); border:1px solid var(--border-subtle); border-radius:10px; padding:0.6rem 0.8rem; margin-bottom:0.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <strong style="font-size:0.85rem; color:var(--primary-700);">${s.period_name || 'Period'}</strong>
                      <span style="font-size:0.75rem; font-family:monospace; color:var(--text-muted);">${s.start_time} - ${s.end_time}</span>
                    </div>
                    <div style="font-size:0.82rem; font-weight:600; color:var(--text-primary); margin-top:2px;">${s.subject || 'Session'}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${s.room_location || s.room_name || 'Hall'}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderConcernForm(students) {
    return `
      <div class="page-header" style="margin-bottom:1.25rem;">
        <div class="page-title-group">
          <h2>Report Student Concern / Progress Note</h2>
          <p>Submit academic progress observations or disciplinary concerns to the Hostel Warden Office</p>
        </div>
      </div>

      <div class="card" style="max-width:680px; margin:0 auto; border-radius:20px; box-shadow:0 6px 20px rgba(0,0,0,0.06);">
        <div class="card-body" style="padding:1.75rem;">
          <form id="teacher-concern-form" onsubmit="event.preventDefault(); Teacher.submitConcern();">
            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Select Student <span class="required">*</span></label>
              <select class="form-control" id="tc-student" required style="height:44px; border-radius:12px;">
                <option value="">-- Choose Student --</option>
                ${students.map(s => `<option value="${s.id}">${s.full_name} (${s.admission_no} - Class ${s.school_class})</option>`).join('')}
              </select>
            </div>

            <div class="form-group" style="margin-top:1rem;">
              <label class="form-label" style="font-weight:700;">Report Type <span class="required">*</span></label>
              <select class="form-control" id="tc-type" style="height:44px; border-radius:12px;">
                <option value="academic_progress">🌟 Academic Progress & Quran Recitation Note</option>
                <option value="class_misconduct">⚠️ Class Misconduct / Lack of Discipline</option>
                <option value="repeated_absence">🚫 Habitual Absence / Chronic Lateness</option>
                <option value="counselling_need">💬 Recommended for Student Mentorship Counselling</option>
              </select>
            </div>

            <div class="form-group" style="margin-top:1rem;">
              <label class="form-label" style="font-weight:700;">Detailed Observation / Complaint <span class="required">*</span></label>
              <textarea class="form-control" id="tc-notes" rows="4" required placeholder="Write specific observations, progress evaluation or disciplinary incident..." style="border-radius:12px;"></textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; height:46px; border-radius:12px; font-weight:800; font-size:1rem; margin-top:1.25rem;">
              Submit Report to Warden & Office
            </button>
          </form>
        </div>
      </div>
    `;
  }

  selectGroup(groupId) {
    this.selectedGroupId = groupId;
    this.attendanceState = {};
    this.render();
  }

  onDateChange(newDate) {
    this.selectedDate = newDate;
    this.render();
  }

  setStudentStatus(studentId, status) {
    this.attendanceState[studentId] = status;
    this.render();
  }

  async submitAttendance() {
    const groupId = this.selectedGroupId;
    const date = this.selectedDate;
    const records = Object.entries(this.attendanceState).map(([sId, st]) => ({
      student_id: sId,
      status: st,
      remarks: ''
    }));

    try {
      await window.AttendanceService.submitAttendanceSession({
        group_id: groupId,
        session_date: date,
        teacher_id: this.currentUser.linked_teacher_id || null
      }, records);

      alert(`Attendance for ${date} recorded successfully!`);
      this.render();
    } catch (err) {
      alert('Failed to submit attendance: ' + err.message);
    }
  }

  async submitConcern() {
    const studentId = document.getElementById('tc-student')?.value;
    const type = document.getElementById('tc-type')?.value;
    const notes = document.getElementById('tc-notes')?.value;

    if (!studentId || !notes) {
      alert('Please select student and enter observation notes.');
      return;
    }

    try {
      await window.db.insertRecord('notifications', {
        recipient_role: 'warden',
        title: `Faculty Report: ${type.replace('_', ' ').toUpperCase()}`,
        message: notes,
        type: 'faculty_concern',
        related_id: studentId,
        author_name: this.currentUser.full_name,
        is_read: false,
        created_at: new Date().toISOString()
      });

      alert('Report successfully submitted to Hostel Warden & Office.');
      document.getElementById('tc-notes').value = '';
    } catch (err) {
      alert('Failed to submit report: ' + err.message);
    }
  }
}

window.Teacher = new TeacherPortal();
window.addEventListener('DOMContentLoaded', () => window.Teacher.init());
