/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Notices View: Notice Board, Announcements, Priority Tags, Audience Scoping
 */

class NoticesView {
  async render() {
    const notices = await db.getTable('notices');

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            Hostel Notice Board & Announcements
          </h2>
          <p>Official announcements, examination coaching reminders, and vacation schedules</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="App.openCreateNoticeModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Publish New Notice
          </button>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${notices.map(n => `
          <div class="card" style="border-left: 5px solid ${n.priority === 'high' ? 'var(--danger-solid)' : 'var(--primary-700)'};">
            <div class="card-header">
              <div style="display:flex; align-items:center; gap:0.65rem;">
                <h3>${n.title}</h3>
                ${n.is_pinned ? '<span class="badge badge-warning"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-top; margin-right:3px;"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>Pinned</span>' : ''}
                <span class="badge ${n.priority === 'high' ? 'badge-danger' : 'badge-neutral'}">${n.priority}</span>
              </div>
              <div style="font-size:0.8rem; color:var(--text-muted);">
                Published: <strong>${n.published_date}</strong>
              </div>
            </div>
            <div class="card-body">
              <p style="font-size:0.92rem; line-height:1.6; color:var(--text-primary); white-space:pre-line;">
                ${n.content}
              </p>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding-top:0.75rem; border-top:1px dashed var(--border-subtle); font-size:0.8rem; color:var(--text-muted);">
                <div>Audience: <strong style="text-transform:capitalize;">${n.audience || 'All'}</strong></div>
                <div>Posted By: <strong>${n.author_name || 'Admin'}</strong></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

window.NoticesView = new NoticesView();
