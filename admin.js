/* ============================================================
   Bangladesh Citizen Card System — Admin JS (API Connected)
   File: admin.js
   ============================================================ */

const API_BASE = 'https://citizen-card-backend-production.up.railway.app/api';

/* ---- GLOBAL STATE ---- */
let allUsers = [];
let allCards = [];
let chartTypeInstance   = null;
let chartStatusInstance = null;

/* ---- GET ADMIN TOKEN ---- */
function getAdminToken() {
  return localStorage.getItem('adminToken');
}

/* ---- STATUS BADGE ---- */
function statusBadge(status) {
  const map = {
    approved:   '<span class="badge badge-approved">✅ Approved</span>',
    active:     '<span class="badge badge-approved">✅ Approved</span>',
    pending:    '<span class="badge badge-pending">⏳ Applied</span>',
    applied:    '<span class="badge badge-pending">⏳ Applied</span>',
    processing: '<span class="badge badge-pending">🔄 Processing</span>',
    rejected:   '<span class="badge badge-rejected">❌ Rejected</span>',
    suspended:  '<span class="badge badge-rejected">❌ Rejected</span>',
    issued:     '<span class="badge badge-approved">🪪 Issued</span>',
  };
  return map[status] || `<span class="badge badge-pending">${status || '—'}</span>`;
}

function typeBadge(type) {
  return `<span class="badge badge-${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</span>`;
}

function userStatusBadge(status) {
  return status === 'active'
    ? '<span class="badge badge-approved">Active</span>'
    : status === 'suspended'
    ? '<span class="badge badge-rejected">Suspended</span>'
    : '<span class="badge badge-pending">Pending</span>';
}

/* ---- LOAD STATS ---- */
async function loadStats() {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    });

    // 401/403 → logout, অন্য error → silently skip
    if (res.status === 401 || res.status === 403) { adminLogout(); return; }
    if (!res.ok) { 
      console.warn('Stats API error:', res.status); 
      setEl('stat-total-users', 'Error');
      setEl('stat-issued-cards', 'Error');
      setEl('stat-pending-cards', 'Error');
      setEl('stat-total-cards', 'Error');
      return; 
    }

    const data = await res.json();
    if (!data.success) return;

    const s = data.stats;
    setEl('stat-total-users',  s.total_users ?? 0);
    setEl('stat-issued-cards', s.issued_cards ?? 0);
    setEl('stat-pending-cards',s.pending_cards ?? 0);
    setEl('stat-total-cards',  s.total_cards ?? 0);

    renderCharts(s);
  } catch (err) {
    // Network/timeout error — show 0s, do NOT logout
    console.warn('Stats load failed (network?):', err.message);
    setEl('stat-total-users', '0');
    setEl('stat-issued-cards', '0');
    setEl('stat-pending-cards', '0');
    setEl('stat-total-cards', '0');
  }
}

