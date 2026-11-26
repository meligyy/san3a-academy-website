/**
 * San3a Academy — Website Live API  (PUBLIC · aggregate-only)
 * ---------------------------------------------------------------------------
 * Serves live, privacy-safe stats for the website's product pages:
 *   sign-ups today / 7 days / 30 days / all-time per product, last sign-up time,
 *   governorates reached in 30 days, a 14-day trend, and the next round + seats left.
 *
 * It NEVER returns names, phones, e-mails, prices, advisors or any row-level data.
 * Counts below MIN_PUBLIC are suppressed (null) so small numbers can't identify anyone.
 *
 * Deploy as a NEW standalone Apps Script project (not inside the sales dashboard):
 *   1. script.google.com → New project → paste this file (+ appsscript.json).
 *   2. Run setup() once (authorise). It creates the "San3a Website Live Data" sheet.
 *   3. Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone.
 *   4. Copy the /exec URL into src/data/site.js → liveApi (and the LIVE_API_URL repo variable).
 * See apps-script/README.md for details.
 */

var CONFIG = {
  TZ: 'Africa/Cairo',
  CACHE_SECONDS: 300,           // 5 minutes
  MIN_PUBLIC: 3,                // suppress any count below this
  TREND_DAYS: 14,
  ASSUME_UTC_FOR_TEXT_DATES: true, // Tally writes "Submitted at" as UTC text

  // Lead sources (Tally → Google Sheets). Only the date, product and governorate columns are read.
  SOURCES: [
    {
      name: 'Employability & Upskilling Bootcamps (Tally jaQ1O4)',
      sheetId: '1QimD6OsszEuxJRjo6c4TRPCFhJhscliqXHuC0zCU_MM',
      tab: 'Tally',
      dateHeader: 'Submitted at',
      productHeader: 'مهتم تشارك في ايه؟',
      cityHeader: 'المدينة او المحافظة',
    },
    // Example: Learning Studios responses with a fixed product (uncomment + set the sheet id):
    // { name: 'Learning Studios (Tally WObLzk)', sheetId: 'SHEET_ID', tab: 'Sheet1',
    //   dateHeader: 'Submitted at', fixedProduct: 'learning-studios',
    //   cityHeader: 'المدينة أو المحافظة أو المنطقة "مثال: القاهرة - المعادي"' },
  ],

  // Product slugs on the website, matched against the Tally answer text or dashboard course names.
  // Order matters: the first match wins.
  PRODUCTS: [
    { slug: '3d-print-to-jewelry', patterns: ['jewel', 'حُلي', 'حلي'] },
    { slug: 'physical-ai-bootcamp', patterns: ['physical\\s*ai', 'الذكاء الاصطناعي'] },
    { slug: 'esp32-for-beginners', patterns: ['esp\\s*32'] },
    { slug: 'iot-explorers-bootcamp', patterns: ['\\biot\\b', 'انترنت الأشياء', 'إنترنت الأشياء'] },
    { slug: 'cad-digital-fabrication', patterns: ['\\bcad\\b', 'التصنيع الرقمي'] },
    { slug: 'design-thinking-bootcamp', patterns: ['design\\s*thinking', 'التفكير التصميمي'] },
    { slug: 'learning-studios', patterns: ['learning studio', 'ستوديو'] },
  ],

  LIVE_DATA_PROP: 'LIVE_DATA_SHEET_ID',
};

