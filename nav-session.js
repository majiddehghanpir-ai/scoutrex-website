/* nav-session.js — Shows logged-in account dropdown in the nav when user is authenticated.
   Include on all public-facing pages. Reads sr_token + sr_user from localStorage.
   Respects sr_lang (de/en). Handles both desktop nav button and mobile menu links. */
(function () {
  'use strict';

  function getSession() {
    try {
      var token = localStorage.getItem('sr_token');
      var user = JSON.parse(localStorage.getItem('sr_user') || 'null');
      return (token && user) ? { token: token, user: user } : null;
    } catch (e) { return null; }
  }

  function getLang() {
    try { return localStorage.getItem('sr_lang') || 'de'; } catch (e) { return 'de'; }
  }

  function tr(en, de) { return getLang() === 'de' ? de : en; }

  function initials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    return (parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : name.slice(0, 2)).toUpperCase();
  }

  function getAccountUrl(user) {
    return (user.role === 'candidate') ? 'account.html' : 'company-account.html';
  }

  function doLogout() {
    ['sr_token','sr_user','srx_lock_profile','srx_lock_return','srx_session_email']
      .forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    window.location.href = 'login.html';
  }

  function injectCSS() {
    if (document.getElementById('_nss_style')) return;
    var s = document.createElement('style');
    s.id = '_nss_style';
    s.textContent =
      '.nav-usr{position:relative;display:inline-block}' +
      '.nav-usr-btn{display:flex;align-items:center;gap:7px;padding:5px 12px 5px 5px;border-radius:50px;' +
        'border:1.5px solid rgba(249,115,22,0.35);background:transparent;cursor:pointer;' +
        'font-family:"Inter",sans-serif;font-size:13px;font-weight:600;color:var(--indigo);' +
        'transition:all 0.2s;line-height:1;white-space:nowrap}' +
      '.nav-usr-btn:hover{background:rgba(249,115,22,0.07);border-color:var(--orange)}' +
      'html.dark .nav-usr-btn{color:#F1F0F9;border-color:rgba(249,115,22,0.35)}' +
      '.nav-usr-av{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#1E1256,#F97316);' +
        'display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;' +
        'color:#fff;flex-shrink:0;overflow:hidden}' +
      '.nav-usr-av img{width:100%;height:100%;object-fit:cover;border-radius:50%}' +
      '.nav-usr-dd{position:absolute;top:calc(100% + 10px);right:0;min-width:210px;' +
        'background:#fff;border:1px solid rgba(30,18,86,0.1);border-radius:14px;' +
        'box-shadow:0 8px 32px rgba(30,18,86,0.12);padding:8px;z-index:9999;' +
        'opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity 0.18s,transform 0.18s}' +
      '.nav-usr-dd.open{opacity:1;transform:translateY(0);pointer-events:auto}' +
      '.nav-usr-em{font-size:11px;color:#9CA3AF;padding:6px 10px 10px;border-bottom:1px solid #F3F4F6;' +
        'margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:194px}' +
      '.nav-usr-it{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:8px;' +
        'font-size:13px;font-weight:500;color:#374151;cursor:pointer;transition:background 0.15s;' +
        'text-decoration:none;width:100%;border:none;background:transparent;' +
        'font-family:"Inter",sans-serif;text-align:left;box-sizing:border-box}' +
      '.nav-usr-it:hover{background:#FFF8F3;color:#EA6C0A}' +
      '.nav-usr-it.red{color:#DC2626}' +
      '.nav-usr-it.red:hover{background:rgba(220,38,38,0.05);color:#DC2626}' +
      'html.dark .nav-usr-dd{background:#1C1836;border-color:#2D2850;box-shadow:0 8px 32px rgba(0,0,0,0.4)}' +
      'html.dark .nav-usr-em{color:#6B6485;border-color:#2D2850}' +
      'html.dark .nav-usr-it{color:#A09BBF}' +
      'html.dark .nav-usr-it:hover{background:#1E1033;color:#F97316}' +
      'html.dark .nav-usr-it.red{color:#FCA5A5}';
    document.head.appendChild(s);
  }

  function buildDesktopWidget(session) {
    var u = session.user;
    var firstName = (u.name || '').split(' ')[0] || tr('Account', 'Konto');
    var av = initials(u.name || '');
    var accountUrl = getAccountUrl(u);
    var avatarInner = u.photo_b64
      ? '<img src="' + u.photo_b64 + '" alt="avatar">'
      : av;

    var wrap = document.createElement('div');
    wrap.className = 'nav-usr';
    wrap.innerHTML =
      '<button class="nav-usr-btn" id="_nub" type="button" aria-haspopup="true" aria-expanded="false">' +
        '<div class="nav-usr-av">' + avatarInner + '</div>' +
        '<span>' + firstName + '</span>' +
        '<span style="font-size:10px;opacity:0.55;line-height:1">▾</span>' +
      '</button>' +
      '<div class="nav-usr-dd" id="_nudd" role="menu">' +
        '<div class="nav-usr-em">' + (u.email || '') + '</div>' +
        '<a href="' + accountUrl + '" class="nav-usr-it" role="menuitem">' +
          '👤 ' + tr('My Account', 'Mein Konto') + '</a>' +
        '<button class="nav-usr-it red" id="_nulo" type="button" role="menuitem">' +
          '🚪 ' + tr('Log Out', 'Abmelden') + '</button>' +
      '</div>';

    var btn = wrap.querySelector('#_nub');
    var dd = wrap.querySelector('#_nudd');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    wrap.querySelector('#_nulo').addEventListener('click', doLogout);
    document.addEventListener('click', function () {
      dd.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    return wrap;
  }

  function init() {
    var session = getSession();
    if (!session) return;

    injectCSS();

    // ── Desktop nav login button ──────────────────────────────────────────────
    // Target the <a href="login.html"> that wraps a .login-btn button
    var loginLink = null;
    document.querySelectorAll('a[href="login.html"]').forEach(function (el) {
      if (el.querySelector('.login-btn') && !loginLink) loginLink = el;
    });
    // Fallback: first nav-area link to login.html
    if (!loginLink) {
      var navEl = document.querySelector('nav, .topnav, .nav-wrap');
      if (navEl) loginLink = navEl.querySelector('a[href="login.html"]');
    }
    if (loginLink) {
      var widget = buildDesktopWidget(session);
      loginLink.parentNode.replaceChild(widget, loginLink);
    }

    // ── Mobile menu: hide Login/Register, fix My-Account href ────────────────
    document.querySelectorAll('[data-i18n="ft-login"], [data-i18n="ft-register"]').forEach(function (el) {
      el.style.display = 'none';
    });
    var mobMyAcct = document.querySelector('[data-i18n="ft-mysr"]');
    if (mobMyAcct) {
      mobMyAcct.href = getAccountUrl(session.user);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
