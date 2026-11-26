// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Actions passes BASE_PATH / SITE_ORIGIN from actions/configure-pages.
// Locally (or on a custom domain) they default to the site root.
const base = process.env.BASE_PATH && process.env.BASE_PATH !== '' ? process.env.BASE_PATH : '/';
const site = process.env.SITE_ORIGIN || 'https://meligyy.github.io';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  compressHTML: true,
});
