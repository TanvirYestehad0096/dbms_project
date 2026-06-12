/* ============================================================
   Bangladesh Citizen Card System — Admin JS (FIXED)
   File: admin.js (frontend)
   ============================================================ */

const API_BASE = 'https://citizen-card-backend-production.up.railway.app/api';

/* ── Global State ────────────────────────────────── */
let allUsers = [];
let allCards = [];
let chartTypeInstance = null;
let chartStatusInstance = null;

/* ── Token Helper ────────────────────────────────── */
function getAdminToken() {
  return localStorage.getItem('adminToken');
}

/* ── Badges ──────────────────────────────────────── */
function statusBadge(status) {
  const map = {
    approved: '<span class="badge badge-approved">✅ Approved</span>',
    issued: '<span class="badge badge-approved">🪪 Issued</span>',
    applied: '<span class="badge badge-pending">⏳ Applied</span>',
    pending: '<span class="badge badge-pending">⏳ Applied</span>',
    processing: '<span class="badge badge-pending">🔄 Processing</span>',
    rejected: '<span class="badge badge-rejected">❌ Rejected</span>',
  };
  return map[(status || '').toLowerCase()]
    || `<span class="badge badge-pending">${status || '—'}</span>`;
}

function typeBadge(type) {
  const t = (type || 'unknown').toLowerCase();
  return `<span class="badge badge-${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</span>`;
}

function userStatusBadge(status) {
  return status === 'active'
    ? '<span class="badge badge-approved">Active</span>'
    : status === 'suspended'
      ? '<span class="badge badge-rejected">Suspended</span>'
      : '<span class="badge badge-pending">Pending</span>';
}

/* ── Card Action Buttons ─────────────────────────── */
// ✅ FIX: updateCardStatus ব্যবহার করছে (user status নয়)
function cardActionBtns(cardId, status) {
  const s = (status || '').toLowerCase();
  let btns = '';
  if (s !== 'approved' && s !== 'issued') {
    btns += `<button class="btn-approve" onclick="updateCardStatus(${cardId}, 'approved')">✅ Accept</button> `;
  }
  if (s !== 'rejected') {
    btns += `<button class="btn-reject" onclick="updateCardStatus(${cardId}, 'rejected')">❌ Reject</button>`;
  }
  return btns || `<span style="font-size:0.8rem;color:var(--text-muted);">—</span>`;
}

