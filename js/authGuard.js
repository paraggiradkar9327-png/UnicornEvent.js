(function () {
    'use strict';

    const AUTH_KEY = 'ue_admin_auth';

    function isAuthed() {
        return sessionStorage.getItem(AUTH_KEY) === '1';
    }

    function goToLogin() {
        window.location.replace('login.html');
    }

    // ─── RE-CHECK ON BACK/FORWARD-CACHE RESTORE ───────────────────
    // If the browser restores this page from bfcache (e.g. after the
    // user logged out and hit Back), re-verify the session flag.
    window.addEventListener('pageshow', function (event) {
        const nav = performance.getEntriesByType('navigation')[0];
        const isBackForward = event.persisted || (nav && nav.type === 'back_forward');
        if (isBackForward && !isAuthed()) {
            goToLogin();
        }
    });

    // ─── TRAP THE BACK BUTTON ON THE DASHBOARD ────────────────────
    // Once logged in, pressing Back should not carry the user to any
    // earlier page (login form, previous site, etc). We push a fresh
    // history entry and re-push it every time Back/Forward is pressed,
    // so the user is kept on the dashboard.
    if (isAuthed()) {
        history.pushState(null, '', location.href);
        window.addEventListener('popstate', function () {
            if (isAuthed()) {
                history.pushState(null, '', location.href);
            } else {
                goToLogin();
            }
        });
    }

    // ─── LOGOUT ────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const logoutBtn = document.getElementById('logoutBtn');
        if (!logoutBtn) return;
        logoutBtn.addEventListener('click', function () {
            sessionStorage.removeItem(AUTH_KEY);
            window.location.replace('login.html');
        });
    });

})();