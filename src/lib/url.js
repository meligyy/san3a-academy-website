// Base-path aware URL helpers (GitHub Pages serves the site under /<repo>/ until a custom domain is set).
const RAW = import.meta.env.BASE_URL || '/';
export const BASE = RAW.endsWith('/') ? RAW.slice(0, -1) : RAW;

/** Prefix an absolute site path with the deploy base. */
export function url(path = '/') {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const p = path.startsWith('/') ? path : '/' + path;
  return (BASE + p) || '/';
}

/** Path for a page in a given language. English is the default (no prefix); Arabic lives under /ar. */
export function lp(lang, path = '/') {
  const p = path.startsWith('/') ? path : '/' + path;
  if (lang === 'ar') return url(p === '/' ? '/ar/' : '/ar' + p);
  return url(p);
}

/** Pick a bilingual value: obj.en / obj.ar, or {en, ar} objects, falling back to English. */
export function t(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return value;
  return value[lang] ?? value.en ?? '';
}

export const dir = (lang) => (lang === 'ar' ? 'rtl' : 'ltr');

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
/** Format a number for display. Arabic pages keep Western digits for numbers in stats (matches brand posts) unless arabicDigits=true. */
export function num(n, lang, arabicDigits = false) {
  if (n == null || n === '') return '';
  const s = typeof n === 'number' ? n.toLocaleString('en-US') : String(n);
  if (lang === 'ar' && arabicDigits) return s.replace(/[0-9]/g, (d) => AR_DIGITS[+d]);
  return s;
}