/* ── Render Cards Table ──────────────────────────── */
function renderTable(tbodyId, cards) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!cards || cards.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#888;">কোনো তথ্য পাওয়া যায়নি।</td></tr>';
    return;
  }
  tbody.innerHTML = cards.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${c.user_name || '—'}</strong></td>
      <td>${c.nid || '—'}</td>
      <td>${c.phone || '—'}</td>
      <td><span style="font-weight:600;color:#c0392b;">${c.blood || '—'}</span></td>
      <td>${typeBadge(c.card_type)}</td>
      <td>${c.applied_at ? new Date(c.applied_at).toLocaleDateString('en-BD') : '—'}</td>
      <td>${statusBadge(c.status)}</td>
      <td style="white-space:nowrap;">${cardActionBtns(c.id, c.status)}</td>
    </tr>
  `).join('');
}

/* ── Load Stats ──────────────────────────────────── */
async function loadStats() {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    });
    if (res.status === 401 || res.status === 403) { adminLogout(); return; }
    if (!res.ok) { setEl('stat-total-users', '—'); return; }

    const data = await res.json();
    if (!data.success) return;

    const s = data.stats;
    setEl('stat-total-users', s.total_users ?? 0);
    setEl('stat-issued-cards', s.issued_cards ?? 0);
    setEl('stat-pending-cards', s.pending_cards ?? 0);
    setEl('stat-total-cards', s.total_cards ?? 0);
    renderCharts(s);
  } catch (err) {
    console.warn('Stats load failed:', err.message);
  }
}

/* ── Render Charts ───────────────────────────────── */
function renderCharts(stats) {
  // Donut: Cards by type
  const typeData = stats.cards_by_type || [];
  const typeLabels = typeData.map(r => r.type_name.charAt(0).toUpperCase() + r.type_name.slice(1));
  const typeCounts = typeData.map(r => Number(r.count));
  const typeColors = ['#006a4e', '#c9a84c', '#3498db', '#8e44ad', '#e67e22'];

  const ctxType = document.getElementById('chartCardType')?.getContext('2d');
  if (ctxType) {
    if (chartTypeInstance) chartTypeInstance.destroy();
    chartTypeInstance = new Chart(ctxType, {
      type: 'doughnut',
      data: { labels: typeLabels, datasets: [{ data: typeCounts, backgroundColor: typeColors, borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'DM Sans', size: 12 }, padding: 14 } } }
      }
    });
  }

  // Bar: Cards by status (derived from allCards)
  const statusMap = { applied: 0, processing: 0, approved: 0, issued: 0, rejected: 0 };
  allCards.forEach(c => {
    const st = (c.status || '').toLowerCase();
    if (statusMap[st] !== undefined) statusMap[st]++;
  });

  const ctxStatus = document.getElementById('chartCardStatus')?.getContext('2d');
  if (ctxStatus) {
    if (chartStatusInstance) chartStatusInstance.destroy();
    chartStatusInstance = new Chart(ctxStatus, {
      type: 'bar',
      data: {
        labels: ['Applied', 'Processing', 'Approved', 'Issued', 'Rejected'],
        datasets: [{
          label: 'Applications',
          data: [statusMap.applied, statusMap.processing, statusMap.approved, statusMap.issued, statusMap.rejected],
          backgroundColor: ['#e67e22', '#3498db', '#c9a84c', '#006a4e', '#e74c3c'],
          borderRadius: 8, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f4f2' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

/* ── Load Applications (FIXED) ───────────────────── */
// ✅ FIX: /api/admin/cards থেকে real card data load করছে
async function loadApplications() {
  const ovTbody = document.getElementById('overview-table');
  const appTbody = document.getElementById('applications-table');
  const loadingRow = `<tr><td colspan="9" style="text-align:center;padding:20px;color:#888;">⏳ লোড হচ্ছে...</td></tr>`;
  const errorRow = `<tr><td colspan="9" style="text-align:center;padding:20px;color:#e74c3c;">⚠️ লোড ব্যর্থ। <button onclick="loadApplications()" style="margin-left:8px;background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.8rem;">🔄 Retry</button></td></tr>`;

  if (ovTbody) ovTbody.innerHTML = loadingRow;
  if (appTbody) appTbody.innerHTML = loadingRow;

  try {
    const res = await fetch(`${API_BASE}/admin/cards?limit=500`, {
      headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    });
    if (res.status === 401 || res.status === 403) { adminLogout(); return; }
    if (!res.ok) throw new Error('Cards API ' + res.status);

    const data = await res.json();
    if (!data.success) throw new Error('API returned failure');

    allCards = data.cards || [];

    if (allCards.length === 0) {
      const emptyRow = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#888;">কোনো card application নেই।</td></tr>';
      if (ovTbody) ovTbody.innerHTML = emptyRow;
      if (appTbody) appTbody.innerHTML = emptyRow;
    } else {
      // Overview: শুধু applied/processing (নতুন/অপেক্ষমান) দেখাও
      const pending = allCards.filter(c => ['applied', 'processing'].includes((c.status || '').toLowerCase()));
      renderTable('overview-table', pending.slice(0, 5));
      filterAndRenderApplications();
    }

    renderCharts({ cards_by_type: [] }); // re-render bar chart from allCards
    loadStats();

  } catch (err) {
    console.error('loadApplications error:', err);
    if (ovTbody) ovTbody.innerHTML = errorRow;
    if (appTbody) appTbody.innerHTML = errorRow;
  }
}

/* ── Filter & Render Applications (FIXED) ────────── */
function filterAndRenderApplications() {
  const query = (document.getElementById('app-search')?.value || '').toLowerCase().trim();
  const typeFilter = (document.getElementById('app-filter-type')?.value || '').toLowerCase();
  const statFilter = (document.getElementById('app-filter-status')?.value || '').toLowerCase();

  const filtered = allCards.filter(c => {
    const matchQuery = !query || (
      (c.user_name || '').toLowerCase().includes(query) ||
      (c.nid || '').toLowerCase().includes(query) ||
      (c.phone || '').toLowerCase().includes(query)
    );
    const matchType = !typeFilter || (c.card_type || '').toLowerCase() === typeFilter;
    const matchStatus = !statFilter || (c.status || '').toLowerCase() === statFilter;
    return matchQuery && matchType && matchStatus;
  });

  const countEl = document.getElementById('app-filter-count');
  if (countEl) countEl.textContent = `${filtered.length} / ${allCards.length} আবেদন`;

  renderTable('applications-table', filtered);
}

/* ── Update Card Status (FIXED) ──────────────────── */
// ✅ FIX: /api/admin/cards/:id/status — card status change করে
async function updateCardStatus(cardId, status) {
  try {
    const res = await fetch(`${API_BASE}/admin/cards/${cardId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      // Local state update — full reload না করে
      const card = allCards.find(c => c.id === cardId);
      if (card) {
        card.status = status;
        if (data.card_number) card.card_number = data.card_number;
      }
      filterAndRenderApplications();
      // Overview table ও refresh করো
      const pending = allCards.filter(c => ['applied', 'processing'].includes((c.status || '').toLowerCase()));
      renderTable('overview-table', pending.slice(0, 5));
      loadStats();
    } else {
      alert('❌ ' + (data.message || 'Status update failed'));
    }
  } catch (err) {
    alert('❌ সার্ভারের সাথে যোগাযোগ হয়নি।');
  }
}

