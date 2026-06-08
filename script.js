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

async function handleLogin() {
    const nid = document.getElementById('loginNid').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!nid || !password) {
        alert('⚠️ NID/Username এবং Password দিন।');
        return;
    }

    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
    }

    try {
        const res = await loginUser(nid, password);

        if (res.success) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('loggedInUser', JSON.stringify(res.user));
            alert('✅ Login সফল! স্বাগতম ' + res.user.full_name);
            window.location.href = 'dashboard.html';
        } else {
            alert('⚠️ ' + res.message);
            if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = 'Login'; }
        }
    } catch (err) {
        alert('❌ সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। পরে চেষ্টা করুন।');
        if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = 'Login'; }
    }
}

if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
}

// Enter key support for login form
const loginNidInput = document.getElementById('loginNid');
const loginPassInput = document.getElementById('loginPassword');
if (loginNidInput) loginNidInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
if (loginPassInput) loginPassInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
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
    ['otp1', 'otp2', 'otp3', 'otp4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.querySelectorAll('.fp-err').forEach(el => el.classList.remove('show'));
    document.getElementById('forgotModal').classList.add('active');
}

function closeForgotModal() {
    document.getElementById('forgotModal').classList.remove('active');
}

document.getElementById('forgotModal').addEventListener('click', function (e) {
    if (e.target === this) closeForgotModal();
});

function fpGoStep(stepId) {
    document.querySelectorAll('.modal-steps').forEach(el => el.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
}

let fpPhone = '';
let fpResetToken = '';

async function fpSendOtp() {
    const phone = document.getElementById('fp-phone').value.trim();
    const phoneErr = document.getElementById('fp-phone-err');
    const btn = document.querySelector('#fp-step1 .modal-btn');
    if (!phone) { phoneErr.classList.add('show'); return; }
    phoneErr.classList.remove('show');
    
    if (btn) { btn.disabled = true; btn.textContent = 'পাঠানো হচ্ছে...'; }
    try {
        const res = await sendOTP(phone);
        if (res.success) {
            fpPhone = phone;
            document.getElementById('fp-otp-desc').textContent = phone + ' নম্বরে OTP পাঠানো হয়েছে।';
            
            // NOTE: Show OTP in an alert since there is no real SMS API
            if (res.otp) {
                alert(`📱 Demo/Development Mode\n\nআপনার OTP হচ্ছে: ${res.otp}`);
            }

            fpGoStep('fp-step2');
            document.getElementById('otp1').focus();
        } else {
            phoneErr.textContent = '⚠️ ' + (res.message || 'Error sending OTP');
            phoneErr.classList.add('show');
        }
    } catch (err) {
        phoneErr.textContent = '⚠️ Connection error';
        phoneErr.classList.add('show');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Send OTP →'; }
    }
}

function otpNext(el, nextId) {
    if (el.value && nextId) document.getElementById(nextId).focus();
}

async function fpVerifyOtp() {
    const otp = ['otp1', 'otp2', 'otp3', 'otp4'].map(id => document.getElementById(id).value).join('');
    const otpErr = document.getElementById('fp-otp-err');
    const btn = document.querySelector('#fp-step2 .modal-btn');
    if (otp.length < 4) { otpErr.textContent = '⚠️ ৪-digit OTP দিন।'; otpErr.classList.add('show'); return; }
    
    if (btn) { btn.disabled = true; btn.textContent = 'যাচাই হচ্ছে...'; }
    try {
        const res = await verifyOTP(fpPhone, otp);
        if (res.success) {
            fpResetToken = res.reset_token || res.token || '';
            otpErr.classList.remove('show');
            fpGoStep('fp-step3');
        } else {
            otpErr.textContent = '⚠️ ' + (res.message || 'OTP সঠিক নয়।');
            otpErr.classList.add('show');
        }
    } catch (err) {
        otpErr.textContent = '⚠️ Connection error';
        otpErr.classList.add('show');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Verify OTP →'; }
    }
}

async function fpResetPassword() {
    const np = document.getElementById('fp-newpass').value.trim();
    const cf = document.getElementById('fp-confirm').value.trim();
    const npErr = document.getElementById('fp-newpass-err');
    const cfErr = document.getElementById('fp-confirm-err');
    const btn = document.querySelector('#fp-step3 .modal-btn');
    
    npErr.classList.remove('show');
    cfErr.classList.remove('show');
    if (!np) { npErr.textContent = '⚠️ Password দিন।'; npErr.classList.add('show'); return; }
    if (np.length < 6) { npErr.textContent = '⚠️ কমপক্ষে ৬ character দিন।'; npErr.classList.add('show'); return; }
    if (np !== cf) { cfErr.classList.add('show'); return; }
    
    if (btn) { btn.disabled = true; btn.textContent = 'Reset হচ্ছে...'; }
    try {
        const res = await resetPassword(fpResetToken, np);
        if (res.success) {
            fpGoStep('fp-step4');
        } else {
            npErr.textContent = '⚠️ ' + (res.message || 'Password reset ব্যর্থ হয়েছে।');
            npErr.classList.add('show');
        }
    } catch (err) {
        npErr.textContent = '⚠️ Connection error';
        npErr.classList.add('show');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Reset Password →'; }
    }
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