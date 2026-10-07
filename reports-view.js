/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Central Report Center: Aggregated Analytics, Export to CSV / Excel, Printable Registers
 */

class ReportsView {
  constructor() {
    this.activeReport = 'attendance'; // 'attendance', 'leave', 'discipline', 'hostel', 'teachers'
  }

  async render() {
    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Central Institutional Report Center
          </h2>
          <p>Exportable reports for attendance rates, leave compliance, student conduct, bed occupancy, and teacher records</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="App.exportCurrentReportCSV()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export to CSV
          </button>
          <button class="btn btn-primary btn-sm" onclick="App.exportCurrentReportExcel()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            Export to Excel
          </button>
          <button class="btn btn-outline-primary btn-sm" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Report
          </button>
        </div>
      </div>

      <!-- Report Category Tabs -->
      <div class="tab-nav">
        <button class="tab-btn ${this.activeReport === 'attendance' ? 'active' : ''}" onclick="App.setReportCategory('attendance')">
          Monthly Attendance Register
        </button>
        <button class="tab-btn ${this.activeReport === 'leave' ? 'active' : ''}" onclick="App.setReportCategory('leave')">
          Leave & Late Returns
        </button>
        <button class="tab-btn ${this.activeReport === 'discipline' ? 'active' : ''}" onclick="App.setReportCategory('discipline')">
          Discipline & Fines Summary
        </button>
        <button class="tab-btn ${this.activeReport === 'hostel' ? 'active' : ''}" onclick="App.setReportCategory('hostel')">
          Hostel & Bed Occupancy
        </button>
        <button class="tab-btn ${this.activeReport === 'teachers' ? 'active' : ''}" onclick="App.setReportCategory('teachers')">
          Teacher Attendance & Timetables
        </button>
      </div>

      <div id="report-table-container">
        ${await this.renderActiveReportTable()}
      </div>
    `;
  }

  async renderActiveReportTable() {
    if (this.activeReport === 'attendance') {
      const data = await window.ReportService.getMonthlyAttendanceReport('current');
      return `
        <div class="card">
          <div class="card-header">
            <h3>Monthly Attendance Percentage Register</h3>
          </div>
          <div class="card-body" style="padding:0;">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID Number</th>
                    <th>Student Name</th>
                    <th>School Class</th>
                    <th>Total Sessions</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Leave / Excused</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.map(d => `
                    <tr>
                      <td><span style="font-weight:700; font-family:monospace;">${d.admission_no}</span></td>
                      <td style="font-weight:600;">${d.full_name}</td>
                      <td>${d.school_class}</td>
                      <td>${d.total_classes}</td>
                      <td><span style="color:var(--success-solid); font-weight:700;">${d.present}</span></td>
                      <td><span style="color:var(--danger-solid); font-weight:700;">${d.absent}</span></td>
                      <td>${d.leave}</td>
                      <td>
                        <span class="badge ${parseInt(d.percentage) >= 80 ? 'badge-success' : 'badge-warning'}">
                          ${d.percentage}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeReport === 'leave') {
      const leaves = await window.LeaveService.getAllLeaves();
      return `
        <div class="card">
          <div class="card-header"><h3>Leave Compliance & Late Return Ledger</h3></div>
          <div class="card-body" style="padding:0;">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr><th>Leave Code</th><th>Type</th><th>Departure</th><th>Expected Return</th><th>Total Students</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${leaves.map(l => `
                    <tr>
                      <td style="font-weight:700; font-family:monospace;">${l.leave_code}</td>
                      <td style="text-transform:capitalize;">${l.leave_type.replace('_', ' ')}</td>
                      <td>${l.leaving_date} ${l.leaving_time}</td>
                      <td>${l.expected_return_date} ${l.expected_return_time}</td>
                      <td>${l.total_students || 1}</td>
                      <td><span class="badge badge-neutral">${l.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else {
      const fines = await window.DisciplineService.getAllFines();
      return `
        <div class="card">
          <div class="card-header"><h3>Discipline & Fines Issued Report</h3></div>
          <div class="card-body" style="padding:0;">
            <div class="table-responsive">
              <table class="data-table">
                <thead><tr><th>Fine No</th><th>Category</th><th>Reason</th><th>Late Days</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  ${fines.map(f => `
                    <tr>
                      <td style="font-weight:700; font-family:monospace;">${f.fine_no}</td>
                      <td>${f.category_name}</td>
                      <td>${f.reason}</td>
                      <td>${f.late_days || 0}</td>
                      <td style="font-weight:700; color:var(--danger-text);">₹${f.amount}</td>
                      <td><span class="badge ${f.status === 'paid' ? 'badge-success' : 'badge-danger'}">${f.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }
  }
}

window.ReportsView = new ReportsView();
