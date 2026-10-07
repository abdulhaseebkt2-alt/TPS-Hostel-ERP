/**
 * THAIBA PUBLIC SCHOOL - HOSTEL IRP
 * Settings View: School Branding, Supabase Connection, Attendance Windows, Fine Rules, Audit Logs
 */

class SettingsView {
  async render() {
    const anonKey = localStorage.getItem('tps_supabase_anon_key') || '';
    const auditLogs = await db.getTable('audit_logs');

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            System Settings & Administration
          </h2>
          <p>Configure Supabase credentials, school branding, attendance time limits, and fine rules</p>
        </div>
      </div>

      <!-- Supabase Backend Connection Card -->
      <div class="card">
        <div class="card-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
            Supabase Backend Integration
          </h3>
          <span class="badge ${db.useSupabase ? 'badge-success' : 'badge-neutral'}">
            ${db.useSupabase ? '● Live Supabase Connected' : 'Local Offline Mode'}
          </span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Supabase Project URL</label>
            <input type="text" class="form-control" value="${CONFIG.SUPABASE_URL}" readonly style="background:var(--neutral-100); font-family:monospace;">
          </div>
          <div class="form-group">
            <label class="form-label">Supabase Publishable / Anon Key <span class="required">*</span></label>
            <input type="password" class="form-control" id="settings-anon-key" value="${anonKey}" placeholder="Paste your Supabase anon/publishable key here...">
            <div class="form-hint">Enter your publishable key from Supabase Dashboard > Project Settings > API. Never use service-role key.</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.saveSupabaseConfig()">
            Save & Connect Supabase
          </button>
        </div>
      </div>

      <!-- Institutional Branding & Identity Settings -->
      <div class="card">
        <div class="card-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            School & Hostel Profile Branding
          </h3>
          <span class="badge ${window.Auth && window.Auth.isSuperAdmin() ? 'badge-success' : 'badge-warning'}">
            ${window.Auth && window.Auth.isSuperAdmin() ? '● Super Admin Authorized' : 'Super Admin Privilege Required'}
          </span>
        </div>
        <div class="card-body">
          ${!window.Auth || !window.Auth.isSuperAdmin() ? `
            <div style="background:rgba(217,119,6,0.1); border:1px solid rgba(217,119,6,0.25); border-radius:var(--radius-md); padding:0.75rem 1rem; margin-bottom:1.25rem; font-size:0.85rem; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--warning-solid); flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <div>Only the <strong>Super Admin</strong> (${CONFIG.SUPER_ADMIN_EMAIL}) has authority to edit the institutional name, subtitle, and logo across the platform.</div>
            </div>
          ` : ''}

          <!-- Live Logo Preview & Uploader Section -->
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.25rem; margin-bottom:1.5rem;">
            <div style="font-weight:700; font-size:0.95rem; margin-bottom:0.85rem; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              Institution Logo & Header Icon
            </div>

            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:1.5rem;">
              <!-- Visual Preview Box -->
              <div style="display:flex; flex-direction:column; align-items:center; gap:0.4rem;">
                <div id="settings-logo-preview-box" style="width:90px; height:90px; border-radius:var(--radius-md); border:2px dashed var(--border-glass); background:rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow:var(--shadow-sm);">
                  <img id="settings-logo-preview" src="${CONFIG.getBranding().logoUrl}" style="max-width:80%; max-height:80%; object-fit:contain;" alt="Logo Preview" onerror="this.src='logo.svg'">
                </div>
                <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Active Logo</span>
              </div>

              <!-- Logo Control Actions -->
              <div style="flex:1; min-width:260px; display:flex; flex-direction:column; gap:0.75rem;">
                <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center;">
                  <label class="btn btn-outline-primary btn-sm" style="cursor:pointer; display:inline-flex; align-items:center; gap:0.4rem; margin:0;" ${!window.Auth || !window.Auth.isSuperAdmin() ? 'disabled style="pointer-events:none; opacity:0.6;"' : ''}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    Upload Logo File (SVG / PNG / JPG)
                    <input type="file" id="settings-logo-file-input" accept="image/*,.svg" style="display:none;" onchange="App.onLogoFileSelected(this, 'settings')" ${!window.Auth || !window.Auth.isSuperAdmin() ? 'disabled' : ''}>
                  </label>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="App.resetBrandingLogo('settings')" ${!window.Auth || !window.Auth.isSuperAdmin() ? 'disabled' : ''}>
                    Reset Default
                  </button>
                </div>

                <div class="form-group" style="margin:0;">
                  <label class="form-label" style="font-size:0.8rem; margin-bottom:0.25rem;">Or Image / SVG URL</label>
                  <input type="text" class="form-control" id="settings-logo-url" value="${CONFIG.getBranding().logoUrl}" placeholder="logo.svg or https://..." oninput="App.onLogoUrlChanged(this.value, 'settings')" ${!window.Auth || !window.Auth.isSuperAdmin() ? 'disabled' : ''}>
                  <div class="form-hint" style="font-size:0.72rem;">Supports SVG vector graphics, PNG with transparency, and standard web photos.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Text Information Form Grid -->
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Hostel / App Main Title <span class="required">*</span></label>
              <input type="text" class="form-control" value="${CONFIG.getBranding().appName}" id="settings-app-name" placeholder="e.g. TPS HOSTEL" ${!window.Auth || !window.Auth.isSuperAdmin() ? 'disabled' : ''}>
              <div class="form-hint">Displayed in bold at the top of the sidebar navigation.</div>
            </div>
            <div class="form-group">
              <label class="form-label">School / Institution Subtitle <span class="required">*</span></label>
              <input type="text" class="form-control" value="${CONFIG.getBranding().schoolName}" id="settings-school-name" placeholder="e.g. THAIBAPUBLICSCHOOL" ${!window.Auth || !window.Auth.isSuperAdmin() ? 'disabled' : ''}>
              <div class="form-hint">Displayed under the hostel name and on official slips.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Institutional Motto / Tagline</label>
              <input type="text" class="form-control" value="${CONFIG.getBranding().motto}" id="settings-motto" placeholder="e.g. Modern Education with Morality" ${!window.Auth || !window.Auth.isSuperAdmin() ? 'disabled' : ''}>
            </div>
            <div class="form-group">
              <label class="form-label">Campus Contact Phone</label>
              <input type="text" class="form-control" value="${CONFIG.getBranding().campusPhone}" id="settings-phone" placeholder="e.g. +91 483 2750000" ${!window.Auth || !window.Auth.isSuperAdmin() ? 'disabled' : ''}>
            </div>
            <div class="form-group">
              <label class="form-label">Default Late Return Fine (₹ per calendar day)</label>
              <input type="number" class="form-control" value="100" id="settings-fine-rate" ${!window.Auth || !window.Auth.isSuperAdmin() ? 'disabled' : ''}>
            </div>
          </div>

          ${window.Auth && window.Auth.isSuperAdmin() ? `
            <div style="margin-top:1.25rem; display:flex; gap:0.75rem; align-items:center;">
              <button class="btn btn-primary" onclick="App.saveBrandingFromSettings()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="7 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Save & Apply Branding Changes
              </button>
              <button class="btn btn-secondary" onclick="App.openEditBrandingModal()">
                Open Quick Branding Dialog
              </button>
            </div>
          ` : `
            <div style="margin-top:1rem; font-size:0.85rem; color:var(--text-muted); font-style:italic;">
              Sign in as Super Admin (${CONFIG.SUPER_ADMIN_EMAIL}) to unlock institution profile customization.
            </div>
          `}
        </div>
      </div>

      <!-- Demo Dataset & Storage Management -->
      <div class="card" style="margin-bottom: 1.75rem;">
        <div class="card-header">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Dataset & Storage Recovery
          </h3>
          <span class="badge badge-success">Local Cache Synchronized</span>
        </div>
        <div class="card-body">
          <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1rem; line-height:1.5;">
            Manage and restore the comprehensive sample dataset with <strong>12 active students (Boys & Girls with HD portraits)</strong>, <strong>6 faculty & wardens</strong>, bedroom spaces, and class weekly timetables.
          </p>
          <div style="display:flex; flex-wrap:wrap; gap:0.75rem;">
            <button class="btn btn-primary" onclick="App.confirmResetFullSampleData()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
              Restore Full Sample Dataset (12 Students, 6 Faculty & Photos)
            </button>
            <button class="btn btn-secondary" onclick="App.exportStaffCSV()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export Staff Directory
            </button>
          </div>
        </div>
      </div>

      <!-- Immutable System Audit Log -->
      <div class="card">
        <div class="card-header">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            System Audit Trail (Immutable Records)
          </h3>
          <span class="badge badge-neutral">${auditLogs.length} Records</span>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Record ID</th>
                </tr>
              </thead>
              <tbody>
                ${auditLogs.slice(0, 10).map(log => `
                  <tr>
                    <td style="font-size:0.78rem; color:var(--text-muted);">${new Date(log.created_at).toLocaleString()}</td>
                    <td><strong>${log.user_email || 'System'}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(${log.user_role || 'sys'})</span></td>
                    <td><span class="badge badge-info">${log.action}</span></td>
                    <td>${log.module}</td>
                    <td style="font-family:monospace; font-size:0.78rem;">${log.record_id || '—'}</td>
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

window.SettingsView = new SettingsView();
