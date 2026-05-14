/* ============================================================
   Bangladesh Citizen Card — Register Page JS
   File: register.js
   ============================================================ */


/* ---- DATE AUTO FORMAT  DD/MM/YYYY ---- */
function formatDate(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length >= 3 && val.length <= 4) {
    val = val.slice(0, 2) + '/' + val.slice(2);
  } else if (val.length >= 5) {
    val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4, 8);
  }
  input.value = val;
}


/* ---- CLEAR ERROR on Input ---- */
function clearError(el) {
  el.classList.remove('error');
  const errEl = document.getElementById(el.id + '-err');
  if (errEl) errEl.classList.remove('show');
}


/* ---- SHOW ERROR Helper ---- */
function showError(id) {
  const input = document.getElementById(id);
  const errEl = document.getElementById(id + '-err');
  if (input) input.classList.add('error');
  if (errEl) errEl.classList.add('show');
  if (input) input.focus();
}


/* ---- NEXT BUTTON Validation ---- */
function handleNext() {
  const nid      = document.getElementById('nid').value.trim();
  const fullname = document.getElementById('fullname').value.trim();
  const dob      = document.getElementById('dob').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const cardType = document.getElementById('cardType').value;

  let valid = true;

  if (!nid)                               { showError('nid');      valid = false; }
  if (!fullname)                          { showError('fullname'); valid = false; }
  if (!dob || dob.length < 10)           { showError('dob');      valid = false; }
  if (!phone || !/^01[0-9]{9}$/.test(phone)) { showError('phone'); valid = false; }
  if (!cardType)                          { showError('cardType'); valid = false; }

  if (!valid) return;

  // সব ঠিক → success দেখাও
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('successBox').style.display   = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // পরের page এ যেতে চাইলে এটা uncomment করো:
  // window.location.href = 'step2.html';
}