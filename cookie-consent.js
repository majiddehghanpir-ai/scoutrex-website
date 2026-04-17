/* ============================================================
   ScoutRex Cookie Consent  |  cookie-consent.js
   Two-stage GDPR flow — bottom banner, no page blocking
   Stage 1: Accept All / Customize
   Stage 2: Per-category toggles (only if Customize chosen)
   ============================================================ */

/* ── Dark-mode ambient orbs (injected on all pages) ────────── */
(function () {
  var style = document.createElement('style');
  style.id = 'sr-dark-orbs';
  style.textContent = [
    'html.dark body::before{',
    '  content:"";',
    '  position:fixed;inset:0;pointer-events:none;z-index:0;',
    '  background:',
    '    radial-gradient(ellipse at 12% 25%,rgba(249,115,22,0.10) 0%,transparent 45%),',
    '    radial-gradient(ellipse at 88% 15%,rgba(93,78,214,0.16) 0%,transparent 45%),',
    '    radial-gradient(ellipse at 55% 85%,rgba(30,18,86,0.18) 0%,transparent 50%);',
    '}',
    'html.dark body>*{position:relative;z-index:1}',
  ].join('');
  document.head.appendChild(style);
})();

(function () {
  'use strict';

  var STORAGE_KEY = 'sr_cookie_consent';
  var STORAGE_VER = '2';

  /* ── suppress any old inline #cookie-banner immediately ──── */
  function killOldBanner() {
    var old = document.getElementById('cookie-banner');
    if (old) {
      old.style.display = 'none';
      old.style.visibility = 'hidden';
      old.style.pointerEvents = 'none';
    }
  }
  /* run now and again after DOM ready in case it renders late */
  killOldBanner();
  document.addEventListener('DOMContentLoaded', killOldBanner);

  /* ── read existing prefs (accepts v1 and v2 + legacy string) */
  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      /* legacy string set by old inline banner */
      if (raw === 'accepted' || raw === 'declined') return { legacy: true };
      var p = JSON.parse(raw);
      if (p.v !== STORAGE_VER && p.v !== '1') return null;
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

  /* ── only show when no consent yet ───────────────────────── */
  if (loadPrefs()) return;

  /* ── styles ───────────────────────────────────────────────── */
  var css = [
    /* === STAGE 1 — compact bottom banner === */
    '#sr-cc{position:fixed;bottom:0;left:0;right:0;z-index:99998;',
      'background:rgba(10,7,35,.96);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);',
      'border-top:1px solid rgba(255,255,255,.09);font-family:"Inter",system-ui,sans-serif;',
      'animation:srUp .35s ease}',
    '@keyframes srUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}',
    '@keyframes srDown{from{transform:translateY(0);opacity:1}to{transform:translateY(100%);opacity:0}}',

    '#sr-cc-s1{max-width:1160px;margin:0 auto;padding:14px 20px;',
      'display:flex;align-items:center;gap:16px;flex-wrap:wrap}',

    '#sr-cc-s1-text{flex:1;min-width:200px}',
    '#sr-cc-s1-text strong{display:block;color:#fff;font-size:13px;font-weight:600;margin-bottom:2px}',
    '#sr-cc-s1-text p{color:rgba(255,255,255,.55);font-size:12px;margin:0;line-height:1.5}',
    '#sr-cc-s1-text a{color:#F97316;text-decoration:underline;text-underline-offset:2px}',

    '#sr-cc-s1-btns{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;align-items:center}',
    '.sr-btn{padding:9px 18px;border-radius:50px;font-size:13px;font-weight:600;',
      'cursor:pointer;border:none;transition:all .18s;font-family:inherit;white-space:nowrap}',
    '.sr-btn-primary{background:#F97316;color:#fff;box-shadow:0 4px 14px rgba(249,115,22,.38)}',
    '.sr-btn-primary:hover{background:#EA6C0A;transform:translateY(-1px)}',
    '.sr-btn-ghost{background:transparent;color:rgba(255,255,255,.6);',
      'border:1px solid rgba(255,255,255,.2);font-size:12px;padding:8px 14px}',
    '.sr-btn-ghost:hover{background:rgba(255,255,255,.08);color:#fff}',
    '.sr-btn-outline{background:rgba(255,255,255,.08);color:#fff;',
      'border:1px solid rgba(255,255,255,.18)}',
    '.sr-btn-outline:hover{background:rgba(255,255,255,.16)}',

    /* === STAGE 2 — preferences panel (hidden by default) === */
    '#sr-cc-s2{display:none;border-top:1px solid rgba(255,255,255,.08)}',
    '#sr-cc-s2.open{display:block}',
    '#sr-cc-s2-inner{max-width:1160px;margin:0 auto;padding:16px 20px 20px}',
    '#sr-cc-s2-inner h3{color:#fff;font-size:14px;font-weight:700;margin:0 0 12px}',

    /* rows */
    '.sr-row{display:flex;align-items:center;justify-content:space-between;gap:12px;',
      'padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)}',
    '.sr-row:last-of-type{border-bottom:none}',
    '.sr-row-info strong{display:block;font-size:13px;font-weight:600;color:#fff;margin-bottom:1px}',
    '.sr-row-info span{font-size:11px;color:rgba(255,255,255,.45);line-height:1.4}',
    '.sr-badge{font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;',
      'background:rgba(61,44,174,.5);color:rgba(255,255,255,.7);letter-spacing:.02em;white-space:nowrap}',

    /* toggle */
    '.sr-tog{position:relative;width:40px;height:22px;flex-shrink:0}',
    '.sr-tog input{opacity:0;width:0;height:0;position:absolute}',
    '.sr-sl{position:absolute;inset:0;background:rgba(255,255,255,.18);border-radius:11px;',
      'cursor:pointer;transition:background .2s}',
    '.sr-sl::before{content:"";position:absolute;height:16px;width:16px;left:3px;top:3px;',
      'background:#fff;border-radius:50%;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.3)}',
    '.sr-tog input:checked + .sr-sl{background:#F97316}',
    '.sr-tog input:checked + .sr-sl::before{transform:translateX(18px)}',
    '.sr-tog input:disabled + .sr-sl{background:#3D2CAE;cursor:not-allowed;opacity:.8}',

    '#sr-cc-s2-footer{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}',

    /* mobile */
    '@media(max-width:600px){',
      '#sr-cc-s1{padding:12px 16px;gap:12px}',
      '#sr-cc-s1-btns{width:100%;justify-content:stretch}',
      '.sr-btn{flex:1;text-align:center;font-size:12px;padding:10px 10px}',
      '#sr-cc-s2-inner{padding:14px 16px 18px}',
    '}'
  ].join('');

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ── HTML ─────────────────────────────────────────────────── */
  var html =
    '<div id="sr-cc" role="region" aria-label="Cookie consent">' +

    /* --- Stage 1 --- */
    '<div id="sr-cc-s1">' +
      '<div id="sr-cc-s1-text">' +
        '<strong>🍪 We use cookies</strong>' +
        '<p>Essential cookies keep the site running. Analytics &amp; marketing cookies need your consent. ' +
        '<a href="gdpr.html#cookies">Learn more</a></p>' +
      '</div>' +
      '<div id="sr-cc-s1-btns">' +
        '<button class="sr-btn sr-btn-ghost" id="sr-s1-customize">Customize</button>' +
        '<button class="sr-btn sr-btn-outline" id="sr-s1-reject">Essential Only</button>' +
        '<button class="sr-btn sr-btn-primary" id="sr-s1-all">Accept All</button>' +
      '</div>' +
    '</div>' +

    /* --- Stage 2 (hidden until Customize clicked) --- */
    '<div id="sr-cc-s2">' +
      '<div id="sr-cc-s2-inner">' +
        '<h3>Manage cookie preferences</h3>' +

        '<div class="sr-row">' +
          '<div class="sr-row-info">' +
            '<strong>Essential Cookies</strong>' +
            '<span>Required for login, security and basic navigation. Cannot be disabled under GDPR Article 5.</span>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:center;gap:4px">' +
            '<span class="sr-badge">Required</span>' +
            '<label class="sr-tog"><input type="checkbox" checked disabled><span class="sr-sl"></span></label>' +
          '</div>' +
        '</div>' +

        '<div class="sr-row">' +
          '<div class="sr-row-info">' +
            '<strong>Analytics Cookies</strong>' +
            '<span>Help us understand how visitors use the site so we can improve it. Requires your consent.</span>' +
          '</div>' +
          '<label class="sr-tog"><input type="checkbox" id="sr-chk-analytics"><span class="sr-sl"></span></label>' +
        '</div>' +

        '<div class="sr-row">' +
          '<div class="sr-row-info">' +
            '<strong>Marketing Cookies</strong>' +
            '<span>Used to show relevant ads. We never sell your data to third parties. Requires your consent.</span>' +
          '</div>' +
          '<label class="sr-tog"><input type="checkbox" id="sr-chk-marketing"><span class="sr-sl"></span></label>' +
        '</div>' +

        '<div id="sr-cc-s2-footer">' +
          '<button class="sr-btn sr-btn-primary" id="sr-s2-save">Save My Preferences</button>' +
          '<button class="sr-btn sr-btn-ghost" id="sr-s2-back">← Back</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '</div>';

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap.firstChild);

  /* ── helpers ──────────────────────────────────────────────── */
  function dismiss() {
    var el = document.getElementById('sr-cc');
    if (!el) return;
    el.style.animation = 'srDown .25s ease forwards';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
  }

  function openStage2() {
    document.getElementById('sr-cc-s2').classList.add('open');
    /* scroll to ensure panel is visible on small phones */
    var el = document.getElementById('sr-cc');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function closeStage2() {
    document.getElementById('sr-cc-s2').classList.remove('open');
  }

  /* ── events ───────────────────────────────────────────────── */
  document.getElementById('sr-s1-all').addEventListener('click', function () {
    savePrefs(true, true);
    dismiss();
  });

  document.getElementById('sr-s1-reject').addEventListener('click', function () {
    savePrefs(false, false);
    dismiss();
  });

  document.getElementById('sr-s1-customize').addEventListener('click', openStage2);

  document.getElementById('sr-s2-back').addEventListener('click', closeStage2);

  document.getElementById('sr-s2-save').addEventListener('click', function () {
    var analytics = document.getElementById('sr-chk-analytics').checked;
    var marketing = document.getElementById('sr-chk-marketing').checked;
    savePrefs(analytics, marketing);
    dismiss();
  });

  /* Escape closes banner (saves essential-only) */
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      savePrefs(false, false);
      dismiss();
      document.removeEventListener('keydown', handler);
    }
  });

})();
