/**
 * ScoutRex App Session Manager
 *
 * - Inactivity lock: after TIMEOUT minutes of no interaction,
 *   saves profile to localStorage and redirects to login?mode=lock
 * - Manual logout (window.srxLogout): clears ALL session data including
 *   the lock profile, so login page shows a clean form
 *
 * Add to app pages only (account.html, company-account.html):
 *   <script src="/session.js"></script>
 */
(function () {
  'use strict';

  const TIMEOUT_MS  = 15 * 60 * 1000;  // 15 minutes of inactivity
  const EVENTS      = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'];

  let _timer = null;

  /* ── Inactivity timer ─────────────────────────────────────── */

  function _reset() {
    clearTimeout(_timer);
    _timer = setTimeout(_lock, TIMEOUT_MS);
  }

  function _lock() {
    // Persist profile so login page can show it as a lock screen
    try {
      const user = JSON.parse(localStorage.getItem('sr_user') || '{}');
      const email = localStorage.getItem('srx_session_email') || user.email || '';
      if (user.name || email) {
        const initials = (user.name || '??')
          .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        localStorage.setItem('srx_lock_profile', JSON.stringify({
          name:     user.name  || '',
          email:    email,
          role:     user.role  || '',
          initials: initials,
          avatar:   user.avatar || ''
        }));
      }
      // Save return URL so login page can redirect back after unlock
      localStorage.setItem('srx_lock_return', window.location.pathname + window.location.search);
    } catch (_) {}

    // Wipe auth token so API calls fail
    localStorage.removeItem('sr_token');

    window.location.href = 'login.html?mode=lock';
  }

  /* ── Full (manual) logout ─────────────────────────────────── */
  // Call window.srxLogout() from logout buttons.
  // This clears EVERYTHING including the lock profile → clean login screen.

  window.srxLogout = function (redirectTo) {
    clearTimeout(_timer);
    EVENTS.forEach(e => document.removeEventListener(e, _reset));

    localStorage.removeItem('sr_token');
    localStorage.removeItem('sr_user');
    localStorage.removeItem('srx_session_email');
    localStorage.removeItem('srx_lock_profile');
    localStorage.removeItem('srx_lock_return');

    window.location.href = redirectTo || 'login.html';
  };

  /* ── Start tracking ───────────────────────────────────────── */

  EVENTS.forEach(e => document.addEventListener(e, _reset, { passive: true }));
  _reset();

})();
