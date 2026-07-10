(function () {
    'use strict';

    const VALID_USERNAME = 'UnicornEvent';
    const VALID_PASSWORD = 'unicorn2026';
    const AUTH_KEY = 'ue_admin_auth';

    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorEl = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const loginCard = document.querySelector('.login-card');
    const toggleBtn = document.getElementById('togglePassword');

    toggleBtn.addEventListener('click', function () {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        toggleBtn.textContent = isHidden ? '🙈' : '👁';
        toggleBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });

    function showError(message) {
        errorEl.textContent = message;
        loginCard.classList.remove('shake');
        // force reflow so the animation can retrigger
        void loginCard.offsetWidth;
        loginCard.classList.add('shake');
        passwordInput.value = '';
        passwordInput.focus();
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showError('Please enter both username and password.');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';

        // slight delay to feel like a real auth check
        setTimeout(function () {
            if (username === VALID_USERNAME && password === VALID_PASSWORD) {
                errorEl.textContent = '';
                sessionStorage.setItem(AUTH_KEY, '1');

                // Replace (not assign) so this login page is removed from history —
                // pressing Back on the dashboard will not return here.
                window.location.replace('adminDashboard.html');
            } else {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
                showError('Invalid username or password.');
            }
        }, 350);
    });

})();