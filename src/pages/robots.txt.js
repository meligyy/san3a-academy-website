export function GET({ site }) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const origin = (site ? site.origin : '') + base;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain' } });
}
