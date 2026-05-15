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
        const nid = document.getElementById('loginNid').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!nid || !password) {
            alert('⚠️ NID এবং Password দিন।');
            return;
        }

        // যেকোনো id/pass দিলেই login হবে
        localStorage.setItem('loggedInUser', JSON.stringify({ nid }));
        window.location.href = 'dashboard.html';
    });
}


/* ---------- FORGOT PASSWORD ---------- */
const forgotLink = document.getElementById('forgotLink');
if (forgotLink) {
    forgotLink.addEventListener('click', e => {
        e.preventDefault();
        // সব step reset
        document.querySelectorAll('.modal-steps').forEach(el => el.classList.remove('active'));
        document.getElementById('fp-step1').classList.add('active');
        // input clear
        ['fp-phone', 'fp-newpass', 'fp-confirm'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        ['otp1', 'otp2', 'otp3', 'otp4'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.querySelectorAll('.fp-err').forEach(el => el.classList.remove('show'));
        // modal খোলো
        document.getElementById('forgotModal').classList.add('active');
    });
}

function closeForgotModal() {
    document.getElementById('forgotModal').classList.remove('active');
}

// Overlay click করলে বন্ধ
const forgotModal = document.getElementById('forgotModal');
if (forgotModal) {
    forgotModal.addEventListener('click', function (e) {
        if (e.target === this) closeForgotModal();
    });
}

function fpGoStep(stepId) {
    document.querySelectorAll('.modal-steps').forEach(el => el.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
}

function fpSendOtp() {
    const phone = document.getElementById('fp-phone').value.trim();
    const phoneErr = document.getElementById('fp-phone-err');
    if (!phone || !/^01[0-9]{9}$/.test(phone)) {
        phoneErr.classList.add('show');
        return;
    }
    phoneErr.classList.remove('show');
    document.getElementById('fp-otp-desc').textContent =
        phone + ' নম্বরে OTP পাঠানো হয়েছে।';
    fpGoStep('fp-step2');
    document.getElementById('otp1').focus();
}

function otpNext(el, nextId) {
    if (el.value && nextId) {
        document.getElementById(nextId).focus();
    }
}

function fpVerifyOtp() {
    const otp = ['otp1', 'otp2', 'otp3', 'otp4']
        .map(id => document.getElementById(id).value).join('');
    const otpErr = document.getElementById('fp-otp-err');
    if (otp.length < 4) {
        otpErr.textContent = '⚠️ ৪-digit OTP দিন।';
        otpErr.classList.add('show');
        return;
    }
    if (otp !== '1234') {
        otpErr.textContent = '⚠️ OTP সঠিক নয়। (Demo OTP: 1234)';
        otpErr.classList.add('show');
        return;
    }
    otpErr.classList.remove('show');
    fpGoStep('fp-step3');
}

function fpResetPassword() {
    const np = document.getElementById('fp-newpass').value.trim();
    const cf = document.getElementById('fp-confirm').value.trim();
    const npErr = document.getElementById('fp-newpass-err');
    const cfErr = document.getElementById('fp-confirm-err');
    npErr.classList.remove('show');
    cfErr.classList.remove('show');

    if (!np || np.length < 6) {
        npErr.textContent = '⚠️ কমপক্ষে ৬ character দিন।';
        npErr.classList.add('show');
        return;
    }
    if (np !== cf) {
        cfErr.classList.add('show');
        return;
    }

    // পরে backend দিয়ে replace করবো
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


/* ---------- DOWNLOAD SMART CARD LINK ---------- */
const downloadLink = document.getElementById('downloadLink');
if (downloadLink) {
    downloadLink.addEventListener('click', e => {
        e.preventDefault();
        document.querySelector('.section-account').scrollIntoView({ behavior: 'smooth' });
    });
}
/* ---- Typing Effect ---- */
const words = ['Bangladesh', 'বাংলাদেশ', 'Bangladesh'];
let wIdx = 0, cIdx = 0, deleting = false;
const typedEl = document.getElementById('typedText');

function typeLoop() {
    if (!typedEl) return;
    const word = words[wIdx];
    if (!deleting) {
        typedEl.textContent = word.slice(0, ++cIdx);
        if (cIdx === word.length) {
            deleting = true;
            setTimeout(typeLoop, 1400);
            return;
        }
    } else {
        typedEl.textContent = word.slice(0, --cIdx);
        if (cIdx === 0) {
            deleting = false;
            wIdx = (wIdx + 1) % words.length;
        }
    }
    setTimeout(typeLoop, deleting ? 60 : 110);
}
typeLoop();
/* ---- Scroll Fade-in ---- */
const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, i * 120);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

fadeEls.forEach(el => observer.observe(el));