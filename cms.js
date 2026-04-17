/**
 * ScoutRex CMS — Inline content editing
 *
 * Usage (bottom of every page, before </body>):
 *   <script src="/cms.js"></script>
 *   <script>CMS.init('pagename')</script>
 *
 * To enter edit mode: visit any page with ?cms=edit
 * (requires ADMIN_API_KEY to be saved in admin Settings first)
 */
(function () {
  'use strict';

  const API = '/api';

  // Elements we allow editing — excludes nav, buttons, scripts, etc.
  const EDITABLE_SELECTOR = [
    'h1','h2','h3','h4','h5',
    'p','li','blockquote',
    '.section-tag','.section-title','.section-sub',
    '.hero-title','.hero-sub',
    '.pillar-title','.pillar-desc',
    '.cta-title','.cta-sub',
    '.stat-number','.stat-label',
    '.card-title','.card-desc',
    '.feature-title','.feature-desc',
  ].join(',');

  // Elements/containers to skip even if they match above
  const SKIP_INSIDE = 'script,style,noscript,nav,.nav-links,.hamburger-menu,' +
    '#cookie-banner,.cookie-banner,.admin-only,[data-cms-skip]';

  window.CMS = {
    page: null,
    changes: {},       // key → {selector, idx, value}
    originals: {},     // key → original innerHTML

    /* ── Public API ─────────────────────────────────────────── */

    async init(pageName) {
      this.page = pageName;
      await this._applyOverrides();

      const params = new URLSearchParams(location.search);
      if (params.get('cms') === 'edit') {
        // Always require password — never skip this, even if key is cached
        setTimeout(() => this._showAuthModal(), 120);
      }
    },

    /* ── Auth modal ─────────────────────────────────────────── */

    _showAuthModal() {
      const overlay = document.createElement('div');
      overlay.id = 'cms-auth-overlay';
      overlay.innerHTML = `
        <div id="cms-auth-box">
          <div id="cms-auth-logo">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#1E1256"/>
              <text x="20" y="27" text-anchor="middle" font-size="18" font-weight="800"
                font-family="serif" fill="#F97316">S</text>
            </svg>
            <span>ScoutRex CMS</span>
          </div>
          <h2 id="cms-auth-title">Admin Access Required</h2>
          <p id="cms-auth-sub">Enter your admin API key to enter edit mode for <strong>${this.page}</strong>.</p>
          <div id="cms-auth-error"></div>
          <input id="cms-auth-input" type="password" placeholder="Admin API key" autocomplete="current-password"/>
          <button id="cms-auth-btn">Unlock Edit Mode</button>
          <a id="cms-auth-cancel" href="#">Cancel</a>
        </div>`;

      const style = document.createElement('style');
      style.textContent = `
        #cms-auth-overlay {
          position:fixed;inset:0;z-index:2147483647;
          background:rgba(7,5,26,0.85);backdrop-filter:blur(6px);
          display:flex;align-items:center;justify-content:center;
          font-family:'Inter',sans-serif;
        }
        #cms-auth-box {
          background:#fff;border-radius:20px;padding:40px;width:380px;max-width:90vw;
          box-shadow:0 32px 80px rgba(0,0,0,0.4);text-align:center;
        }
        html.dark #cms-auth-box { background:#1C1836; }
        #cms-auth-logo {
          display:flex;align-items:center;justify-content:center;gap:10px;
          font-family:'Lora',serif;font-size:17px;font-weight:800;
          color:#1E1256;margin-bottom:20px;
        }
        html.dark #cms-auth-logo { color:#F1F0F9; }
        #cms-auth-title {
          font-family:'Lora',serif;font-size:1.35rem;font-weight:800;
          color:#1E1256;margin-bottom:8px;
        }
        html.dark #cms-auth-title { color:#F1F0F9; }
        #cms-auth-sub { font-size:13px;color:#6B7280;margin-bottom:22px;line-height:1.6; }
        html.dark #cms-auth-sub { color:#A09BBF; }
        #cms-auth-error {
          background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.2);
          border-radius:8px;padding:9px 14px;font-size:13px;color:#B91C1C;
          margin-bottom:14px;display:none;
        }
        #cms-auth-error.show { display:block; }
        #cms-auth-input {
          width:100%;padding:13px 16px;border:1.5px solid #E5E7EB;border-radius:10px;
          font-size:14px;font-family:'Inter',sans-serif;color:#0F0A2E;
          background:#fff;outline:none;margin-bottom:14px;box-sizing:border-box;
          transition:border-color 0.2s,box-shadow 0.2s;
        }
        #cms-auth-input:focus { border-color:#1E1256;box-shadow:0 0 0 3px rgba(30,18,86,0.08); }
        html.dark #cms-auth-input { background:#110F26;border-color:#2D2850;color:#F1F0F9; }
        html.dark #cms-auth-input:focus { border-color:#3D2CAE;box-shadow:0 0 0 3px rgba(93,78,214,0.15); }
        #cms-auth-btn {
          width:100%;padding:13px;background:#1E1256;color:#fff;border:none;
          border-radius:50px;font-size:15px;font-weight:700;cursor:pointer;
          font-family:'Inter',sans-serif;transition:all 0.2s;margin-bottom:14px;
          box-shadow:0 4px 16px rgba(30,18,86,0.25);
        }
        #cms-auth-btn:hover { background:#2D1B8E;transform:translateY(-1px); }
        #cms-auth-btn:disabled { background:#9CA3AF;cursor:default;transform:none; }
        #cms-auth-cancel { font-size:13px;color:#6B7280;text-decoration:none; }
        #cms-auth-cancel:hover { color:#1E1256; }
        html.dark #cms-auth-cancel { color:#A09BBF; }
        html.dark #cms-auth-cancel:hover { color:#F1F0F9; }
      `;
      document.head.appendChild(style);
      document.body.appendChild(overlay);

      const input = document.getElementById('cms-auth-input');
      const btn   = document.getElementById('cms-auth-btn');
      const errEl = document.getElementById('cms-auth-error');

      input.focus();
      input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });

      btn.addEventListener('click', async () => {
        const key = input.value.trim();
        if (!key) { errEl.textContent = 'Please enter your admin API key.'; errEl.classList.add('show'); return; }
        errEl.classList.remove('show');
        btn.textContent = 'Verifying…'; btn.disabled = true;

        try {
          // Validate by hitting a protected endpoint
          const res = await fetch('/api/messages?limit=1', {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          if (res.ok) {
            // Valid — store for this session only (not localStorage)
            sessionStorage.setItem('srx_cms_auth', key);
            overlay.remove();
            style.remove();
            this._enableEditMode();
          } else {
            errEl.textContent = 'Incorrect API key. Please try again.';
            errEl.classList.add('show');
            input.value = '';
            input.focus();
            btn.textContent = 'Unlock Edit Mode'; btn.disabled = false;
          }
        } catch (_) {
          errEl.textContent = 'Could not verify — check your connection.';
          errEl.classList.add('show');
          btn.textContent = 'Unlock Edit Mode'; btn.disabled = false;
        }
      });

      document.getElementById('cms-auth-cancel').addEventListener('click', e => {
        e.preventDefault();
        const u = new URL(location.href);
        u.searchParams.delete('cms');
        location.href = u.toString();
      });
    },

    /* ── Apply saved overrides on normal page load ──────────── */

    async _applyOverrides() {
      try {
        const res = await fetch(`${API}/content?page=${encodeURIComponent(this.page)}`);
        if (!res.ok) return;
        const data = await res.json();
        for (const item of (data.content || [])) {
          try {
            const els = document.querySelectorAll(item.selector);
            const el  = els[item.idx] || els[0];
            if (el) el.innerHTML = item.value;
          } catch (_) {}
        }
      } catch (_) {}
    },

    /* ── Edit mode ──────────────────────────────────────────── */

    _enableEditMode() {
      this._injectStyles();
      this._buildToolbar();
      this._markEditables();
    },

    _injectStyles() {
      const s = document.createElement('style');
      s.id = 'cms-styles';
      s.textContent = `
        #cms-toolbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647;
          background: #1E1256; color: #fff;
          padding: 0 20px; height: 50px;
          display: flex; align-items: center; gap: 12px;
          font-family: 'Inter', sans-serif; font-size: 13px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.4);
        }
        #cms-toolbar-title { font-weight: 700; flex: 1; }
        #cms-toolbar-title span { color: #FB923C; }
        #cms-count { font-size: 12px; color: #FB923C; font-weight: 600; min-width: 120px; text-align:right; }
        .cms-btn {
          padding: 7px 16px; border-radius: 8px; border: none;
          cursor: pointer; font-size: 12px; font-weight: 600;
          font-family: 'Inter', sans-serif; transition: opacity 0.15s;
        }
        .cms-btn:hover { opacity: 0.85; }
        #cms-save { background: #F97316; color: #fff; }
        #cms-save:disabled { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.4); cursor: default; opacity: 1; }
        #cms-reset { background: rgba(255,255,255,0.1); color: #fff; }
        #cms-exit  { background: rgba(220,38,38,0.25); color: #fff; }
        body { padding-top: 50px !important; }

        [data-cms-id] { cursor: pointer; transition: outline 0.12s; outline: 2px solid transparent; outline-offset: 3px; }
        [data-cms-id]:hover { outline: 2px dashed rgba(249,115,22,0.55) !important; }
        [data-cms-id].cms-editing {
          outline: 2px solid #F97316 !important;
          background: rgba(249,115,22,0.07) !important;
          border-radius: 4px;
          min-height: 1em;
        }
        [data-cms-id].cms-dirty { outline: 2px dashed #10B981 !important; }
        [data-cms-id].cms-saved { outline: 2px solid #10B981 !important; }

        #cms-hint {
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: rgba(30,18,86,0.95); color: rgba(255,255,255,0.8);
          padding: 10px 20px; border-radius: 50px; font-size: 12px;
          font-family: 'Inter', sans-serif; z-index: 2147483646;
          pointer-events: none; transition: opacity 0.3s;
        }
      `;
      document.head.appendChild(s);
    },

    _buildToolbar() {
      const bar = document.createElement('div');
      bar.id = 'cms-toolbar';
      bar.innerHTML = `
        <div id="cms-toolbar-title">✏️ CMS Edit Mode — <span>${this.page}</span></div>
        <div id="cms-count"></div>
        <button class="cms-btn" id="cms-reset">↩ Reset All</button>
        <button class="cms-btn" id="cms-save" disabled>💾 Save Changes</button>
        <button class="cms-btn" id="cms-exit">✕ Exit</button>
      `;
      document.body.prepend(bar);

      const hint = document.createElement('div');
      hint.id = 'cms-hint';
      hint.textContent = 'Click any highlighted text to edit it';
      document.body.appendChild(hint);
      setTimeout(() => { hint.style.opacity = '0'; setTimeout(() => hint.remove(), 400); }, 3500);

      document.getElementById('cms-save').addEventListener('click', () => this._saveAll());
      document.getElementById('cms-reset').addEventListener('click', () => this._resetAll());
      document.getElementById('cms-exit').addEventListener('click', () => {
        const u = new URL(location.href);
        u.searchParams.delete('cms');
        location.href = u.toString();
      });
    },

    _markEditables() {
      const all = document.querySelectorAll(EDITABLE_SELECTOR);
      let id = 0;
      all.forEach(el => {
        // Skip if inside a nav/skip zone or already nested inside another editable
        if (el.closest(SKIP_INSIDE)) return;
        if (el.closest('[data-cms-id]')) return;
        // Skip empty or icon-only elements
        if (!el.textContent.trim()) return;

        const cmsId = id++;
        el.setAttribute('data-cms-id', cmsId);

        const selector  = this._buildSelector(el);
        const elIdx     = this._elementIndex(el, selector);
        const key       = `${selector}::${elIdx}`;

        el.addEventListener('click', (e) => {
          if (el.contentEditable === 'true') return;
          e.stopPropagation();
          this._startEdit(el, key, selector, elIdx);
        });
      });
    },

    _startEdit(el, key, selector, elIdx) {
      // Close any other open editor
      document.querySelectorAll('[data-cms-id][contenteditable="true"]').forEach(other => {
        if (other !== el) this._commitEdit(other);
      });

      if (!this.originals[key]) {
        this.originals[key] = el.innerHTML;
      }

      el.contentEditable = 'true';
      el.classList.add('cms-editing');
      el.classList.remove('cms-dirty');
      el.focus();

      // Place cursor at end
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      el.addEventListener('blur',  () => this._commitEdit(el), { once: true });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { el.innerHTML = this.originals[key] || el.innerHTML; el.blur(); }
        if (e.key === 'Enter' && !e.shiftKey && el.tagName !== 'LI') { e.preventDefault(); el.blur(); }
      }, { once: false });

      el._cmsKey = key;
      el._cmsSelector = selector;
      el._cmsIdx = elIdx;
    },

    _commitEdit(el) {
      el.contentEditable = 'false';
      el.classList.remove('cms-editing');

      const key      = el._cmsKey;
      const selector = el._cmsSelector;
      const elIdx    = el._cmsIdx;
      if (!key) return;

      const newVal = el.innerHTML;
      const orig   = this.originals[key];

      if (newVal !== orig) {
        this.changes[key] = { selector, idx: elIdx, value: newVal };
        el.classList.add('cms-dirty');
      } else {
        delete this.changes[key];
        el.classList.remove('cms-dirty');
      }
      this._updateCount();
    },

    _updateCount() {
      const n = Object.keys(this.changes).length;
      const countEl = document.getElementById('cms-count');
      const saveBtn = document.getElementById('cms-save');
      if (countEl) countEl.textContent = n > 0 ? `${n} unsaved change${n !== 1 ? 's' : ''}` : '';
      if (saveBtn) saveBtn.disabled = n === 0;
    },

    async _saveAll() {
      const saveBtn = document.getElementById('cms-save');
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving…'; }

      const key     = sessionStorage.getItem('srx_cms_auth') || localStorage.getItem('srx_admin_key') || '';
      const entries = Object.values(this.changes);

      try {
        const res = await fetch(`${API}/content`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ page: this.page, changes: entries }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Mark all as saved
        document.querySelectorAll('[data-cms-id].cms-dirty').forEach(el => {
          el.classList.remove('cms-dirty');
          el.classList.add('cms-saved');
          setTimeout(() => el.classList.remove('cms-saved'), 2500);
        });

        this.changes = {};
        this._updateCount();

        if (saveBtn) {
          saveBtn.textContent = '✓ Saved!';
          setTimeout(() => { saveBtn.textContent = '💾 Save Changes'; }, 2500);
        }

        this._toast('✓ Changes saved — live on the website now!', '#065F46');
      } catch (err) {
        this._toast('✗ Save failed: ' + err.message, '#991B1B');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Save Changes'; }
      }
    },

    _resetAll() {
      if (!confirm('Reset all unsaved changes on this page?')) return;
      Object.entries(this.originals).forEach(([key, orig]) => {
        document.querySelectorAll('[data-cms-id]').forEach(el => {
          if (el._cmsKey === key) {
            el.innerHTML = orig;
            el.classList.remove('cms-dirty', 'cms-saved');
          }
        });
      });
      this.changes = {};
      this._updateCount();
    },

    _toast(msg, bg) {
      const t = document.createElement('div');
      t.style.cssText = `position:fixed;bottom:28px;right:28px;z-index:2147483647;
        background:${bg};color:#fff;padding:12px 22px;border-radius:10px;
        font-size:13px;font-weight:600;font-family:Inter,sans-serif;
        box-shadow:0 4px 20px rgba(0,0,0,0.25);`;
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 4000);
    },

    /* ── Helpers ─────────────────────────────────────────────── */

    _buildSelector(el) {
      const tag = el.tagName.toLowerCase();
      // Use the first 2 meaningful classes (not utility or dynamic ones)
      const classes = [...el.classList]
        .filter(c => !c.startsWith('cms-') && !/^(active|open|visible|hidden|show)$/.test(c) && c.length < 40)
        .slice(0, 2);
      return classes.length ? `${tag}.${classes.join('.')}` : tag;
    },

    _elementIndex(el, selector) {
      return [...document.querySelectorAll(selector)].indexOf(el);
    },
  };
})();
