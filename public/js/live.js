/* San3a Academy — live stats. Reads the public Live API (aggregates only: counts, dates, seats).
   Falls back to /live/snapshot.json (refreshed hourly by GitHub Actions). Never handles personal data. */
(function () {
  'use strict';
  var C = window.SAN3A_LIVE || {};
  var lang = C.lang || document.documentElement.lang || 'en';
  var MIN = typeof C.min === 'number' ? C.min : 3;
  var KEY = 'san3a-live-v1';
  var d = document;

  function hasTargets() { return d.querySelector('[data-live-strip],[data-live-badge],[data-live-ticker]'); }
  if (!hasTargets()) return;

  function timeout(ms) { return new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); }); }
  function getJSON(u, ms) {
    return Promise.race([fetch(u, { cache: 'no-store', redirect: 'follow' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }), timeout(ms)]);
  }
  function fmt(n) { return Number(n).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US'); }
  function ago(iso) {
    var t = Date.parse(iso); if (isNaN(t)) return '';
    var s = Math.max(0, (Date.now() - t) / 1000);
    var rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
    if (s < 3600) return rtf.format(-Math.max(1, Math.round(s / 60)), 'minute');
    if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
    return rtf.format(-Math.round(s / 86400), 'day');
  }
  function day(iso) {
    var t = Date.parse(iso); if (isNaN(t)) return iso || '';
    return new Date(t).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
  }
  function show(el, on) { if (el) el.hidden = !on; }
  function spark(svg, arr) {
    if (!svg || !arr || arr.length < 2) return false;
    var max = Math.max.apply(null, arr) || 1, w = 96, h = 28, step = w / (arr.length - 1);
    var pts = arr.map(function (v, i) { return (i * step).toFixed(1) + ',' + (h - 2 - (v / max) * (h - 6)).toFixed(1); });
    svg.innerHTML = '<polyline fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + pts.join(' ') + '"/>' +
      '<polygon fill="currentColor" opacity=".12" points="0,' + h + ' ' + pts.join(' ') + ' ' + w + ',' + h + '"/>';
    svg.style.color = 'var(--red)';
    return true;
  }

  function apply(data) {
    if (!data || !data.products) return;
    var P = data.products || {};

    d.querySelectorAll('[data-live-strip]').forEach(function (strip) {
      var p = P[strip.dataset.liveKey] || {}, any = false;
      var setNum = function (f, v) {
        var el = strip.querySelector('[data-f="' + f + '"]'); if (!el) return;
        var ok = typeof v === 'number' && v >= MIN;
        if (ok) { el.querySelector('[data-v]').textContent = fmt(v); any = true; }
        show(el, ok);
      };
      setNum('d7', p.d7); setNum('d30', p.d30);
      var lastEl = strip.querySelector('[data-f="last"]');
      if (lastEl && p.lastSignupAt && (p.d30 || 0) >= MIN) { lastEl.querySelector('[data-v]').textContent = ago(p.lastSignupAt); show(lastEl, true); any = true; } else show(lastEl, false);
      setNum('govs', p.governorates30);
      var sp = strip.querySelector('[data-f="spark"]');
      if (sp) { var okS = (p.d30 || 0) >= MIN && spark(sp, p.daily); show(sp, okS); }
      // next round + seats: live data first, then the page's own content (data-next)
      var nr = p.nextRound || null;
      if (!nr && strip.dataset.next) { try { nr = JSON.parse(strip.dataset.next); } catch (e) { nr = null; } }
      var seatsEl = strip.querySelector('[data-f="seats"]'), fullEl = strip.querySelector('[data-f="full"]');
      if (nr && nr.start && Date.parse(nr.start) > Date.now() - 864e5) {
        var left = typeof nr.seatsLeft === 'number' ? nr.seatsLeft : (typeof nr.capacity === 'number' && typeof nr.enrolled === 'number' ? nr.capacity - nr.enrolled : null);
        if (left !== null && left <= 0) { show(seatsEl, false); show(fullEl, true); any = true; }
        else if (left !== null) {
          seatsEl.querySelector('[data-v-date]').textContent = day(nr.start);
          seatsEl.querySelector('[data-v]').textContent = fmt(left);
          show(seatsEl, true); show(fullEl, false); any = true;
        } else { show(seatsEl, false); show(fullEl, false); }
      } else { show(seatsEl, false); show(fullEl, false); }
      strip.hidden = !any;
    });

    d.querySelectorAll('[data-live-badge]').forEach(function (b) {
      var p = P[b.dataset.liveKey] || {}; var v = p[b.dataset.f || 'd30'];
      if (typeof v === 'number' && v >= MIN) { b.querySelector('[data-v]').textContent = fmt(v); b.hidden = false; } else b.hidden = true;
    });

    var T = data.totals || {};
    d.querySelectorAll('[data-live-ticker]').forEach(function (t) {
      var ok = typeof T.d30 === 'number' && T.d30 >= MIN;
      if (ok) {
        t.querySelector('[data-v="d30"]').textContent = fmt(T.d30);
        var w = t.querySelector('[data-wrap="d7"]');
        if (w) { if (typeof T.d7 === 'number' && T.d7 >= MIN) { w.querySelector('[data-v="d7"]').textContent = fmt(T.d7); w.hidden = false; } else w.hidden = true; }
      }
      t.hidden = !ok;
    });
  }

  function cached() { try { var c = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return c && Date.now() - c.at < 120000 ? c.data : null; } catch (e) { return null; } }
  function store(data) { try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data: data })); } catch (e) {} }

  function load() {
    var tries = [];
    if (C.api) tries.push(function () { return getJSON(C.api, 6000); });
    if (C.snapshot) tries.push(function () { return getJSON(C.snapshot, 6000); });
    var i = 0;
    var next = function () {
      if (i >= tries.length) return Promise.resolve(null);
      return tries[i++]().then(function (j) { return j && j.ok !== false && j.products ? j : next(); }, next);
    };
    return next().then(function (data) { if (data) { store(data); apply(data); } });
  }

  var c = cached(); if (c) apply(c);
  load();
  if (C.refresh) setInterval(function () { if (!d.hidden) load(); }, C.refresh * 1000);
})();
