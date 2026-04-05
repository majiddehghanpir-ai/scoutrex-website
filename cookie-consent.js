/* ============================================================
   ScoutRex Cookie Consent  |  cookie-consent.js
   Bottom banner — does NOT block page interaction
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
    /* bottom banner — does NOT cover the page */
    '#sr-cc-banner{position:fixed;bottom:0;left:0;right:0;z-index:99998;',
    'background:rgba(15,10,46,.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);',
    'border-top:1px solid rgba(255,255,255,.10);',
    'padding:16px 20px;font-family:"Inter",system-ui,sans-serif;',
    'animation:srSlideUpBanner .3s ease}',

    '@keyframes srSlideUpBanner{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}',
    '@keyframes srFadeOutBanner{from{transform:translateY(0);opacity:1}to{transform:translateY(100%);opacity:0}}',

    /* inner layout */
    '#sr-cc-inner{max-width:1160px;margin:0 auto;display:flex;align-items:center;gap:16px;flex-wrap:wrap}',
    '#sr-cc-text{flex:1;min-width:220px}',
    '#sr-cc-text strong{display:block;color:#fff;font-size:14px;font-weight:600;margin-bottom:3px}',
    '#sr-cc-text p{color:rgba(255,255,255,.65);font-size:13px;margin:0;line-height:1.5}',
    '#sr-cc-text a{color:#F97316;text-decoration:underline;text-underline-offset:2px}',

    /* buttons */
    '#sr-cc-actions{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap}',
    '.sr-cc-btn{padding:9px 18px;border-radius:50px;font-size:13px;font-weight:600;',
    'cursor:pointer;border:none;transition:all .18s;font-family:inherit;white-space:nowrap}',
    '.sr-cc-btn-primary{background:#F97316;color:#fff;box-shadow:0 4px 12px rgba(249,115,22,.4)}',
    '.sr-cc-btn-primary:hover{background:#EA6C0A;transform:translateY(-1px)}',
    '.sr-cc-btn-secondary{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.2)}',
    '.sr-cc-btn-secondary:hover{background:rgba(255,255,255,.2)}',

    /* manage panel (hidden by default) */
    '#sr-cc-manage{display:none;width:100%;margin-top:12px;padding-top:12px;',
    'border-top:1px solid rgba(255,255,255,.1)}',
    '#sr-cc-manage.open{display:block}',
    '.sr-cc-row{display:flex;align-items:center;justify-content:space-between;gap:12px;',
    'padding:8px 0;border-bottom:1px solid rgba(255,255,255,.07)}',
    '.sr-cc-row:last-child{border-bottom:none}',
    '.sr-cc-row-info strong{font-size:13px;font-weight:600;color:#fff;margin-bottom:1px;display:block}',
    '.sr-cc-row-info span{font-size:12px;color:rgba(255,255,255,.5);line-height:1.4}',
    '.sr-cc-badge{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;',
    'background:rgba(255,255,255,.15);color:rgba(255,255,255,.7);white-space:nowrap}',

    /* toggle switch */
    '.sr-cc-toggle{position:relative;width:44px;height:24px;flex-shrink:0}',
    '.sr-cc-toggle input{opacity:0;width:0;height:0;position:absolute}',
    '.sr-cc-slider{position:absolute;inset:0;background:rgba(255,255,255,.2);border-radius:12px;',
    'cursor:pointer;transition:background .2s}',
    '.sr-cc-slider::before{content:"";position:absolute;height:18px;width:18px;left:3px;top:3px;',
    'background:#fff;border-radius:50%;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.3)}',
    '.sr-cc-toggle input:checked + .sr-cc-slider{background:#F97316}',
    '.sr-cc-toggle input:checked + .sr-cc-slider::before{transform:translateX(20px)}',
    '.sr-cc-toggle input:disabled + .sr-cc-slider{background:#3D2CAE;cursor:not-allowed;opacity:.7}',

    /* responsive */
    '@media(max-width:600px){',
    '#sr-cc-inner{gap:12px}',
    '#sr-cc-text strong{font-size:13px}',
    '#sr-cc-text p{font-size:12px}',
    '#sr-cc-actions{width:100%}',
    '.sr-cc-btn{flex:1;text-align:center;padding:10px 12px;font-size:13px}',
    '}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── build HTML ───────────────────────────────────── */
  var html = [
    '<div id="sr-cc-banner" role="region" aria-label="Cookie Preferences">',
    '  <div id="sr-cc-inner">',

    '    <div id="sr-cc-text">',
    '      <strong>🍪 We use cookies</strong>',
    '      <p>We use essential, analytics and marketing cookies to improve your experience.',
    '         <a href="gdpr.html#cookies">Learn more</a></p>',
    '    </div>',

    '    <div id="sr-cc-actions">',
    '      <button class="sr-cc-btn sr-cc-btn-secondary" id="sr-cc-manage-btn">Manage</button>',
    '      <button class="sr-cc-btn sr-cc-btn-secondary" id="sr-cc-reject-btn">Reject Non-Essential</button>',
    '      <button class="sr-cc-btn sr-cc-btn-primary" id="sr-cc-accept-all">Accept All</button>',
    '    </div>',

    '    <div id="sr-cc-manage">',

    '      <div class="sr-cc-row">',
    '        <div class="sr-cc-row-info">',
    '          <strong>Essential</strong>',
    '          <span>Login, security, basic navigation — cannot be disabled.</span>',
    '        </div>',
    '        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">',
    '          <span class="sr-cc-badge">Always active</span>',
    '          <label class="sr-cc-toggle"><input type="checkbox" checked disabled><span class="sr-cc-slider"></span></label>',
    '        </div>',
    '      </div>',

    '      <div class="sr-cc-row">',
    '        <div class="sr-cc-row-info">',
    '          <strong>Analytics</strong>',
    '          <span>Helps us understand how visitors use the site.</span>',
    '        </div>',
    '        <label class="sr-cc-toggle"><input type="checkbox" id="sr-cc-analytics"><span class="sr-cc-slider"></span></label>',
    '      </div>',

    '      <div class="sr-cc-row">',
    '        <div class="sr-cc-row-info">',
    '          <strong>Marketing</strong>',
    '          <span>Relevant ads — we never sell your data.</span>',
    '        </div>',
    '        <label class="sr-cc-toggle"><input type="checkbox" id="sr-cc-marketing"><span class="sr-cc-slider"></span></label>',
    '      </div>',

    '      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">',
    '        <button class="sr-cc-btn sr-cc-btn-primary" id="sr-cc-save-sel">Save My Preferences</button>',
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
    var el = document.getElementById('sr-cc-banner');
    if (el) {
      el.style.animation = 'srFadeOutBanner .25s ease forwards';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
    }
  }

  /* ── event listeners ──────────────────────────────── */
  document.getElementById('sr-cc-accept-all').addEventListener('click', function () {
    savePrefs(true, true);
    dismiss();
  });

  document.getElementById('sr-cc-reject-btn').addEventListener('click', function () {
    savePrefs(false, false);
    dismiss();
  });

  document.getElementById('sr-cc-manage-btn').addEventListener('click', function () {
    var panel = document.getElementById('sr-cc-manage');
    panel.classList.toggle('open');
    this.textContent = panel.classList.contains('open') ? 'Hide' : 'Manage';
  });

  document.getElementById('sr-cc-save-sel').addEventListener('click', function () {
    var analytics = document.getElementById('sr-cc-analytics').checked;
    var marketing = document.getElementById('sr-cc-marketing').checked;
    savePrefs(analytics, marketing);
    dismiss();
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