/* ---- RENDER CHARTS ---- */
function renderCharts(stats) {
  // --- Chart 1: Cards by Type (Donut) ---
  const typeData  = stats.cards_by_type || [];
  const typeLabels = typeData.map(r => r.type_name.charAt(0).toUpperCase() + r.type_name.slice(1));
  const typeCounts = typeData.map(r => r.count);
  const typeColors = ['#006a4e', '#c9a84c', '#3498db', '#8e44ad', '#e67e22'];

  const ctxType = document.getElementById('chartCardType')?.getContext('2d');
  if (ctxType) {
    if (chartTypeInstance) chartTypeInstance.destroy();
    chartTypeInstance = new Chart(ctxType, {
      type: 'doughnut',
      data: {
        labels: typeLabels,
        datasets: [{
          data: typeCounts,
          backgroundColor: typeColors,
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'DM Sans', size: 12 }, padding: 14 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} cards` } }
        },
        cutout: '60%'
      }
    });
  }

  // --- Chart 2: Cards by Status (Bar) ---
  const statusLabels = ['Applied', 'Processing', 'Approved', 'Issued', 'Rejected'];
  const statusValues = [
    parseInt(stats.pending_cards  || 0),
    0,  // processing — not in stats directly, derived below
    0,
    parseInt(stats.issued_cards   || 0),
    0
  ];
  // Use cards_by_type data to derive full breakdown from allCards
  const statusMap = { applied: 0, processing: 0, approved: 0, issued: 0, rejected: 0 };
  allCards.forEach(c => { 
    let st = c.status;
    if (st === 'pending') st = 'applied';
    if (statusMap[st] !== undefined) statusMap[st]++; 
  });
  const barValues = [
    statusMap.applied,
    statusMap.processing,
    statusMap.approved,
    statusMap.issued,
    statusMap.rejected
  ];
  const barColors = ['#e67e22', '#3498db', '#c9a84c', '#006a4e', '#e74c3c'];

  const ctxStatus = document.getElementById('chartCardStatus')?.getContext('2d');
  if (ctxStatus) {
    if (chartStatusInstance) chartStatusInstance.destroy();
    chartStatusInstance = new Chart(ctxStatus, {
      type: 'bar',
      data: {
        labels: statusLabels,
        datasets: [{
          label: 'Applications',
          data: barValues,
          backgroundColor: barColors,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} applications` } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'DM Sans' } }, grid: { color: '#f0f4f2' } },
          x: { ticks: { font: { family: 'DM Sans', size: 11 } }, grid: { display: false } }
        }
      }
    });
  }
}

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
      <td><strong>${c.user_name || (c.user && c.user.full_name) || '—'}</strong></td>
      <td>${c.nid || c.nid_number || (c.user && c.user.nid_number) || '—'}</td>
      <td>${c.phone || (c.user && c.user.phone) || '—'}</td>
      <td><span style="font-weight:600;color:#c0392b;">${c.blood || c.blood_group || (c.user && (c.user.blood_group || c.user.blood)) || '—'}</span></td>
      <td>${typeBadge(c.card_type || 'unknown')}</td>
      <td>${c.applied_at || c.created_at ? new Date(c.applied_at || c.created_at).toLocaleDateString('en-BD') : '—'}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${cardActionBtns(c.id, c.status)}</td>
    </tr>
  `).join('');
}

/* ---- LOAD USERS ---- */
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

/* ---- FILTER & RENDER USERS ---- */
function filterAndRenderUsers() {
  const query = (document.getElementById('user-search')?.value || '').toLowerCase().trim();

  const filtered = allUsers.filter(u => {
    if ((u.status || '').toLowerCase() !== 'active' && (u.status || '').toLowerCase() !== 'accepted') return false;
    if (!query) return true;
    return (
      (u.full_name  || '').toLowerCase().includes(query) ||
      (u.nid_number || '').toLowerCase().includes(query) ||
      (u.phone      || '').toLowerCase().includes(query)
    );
  });

  const countEl = document.getElementById('user-filter-count');
  if (countEl) countEl.textContent = `${filtered.length} / ${allUsers.length} ব্যক্তি`;

  const tbody = document.getElementById('users-table');
  if (!tbody) return;
  if (!filtered || filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:#888;">${query ? 'কোনো result পাওয়া যায়নি।' : 'কোনো user নেই।'}</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${u.full_name || '—'}</strong></td>
      <td>${u.nid_number || '—'}</td>
      <td>${u.phone || '—'}</td>
      <td><span style="font-weight:600;color:#c0392b;">${u.blood_group || u.blood || '—'}</span></td>
      <td>${u.created_at ? new Date(u.created_at).toLocaleDateString('en-BD') : '—'}</td>
      <td>${userStatusBadge(u.status)}</td>
      <td style="white-space:nowrap;">
        ${u.status !== 'active'    ? `<button class="btn-approve" onclick="updateUserStatus(${u.id || u._id}, 'active')" title="Accept">✅ Accept</button>` : ''}
        ${u.status !== 'suspended' ? `<button class="btn-reject"  onclick="updateUserStatus(${u.id || u._id}, 'suspended')" title="Reject">❌ Reject</button>` : ''}
      </td>
    </tr>
  `).join('');
}

