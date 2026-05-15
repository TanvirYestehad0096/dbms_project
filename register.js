/* ============================================================
   Bangladesh Citizen Card — Register Page JS
   File: register.js
============================================================ */

/* ---- Date Format ---- */
function formatDate(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length >= 3 && val.length <= 4) {
    val = val.slice(0, 2) + '/' + val.slice(2);
  } else if (val.length >= 5) {
    val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4, 8);
  }
  input.value = val;
}

/* ---- Clear Error ---- */
function clearError(el) {
  el.classList.remove('error');
  const errEl = document.getElementById(el.id + '-err');
  if (errEl) errEl.classList.remove('show');
}

/* ---- Show Error ---- */
function showError(id) {
  const input = document.getElementById(id);
  const errEl = document.getElementById(id + '-err');
  if (input) input.classList.add('error');
  if (errEl) errEl.classList.add('show');
  if (input) input.focus();
}

/* ---- Password Toggle ---- */
function togglePass(id, btn) {
  const input = document.getElementById(id);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

/* ---- Next Button ---- */
function handleNext() {
  const nid = document.getElementById('nid').value.trim();
  const fullname = document.getElementById('fullname').value.trim();
  const dob = document.getElementById('dob').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const cardType = document.getElementById('cardType').value;
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();

  let valid = true;

  if (!nid) { showError('nid'); valid = false; }
  if (!fullname) { showError('fullname'); valid = false; }
  if (!dob || dob.length < 10) { showError('dob'); valid = false; }
  if (!phone || !/^01[0-9]{9}$/.test(phone)) { showError('phone'); valid = false; }
  if (!cardType) { showError('cardType'); valid = false; }
  if (!password) { showError('password'); valid = false; }
  if (password !== confirmPassword) { showError('confirmPassword'); valid = false; }

  if (!valid) return;

  // যেকোনো data দিলেই success
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('successBox').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 3000);
  // ---- LocalStorage এ save করো ----
  const users = JSON.parse(localStorage.getItem('users') || '[]');

  // NID already exists check
  const exists = users.find(u => u.nid === nid);
  if (exists) {
    showError('nid');
    document.getElementById('nid-err').textContent = '⚠️ এই NID দিয়ে আগেই register করা আছে।';
    return;
  }

  // নতুন user save
  users.push({ nid, fullname, dob, phone, cardType, password });
  localStorage.setItem('users', JSON.stringify(users));

  // ---- Success দেখাও তারপর Login এ যাও ----
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('successBox').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // ৩ সেকেন্ড পর login page এ যাবে
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 3000);
}