/* ── Load Users ──────────────────────────────────── */
async function loadUsers() {
  const tbody = document.getElementById('users-table');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#888;">⏳ লোড হচ্ছে...</td></tr>';
  try {
    const res = await fetch(`${API_BASE}/admin/users?limit=200`, {
      headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    });
    if (res.status === 401 || res.status === 403) { adminLogout(); return; }
    if (!res.ok) throw new Error('Users API ' + res.status);

    const data = await res.json();
    if (!data.success) return;
    allUsers = data.users;
    filterAndRenderUsers();
  } catch (err) {
    console.error('loadUsers error:', err);
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#e74c3c;">⚠️ সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।</td></tr>';
  }
}

/* ── Filter & Render Users ───────────────────────── */
function filterAndRenderUsers() {
  const query = (document.getElementById('user-search')?.value || '').toLowerCase().trim();

  const filtered = allUsers.filter(u => {
    if (!query) return true;
    return (
      (u.full_name || '').toLowerCase().includes(query) ||
      (u.nid_number || '').toLowerCase().includes(query) ||
      (u.phone || '').toLowerCase().includes(query)
    );
  });

  const countEl = document.getElementById('user-filter-count');
  if (countEl) countEl.textContent = `${filtered.length} / ${allUsers.length} ব্যক্তি`;

  const tbody = document.getElementById('users-table');
  if (!tbody) return;
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:#888;">${query ? 'কোনো result পাওয়া যায়নি।' : 'কোনো user নেই।'}</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${u.full_name || '—'}</strong></td>
      <td>${u.nid_number || '—'}</td>
      <td>${u.phone || '—'}</td>
      <td><span style="font-weight:600;color:#c0392b;">${u.blood_group || '—'}</span></td>
      <td>${u.created_at ? new Date(u.created_at).toLocaleDateString('en-BD') : '—'}</td>
      <td>${userStatusBadge(u.status)}</td>
      <td style="white-space:nowrap;">
        ${u.status !== 'active' ? `<button class="btn-approve" onclick="updateUserStatus(${u.id}, 'active')">✅ Activate</button> ` : ''}
        ${u.status !== 'suspended' ? `<button class="btn-reject"  onclick="updateUserStatus(${u.id}, 'suspended')">🚫 Suspend</button> ` : ''}
       <button 
          style="background:#c0392b; color:#fff; border:none; border-radius:6px; padding:5px 10px; font-size:0.78rem; font-weight:600; cursor:pointer; margin-left:4px;"
         onclick="deleteUser(${u.id}, '${u.full_name}')">
         🗑️ Delete
       </button>
      </td>
    </tr>
  `).join('');
}

/* ── Update User Status ──────────────────────────── */
async function updateUserStatus(userId, status) {
  if (!userId) { alert('❌ User ID missing.'); return; }
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAdminToken()}` },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      const u = allUsers.find(x => x.id === userId);
      if (u) u.status = status;
      filterAndRenderUsers();
      loadStats();
    } else {
      alert('❌ ' + (data.message || 'Update failed'));
    }
  } catch (err) {
    alert('❌ সার্ভারের সাথে যোগাযোগ হয়নি।');
  }
}

