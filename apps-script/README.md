# Live stats for the website (Google Apps Script)

The website shows **live, aggregate-only** numbers on commercial product pages:

| Shown on the site | Where it comes from |
|---|---|
| Sign-ups this week / last 30 days, 14-day trend | Tally → *Employability Courses Tally Leads Hub* sheet (date + product columns only) |
| "Last sign-up 12 minutes ago" | same (rounded down to 5 minutes, only when ≥ 3 sign-ups in 30 days) |
| Governorates reached this month | same (governorate column, counted, never listed) |
| Next round date + seats left | *San3a Website Live Data* sheet (`rounds` tab, + optional `rounds_auto` from the dashboard) |

Nothing else leaves Google: **no names, phones, e-mails, prices, advisors, payments, waitlist or blacklist.**
Any count below 3 is suppressed.

## ⚠️ First: secure the existing dashboard

`San3a Academy Dashboard` (`…/macros/s/AKfycby1naw…/exec`) is currently deployed with **Who has access: Anyone**.
Anyone with the link can open it, and its `getData()` / `getRounds()` functions return named leads, payments and the blacklist.

Fix (2 minutes): open the dashboard project → **Deploy → Manage deployments → ✏️ → Who has access: _Anyone within san3atech.com_** → Deploy.
The website never uses that deployment.

## 1. Deploy the Live API (once)

1. Go to <https://script.google.com> → **New project** → name it `San3a Website Live API`.
2. Paste [`LiveApi.gs`](LiveApi.gs). In **Project Settings** tick *Show appsscript.json* and paste [`appsscript.json`](appsscript.json).
3. Run **`setup`** once and authorise. The log prints the URL of the new **San3a Website Live Data** sheet.
4. **Deploy → New deployment → Web app** · *Execute as:* **Me** · *Who has access:* **Anyone** → copy the `/exec` URL.
5. Put the URL in the website:
   - `src/data/site.js` → `liveApi: 'https://script.google.com/macros/s/…/exec'`, and
   - GitHub repo → **Settings → Secrets and variables → Actions → Variables** → `LIVE_API_URL` (used for the hourly snapshot).

Test: open the `/exec` URL in a browser — you should see JSON like:

```json
{ "ok": true, "totals": { "d30": 603 }, "products": { "esp32-for-beginners": { "d7": 41, "d30": 160, "lastSignupAt": "…", "governorates30": 14, "daily": [ … ], "nextRound": { "start": "2026-12-12", "seatsLeft": 6 } } } }
```

## 2. Keep "next round + seats" up to date

In the **San3a Website Live Data** sheet → `rounds` tab, one row per upcoming round:

| product_slug | round_name | start_date | end_date | capacity | enrolled | status |
|---|---|---|---|---|---|---|
| esp32-for-beginners | Round 8 | 2026-12-12 | 2027-02-20 | 20 | *(empty = automatic)* | open |

`status`: `open`, `waitlist` or `hidden`. When `enrolled` reaches `capacity` the site shows *Round full — join the waitlist*.

### Optional: automatic enrolled counts from the dashboard

Paste [`DashboardExport.gs`](DashboardExport.gs) into the **dashboard** project, add the script property
`LIVE_DATA_SHEET_ID`, run `installPublicRoundsTrigger()`. Every 15 minutes it copies *course, round, start, end, number of people*
into `rounds_auto` — nothing else.

## 3. Add more products or forms

Edit `CONFIG.PRODUCTS` (slug + text patterns that match the Tally answer) and `CONFIG.SOURCES`
(e.g. the Learning Studios responses sheet with `fixedProduct: 'learning-studios'`). Re-deploy (**Manage deployments → Edit → New version**).
