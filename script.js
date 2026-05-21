/* ============================================================
   Bangladesh Citizen Card System — JavaScript
   File: script.js
   ============================================================ */


/* ---------- FAQ ACCORDION ---------- */

document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-header').addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    });
});


/* ---------- LOGIN FORM ---------- */

const loginBtn = document.querySelector('.btn-login');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const nid      = document.getElementById('loginNid').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!nid || !password) {
            alert('⚠️ NID/Username এবং Password দিন।');
            return;
        }

        // Admin check
        if (nid === 'admin' && password === 'admin123') {
            window.location.href = 'admin.html';
            return;
        }

        // localStorage এ registered user check
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user  = users.find(u => u.nid === nid && u.password === password);

        if (user) {
            // Logged in user info save করো
            localStorage.setItem('loggedInUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            alert('⚠️ NID বা Password ভুল। আগে Register করুন।');
        }
    });
}


/* ---------- DOWNLOAD SMART CARD LINK ---------- */

const downloadLink = document.getElementById('downloadLink');
if (downloadLink) {
    downloadLink.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector('.section-account').scrollIntoView({ behavior: 'smooth' });
    });
}


/* ---------- FORGET PASSWORD MODAL ---------- */

const forgotLink = document.getElementById('forgotLink');
if (forgotLink) {
    forgotLink.addEventListener('click', e => {
        e.preventDefault();
        openForgotModal();
    });
}

function openForgotModal() {
    document.querySelectorAll('.modal-steps').forEach(el => el.classList.remove('active'));
    document.getElementById('fp-step1').classList.add('active');
    ['fp-phone', 'fp-newpass', 'fp-confirm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['otp1','otp2','otp3','otp4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.querySelectorAll('.fp-err').forEach(el => el.classList.remove('show'));
    document.getElementById('forgotModal').classList.add('active');
}

function closeForgotModal() {
    document.getElementById('forgotModal').classList.remove('active');
}

document.getElementById('forgotModal').addEventListener('click', function(e) {
    if (e.target === this) closeForgotModal();
});

function fpGoStep(stepId) {
    document.querySelectorAll('.modal-steps').forEach(el => el.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
}

function fpSendOtp() {
    const phone    = document.getElementById('fp-phone').value.trim();
    const phoneErr = document.getElementById('fp-phone-err');
    if (!phone) { phoneErr.classList.add('show'); return; }
    phoneErr.classList.remove('show');
    document.getElementById('fp-otp-desc').textContent = phone + ' নম্বরে OTP পাঠানো হয়েছে।';
    fpGoStep('fp-step2');
    document.getElementById('otp1').focus();
}

function otpNext(el, nextId) {
    if (el.value && nextId) document.getElementById(nextId).focus();
}

function fpVerifyOtp() {
    const otp    = ['otp1','otp2','otp3','otp4'].map(id => document.getElementById(id).value).join('');
    const otpErr = document.getElementById('fp-otp-err');
    if (otp.length < 4) { otpErr.textContent = '⚠️ ৪-digit OTP দিন।'; otpErr.classList.add('show'); return; }
    if (otp !== '1234') { otpErr.textContent = '⚠️ OTP সঠিক নয়।'; otpErr.classList.add('show'); return; }
    otpErr.classList.remove('show');
    fpGoStep('fp-step3');
}

function fpResetPassword() {
    const np    = document.getElementById('fp-newpass').value.trim();
    const cf    = document.getElementById('fp-confirm').value.trim();
    const npErr = document.getElementById('fp-newpass-err');
    const cfErr = document.getElementById('fp-confirm-err');
    npErr.classList.remove('show');
    cfErr.classList.remove('show');
    if (!np) { npErr.textContent = '⚠️ Password দিন।'; npErr.classList.add('show'); return; }
    if (np.length < 6) { npErr.textContent = '⚠️ কমপক্ষে ৬ character দিন।'; npErr.classList.add('show'); return; }
    if (np !== cf) { cfErr.classList.add('show'); return; }
    fpGoStep('fp-step4');
}


/* ---------- SMOOTH SCROLL ---------- */

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});