/* ------------------------------------------------------------------------ */
/* Web entry point                                                           */
/* ------------------------------------------------------------------------ */
function doGet(e) {
  var params = (e && e.parameter) || {};
  var cache = CacheService.getScriptCache();
  var body = cache.get('live_v1');
  var adminKey = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  var forceRefresh = adminKey && params.key === adminKey && params.refresh === '1';
  if (!body || forceRefresh) {
    try {
      body = JSON.stringify(buildStats_());
      cache.put('live_v1', body, CONFIG.CACHE_SECONDS);
    } catch (err) {
      body = JSON.stringify({ ok: false, error: 'unavailable', generatedAt: new Date().toISOString() });
    }
  }
  var cb = params.callback;
  if (cb && /^[A-Za-z_$][\w$.]{0,40}$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + body + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------------ */
/* Aggregation                                                               */
/* ------------------------------------------------------------------------ */
function buildStats_() {
  var now = new Date();
  var DAY = 864e5;
  var todayKey = Utilities.formatDate(now, CONFIG.TZ, 'yyyy-MM-dd');
  var trendKeys = [];
  for (var i = CONFIG.TREND_DAYS - 1; i >= 0; i--) {
    trendKeys.push(Utilities.formatDate(new Date(now.getTime() - i * DAY), CONFIG.TZ, 'yyyy-MM-dd'));
  }
  var res = {};
  CONFIG.PRODUCTS.forEach(function (p) { res[p.slug] = blank_(); });
  var tot = blank_();
  var matchers = CONFIG.PRODUCTS.map(function (p) {
    return { slug: p.slug, rx: p.patterns.map(function (s) { return new RegExp(s, 'i'); }) };
  });

  CONFIG.SOURCES.forEach(function (src) {
    var sh = SpreadsheetApp.openById(src.sheetId).getSheetByName(src.tab);
    if (!sh) return;
    var values = sh.getDataRange().getValues();
    if (values.length < 2) return;
    var head = values.shift().map(function (h) { return String(h).trim(); });
    var iD = head.indexOf(src.dateHeader.trim());
    var iP = src.productHeader ? head.indexOf(src.productHeader.trim()) : -1;
    var iC = [];
    head.forEach(function (h, idx) { if (src.cityHeader && h === src.cityHeader.trim()) iC.push(idx); });
    if (iD < 0) return;

    values.forEach(function (r) {
      var t = toDate_(r[iD]);
      if (!t) return;
      var age = (now - t) / DAY;
      if (age < -1) return; // ignore future-dated rows
      var key = Utilities.formatDate(t, CONFIG.TZ, 'yyyy-MM-dd');
      var city = '';
      for (var c = 0; c < iC.length && !city; c++) city = String(r[iC[c]] || '').trim();
      var slug = src.fixedProduct || null;
      if (!slug && iP >= 0) {
        var txt = String(r[iP] || '');
        for (var m = 0; m < matchers.length && !slug; m++) {
          if (matchers[m].rx.some(function (rx) { return rx.test(txt); })) slug = matchers[m].slug;
        }
      }
      add_(tot, t, age, key, city, todayKey);
      if (slug && res[slug]) add_(res[slug], t, age, key, city, todayKey);
    });
  });

  var rounds = nextRounds_();
  var products = {};
  Object.keys(res).forEach(function (slug) {
    var out = finish_(res[slug], trendKeys);
    if (rounds[slug]) out.nextRound = rounds[slug];
    products[slug] = out;
  });
  return {
    ok: true,
    generatedAt: now.toISOString(),
    cacheSeconds: CONFIG.CACHE_SECONDS,
    totals: finish_(tot, trendKeys),
    products: products,
  };
}

function blank_() { return { today: 0, d7: 0, d30: 0, all: 0, last: null, govs: {}, daily: {} }; }

function add_(o, t, age, key, city, todayKey) {
  o.all++;
  if (age <= 30) { o.d30++; if (city) o.govs[normGov_(city)] = 1; }
  if (age <= 7) o.d7++;
  if (key === todayKey) o.today++;
  if (age <= CONFIG.TREND_DAYS) o.daily[key] = (o.daily[key] || 0) + 1;
  if (!o.last || t > o.last) o.last = t;
}

function finish_(o, trendKeys) {
  var min = CONFIG.MIN_PUBLIC;
  var sup = function (n) { return n >= min ? n : null; };
  var last = null;
  if (o.last && o.d30 >= min) {
    var rounded = new Date(Math.floor(o.last.getTime() / 300000) * 300000); // round down to 5 minutes
    last = rounded.toISOString();
  }
  var govCount = Object.keys(o.govs).length;
  return {
    today: sup(o.today),
    d7: sup(o.d7),
    d30: sup(o.d30),
    all: sup(o.all),
    lastSignupAt: last,
    governorates30: govCount >= 2 ? govCount : null,
    daily: o.d30 >= min ? trendKeys.map(function (k) { return o.daily[k] || 0; }) : null,
  };
}

function normGov_(s) {
  return String(s).replace(/[ً-ْ]/g, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim().toLowerCase();
}

function toDate_(v) {
  if (v instanceof Date && !isNaN(v)) return v;
  if (v == null || v === '') return null;
  var s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    s = s.replace(' ', 'T') + (CONFIG.ASSUME_UTC_FOR_TEXT_DATES ? 'Z' : '');
  }
  var d = new Date(s);
  return isNaN(d) ? null : d;
}

/* ------------------------------------------------------------------------ */
/* Next round + seats (from the "San3a Website Live Data" sheet)             */
/*   tab "rounds"      — edited by the team: product_slug, round_name,         */
/*                       start_date, end_date, capacity, enrolled, status      */
/*   tab "rounds_auto" — optional, written every 15 min by DashboardExport.gs  */
/*                       (course, round, start, end, enrolled) — counts only   */
/* ------------------------------------------------------------------------ */
function nextRounds_() {
  var id = PropertiesService.getScriptProperties().getProperty(CONFIG.LIVE_DATA_PROP);
  if (!id) return {};
  var ss;
  try { ss = SpreadsheetApp.openById(id); } catch (e) { return {}; }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var auto = readTab_(ss, 'rounds_auto').map(function (r) {
    return { slug: slugFor_(r.course), round: String(r.round || ''), start: toDate_(r.start), end: toDate_(r.end), enrolled: num_(r.enrolled) };
  }).filter(function (r) { return r.slug; });
  var manual = readTab_(ss, 'rounds').map(function (r) {
    return { slug: String(r.product_slug || '').trim(), round: String(r.round_name || ''), start: toDate_(r.start_date), end: toDate_(r.end_date),
             capacity: num_(r.capacity), enrolled: num_(r.enrolled), status: String(r.status || 'open').toLowerCase() };
  }).filter(function (r) { return r.slug && r.status !== 'hidden'; });

  var out = {};
  manual.forEach(function (r) {
    if (!r.start || r.start < today) return;
    var cur = out[r.slug];
    if (cur && new Date(cur.start) <= r.start) return;
    var enrolled = r.enrolled;
    if (enrolled == null) {
      var a = auto.filter(function (x) { return x.slug === r.slug && ((r.round && x.round === r.round) || (x.start && sameDay_(x.start, r.start))); })[0];
      if (a) enrolled = a.enrolled;
    }
    var seatsLeft = (r.capacity != null && enrolled != null) ? Math.max(0, r.capacity - enrolled) : null;
    out[r.slug] = {
      name: r.round || null,
      start: Utilities.formatDate(r.start, CONFIG.TZ, 'yyyy-MM-dd'),
      end: r.end ? Utilities.formatDate(r.end, CONFIG.TZ, 'yyyy-MM-dd') : null,
      capacity: r.capacity,
      seatsLeft: seatsLeft,
      status: seatsLeft === 0 ? 'full' : r.status,
    };
  });
  return out;
}

function readTab_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) return [];
  var v = sh.getDataRange().getValues();
  if (v.length < 2) return [];
  var h = v.shift().map(function (x) { return String(x).trim().toLowerCase(); });
  return v.filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    var o = {}; h.forEach(function (k, i) { o[k] = r[i]; }); return o;
  });
}
function num_(v) { if (v === '' || v == null) return null; var n = Number(v); return isNaN(n) ? null : n; }
function sameDay_(a, b) { return Utilities.formatDate(a, CONFIG.TZ, 'yyyy-MM-dd') === Utilities.formatDate(b, CONFIG.TZ, 'yyyy-MM-dd'); }
function slugFor_(course) {
  var txt = String(course || '');
  for (var i = 0; i < CONFIG.PRODUCTS.length; i++) {
    var p = CONFIG.PRODUCTS[i];
    if (p.patterns.some(function (s) { return new RegExp(s, 'i').test(txt); })) return p.slug;
  }
  return null;
}

