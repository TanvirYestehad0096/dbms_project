/* ============================================================
   Bangladesh Citizen Card System — JavaScript
   File: script.js
   ============================================================ */


/* ---------- FAQ ACCORDION ---------- */

/**
 * Toggles a FAQ item open or closed.
 * Only one item can be open at a time.
 * @param {HTMLElement} item - The clicked .faq-item element
 */
function toggleFaq(item) {
  const isOpen = item.classList.contains('open');

  // Close all items first
  document.querySelectorAll('.faq-item').forEach(el => {
    el.classList.remove('open');
  });

  // If it was closed, open it
  if (!isOpen) {
    item.classList.add('open');
  }
}

// Attach click listeners to all FAQ items
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-header').addEventListener('click', () => {
    toggleFaq(item);
  });
});


/* ---------- LOGIN FORM VALIDATION ---------- */

const loginBtn = document.querySelector('.btn-login');

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    const nid      = document.querySelector('input[type="text"]').value.trim();
    const password = document.querySelector('input[type="password"]').value.trim();

    if (!nid || !password) {
      alert('⚠️ Please enter your NID/Username and Password.');
      return;
    }

    // Placeholder: replace with real API call
    alert('✅ Login submitted! (Connect to your backend API here)');
  });
}


/* ---------- SMOOTH SCROLL (optional) ---------- */

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});