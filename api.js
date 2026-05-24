const API_BASE = 'https://citizen-card-backend-production.up.railway.app/api';

// ── User Register ─────────────────────────
async function registerUser(data) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
}

// ── User Login ────────────────────────────
async function loginUser(identifier, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  return await res.json();
}

// ── Get Profile ───────────────────────────
async function getProfile() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/user/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await res.json();
}

// ── Get My Cards ──────────────────────────
async function getMyCards() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/user/cards`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await res.json();
}

// ── Admin Login ───────────────────────────
async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return await res.json();
}

// ── Send OTP ──────────────────────────────
async function sendOTP(phone) {
  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return await res.json();
}

// ── Verify OTP ────────────────────────────
async function verifyOTP(phone, otp) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  return await res.json();
}

// ── Reset Password ────────────────────────
async function resetPassword(reset_token, new_password) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reset_token, new_password })
  });
  return await res.json();
}