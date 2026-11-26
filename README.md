# San3a Academy website · صنعة أكاديمي

The public website of **San3a Academy**: a multi-page, bilingual (English default, Arabic under `/ar/`) site in the direction of Udacity (program catalog, rich program pages, audience "schools", partners/enterprise, blog), built on the **San3a Academy Brand Manual v1.2**.

It is built and hosted **in the cloud**. Every push to `main` triggers GitHub Actions, which builds the site and publishes it to GitHub Pages. Nothing has to be built on anyone's computer.

| | |
|---|---|
| Stack | [Astro 5](https://astro.build) static site · plain CSS design tokens · no client framework |
| Hosting | GitHub Pages via `.github/workflows/deploy.yml` (on push + hourly) |
| Editing | [Pages CMS](https://pagescms.org) (`.pages.yml`) or the GitHub web editor |
| Applications | Tally forms, embedded on every program page (UTM & `fbclid` forwarded automatically) |
| Live stats | Google Apps Script "Live API" (aggregate counts only) + hourly snapshot (`public/live/snapshot.json`) |

---

## 1. One-time setup (≈ 5 minutes)

1. **Make the repository public:** Settings → General → Danger Zone → *Change visibility*. GitHub Pages on the free plan needs this.
2. **Turn on Pages:** Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
3. Re-run the workflow: Actions → *Build & deploy (GitHub Pages)* → *Run workflow*.
   The site goes live at `https://meligyy.github.io/san3a-academy-website/`.
4. **Custom domain** (when ready): Settings → Pages → Custom domain `san3aacademy.com`, then add the DNS records GitHub shows you. The build picks up the new base path automatically.

If a build fails, the workflow writes its log to the **`ci-logs`** branch (`build.log`).

## 2. Editing content (no code)

Open **<https://app.pagescms.org>**, sign in with GitHub and choose this repository. You can edit:

- **Programs:** one file per program (`src/content/programs/*.json`), with English and Arabic side by side: card text, key facts, syllabus modules, projects, FAQs, fees, the Tally form and the pre-selected product.
- **Blog (English / Arabic):** Markdown articles with SEO fields (`src/content/blog/{en,ar}/*.md`). Covers are 1600×900 in `public/images/blog/`.
- **News & events, Alumni stories, Home, Kids/Youth/Educators, About, Impact, Partners** pages.

Every save is a commit. The site rebuilds and goes live in about 1–2 minutes.

**To add a program:** duplicate a program file and change the `slug`, `audience`, `type`, `status`, texts and Tally form. It then appears in the catalog, the mega-menu, its audience page, the footer and the sitemap automatically.

## 3. Applications (Tally)

Program pages embed their Tally form (`site.js → tally`):

| Key | Form |
|---|---|
| `bootcamps` | `jaQ1O4` Employability & Upskilling Bootcamps (ESP32, IoT, Physical AI, CAD, Jewelry) |
| `makerDiploma` | `obyQ8e` Maker Diploma application |
| `girlsMake` | `VL2xLJ` Girls Make scholarship application |
| `eduMakers` | `7XqaE2` EduMakers application (teachers) |
| `studios` | `WObLzk` Learning Studios (parents) |

The embed forwards the page's query string to the form's hidden fields (`utm_*`, `fbclid`, `originPage`). Each program can pre-select its product through `tally.product`. For this to work, the form's product question must use the `product` hidden field as its default answer.

## 4. Live stats (aggregate only)

Commercial product pages show a **LIVE** strip with these figures:
- sign-ups this week / in the last 30 days
- a 14-day trend
- time of the last sign-up
- governorates reached
- next round and seats left

The **catalog cards** show a live badge, and the **home page** shows a live ticker.

Setup is in [`apps-script/README.md`](apps-script/README.md). In short: deploy `apps-script/LiveApi.gs` as a public web app, then put its URL in `src/data/site.js → liveApi` and in the repository variable **`LIVE_API_URL`**, which the hourly snapshot uses. The API never returns names, phones, e-mails or prices, and it suppresses counts below 3.

> ⚠️ The existing *San3a Academy Dashboard* Apps Script is deployed with **"Anyone"** access, and its functions return named leads and payments. Restrict it to *Anyone within san3atech.com*. See `apps-script/README.md`.

## 5. Analytics

Set `ga4Id` and/or `metaPixelId` in `src/data/site.js`. The site then sends these funnel events, with no personal data:
- `apply_click`
- `form_view` (Tally embed loaded)
- `form_start` (first form page)
- `generate_lead` (Tally submitted). This event also fires a Meta `Lead`.

## 6. Brand & design system

Every brand value is a CSS token at the top of [`src/styles/global.css`](src/styles/global.css):
- colours: Red, Crimson, Wine, Night, Blush, Plum, plus the audience colours
- the eight-step **stripes**
- shapes, radii and type

Fonts use the brand manual's own free look-alikes (Montserrat ≈ Big John, Arvo, Source Sans 3 ≈ Myriad Pro, Alexandria ≈ GE SS Two). To switch to the licensed fonts, add the web-licensed files to `public/fonts/` and change the `--f-*` tokens. Because everything runs on tokens, the upcoming TBG rebrand only needs a token update.

## 7. Structure

```
src/
  content/programs/*.json     programs (EN + AR)
  content/blog/{en,ar}/*.md   blog articles
  content/news/*.json         news & events
  content/stories/*.json      alumni stories & testimonials
  content/pages/*.json        editable page copy (home, audiences, about, impact, partners)
  data/site.js                contact, socials, numbers, Tally ids, live API, analytics
  i18n/ui.js                  interface strings (EN/AR)
  views/*.astro               page templates (one per page type, shared by EN and AR)
  pages/                      routes (EN at /, AR at /ar/)
public/
  images/                     photos, brand assets, blog covers
  js/site.js · js/live.js     menus, filters, Tally embeds, analytics · live stats
  live/snapshot.json          live-stats fallback (refreshed hourly in CI)
apps-script/                  Live API (Google Apps Script) + setup guide
```

## 8. Launch checklist (target: Sun 20 Dec 2026)

- [ ] Repo public, Pages on, custom domain + HTTPS
- [ ] Live API deployed; `liveApi` + `LIVE_API_URL` set; dashboard access restricted
- [ ] Tally hidden fields `product` / `originPage` published on all embedded forms
- [ ] GA4 / Meta Pixel ids set; conversions marked in GA4 (`generate_lead`)
- [ ] WhatsApp number in `site.js` (enables "Ask us on WhatsApp" buttons)
- [ ] Confirm Maker Diploma Winter 2027 fees text and bootcamp round dates/seats
- [ ] Submit `sitemap.xml` in Google Search Console
