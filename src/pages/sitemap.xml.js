import { programs, news, posts } from '../lib/content.js';
const STATIC = ['/', '/programs/', '/kids/', '/youth/', '/educators/', '/about/', '/impact/', '/partners/', '/stories/', '/news/', '/blog/', '/contact/'];
export function GET({ site }) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const origin = (site ? site.origin : 'https://meligyy.github.io') + base;
  const en = (p) => origin + p;
  const ar = (p) => origin + (p === '/' ? '/ar/' : '/ar' + p);
  const pairs = [...STATIC, ...programs.map((p) => `/programs/${p.slug}/`), ...news.map((n) => `/news/${n.slug}/`)];
  const arSlugs = new Set(posts('ar').map((p) => p.slug));
  const blog = posts('en').map((p) => ({ path: `/blog/${p.slug}/`, both: arSlugs.has(p.slug), date: p.updated || p.date }));
  const arOnly = posts('ar').filter((p) => !posts('en').some((e) => e.slug === p.slug)).map((p) => `/blog/${p.slug}/`);
  const entry = (loc, alts, lastmod) => `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}${alts.map(([l, h]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${h}"/>`).join('')}</url>`;
  const urls = [];
  for (const p of pairs) { const alts = [['en', en(p)], ['ar', ar(p)], ['x-default', en(p)]]; urls.push(entry(en(p), alts), entry(ar(p), alts)); }
  for (const b of blog) { const alts = b.both ? [['en', en(b.path)], ['ar', ar(b.path)], ['x-default', en(b.path)]] : []; urls.push(entry(en(b.path), alts, b.date)); if (b.both) urls.push(entry(ar(b.path), alts, b.date)); }
  for (const p of arOnly) urls.push(entry(ar(p), []));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
