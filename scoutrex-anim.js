/* ScoutRex homepage micro-interactions
   - srPlayHero(): click-to-load the hero video (kept preload=none so the .mp4 never blocks LCP)
   - #3 match-signal bars: fill to value + count up on scroll
   - #4 How-it-works: sequential step reveal + self-drawing connector line
   - #5 product-proof mockup: candidate rows stream in and get scored live
   Animations only run when <html> has class "sr-js" (set by the head guard:
   IntersectionObserver supported AND prefers-reduced-motion not set).
   With no JS / reduced motion the page shows final values, no motion. */
(function () {
  'use strict';

  // Hero play button — must exist regardless of motion preference.
  window.srPlayHero = function (btn) {
    var v = document.getElementById('heroVideo');
    if (!v) return;
    if (btn) btn.classList.add('hidden');
    var p = v.play();
    if (p && typeof p.catch === 'function') { p.catch(function () { if (btn) btn.classList.remove('hidden'); }); }
  };

  if (!document.documentElement.classList.contains('sr-js')) return; // reduced motion / no IO

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function observeOnce(el, cb) {
    if (!el) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { cb(); io.disconnect(); }
      });
    }, { threshold: 0.25 });
    io.observe(el);
  }

  function countTo(el, target, dur, suffix) {
    suffix = (suffix == null) ? '%' : suffix;
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(frame);
  }

  onReady(function () {
    // ── #3 Match-signal bars ──
    var card = document.querySelector('#ai-section .ai-card');
    if (card) {
      var fills = card.querySelectorAll('.ai-bar-fill');
      var pcts = card.querySelectorAll('.ai-bar-pct');
      pcts.forEach(function (p) {
        if (!p.dataset.target) {
          var n = parseInt(p.textContent, 10);
          p.dataset.target = isNaN(n) ? 0 : n;
        }
        p.textContent = '0%';
      });
      observeOnce(card, function () {
        fills.forEach(function (f) { f.style.width = (f.dataset.target || 0) + '%'; });
        pcts.forEach(function (p) { countTo(p, parseInt(p.dataset.target, 10) || 0, 1300); });
      });
    }

    // ── #4 How-it-works steps + connector line ──
    var wrap = document.querySelector('#ai-section .ai-steps');
    if (wrap) {
      var steps = Array.prototype.slice.call(wrap.querySelectorAll('.ai-step'));
      var line = wrap.querySelector('.ai-steps-line');
      var nums = wrap.querySelectorAll('.ai-step-num');
      if (line && nums.length > 1) {
        var align = function () {
          var wr = wrap.getBoundingClientRect();
          var a = nums[0].getBoundingClientRect();
          var b = nums[nums.length - 1].getBoundingClientRect();
          var top = (a.top - wr.top) + a.height / 2;
          var bottom = (b.top - wr.top) + b.height / 2;
          line.style.top = top + 'px';
          line.style.bottom = 'auto';
          line.style.height = (bottom - top) + 'px';
        };
        align();
        window.addEventListener('resize', align);
      }
      observeOnce(wrap, function () {
        if (line) line.classList.add('in');
        steps.forEach(function (s, i) {
          setTimeout(function () { s.classList.add('in'); }, i * 140);
        });
      });
    }

    // ── #5 Product-proof mockup: stream candidate rows in + count scores ──
    var rowsWrap = document.getElementById('proofRows');
    if (rowsWrap) {
      var prows = Array.prototype.slice.call(rowsWrap.querySelectorAll('.proof-row'));
      prows.forEach(function (r) {
        var sc = r.querySelector('.proof-score');
        if (sc) {
          if (!sc.dataset.target) sc.dataset.target = parseInt(sc.textContent, 10) || 0;
          sc.textContent = '0';
        }
      });
      observeOnce(rowsWrap, function () {
        prows.forEach(function (r, i) {
          setTimeout(function () {
            r.classList.add('in');
            var f = r.querySelector('.proof-fill');
            if (f) f.style.width = (f.dataset.target || 0) + '%';
            var sc = r.querySelector('.proof-score');
            if (sc) countTo(sc, parseInt(sc.dataset.target, 10) || 0, 900, '');
          }, i * 160);
        });
      });
    }
  });
})();