/* ------------------------------------------------------------------------ */
/* One-time setup + helpers                                                  */
/* ------------------------------------------------------------------------ */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(CONFIG.LIVE_DATA_PROP);
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('San3a Website Live Data');
  props.setProperty(CONFIG.LIVE_DATA_PROP, ss.getId());
  var r = ss.getSheetByName('rounds') || ss.insertSheet('rounds');
  if (r.getLastRow() === 0) {
    r.appendRow(['product_slug', 'round_name', 'start_date', 'end_date', 'capacity', 'enrolled', 'status', 'note']);
    CONFIG.PRODUCTS.forEach(function (p) { r.appendRow([p.slug, '', '', '', '', '', 'open', 'Fill start_date + capacity. Leave enrolled empty to use rounds_auto.']); });
    r.setFrozenRows(1);
  }
  var a = ss.getSheetByName('rounds_auto') || ss.insertSheet('rounds_auto');
  if (a.getLastRow() === 0) a.appendRow(['course', 'round', 'start', 'end', 'enrolled', 'updated_at']);
  var first = ss.getSheetByName('Sheet1'); if (first && ss.getSheets().length > 1) ss.deleteSheet(first);
  if (!props.getProperty('ADMIN_KEY')) props.setProperty('ADMIN_KEY', Utilities.getUuid());
  Logger.log('Live Data sheet: ' + ss.getUrl());
  Logger.log('Share it (Editor) with whoever maintains rounds. Dashboard export needs its id: ' + ss.getId());
  Logger.log(JSON.stringify(buildStats_()).slice(0, 2000));
}

/** Preview the public JSON in the editor log (no caching). */
function preview() { Logger.log(JSON.stringify(buildStats_(), null, 2)); }
