/* ============================================================
   Bangladesh Citizen Card System — Admin JS
   File: admin.js
   ============================================================ */

/* ---- DEMO DATA ---- */
const applications = [
  { id: 1,  name: 'Md. Rahim Uddin',    nid: '1234567890', phone: '01712345678', type: 'family',      date: '01 Jan 2025', status: 'approved'  },
  { id: 2,  name: 'Fatema Begum',        nid: '9876543210', phone: '01898765432', type: 'student',     date: '05 Jan 2025', status: 'approved'  },
  { id: 3,  name: 'Karim Hossain',       nid: '1122334455', phone: '01611223344', type: 'business',    date: '10 Jan 2025', status: 'pending'   },
  { id: 4,  name: 'Sumaiya Akter',       nid: '5544332211', phone: '01755443322', type: 'vehicle',     date: '15 Jan 2025', status: 'pending'   },
  { id: 5,  name: 'Jahirul Islam',       nid: '6677889900', phone: '01966778899', type: 'agriculture', date: '20 Jan 2025', status: 'approved'  },
  { id: 6,  name: 'Nasrin Sultana',      nid: '0099887766', phone: '01800998877', type: 'family',      date: '25 Jan 2025', status: 'rejected'  },
  { id: 7,  name: 'Arif Billah',         nid: '3344556677', phone: '01533445566', type: 'student',     date: '01 Feb 2025', status: 'pending'   },
  { id: 8,  name: 'Roksana Khanam',      nid: '7788990011', phone: '01977889900', type: 'business',    date: '05 Feb 2025', status: 'approved'  },
  { id: 9,  name: 'Mizanur Rahman',      nid: '2233445566', phone: '01622334455', type: 'vehicle',     date: '10 Feb 2025', status: 'pending'   },
  { id: 10, name: 'Sharmin Akter',       nid: '8899001122', phone: '01788990011', type: 'family',      date: '15 Feb 2025', status: 'approved'  },
];

const users = [
  { id: 1,  name: 'Md. Rahim Uddin',  nid: '1234567890', phone: '01712345678', cards: 2, joined: '01 Jan 2025', status: 'active'   },
  { id: 2,  name: 'Fatema Begum',      nid: '9876543210', phone: '01898765432', cards: 1, joined: '05 Jan 2025', status: 'active'   },
  { id: 3,  name: 'Karim Hossain',     nid: '1122334455', phone: '01611223344', cards: 1, joined: '10 Jan 2025', status: 'active'   },
  { id: 4,  name: 'Sumaiya Akter',     nid: '5544332211', phone: '01755443322', cards: 1, joined: '15 Jan 2025', status: 'active'   },
  { id: 5,  name: 'Jahirul Islam',     nid: '6677889900', phone: '01966778899', cards: 3, joined: '20 Jan 2025', status: 'active'   },
  { id: 6,  name: 'Nasrin Sultana',    nid: '0099887766', phone: '01800998877', cards: 0, joined: '25 Jan 2025', status: 'inactive' },
  { id: 7,  name: 'Arif Billah',       nid: '3344556677', phone: '01533445566', cards: 1, joined: '01 Feb 2025', status: 'active'   },
  { id: 8,  name: 'Roksana Khanam',    nid: '7788990011', phone: '01977889900', cards: 2, joined: '05 Feb 2025', status: 'active'   },
];


/* ---- STATUS BADGE ---- */
function statusBadge(status) {
  const map = {
    approved: '<span class="badge badge-approved">✅ Approved</span>',
    pending:  '<span class="badge badge-pending">⏳ Pending</span>',
    rejected: '<span class="badge badge-rejected">❌ Rejected</span>',
  };
  return map[status] || status;
}

function typeBadge(type) {
  return `<span class="badge badge-${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</span>`;
}

function userStatusBadge(status) {
  return status === 'active'
    ? '<span class="badge badge-approved">Active</span>'
    : '<span class="badge badge-rejected">Inactive</span>';
}


/* ---- RENDER OVERVIEW TABLE (first 5) ---- */
function renderOverview() {
  const tbody = document.getElementById('overview-table');
  if (!tbody) return;
  tbody.innerHTML = applications.slice(0, 5).map(a => `
    <tr id="overview-row-${a.id}">
      <td>${a.id}</td>
      <td><strong>${a.name}</strong></td>
      <td>${a.nid}</td>
      <td>${typeBadge(a.type)}</td>
      <td>${a.date}</td>
      <td>${statusBadge(a.status)}</td>
      <td>${actionBtns(a.id, a.status, 'overview')}</td>
    </tr>
  `).join('');
}


/* ---- RENDER APPLICATIONS TABLE (all) ---- */
function renderApplications() {
  const tbody = document.getElementById('applications-table');
  if (!tbody) return;
  tbody.innerHTML = applications.map(a => `
    <tr id="app-row-${a.id}">
      <td>${a.id}</td>
      <td><strong>${a.name}</strong></td>
      <td>${a.nid}</td>
      <td>${a.phone}</td>
      <td>${typeBadge(a.type)}</td>
      <td>${a.date}</td>
      <td>${statusBadge(a.status)}</td>
      <td>${actionBtns(a.id, a.status, 'app')}</td>
    </tr>
  `).join('');
}


/* ---- RENDER USERS TABLE ---- */
function renderUsers() {
  const tbody = document.getElementById('users-table');
  if (!tbody) return;
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td><strong>${u.name}</strong></td>
      <td>${u.nid}</td>
      <td>${u.phone}</td>
      <td>${u.cards}</td>
      <td>${u.joined}</td>
      <td>${userStatusBadge(u.status)}</td>
    </tr>
  `).join('');
}


/* ---- ACTION BUTTONS ---- */
function actionBtns(id, status, prefix) {
  if (status === 'pending') {
    return `
      <button class="btn-approve" onclick="changeStatus(${id}, 'approved', '${prefix}')">✅ Approve</button>
      <button class="btn-reject"  onclick="changeStatus(${id}, 'rejected', '${prefix}')">❌ Reject</button>
    `;
  }
  return `<span style="font-size:0.8rem; color:var(--text-muted);">—</span>`;
}


/* ---- CHANGE STATUS ---- */
function changeStatus(id, newStatus, prefix) {
  const app = applications.find(a => a.id === id);
  if (!app) return;
  app.status = newStatus;

  // Re-render both tables
  renderOverview();
  renderApplications();
}


/* ---- PANEL SWITCH ---- */
function showAdminPanel(id, linkEl) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  if (linkEl) linkEl.classList.add('active');
}


/* ---- NOTIFY TO TOGGLE ---- */
document.addEventListener('DOMContentLoaded', () => {
  const notifyTo = document.getElementById('notify-to');
  if (notifyTo) {
    notifyTo.addEventListener('change', () => {
      const nidField = document.getElementById('nid-field');
      nidField.style.display = notifyTo.value === 'specific' ? 'block' : 'none';
    });
  }

  renderOverview();
  renderApplications();
  renderUsers();
});


/* ---- SEND NOTIFICATION ---- */
function sendNotification() {
  const title = document.getElementById('notify-title').value.trim();
  const msg   = document.getElementById('notify-msg').value.trim();

  if (!title || !msg) {
    alert('⚠️ Title এবং Message দিন।');
    return;
  }

  alert(`✅ Notification পাঠানো হয়েছে!\n\nTitle: ${title}\nMessage: ${msg}`);
  document.getElementById('notify-title').value = '';
  document.getElementById('notify-msg').value   = '';
}