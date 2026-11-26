/* San3a Academy — site interactions (no framework). */
(function () {
  'use strict';
  var d = document;

  // ---- mega menu ----
  var megaBtn = d.querySelector('[data-mega-toggle]');
  var mega = d.querySelector('[data-mega]');
  function closeMega() { if (!mega) return; mega.classList.remove('is-open'); megaBtn && megaBtn.setAttribute('aria-expanded', 'false'); }
  if (megaBtn && mega) {
    megaBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !mega.classList.contains('is-open');
      mega.classList.toggle('is-open', open);
      megaBtn.setAttribute('aria-expanded', String(open));
    });
    d.addEventListener('click', function (e) { if (!mega.contains(e.target)) closeMega(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMega(); megaBtn.focus(); } });
  }

  // ---- mobile drawer ----
  var drawerBtn = d.querySelector('[data-drawer-toggle]');
  var drawer = d.querySelector('[data-drawer]');
  if (drawerBtn && drawer) {
    drawerBtn.addEventListener('click', function () {
      var open = !drawer.classList.contains('is-open');
      drawer.classList.toggle('is-open', open);
      drawerBtn.setAttribute('aria-expanded', String(open));
      d.body.classList.toggle('no-scroll', open);
    });
  }

  // ---- reveal on scroll ----
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    d.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    d.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---- program sub-nav scroll spy + mobile apply bar ----
  var subLinks = Array.prototype.slice.call(d.querySelectorAll('[data-subnav] a[href^="#"]'));
  if (subLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    subLinks.forEach(function (a) { var id = a.getAttribute('href').slice(1); var sec = d.getElementById(id); if (sec) map[id] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          subLinks.forEach(function (a) { a.classList.remove('is-active'); });
          map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { spy.observe(d.getElementById(id)); });
  }
  var mobileApply = d.querySelector('[data-mobile-apply]');
  var heroEnd = d.querySelector('[data-hero-end]');
  var applySec = d.getElementById('apply');
  if (mobileApply && heroEnd && 'IntersectionObserver' in window) {
    var pastHero = false, atApply = false;
    var upd = function () { mobileApply.classList.toggle('is-visible', pastHero && !atApply); };
    new IntersectionObserver(function (e) { pastHero = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; upd(); }).observe(heroEnd);
    if (applySec) new IntersectionObserver(function (e) { atApply = e[0].isIntersecting; upd(); }, { rootMargin: '0px 0px -30% 0px' }).observe(applySec);
  }

  // ---- catalog filters ----
  var grid = d.querySelector('[data-catalog]');
  if (grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-card]'));
    var state = { audience: 'all', type: 'all', format: 'all', cost: 'all', q: '' };
    var params = new URLSearchParams(location.search);
    ['audience', 'type', 'format', 'cost'].forEach(function (k) { if (params.get(k)) state[k] = params.get(k); });
    if (params.get('q')) state.q = params.get('q');
    var countEl = d.querySelector('[data-count]');
    var emptyEl = d.querySelector('[data-empty]');
    var input = d.querySelector('[data-search]');
    if (input) input.value = state.q;
    function render() {
      var n = 0, q = state.q.trim().toLowerCase();
      cards.forEach(function (c) {
        var ok = (state.audience === 'all' || c.dataset.audience === state.audience) &&
                 (state.type === 'all' || c.dataset.type === state.type) &&
                 (state.format === 'all' || c.dataset.format === state.format) &&
                 (state.cost === 'all' || c.dataset.cost === state.cost) &&
                 (!q || (c.dataset.search || '').indexOf(q) !== -1);
        c.parentElement.hidden = !ok; if (ok) n++;
      });
      if (countEl) countEl.textContent = n;
      if (emptyEl) emptyEl.hidden = n !== 0;
      d.querySelectorAll('[data-filter]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(state[b.dataset.filter] === b.dataset.value));
      });
      var p = new URLSearchParams();
      ['audience', 'type', 'format', 'cost'].forEach(function (k) { if (state[k] !== 'all') p.set(k, state[k]); });
      if (state.q) p.set('q', state.q);
      var qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }
    d.querySelectorAll('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () { state[b.dataset.filter] = b.dataset.value; render(); });
    });
    if (input) input.addEventListener('input', function () { state.q = input.value; render(); });
    var clear = d.querySelector('[data-clear]');
    if (clear) clear.addEventListener('click', function () { state = { audience: 'all', type: 'all', format: 'all', cost: 'all', q: '' }; if (input) input.value = ''; render(); });
    render();
  }

  // ---- blog category filter ----
  var blog = d.querySelector('[data-blog]');
  if (blog) {
    var posts = Array.prototype.slice.call(blog.querySelectorAll('[data-cat]'));
    var cat = new URLSearchParams(location.search).get('topic') || 'all';
    function renderBlog() {
      posts.forEach(function (p) { p.hidden = !(cat === 'all' || p.dataset.cat === cat); });
      d.querySelectorAll('[data-topic]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.topic === cat)); });
    }
    d.querySelectorAll('[data-topic]').forEach(function (b) {
      b.addEventListener('click', function () {
        cat = b.dataset.topic; renderBlog();
        history.replaceState(null, '', location.pathname + (cat === 'all' ? '' : '?topic=' + cat));
      });
    });
    renderBlog();
  }

  // ---- Tally embeds (load when near the viewport) ----
  var tallyFrames = d.querySelectorAll('iframe[data-tally-src]');
  if (tallyFrames.length) {
    var W = 'https://tally.so/widgets/embed.js';
    var loadTally = function () {
      if (typeof window.Tally !== 'undefined') { window.Tally.loadEmbeds(); return; }
      if (!d.querySelector('script[src="' + W + '"]')) {
        var sc = d.createElement('script'); sc.src = W; sc.async = true;
        sc.onload = function () { window.Tally ? window.Tally.loadEmbeds() : fallback(); };
        sc.onerror = fallback; d.body.appendChild(sc);
      }
    };
    var fallback = function () { tallyFrames.forEach(function (f) { if (!f.src) f.src = f.dataset.tallySrc; }); };
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { loadTally(); tio.disconnect(); } }, { rootMargin: '600px 0px' });
      tallyFrames.forEach(function (f) { tio.observe(f); });
    } else { loadTally(); }
  }

  // ---- analytics: funnel events (no personal data is ever sent) ----
  var program = d.body.getAttribute('data-program') || undefined;
  function track(name, extra) {
    var data = Object.assign({ program: program, page_language: d.documentElement.lang }, extra || {});
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, data));
    if (typeof window.gtag === 'function') window.gtag('event', name, data);
    if (typeof window.fbq === 'function') {
      if (name === 'generate_lead') window.fbq('track', 'Lead', { content_name: program });
      else if (name === 'form_start') window.fbq('track', 'InitiateCheckout', { content_name: program });
      else window.fbq('trackCustom', name, data);
    }
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-track]');
    if (a) track(a.getAttribute('data-track'), { link_text: (a.textContent || '').trim().slice(0, 60) });
  });
  var seen = {};
  window.addEventListener('message', function (e) {
    if (typeof e.data !== 'string' || e.origin.indexOf('tally.so') === -1) return;
    var m; try { m = JSON.parse(e.data); } catch (err) { return; }
    if (!m || !m.event) return;
    var formId = m.payload && m.payload.formId; // only the form id — answers are never read
    if (m.event === 'Tally.FormLoaded' && !seen.load) { seen.load = 1; track('form_view', { form_id: formId }); }
    if (m.event === 'Tally.FormPageView' && !seen.start) { seen.start = 1; track('form_start', { form_id: formId }); }
    if (m.event === 'Tally.FormSubmitted') track('generate_lead', { form_id: formId });
  });
})();