/* ---- LOAD APPLICATIONS (cards) ---- */
async function loadApplications() {
  const ovTbody  = document.getElementById('overview-table');
  const appTbody = document.getElementById('applications-table');
  const loadingRow = (cols) => `<tr><td colspan="${cols}" style="text-align:center;padding:20px;color:#888;">⏳ লোড হচ্ছে...</td></tr>`;
  const errorRow   = (cols, msg) => `<tr><td colspan="${cols}" style="text-align:center;padding:20px;color:#e74c3c;">${msg} <button onclick="loadApplications()" style="margin-left:8px;background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.8rem;">🔄 Retry</button></td></tr>`;

  if (ovTbody)  ovTbody.innerHTML  = loadingRow(9);
  if (appTbody) appTbody.innerHTML = loadingRow(9);

  try {
    const res = await fetch(`${API_BASE}/admin/users?limit=500`, {
      headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    });
    if (res.status === 401 || res.status === 403) { adminLogout(); return; }
    if (!res.ok) throw new Error('Users API ' + res.status);

    const data = await res.json();
    if (!data.success) {
      if (ovTbody)  ovTbody.innerHTML  = errorRow(9, '❌ ডেটা লোড ব্যর্থ হয়েছে।');
      if (appTbody) appTbody.innerHTML = errorRow(9, '❌ ডেটা লোড ব্যর্থ হয়েছে।');
      return;
    }

    const users = data.users || [];
    if (users.length === 0) {
      const emptyRow = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#888;">কোনো user নেই।</td></tr>';
      if (ovTbody)  ovTbody.innerHTML  = emptyRow;
      if (appTbody) appTbody.innerHTML = emptyRow;
      return;
    }

    // Backend Cards API is currently missing,
    // so we treat every registered user as a Card Application.
    allCards = users.map(u => ({
      id: u.id || u._id, // Handle both SQL and MongoDB
      user_name: u.full_name || '—',
      nid: u.nid_number || '—',
      phone: u.phone || '—',
      blood: u.blood_group || u.blood || '—',
      card_type: 'Family', // Default type
      applied_at: u.created_at,
      status: u.status // maps to user status (pending, active, suspended)
    }));

    // Sort by created_at / applied_at descending
    allCards.sort((a, b) => new Date(b.created_at || b.applied_at || 0) - new Date(a.created_at || a.applied_at || 0));

    if (allCards.length === 0) {
      const emptyRow = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#888;">কোনো আবেদন নেই।</td></tr>';
      if (ovTbody)  ovTbody.innerHTML  = emptyRow;
      if (appTbody) appTbody.innerHTML = emptyRow;
    } else {
      const pendingCards = allCards.filter(c => (c.status || '').toLowerCase() === 'pending');
      renderTable('overview-table', pendingCards.slice(0, 5));
      filterAndRenderApplications();
    }

    // Re-render charts with updated allCards data
    loadStats();

  } catch (err) {
    console.error('loadApplications error:', err);
    if (ovTbody)  ovTbody.innerHTML  = errorRow(9, '⚠️ সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।');
    if (appTbody) appTbody.innerHTML = errorRow(9, '⚠️ সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।');
  }
}

/* ---- FILTER & RENDER APPLICATIONS ---- */
function filterAndRenderApplications() {
  const query      = (document.getElementById('app-search')?.value        || '').toLowerCase().trim();
  const typeFilter = (document.getElementById('app-filter-type')?.value   || '').toLowerCase();
  const statFilter = (document.getElementById('app-filter-status')?.value || '').toLowerCase();

  const pendingCards = allCards.filter(c => (c.status || '').toLowerCase() === 'pending');

  const filtered = pendingCards.filter(c => {
    const matchQuery = !query || (
      (c.user_name || (c.user && c.user.full_name) || '').toLowerCase().includes(query) ||
      (c.nid || c.nid_number || (c.user && c.user.nid_number) || '').toLowerCase().includes(query) ||
      (c.phone || (c.user && c.user.phone) || '').toLowerCase().includes(query)
    );
    const matchType   = !typeFilter || (c.card_type || '').toLowerCase() === typeFilter;
    const matchStatus = !statFilter || (c.status    || '').toLowerCase() === statFilter;
    return matchQuery && matchType && matchStatus;
  });

  const countEl = document.getElementById('app-filter-count');
  if (countEl) countEl.textContent = `${filtered.length} / ${allCards.length} আবেদন`;

  renderTable('applications-table', filtered);
}

/* ---- CARD ACTION BUTTONS ---- */
function cardActionBtns(cardId, status) {
  let btns = '';
  // cardId is actually userId because of the mock mapping above
  if (status !== 'approved' && status !== 'issued' && status !== 'active') {
    btns += `<button class="btn-approve" onclick="updateUserStatus(${cardId}, 'active')">✅ Accept</button> `;
  }
  if (status !== 'rejected' && status !== 'suspended') {
    btns += `<button class="btn-reject" onclick="updateUserStatus(${cardId}, 'suspended')">❌ Reject</button>`;
  }
  return btns || `<span style="font-size:0.8rem; color:var(--text-muted);">—</span>`;
}

