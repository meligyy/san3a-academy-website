// Checks every internal href/src in dist/ resolves to a built file. Usage: BASE_PATH=/repo npm run build && npm run check:links
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
const DIST = resolve('dist');
const BASE = (process.env.BASE_PATH || '/').replace(/\/$/, '');
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); } })(DIST);
const bad = new Map();
const exists = (u) => {
  let p = u.split('#')[0].split('?')[0];
  if (!p) return true;
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length) || '/';
  const f = join(DIST, decodeURIComponent(p));
  return existsSync(f) && statSync(f).isFile() || existsSync(join(f, 'index.html'));
};
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let u = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(u)) continue;
    if (!u.startsWith('/')) u = resolve('/', dirname(file.slice(DIST.length)), u);
    if (!exists(u)) { const k = u; bad.set(k, (bad.get(k) || new Set()).add(file.slice(DIST.length))); }
  }
}
if (bad.size) { for (const [u, from] of bad) console.log('BROKEN', u, '<-', [...from].slice(0, 3).join(', ')); process.exit(1); }
console.log(`OK — ${files.length} pages, all internal links resolve.`);
