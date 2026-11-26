// Site-wide settings. Editable by the team (also exposed in Pages CMS as "Site settings").
// Numbers: San3a Academy Profile, July 2026 (canonical per Brand Manual v1.2).
export const site = {
  name: { en: 'San3a Academy', ar: 'صنعة أكاديمي' },
  domain: 'san3aacademy.com',
  email: 'academy@san3atech.com',
  whatsapp: '', // e.g. '201000000000' — international format without +; leave empty to hide WhatsApp buttons
  address: {
    en: 'San3a Tech HQ · Villa 35, 100 St., Maadi, Cairo',
    ar: 'مقر صنعة · فيلا ٣٥، شارع ١٠٠، المعادي، القاهرة',
  },
  mapUrl: 'https://maps.google.com/?q=Fab+Lab+Egypt+Villa+35+Street+100+Maadi+Cairo',
  socials: {
    facebook: 'https://www.facebook.com/san3aacademy',
    instagram: 'https://www.instagram.com/san3aacademy',
    linkedin: 'https://www.linkedin.com/company/san3a-academy',
    youtube: '',
    tiktok: '',
  },
  linktree: 'https://linktr.ee/san3a_academy',
  parent: { name: 'San3a Tech', url: 'https://san3a.san3atech.workers.dev/' },
  verifyCertificateUrl: 'https://www.makerdiploma.com/alumni-list',

  // Analytics (leave empty to disable). Funnel events sent: apply_click, form_view, form_start, generate_lead (Tally submit).
  ga4Id: '',          // e.g. 'G-XXXXXXXXXX'
  metaPixelId: '',    // e.g. '1234567890'
  // Learning platform (Softobia / Odoo LMS). When set, a "Log in" button appears in the header.
  lmsUrl: '',

  // Live stats feed (Google Apps Script web app — see /apps-script/README.md).
  // Leave empty until deployed; the site then shows the hourly snapshot written by GitHub Actions.
  liveApi: '',
  liveRefreshSeconds: 180,
  liveMinCount: 3, // hide a live number below this (avoids weak "1 person" social proof)

  // Tally forms (application flow). Embedded on program pages.
  tally: {
    bootcamps: 'jaQ1O4',      // Employability & Upskilling Bootcamps (commercial)
    makerDiploma: 'obyQ8e',   // Maker Diploma Application Form
    girlsMake: 'VL2xLJ',      // Girls Make scholarship application
    eduMakers: '7XqaE2',      // EduMakers diploma application (teachers)
    studios: 'WObLzk',        // Learning Studios (kids, parents register)
  },

  impact: [
    { n: '1,000+', en: 'alumni from our programs', ar: 'خريج وخريجة من برامجنا' },
    { n: '5,000+', en: 'people reached, directly and indirectly', ar: 'شخص وصلنا لهم بشكل مباشر وغير مباشر' },
    { n: '509', en: 'Maker Diploma graduates since 2015 — 44% women', ar: 'خريج من دبلومة الميكر منذ ٢٠١٥ — ٤٤٪ سيدات' },
    { n: '289', en: 'Girls Make graduates in seven cities', ar: 'خريجة من برنامج Girls Make في سبع مدن' },
  ],
  impactSource: { en: 'Source: San3a Academy Profile, July 2026.', ar: 'المصدر: ملف صنعة أكاديمي، يوليو ٢٠٢٦.' },
  jobStat: { n: '42%', en: 'of graduates said the Maker Diploma helped them find a better job.', ar: 'من الخريجين قالوا إن دبلومة الميكر ساعدتهم يلاقوا شغل أفضل.', source: { en: 'San3a Academy graduate survey', ar: 'استبيان خريجي صنعة أكاديمي' } },

  pillars: [
    { en: 'Employability & Upskilling', ar: 'التوظيف وتطوير المهارات', den: 'Skills that get people hired — proven by the projects they build.', dar: 'مهارات بتفتح أبواب الشغل — وبيثبتها المشروع اللي بتبنيه.' },
    { en: 'Innovation in Education', ar: 'الابتكار في التعليم', den: 'New ways to teach and learn, tested in our own studios first.', dar: 'طرق جديدة للتعليم والتعلّم، بنجربها في ستوديوهاتنا الأول.' },
    { en: 'STEAM & Creative Learning', ar: 'STEAM والتعلّم الإبداعي', den: 'Science, technology, engineering, art and maths, learned by making.', dar: 'العلوم والتكنولوجيا والهندسة والفنون والرياضيات، بنتعلمها بالتصنيع.' },
    { en: 'Community & Sustainability', ar: 'المجتمع والاستدامة', den: 'Makers who repair, reuse and build for their own communities.', dar: 'صُنّاع بيصلّحوا ويعيدوا الاستخدام ويبنوا لمجتمعاتهم.' },
    { en: 'Access & Inclusion', ar: 'الإتاحة والشمول', den: 'Scholarships, women in tech and programs beyond Cairo.', dar: 'منح، ودعم للبنات في التكنولوجيا، وبرامج خارج القاهرة.' },
  ],
};
