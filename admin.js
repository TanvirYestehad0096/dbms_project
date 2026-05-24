/* ============================================================
   Bangladesh Citizen Card System — Admin JS (API Connected)
   File: admin.js
   ============================================================ */

const API_BASE = 'https://citizen-card-backend-production.up.railway.app/api';

/* ---- GET ADMIN TOKEN ---- */
function getAdminToken() {
  return localStorage.getItem('adminToken');
}

/* ---- STATUS BADGE ---- */
function statusBadge(status) {
  const map = {
    approved:   '<span class="badge badge-approved">✅ Approved</span>',
    pending:    '<span class="badge badge-pending">⏳ Pending</span>',
    applied:    '<span class="badge badge-pending">⏳ Applied</span>',
    processing: '<span class="badge badge-pending">🔄 Processing</span>',
    rejected:   '<span class="badge badge-rejected">❌ Rejected</span>',
    issued:     '<span class="badge badge-approved">🪪 Issued</span>',
  };
  return map[status] || status;
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
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${getAdminToken()}` }
  });
  const data = await res.json();
  if (!data.success) return;

  const s = data.stats;
  document.getElementById('stat-total-users').textContent    = s.total_users;
  document.getElementById('stat-issued-cards').textContent   = s.issued_cards;
  document.getElementById('stat-pending-cards').textContent  = s.pending_cards;
  document.getElementById('stat-total-cards').textContent    = s.total_cards;
}

/* ---- LOAD USERS ---- */
async function loadUsers() {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: { 'Authorization': `Bearer ${getAdminToken()}` }
  });
  const data = await res.json();
  if (!data.success) return;

  const tbody = document.getElementById('users-table');
  tbody.innerHTML = data.users.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${u.full_name}</strong></td>
      <td>${u.nid_number}</td>
      <td>${u.phone}</td>
      <td>${new Date(u.created_at).toLocaleDateString('en-BD')}</td>
      <td>${userStatusBadge(u.status)}</td>
      <td>
        ${u.status !== 'active' ? `<button class="btn-approve" onclick="updateUserStatus(${u.id}, 'active')">✅ Activate</button>` : ''}
        ${u.status !== 'suspended' ? `<button class="btn-reject" onclick="updateUserStatus(${u.id}, 'suspended')">🚫 Suspend</button>` : ''}
      </td>
    </tr>
  `).join('');
}

/* ---- LOAD APPLICATIONS (cards) ---- */
async function loadApplications() {
  const res = await fetch(`${API_BASE}/admin/users?limit=100`, {
    headers: { 'Authorization': `Bearer ${getAdminToken()}` }
  });
  const data = await res.json();
  if (!data.success) return;

  // সব user এর cards load করো
  let allCards = [];
  for (const user of data.users) {
    const uRes = await fetch(`${API_BASE}/admin/users/${user.id}`, {
      headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    });
    const uData = await uRes.json();
    if (uData.success) {
      uData.user.cards.forEach(card => {
        allCards.push({ ...card, user_name: uData.user.full_name, nid: uData.user.nid_number, phone: uData.user.phone });
      });
    }
  }

  const renderTable = (tbodyId, cards) => {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = cards.map((c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${c.user_name}</strong></td>
        <td>${c.nid}</td>
        <td>${c.phone}</td>
        <td>${typeBadge(c.card_type)}</td>
        <td>${new Date(c.applied_at).toLocaleDateString('en-BD')}</td>
        <td>${statusBadge(c.status)}</td>
        <td>${cardActionBtns(c.id, c.status)}</td>
      </tr>
    `).join('');
  };

  renderTable('overview-table', allCards.slice(0, 5));
  renderTable('applications-table', allCards);
}

/* ---- CARD ACTION BUTTONS ---- */
function cardActionBtns(cardId, status) {
  if (status === 'applied' || status === 'processing') {
    return `
      <button class="btn-approve" onclick="updateCardStatus(${cardId}, 'approved')">✅ Approve</button>
      <button class="btn-reject"  onclick="updateCardStatus(${cardId}, 'rejected')">❌ Reject</button>
    `;
  }
  if (status === 'approved') {
    return `<button class="btn-approve" onclick="updateCardStatus(${cardId}, 'issued')">🪪 Issue</button>`;
  }
  return `<span style="font-size:0.8rem; color:var(--text-muted);">—</span>`;
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
    alert(`✅ User status "${status}" করা হয়েছে!`);
    loadUsers();
    loadStats();
  } else {
    alert('❌ ' + data.message);
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
  window.location.href = 'index.html';
}

/* ---- NOTIFY TO TOGGLE ---- */
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('adminToken');
  if (!token) { window.location.href = 'admin-login.html'; return; }

  const notifyTo = document.getElementById('notify-to');
  if (notifyTo) {
    notifyTo.addEventListener('change', () => {
      document.getElementById('nid-field').style.display =
        notifyTo.value === 'specific' ? 'block' : 'none';
    });
  }

  // Update stat IDs in HTML
  loadStats();
  loadApplications();
  loadUsers();
});

/* ---- SEND NOTIFICATION ---- */
function sendNotification() {
  const title = document.getElementById('notify-title').value.trim();
  const msg   = document.getElementById('notify-msg').value.trim();
  if (!title || !msg) { alert('⚠️ Title এবং Message দিন।'); return; }
  alert(`✅ Notification পাঠানো হয়েছে!\n\nTitle: ${title}\nMessage: ${msg}`);
  document.getElementById('notify-title').value = '';
  document.getElementById('notify-msg').value   = '';
}