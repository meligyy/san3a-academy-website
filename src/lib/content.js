// Content loaders. Files are plain JSON / Markdown so the team can edit them in Pages CMS (/.pages.yml)
// or directly on GitHub; every commit triggers a cloud build.

const programModules = import.meta.glob('../content/programs/*.json', { eager: true });
const newsModules = import.meta.glob('../content/news/*.json', { eager: true });
const storyModules = import.meta.glob('../content/stories/*.json', { eager: true });
const postModules = import.meta.glob('../content/blog/*/*.md', { eager: true });

const unwrap = (m) => (m && m.default ? m.default : m);

export const AUDIENCES = ['kids', 'youth', 'educators'];

export const programs = Object.values(programModules)
  .map(unwrap)
  .filter((p) => p && p.slug && p.published !== false)
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

export const getProgram = (slug) => programs.find((p) => p.slug === slug);
export const programsFor = (audience) => programs.filter((p) => p.audience === audience);
export const featuredPrograms = () => programs.filter((p) => p.featured);

export const news = Object.values(newsModules)
  .map(unwrap)
  .filter((n) => n && n.slug && n.published !== false)
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));

export const stories = Object.values(storyModules)
  .map(unwrap)
  .filter((s) => s && s.slug && s.published !== false)
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

/** Blog posts for a language: src/content/blog/<lang>/<slug>.md */
export function posts(lang) {
  return Object.entries(postModules)
    .map(([path, mod]) => {
      const m = path.match(/blog\/(en|ar)\/([^/]+)\.md$/);
      if (!m) return null;
      const fm = mod.frontmatter || {};
      return { lang: m[1], slug: fm.slug || m[2], ...fm, Content: mod.Content, raw: mod };
    })
    .filter((p) => p && p.lang === lang && p.draft !== true)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export const BLOG_CATEGORIES = {
  electronics: { en: 'Electronics & IoT', ar: 'الإلكترونيات وإنترنت الأشياء' },
  ai: { en: 'AI & Robotics', ar: 'الذكاء الاصطناعي والروبوتات' },
  fabrication: { en: 'Digital Fabrication', ar: 'التصنيع الرقمي' },
  careers: { en: 'Careers & Skills', ar: 'الوظائف والمهارات' },
  kids: { en: 'Kids & Parents', ar: 'الأطفال وأولياء الأمور' },
  educators: { en: 'Teaching & Educators', ar: 'التعليم والمدرسين' },
  community: { en: 'Community & Impact', ar: 'المجتمع والأثر' },
};

/** Rough reading time in minutes from a Markdown module. */
export function readingTime(post) {
  if (post.readingTime) return post.readingTime;
  try {
    const raw = post.raw && post.raw.rawContent ? post.raw.rawContent() : '';
    const words = raw.split(/\s+/).filter(Boolean).length;
    return Math.max(3, Math.round(words / 200));
  } catch {
    return 5;
  }
}
