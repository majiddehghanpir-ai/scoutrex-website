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
      if (params.get('cms') === 'edit' && localStorage.getItem('srx_admin_key')) {
        // Small delay so page finishes painting
        setTimeout(() => this._enableEditMode(), 100);
      }
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

      const key     = localStorage.getItem('srx_admin_key') || '';
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