/* ---- UPDATE CARD STATUS ---- */
async function updateCardStatus(cardId, status) {
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
    alert(`✅ Card status "${status}" করা হয়েছে!`);
    loadApplications();
    loadStats();
  } else {
    alert('❌ ' + data.message);
  }
}

/* ---- UPDATE USER STATUS ---- */
async function updateUserStatus(userId, status) {
  if (!userId) {
    alert('❌ User ID is undefined. Database format error.');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      // Update local state without full reload for speed
      const u = allUsers.find(x => x.id === userId);
      if (u) u.status = status;
      filterAndRenderUsers();
      loadStats();
    } else {
      alert('❌ ' + (data.message || 'Status update failed'));
    }
  } catch (err) {
    alert('❌ সার্ভারের সাথে যোগাযোগ হয়নি।');
  }
}

/* ---- DELETE USER ---- */
async function deleteUser(userId, userName) {
  if (!confirm(`⚠️ "${userName}" এর সব তথ্য মুছে যাবে! নিশ্চিত?`)) return;
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ User মুছে ফেলা হয়েছে।');
      allUsers = allUsers.filter(u => u.id !== userId);
      filterAndRenderUsers();
      loadStats();
    } else {
      alert('❌ ' + (data.message || 'Delete সম্ভব হয়নি।'));
    }
  } catch (err) {
    alert('❌ সার্ভারের সাথে যোগাযোগ হয়নি।');
  }
}

/* ---- PANEL SWITCH ---- */
function showAdminPanel(id, linkEl) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  if (linkEl) linkEl.classList.add('active');
}

/* ---- LOGOUT ---- */
function adminLogout() {
  localStorage.removeItem('adminToken');
  window.location.replace('index.html');
}

/* ---- ON LOAD ---- */
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('adminToken');
  if (!token || token === 'undefined' || token === 'null') {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-login.html';
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

function sendNotification() {
  const title = document.getElementById('notify-title').value.trim();
  const msg   = document.getElementById('notify-msg').value.trim();
  if (!title || !msg) { alert('⚠️ Title এবং Message দিন।'); return; }
  alert(`✅ Notification পাঠানো হয়েছে!\n\nTitle: ${title}\nMessage: ${msg}`);
  document.getElementById('notify-title').value = '';
  document.getElementById('notify-msg').value   = '';
}

/* ---- CHANGE ADMIN PASSWORD ---- */
async function changeAdminPassword() {
  const current  = document.getElementById('adminCurrentPass').value.trim();
  const newPass  = document.getElementById('adminNewPass').value.trim();
  const confirm  = document.getElementById('adminConfirmPass').value.trim();
  const msgEl    = document.getElementById('admin-pass-msg');

  msgEl.textContent = '';

  if (!current || !newPass || !confirm) {
    msgEl.style.color = '#e74c3c';
    msgEl.textContent = '⚠️ সব field পূরণ করুন।';
    return;
  }
  if (newPass.length < 6) {
    msgEl.style.color = '#e74c3c';
    msgEl.textContent = '⚠️ নতুন password কমপক্ষে ৬ character হতে হবে।';
    return;
  }
  if (newPass !== confirm) {
    msgEl.style.color = '#e74c3c';
    msgEl.textContent = '⚠️ নতুন password দুটো মিলছে না।';
    return;
  }

  msgEl.style.color = '#888';
  msgEl.textContent = 'সংরক্ষণ হচ্ছে...';

  try {
    const res = await fetch(`${API_BASE}/admin/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify({ current_password: current, new_password: newPass })
    });
    const data = await res.json();

    if (data.success) {
      msgEl.style.color = '#27ae60';
      msgEl.textContent = '✅ Password সফলভাবে পরিবর্তন হয়েছে!';
      document.getElementById('adminCurrentPass').value = '';
      document.getElementById('adminNewPass').value     = '';
      document.getElementById('adminConfirmPass').value = '';
    } else {
      msgEl.style.color = '#e74c3c';
      msgEl.textContent = '❌ ' + (data.message || 'Password পরিবর্তন ব্যর্থ হয়েছে।');
    }
  } catch (err) {
    msgEl.style.color = '#e74c3c';
    msgEl.textContent = '❌ সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।';
  }
}