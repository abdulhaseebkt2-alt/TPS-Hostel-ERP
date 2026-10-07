/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Leave & Return View: Batch & Individual Leave Cards, Return Register, Late Fine Calculations
 */

class LeaveView {
  async render() {
    const leaves = await window.LeaveService.getAllLeaves();
    const leaveStudents = await window.LeaveService.getLeaveStudents();
    const students = await window.StudentService.getAllStudents();

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Hostel Leave & Return Management
          </h2>
          <p>Batch vacation cards, individual leave passes, return recording, and automatic date-based fine auditing</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="App.openRecordArrivalModal()" style="display:inline-flex; align-items:center; gap:6px; font-weight:700;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Record Arrival
          </button>
          <button class="btn btn-secondary btn-sm" onclick="App.openLeavePassModal('individual')" style="display:inline-flex; align-items:center; gap:6px; font-weight:700;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Issue Leave Pass
          </button>
        </div>
      </div>

      <!-- Leave Records Table -->
      <div class="card">
        <div class="card-header">
          <h3>Leave Card Register</h3>
        </div>
        <div class="card-body" style="padding:0;">
          ${leaves.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <h4>No Active Leave Records</h4>
              <p>Create a batch or individual leave pass when students depart campus for vacation or home visits.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Leave Code</th>
                    <th>Type & Reason</th>
                    <th>Departure</th>
                    <th>Expected Return</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th style="text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${leaves.map(l => {
                    const lStudents = leaveStudents.filter(ls => ls.leave_id === l.id);
                    const unretCount = lStudents.filter(ls => !ls.is_returned).length;
                    const isOverdue = l.status === 'overdue' || (new Date() > new Date(l.expected_return_date) && l.status === 'active');
                    return `
                      <tr>
                        <td><span style="font-weight:700; font-family:monospace;">${l.leave_code}</span></td>
                        <td>
                          <div style="font-weight:600; text-transform:capitalize;">${l.leave_type.replace('_', ' ')}</div>
                          <div style="font-size:0.78rem; color:var(--text-muted);">${l.reason}</div>
                        </td>
                        <td>${l.leaving_date} <span style="font-size:0.75rem; color:var(--text-muted);">${l.leaving_time}</span></td>
                        <td>
                          <div style="font-weight:600;">${l.expected_return_date}</div>
                          <div style="font-size:0.75rem; color:var(--text-muted);">${l.expected_return_time}</div>
                        </td>
                        <td>
                          <span class="badge badge-neutral">${l.total_students || lStudents.length} Student(s)</span>
                        </td>
                        <td>
                          <span class="badge ${isOverdue ? 'badge-danger' : l.status === 'returned' ? 'badge-success' : 'badge-warning'}">
                            ${isOverdue ? 'Overdue Return' : l.status}
                          </span>
                        </td>
                        <td style="text-align:right;">
                          <div style="display:inline-flex; gap:0.35rem; align-items:center; justify-content:flex-end;">
                            ${unretCount > 0 ? `
                              <button class="btn btn-xs btn-outline-success" onclick="App.openRecordArrivalModal('batch', '${l.id}')" title="Record Arrival for this pass" style="display:inline-flex; align-items:center; gap:4px; font-weight:700; border-radius:var(--radius-full); padding:0.25rem 0.65rem;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                                Arrival (${unretCount})
                              </button>
                            ` : ''}
                            <button class="btn btn-xs btn-outline-primary" onclick="App.openLeaveDetails('${l.id}')" style="border-radius:var(--radius-full); padding:0.25rem 0.65rem;">
                              Details
                            </button>
                            <button class="btn btn-xs btn-secondary" onclick="App.printLeavePass('${l.id}')" style="border-radius:var(--radius-full); padding:0.25rem 0.55rem;">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:2px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>Pass
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

window.LeaveView = new LeaveView();
