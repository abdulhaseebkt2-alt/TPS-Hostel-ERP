/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Discipline View: Conduct Register, Black Marks Ledger, Fine Slips, Incident Logging
 */

class DisciplineView {
  constructor() {
    this.activeTab = 'incidents'; // 'incidents', 'fines', 'black_marks'
  }

  async render() {
    const incidents = await window.DisciplineService.getAllIncidents();
    const fines = await window.DisciplineService.getAllFines();
    const blackMarks = await window.DisciplineService.getAllBlackMarks();
    const students = await window.StudentService.getAllStudents();

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Student Discipline & Conduct Register
          </h2>
          <p>Official record of violations, black marks, property damage, and printable fine slips</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="App.openIncidentModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Log New Incident / Violation
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tab-nav">
        <button class="tab-btn ${this.activeTab === 'incidents' ? 'active' : ''}" onclick="App.setDisciplineTab('incidents')">
          Discipline Incidents (${incidents.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'fines' ? 'active' : ''}" onclick="App.setDisciplineTab('fines')">
          Fines & Penalties (${fines.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'black_marks' ? 'active' : ''}" onclick="App.setDisciplineTab('black_marks')">
          Black Marks Ledger (${blackMarks.length})
        </button>
      </div>

      ${this.activeTab === 'incidents' ? this.renderIncidentsTable(incidents, students) : ''}
      ${this.activeTab === 'fines' ? this.renderFinesTable(fines, students) : ''}
      ${this.activeTab === 'black_marks' ? this.renderBlackMarksTable(blackMarks, students) : ''}
    `;
  }

  renderIncidentsTable(incidents, students) {
    const defaultAvatar = (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '');

    return `
      <div class="card">
        <div class="card-header">
          <h3>Incident Logs</h3>
        </div>
        <div class="card-body" style="padding:0;">
          ${incidents.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h4>No Discipline Incidents Recorded</h4>
              <p>No student misconduct or rule violations are currently on file.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Incident No</th>
                    <th>Student</th>
                    <th>Category & Details</th>
                    <th>Date & Time</th>
                    <th>Severity</th>
                    <th>Penalty</th>
                    <th>Parent Informed</th>
                    <th>Action Taken</th>
                    <th style="text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${incidents.map(inc => {
                    const student = students.find(s => s.id === inc.student_id);
                    const photo = (student && student.photo_url) ? student.photo_url : defaultAvatar;
                    const dateDisplay = inc.incident_date || 'Recent';
                    const timeDisplay = inc.incident_time || '';
                    return `
                      <tr>
                        <td><span style="font-weight:700; font-family:monospace;">${inc.incident_no}</span></td>
                        <td>
                          <div class="table-user-cell">
                            <img src="${photo}" class="table-avatar" alt="Photo" onerror="this.src='${defaultAvatar}'">
                            <div>
                              <div class="table-user-name">${student ? student.full_name : 'Unknown Student'}</div>
                              <div class="table-user-sub">ID: ${student ? student.admission_no : '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="font-weight:600;">${inc.category || 'Violation'}</div>
                          <div style="font-size:0.78rem; color:var(--text-muted);">${inc.description || '—'}</div>
                        </td>
                        <td>${dateDisplay} <span style="font-size:0.75rem; color:var(--text-muted);">${timeDisplay}</span></td>
                        <td>
                          <span class="badge ${inc.severity === 'critical' || inc.severity === 'severe' ? 'badge-danger' : 'badge-warning'}">
                            ${inc.severity || 'moderate'}
                          </span>
                        </td>
                        <td>
                          <div><strong>${inc.black_marks || 0}</strong> Black Mark(s)</div>
                          ${inc.fine_amount > 0 ? `<div style="font-size:0.78rem; color:var(--danger-solid); font-weight:700;">₹${inc.fine_amount} Fine</div>` : ''}
                        </td>
                        <td>
                          <span class="badge ${inc.parent_informed ? 'badge-success' : 'badge-neutral'}">
                            ${inc.parent_informed ? '✓ Yes' : 'Pending'}
                          </span>
                        </td>
                        <td style="font-size:0.85rem;">${inc.action_taken || 'Under Review'}</td>
                        <td style="text-align:right; white-space:nowrap;">
                          <button class="btn btn-sm btn-outline-danger" onclick="App.confirmDeleteIncident('${inc.id}', '${inc.incident_no}')" title="Delete Incident Record">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:2px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Delete
                          </button>
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

  renderFinesTable(fines, students) {
    const defaultAvatar = (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '');

    return `
      <div class="card">
        <div class="card-header">
          <h3>Fines & Payment Register</h3>
        </div>
        <div class="card-body" style="padding:0;">
          ${fines.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              </div>
              <h4>No Fines Issued</h4>
              <p>All student accounts are currently clear of penalties.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Fine No</th>
                    <th>Student</th>
                    <th>Category & Reason</th>
                    <th>Late Days</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style="text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${fines.map(f => {
                    const student = students.find(s => s.id === f.student_id);
                    const photo = (student && student.photo_url) ? student.photo_url : defaultAvatar;
                    return `
                      <tr>
                        <td><span style="font-weight:700; font-family:monospace;">${f.fine_no}</span></td>
                        <td>
                          <div class="table-user-cell">
                            <img src="${photo}" class="table-avatar" alt="Photo" onerror="this.src='${defaultAvatar}'">
                            <div>
                              <div class="table-user-name">${student ? student.full_name : 'Unknown Student'}</div>
                              <div class="table-user-sub">ID: ${student ? student.admission_no : '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="font-weight:600;">${f.category_name || 'Fine'}</div>
                          <div style="font-size:0.78rem; color:var(--text-muted);">${f.reason || '—'}</div>
                        </td>
                        <td>${f.late_days > 0 ? `${f.late_days} Days Late` : '—'}</td>
                        <td><span style="font-weight:800; font-size:1.05rem; color:var(--danger-text);">₹${f.amount}</span></td>
                        <td>
                          <span class="badge ${f.status === 'paid' ? 'badge-success' : 'badge-danger'}">
                            ${f.status}
                          </span>
                        </td>
                        <td style="text-align:right; white-space:nowrap;">
                          <div style="display:inline-flex; gap:0.35rem; align-items:center;">
                            <button class="btn btn-sm btn-outline-primary" onclick="App.printFineSlip('${f.id}')">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                              Fine Slip
                            </button>
                            ${f.status === 'pending' ? `
                              <button class="btn btn-sm btn-primary" onclick="App.markFinePaid('${f.id}')">
                                Mark Paid
                              </button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline-danger" onclick="App.confirmDeleteFine('${f.id}', '${f.fine_no}')" title="Delete Fine Record">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              Delete
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

  renderBlackMarksTable(blackMarks, students) {
    const defaultAvatar = (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_AVATAR : '');

    return `
      <div class="card">
        <div class="card-header">
          <h3>Black Mark Ledger</h3>
        </div>
        <div class="card-body" style="padding:0;">
          ${blackMarks.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h4>No Black Marks Issued</h4>
              <p>Student conduct record is clear.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Marks Count</th>
                    <th>Reason</th>
                    <th>Issued By</th>
                    <th>Date</th>
                    <th style="text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${blackMarks.map(b => {
                    const student = students.find(s => s.id === b.student_id);
                    const photo = (student && student.photo_url) ? student.photo_url : defaultAvatar;
                    return `
                      <tr>
                        <td>
                          <div class="table-user-cell">
                            <img src="${photo}" class="table-avatar" alt="Photo" onerror="this.src='${defaultAvatar}'">
                            <div>
                              <div class="table-user-name">${student ? student.full_name : 'Unknown Student'}</div>
                              <div class="table-user-sub">${student ? student.admission_no : '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td><span class="badge badge-danger">● ${b.marks_count} Mark(s)</span></td>
                        <td>${b.reason || '—'}</td>
                        <td>${b.issued_by || 'Staff'}</td>
                        <td>${b.issued_date || '—'}</td>
                        <td style="text-align:right; white-space:nowrap;">
                          <button class="btn btn-sm btn-outline-danger" onclick="App.confirmDeleteBlackMark('${b.id}', '${student ? student.full_name : 'Student'}')" title="Delete Black Mark">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:2px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Delete
                          </button>
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

window.DisciplineView = new DisciplineView();