/* ── Delete User ─────────────────────────────────── */
async function deleteUser(userId, userName) {
  if (!confirm(`⚠️ "${userName}" এর সব তথ্য এবং সব cards মুছে যাবে! নিশ্চিত?`)) return;
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    });
    const data = await res.json();
    if (data.success) {
      // ✅ allUsers থেকে remove
      allUsers = allUsers.filter(u => u.id !== userId);
      // ✅ allCards থেকেও সেই user এর সব cards remove
      allCards = allCards.filter(c => c.user_id !== userId);

      filterAndRenderUsers();
      filterAndRenderApplications();
      // Overview table ও refresh
      const pending = allCards.filter(c => ['applied','processing'].includes((c.status||'').toLowerCase()));
      renderTable('overview-table', pending.slice(0, 5));
      loadStats();
      alert('✅ User এবং তার সব cards সফলভাবে delete হয়েছে।');
    } else {
      alert('❌ ' + (data.message || 'Delete ব্যর্থ।'));
    }
  } catch {
    alert('❌ সার্ভারের সাথে যোগাযোগ হয়নি।');
  }
}

/* ── Panel Switch ────────────────────────────────── */
function showAdminPanel(id, linkEl) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  if (linkEl) linkEl.classList.add('active');
}

/* ── Logout ──────────────────────────────────────── */
function adminLogout() {
  localStorage.removeItem('adminToken');
  window.location.replace('index.html');
}

/* ── Send Notification ───────────────────────────── */
async function sendNotification() {
  const to    = document.getElementById('notify-to').value;
  const nid   = document.getElementById('notify-nid')?.value.trim();
  const title = document.getElementById('notify-title').value.trim();
  const msg   = document.getElementById('notify-msg').value.trim();

  if (!title || !msg) { alert('⚠️ Title এবং Message দিন।'); return; }
  if (to === 'specific' && !nid) { alert('⚠️ User এর NID দিন।'); return; }

  const btn = document.querySelector('#panel-notify .btn-login');
  if (btn) { btn.disabled = true; btn.textContent = 'পাঠানো হচ্ছে...'; }

  try {
    const res = await fetch(`${API_BASE}/admin/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify({
        user_id: to === 'specific' ? nid : 'all',
        title,
        message: msg
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      document.getElementById('notify-title').value = '';
      document.getElementById('notify-msg').value   = '';
      if (document.getElementById('notify-nid'))
        document.getElementById('notify-nid').value = '';
    } else {
      alert('❌ ' + (data.message || 'পাঠানো ব্যর্থ।'));
    }
  } catch {
    alert('❌ সার্ভারের সাথে যোগাযোগ হয়নি।');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📤 Send Notification'; }
  }
}
/* ── Change Admin Password ───────────────────────── */
async function changeAdminPassword() {
  const current = document.getElementById('adminCurrentPass').value.trim();
  const newPass = document.getElementById('adminNewPass').value.trim();
  const confirm = document.getElementById('adminConfirmPass').value.trim();
  const msgEl = document.getElementById('admin-pass-msg');
  msgEl.textContent = '';

  if (!current || !newPass || !confirm) { msgEl.style.color = '#e74c3c'; msgEl.textContent = '⚠️ সব field পূরণ করুন।'; return; }
  if (newPass.length < 6) { msgEl.style.color = '#e74c3c'; msgEl.textContent = '⚠️ কমপক্ষে ৬ character দিন।'; return; }
  if (newPass !== confirm) { msgEl.style.color = '#e74c3c'; msgEl.textContent = '⚠️ Password মিলছে না।'; return; }

  msgEl.style.color = '#888'; msgEl.textContent = 'সংরক্ষণ হচ্ছে...';
  try {
    const res = await fetch(`${API_BASE}/admin/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAdminToken()}` },
      body: JSON.stringify({ current_password: current, new_password: newPass })
    });
    const data = await res.json();
    if (data.success) {
      msgEl.style.color = '#27ae60'; msgEl.textContent = '✅ Password সফলভাবে পরিবর্তন হয়েছে!';
      ['adminCurrentPass', 'adminNewPass', 'adminConfirmPass'].forEach(id => document.getElementById(id).value = '');
    } else {
      msgEl.style.color = '#e74c3c'; msgEl.textContent = '❌ ' + (data.message || 'Failed');
    }
  } catch {
    msgEl.style.color = '#e74c3c'; msgEl.textContent = '❌ সার্ভারের সাথে যোগাযোগ হয়নি।';
  }
}

/* ── On Load ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('adminToken');
  if (!token || token === 'undefined' || token === 'null') {
    localStorage.removeItem('adminToken');
    window.location.replace('admin-login.html');
    return;
  }

  const notifyTo = document.getElementById('notify-to');
  if (notifyTo) {
    notifyTo.addEventListener('change', () => {
      document.getElementById('nid-field').style.display =
        notifyTo.value === 'specific' ? 'block' : 'none';
    });
  }

  loadStats();
  loadApplications();
  loadUsers();
});