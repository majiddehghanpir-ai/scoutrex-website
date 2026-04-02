/* ============================================================
   ScoutRex Cookie Consent  |  cookie-consent.js
   Full GDPR-compliant banner with preference management
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'sr_cookie_consent';
  var STORAGE_VER = '1';

  /* ── read existing prefs ──────────────────────────── */
  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (p.v !== STORAGE_VER) return null;
      return p;
    } catch (e) { return null; }
  }

  function savePrefs(analytics, marketing) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: STORAGE_VER,
        essential: true,
        analytics: !!analytics,
        marketing: !!marketing,
        ts: Date.now()
      }));
    } catch (e) {}
  }

  /* ── only show once consent is given ─────────────── */
  if (loadPrefs()) return;

  /* ── inject styles ────────────────────────────────── */
  var css = [
    /* overlay */
    '#sr-cc-overlay{position:fixed;inset:0;background:rgba(15,10,46,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;animation:srFadeIn .25s ease}',
    '@keyframes srFadeIn{from{opacity:0}to{opacity:1}}',
    '@keyframes srSlideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}',

    /* card */
    '#sr-cc-card{background:#fff;border-radius:20px;max-width:540px;width:100%;box-shadow:0 24px 80px rgba(30,18,86,.22);animation:srSlideUp .3s ease;overflow:hidden;font-family:"Inter",system-ui,sans-serif}',

    /* header */
    '#sr-cc-header{background:linear-gradient(135deg,#1E1256 0%,#2D1B8E 100%);padding:24px 28px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}',
    '#sr-cc-header h2{color:#fff;font-size:18px;font-weight:700;line-height:1.3;margin:0}',
    '#sr-cc-header p{color:rgba(255,255,255,.75);font-size:13px;margin:6px 0 0;line-height:1.5}',
    '#sr-cc-close{background:rgba(255,255,255,.15);border:none;border-radius:50%;width:32px;height:32px;min-width:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;line-height:1;transition:background .2s;padding:0}',
    '#sr-cc-close:hover{background:rgba(255,255,255,.28)}',

    /* body */
    '#sr-cc-body{padding:20px 28px}',

    /* cookie row */
    '.sr-cc-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid #E5E7EB}',
    '.sr-cc-row:last-child{border-bottom:none}',
    '.sr-cc-row-info{flex:1;min-width:0}',
    '.sr-cc-row-info strong{display:block;font-size:14px;font-weight:600;color:#0F0A2E;margin-bottom:2px}',
    '.sr-cc-row-info span{font-size:12px;color:#6B7280;line-height:1.4}',

    /* toggle switch */
    '.sr-cc-toggle{position:relative;width:44px;height:24px;flex-shrink:0}',
    '.sr-cc-toggle input{opacity:0;width:0;height:0;position:absolute}',
    '.sr-cc-slider{position:absolute;inset:0;background:#D1D5DB;border-radius:12px;cursor:pointer;transition:background .2s}',
    '.sr-cc-slider::before{content:"";position:absolute;height:18px;width:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)}',
    '.sr-cc-toggle input:checked + .sr-cc-slider{background:#F97316}',
    '.sr-cc-toggle input:checked + .sr-cc-slider::before{transform:translateX(20px)}',
    '.sr-cc-toggle input:disabled + .sr-cc-slider{background:#3D2CAE;cursor:not-allowed;opacity:.7}',

    /* badge */
    '.sr-cc-badge{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#EEF2FF;color:#3D2CAE;white-space:nowrap}',

    /* footer */
    '#sr-cc-footer{padding:16px 28px 24px;display:flex;flex-direction:column;gap:12px}',
    '#sr-cc-btns{display:flex;gap:10px;flex-wrap:wrap}',
    '.sr-cc-btn{flex:1;min-width:120px;padding:11px 16px;border-radius:50px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all .18s;text-align:center;font-family:inherit}',
    '.sr-cc-btn-primary{background:#F97316;color:#fff;box-shadow:0 4px 14px rgba(249,115,22,.35)}',
    '.sr-cc-btn-primary:hover{background:#EA6C0A;transform:translateY(-1px);box-shadow:0 6px 20px rgba(249,115,22,.45)}',
    '.sr-cc-btn-secondary{background:#F3F4F6;color:#1E1256}',
    '.sr-cc-btn-secondary:hover{background:#E5E7EB}',
    '#sr-cc-links{display:flex;align-items:center;gap:16px;justify-content:center}',
    '#sr-cc-links a{font-size:12px;color:#6B7280;text-decoration:underline;text-underline-offset:3px}',
    '#sr-cc-links a:hover{color:#1E1256}',

    /* responsive */
    '@media(max-width:480px){#sr-cc-body{padding:16px 20px}#sr-cc-header{padding:20px 20px 16px}#sr-cc-footer{padding:14px 20px 20px}.sr-cc-btn{min-width:0}}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── build HTML ───────────────────────────────────── */
  var html = [
    '<div id="sr-cc-overlay" role="dialog" aria-modal="true" aria-label="Cookie Preferences">',
    '  <div id="sr-cc-card">',

    '    <div id="sr-cc-header">',
    '      <div>',
    '        <h2>🍪 Cookie Preferences</h2>',
    '        <p>We use cookies to improve your experience and analyse site usage.<br>Choose which categories you allow below.</p>',
    '      </div>',
    '      <button id="sr-cc-close" aria-label="Close">&#x2715;</button>',
    '    </div>',

    '    <div id="sr-cc-body">',

    '      <div class="sr-cc-row">',
    '        <div class="sr-cc-row-info">',
    '          <strong>Essential Cookies</strong>',
    '          <span>Required for the site to function — login sessions, security, and basic navigation. Cannot be disabled.</span>',
    '        </div>',
    '        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">',
    '          <span class="sr-cc-badge">Always active</span>',
    '          <label class="sr-cc-toggle"><input type="checkbox" id="sr-cc-essential" checked disabled><span class="sr-cc-slider"></span></label>',
    '        </div>',
    '      </div>',

    '      <div class="sr-cc-row">',
    '        <div class="sr-cc-row-info">',
    '          <strong>Analytics Cookies</strong>',
    '          <span>Help us understand how visitors interact with the site so we can improve performance and content.</span>',
    '        </div>',
    '        <label class="sr-cc-toggle"><input type="checkbox" id="sr-cc-analytics"><span class="sr-cc-slider"></span></label>',
    '      </div>',

    '      <div class="sr-cc-row">',
    '        <div class="sr-cc-row-info">',
    '          <strong>Marketing Cookies</strong>',
    '          <span>Used to show relevant ads and measure their effectiveness. We never sell your data to third parties.</span>',
    '        </div>',
    '        <label class="sr-cc-toggle"><input type="checkbox" id="sr-cc-marketing"><span class="sr-cc-slider"></span></label>',
    '      </div>',

    '    </div>',

    '    <div id="sr-cc-footer">',
    '      <div id="sr-cc-btns">',
    '        <button class="sr-cc-btn sr-cc-btn-secondary" id="sr-cc-accept-sel">Accept Selected</button>',
    '        <button class="sr-cc-btn sr-cc-btn-primary" id="sr-cc-accept-all">Accept All Cookies</button>',
    '      </div>',
    '      <div id="sr-cc-links">',
    '        <a href="gdpr.html">Privacy &amp; GDPR Policy</a>',
    '        <span style="color:#D1D5DB">|</span>',
    '        <a href="gdpr.html#cookies">Cookie Policy</a>',
    '      </div>',
    '    </div>',

    '  </div>',
    '</div>'
  ].join('\n');

  var wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper.firstChild);

  /* ── helpers ──────────────────────────────────────── */
  function dismiss() {
    var el = document.getElementById('sr-cc-overlay');
    if (el) {
      el.style.animation = 'srFadeIn .2s ease reverse';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
    }
  }

  /* ── event listeners ──────────────────────────────── */
  document.getElementById('sr-cc-accept-all').addEventListener('click', function () {
    savePrefs(true, true);
    dismiss();
  });

  document.getElementById('sr-cc-accept-sel').addEventListener('click', function () {
    var analytics = document.getElementById('sr-cc-analytics').checked;
    var marketing = document.getElementById('sr-cc-marketing').checked;
    savePrefs(analytics, marketing);
    dismiss();
  });

  document.getElementById('sr-cc-close').addEventListener('click', function () {
    /* treat close as accept-essential-only */
    savePrefs(false, false);
    dismiss();
  });

  /* close on backdrop click */
  document.getElementById('sr-cc-overlay').addEventListener('click', function (e) {
    if (e.target === this) {
      savePrefs(false, false);
      dismiss();
    }
  });

  /* close on Escape */
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      savePrefs(false, false);
      dismiss();
      document.removeEventListener('keydown', handler);
    }
  });

})();
