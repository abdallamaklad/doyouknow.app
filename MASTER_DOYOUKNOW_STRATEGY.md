# Master doyouknow.app Strategy

---

## ⚡ 2026-07-11 review addendum (read this first)

Follow-up session to the 2026-07-10 audit: closed out its manual VPS remediation, then coordinated/shipped two new bilingual content batches (T46 business/marketing, T47 Islamic knowledge) through commit, verification, and deploy.

### VPS remediation from 2026-07-10 — now done
- PR #1 (`worktree-site-audit-july10`) merged to `main` (`ea2193c`).
- Applied the `handle_errors` 404 block to the live Caddy config at `/root/qulture/deploy/Caddyfile` (validated + graceful reload; all 4 domains on the shared box confirmed healthy after). Verified both `/en/404.html` and `/ar/404.html` now serve on missing URLs.
- Deleted the 8 previously-exposed internal docs from `/var/www/doyouknow/current` (research/, marketing/, docs/, design/, the strategy/audit `.md` files, `editorial-review.json`); all now 404 on prod.

### T46 (Business & Marketing) and T47 (Islamic Knowledge) — both live
- T46: 6 bilingual articles (Dubai company registration, golden visa, Saudi SME support, UAE free zones, UAE vs Saudi setup, why Dubai is rich). Primary-source verified — 4 stale official-source URLs fixed (u.ae paths restructured, DMCC page moved, wrong D33 domain); all other claims already appropriately hedged. Released from noindex. Merged via PR #4.
- T47: 6 bilingual articles (five pillars, Hijri calendar, Islamic New Year, Laylat al-Qadr, sadaqah vs zakat, Two Holy Mosques history). Originally drafted at ~40% of the 2.5k-3.5k word spec — expanded all 12 files to 2.2k-2.5k words. Primary-source verified — 3 **invented/dead** cited domains fixed (`haramainshareef.gov.sa`, `zakat.gov.sa`, `zakatfund.gov.ae` all NXDOMAIN → replaced with real official sites). Released from noindex. Merged via PR #3 (after #4, per a documented `editorial-review.json`/`prepare.mjs` conflict-resolution plan — union both sides, don't hand-merge generated files).
- Both verified live 2026-07-11: 24/24 new pages return `index, follow`, present in sitemap.xml, tiled correctly on both category pages, and searchable in both language indexes (EN index now 128 articles).

### New failure modes found this session (watch for these in future batches)
1. **Shared-checkout contamination, twice.** Multiple agents (Codex, Kimi, parallel Claude sessions) working directly in `/Users/abdallamaklad/Documents/Doyouknow` without isolation caused two incidents: uncommitted business-batch edits leaking into an islamic-batch commit (fixed in `7fc5e4e`), and — more subtly — Codex's uncommitted `prepare.mjs`/`add-article-images.mjs` category-list edits getting baked into Kimi's original T47 commit, which then crashed the build with `ENOENT` (only found and fixed in `d6ea8bf`, because an earlier `npm run build 2>&1 | tail -N` had piped away the actual crash). **Always isolate in a worktree; always check real exit codes, not a piped tail.**
2. **Word-count spec undershoot.** T47 shipped at roughly 40% of the requested 2.5k-3.5k words per file — this needs an explicit self-check step (strip tags, count words, expand until in range) built into the task spec, not just stated as a target.
3. **Invented source URLs.** Three of T47's cited "official" sources were domains that don't exist (NXDOMAIN, not just geo-blocked). Any citation added by an agent needs an actual reachability check before shipping, distinguishing "geo-blocked/slow" (acceptable, cross-reference via search) from "doesn't resolve" (fabricated, must fix).
4. **Background-agent session limits.** Both forks dispatched for T46/T47 verification hit an API session-limit mid-task and reported a misleading "still running" status on resume before the real cutoff was discovered. Don't fully trust a resumed fork's self-report — verify actual git state (`log`, `diff --stat`) before accepting "done."

### Next up (in flight as of 2026-07-11)
T48 (deploy, done by Codex before this addendum was written), T49 (Kimi — 6 more bilingual Saudi practical-service guides: iqama, family visit visa, Nafath, SADAD, renting in Riyadh, mobile plans), T50 (Codex — 6 more bilingual UAE practical-service guides: Emirates ID, residence visa comparison, renting in Dubai, DEWA setup, traffic fines, school year) — both already started in their own worktrees as of this writing.

---

## ⚡ 2026-07-10 review addendum (read this first)

Full-site re-audit on 2026-07-10 (repo + live prod checks). Status of the 2026-07-07 findings and new work:

### Fixed in this pass (branch `worktree-site-audit-july10`)
1. **Editorial-release desync (new, P1):** `prepare.mjs` hardcoded a 7-page noindex set that ignored `editorial-review.json`. Five articles cleared by the 2026-07-08 review (hajj-guide, umrah-guide, what-is-zakat, islamic-finance-guide, ramadan-health-guide) were still noindex/out-of-sitemap on EN while their AR twins were indexed. `prepare.mjs` now reads the JSON as single source of truth — editing the JSON + build is the whole release mechanism from now on. EN search index 229 → 234.
2. **Fake forms (new, P0-trust):** Contact + Work With Us forms discarded every submission (inline `onsubmit` fake alert; contact variant had a quote-mismatch SyntaxError so even the alert never fired). Now deliver via `mailto:hello@doyouknow.app` with all field values + honest toast + GA4 `contact_form_submit` event. Newsletter "✓ Subscribed!" lie replaced with a prefilled subscribe email (real ESP still recommended — see MARKETING_STRATEGY.md).
3. **Dead/wrong footer links (new):** removed `href="#"` Authors/Careers links (158 pages, both languages); fixed EN "KSA" → pointed at `/ar/` category (79 pages) and AR "الإمارات" → pointed at `/en/` category (42 pages); `#categories` anchor made absolute per language; legacy "Best Of"/"Compare" labels renamed to real category names.
4. **Dark-mode brand invisibility (new):** `.logo` color `#0F172A` on a `#0F172A` header — site name invisible in dark theme on every page; global `a:hover` had the same hardcoded color. Both fixed with `[data-theme="dark"]` overrides; verified by screenshot EN+AR.
5. **F-03 (custom 404) — repo half done:** `handle_errors` block added to `deploy/Caddyfile.doyouknow` (serves `/en/404.html` or `/ar/404.html` by path). **Still requires manual apply on the VPS** — see prod cleanup below.
6. New internal doc `MARKETING_STRATEGY.md` created and added to deploy EXCLUDE.

### ⚠️ Still open on production (manual, needs VPS access)
The rsync deploy has no `--delete`, so internal docs added to the EXCLUDE list on 2026-07-07 **are still live on prod** (all verified HTTP 200 on 2026-07-10): `/research/humanization-summary.md`, `/research/competitor-gap-analysis.md`, `/marketing/ad-creative-variations.md`, `/docs/strategy-review.md`, `/traffic-monetization-plan.md`, `/seo-audit-report-2026-06-30.md`, `/MASTER_DOYOUKNOW_STRATEGY.md`, `/editorial-review.json`.

**Manual remediation (run on the VPS, web root `/var/www/doyouknow/current`):**
```bash
cd /var/www/doyouknow/current
rm -rf research marketing docs design
rm -f traffic-monetization-plan.md seo-audit-report-2026-06-30.md MASTER_DOYOUKNOW_STRATEGY.md MARKETING_STRATEGY.md editorial-review.json
# then apply the updated deploy/Caddyfile.doyouknow site block, `caddy validate`, reload
# verify: each URL above returns 404, and a missing article URL returns the styled 404 page
```
Note `editorial-review.json` is needed by nothing at runtime (build-time only) — safe to delete from the web root.

### Verification run 2026-07-10
`npm test` → SEO/link audit passed, 259 pages, 0 errors. `npm run build` → idempotent (zero diff on rebuild). `node --check site.js` OK. Browser-verified: contact form submit (single listener, toast, mailto), footer links, EN/AR homepages in dark mode, RTL.

---

**Audit date:** 2026-07-07 · **Auditor:** deep production-readiness review (code + live-site verification against https://doyouknow.app)
**Scope:** 173 HTML pages (61 EN articles, 81 AR articles, 11 category pages, hubs/legal/404/offline), 9 build/audit scripts, deploy pipeline, live server behavior.

Every finding below was verified by direct evidence (file + line, command output, or live HTTP response). Items that could not be fully verified are explicitly labeled **needs verification**.

---

## 1. Executive Summary

The site is in **far better technical-SEO shape than a typical static content site**: canonicals, hreflang, sitemap↔canonical bidirectional consistency, noindex policy, search index, and Arabic localization are all machine-enforced by `scripts/audit.mjs` (run in CI before every deploy) and **all currently pass**. Zero broken internal links, zero missing hreflang/canonical targets, zero noindex leakage into sitemap or search index, zero English-metadata leakage on Arabic pages.

However, four production problems undermine everything the audit protects:

1. **P0 — Every page ships ~312KB of duplicated inline CSS.** A build bug in `injectCriticalCSS` (scripts/prepare.mjs:444) re-injects the same 13KB critical-CSS block on every build. Pages now contain **25 identical `<style>` blocks** and 25 nested `<noscript>` wrappers, and grow +13KB per page per build. `en/index.html` is 343KB (body is only 14.6KB). This is a direct LCP/FCP/crawl-budget hit across all 173 pages, and it compounds forever.
2. **P0 — Internal business documents are publicly served on production**, including `research/humanization-summary.md`, which explicitly documents removing "AI-generated writing patterns" from articles. For an editorial site whose entire value is trust, this being discoverable is a reputational kill-shot. Also public: the monetization plan, competitor analysis, ad-creative variations, internal strategy review, SEO audit, and the editorial-review/noindex policy. All verified returning HTTP 200 on prod.
3. **P1 — The custom 404 pages are never served.** Live check: a missing URL returns a **0-byte 404 body** (Caddy has no `handle_errors` block). The three 404.html files (each ~330KB due to bug #1) are dead weight.
4. **P1 — All 142 article social images are SVG.** Facebook/WhatsApp/X/LinkedIn do not render SVG `og:image` → every shared article shows no preview. The image sitemap also lists 127 SVGs, which Google Images does not index.

Secondary risks: 1-year `immutable` caching on unversioned mutable assets (plus a service worker with a never-bumped cache name — a double stale-cache trap), a stale nginx config in the repo that diverges from the live Caddy config, 10 articles with a `2025` year-typo in schema dates, and World Cup 2026 content that is mid-tournament right now with a data file last seeded 2026-06-26.

**Verdict:** structurally launch-ready, operationally strong (CI-gated deploys, real audit coverage), but the P0s above must be fixed before spending anything on traffic acquisition. Fixes are small and low-risk; all are build/deploy-layer, not content-layer.

---

## 2. Project Map

### Architecture
Pure static HTML/CSS/JS. No framework, no templating at request time. Articles are hand/AI-authored complete HTML files; a Node build pipeline (`scripts/prepare.mjs`, 71KB) normalizes and enriches them in place.

```
/                       root: index.html (noindex EN redirect), 404.html, sitemap.xml, robots.txt, sw.js, manifests
/en/, /ar/              index, about, contact, privacy, terms, work-with-us, offline, newsletter-template, rss.xml, feed.json, 404
/en/article/ (61)       English articles (complete standalone HTML)
/ar/article/ (81)       Arabic articles — native RTL, NOT translations (26 AR-only, 6 EN-only slugs)
/en/category/ (5)       dubai, guides, saudi, technology, world-cup-2026
/ar/category/ (6)       dubai, guides, islamic, saudi, vision-2030, world-cup-2026
/assets/css/style.css   66KB single stylesheet
/assets/js/site.js      47KB (nav, search UI, GA events, SW registration)
/assets/js/search-index.json  347KB, 141 entries, regenerated each build
/assets/images/         169 files; articles/ + world-cup-2026/ are 142 SVG featured images
/api/world-cup-2026.json  seeded fixture data (live updater deliberately disabled)
```

### Build & generation model (`scripts/prepare.mjs`)
Run via `npm run build`. Mutates article HTML in place and regenerates artifacts:
- Normalizes hreflang, canonical, social image tags, image attributes (lazy/eager, dimensions)
- Injects Article/FAQPage/BreadcrumbList JSON-LD, reading time, critical CSS (**buggy — see §3 F-01**)
- Generates: `sitemap.xml` (152 URLs + 127 image blocks), `assets/js/search-index.json`, `en|ar/rss.xml`, `en|ar/feed.json`, category pages

### Quality gate (`scripts/audit.mjs`)
Exceptionally thorough, runs as `npm test` in CI before deploy. Enforces: single H1, title 15–75 chars, description 40–180, absolute canonicals that exist on disk, no duplicate canonicals, self-referencing + x-default hreflang, valid JSON-LD, no legacy `General.html`, no SearchAction schema, World Cup live widgets stay disabled, no render-blocking Google Fonts, deferred site.js, exactly one GA tag, all internal links resolve, all featured/card images exist, Arabic pages have Arabic titles/H1s, sitemap ⊇⊆ indexable canonicals (bidirectional), search index has no noindex/missing/placeholder entries. **Currently passes: 173 pages, 0 errors.**

### Editorial/noindex model (`editorial-review.json`)
15 articles are `noindex,follow` + excluded from sitemap/search until reviewed against primary sources: government/legal/finance (9), health/religious/travel (4), fast-changing tech (2). Policy machine-enforced by audit.mjs. This is the correct design.

### Deployment
GitHub Actions (`.github/workflows/deploy.yml`): push to main → `npm test` → rsync (ssh-deploy) to VPS. EXCLUDE list: `.git, .github, scripts, package.json, package-lock.json, README.md, deploy` — **everything else in the repo ships to the public web root** (see §3 F-02). Live server is **Caddy** (verified via `server: Caddy` response header); `deploy/Caddyfile.doyouknow` matches observed headers. `deploy/nginx.conf` is a divergent stale config. `deploy/worldcup-live-scheduler.service` exists but the live updater is disabled by policy (audit-enforced).

### External services
Google Analytics 4 (`G-6VQZY87LJB`, exactly one tag per page, audit-enforced). Google Fonts preconnect hints exist but **no font stylesheet is loaded** (system-font stack) — the hints are dead. No other third parties. No API keys in the repo (World Cup scripts read from env only — verified).

---

## 3. Critical Findings

| ID | Pri | Area | Finding | Evidence | Impact | Recommended fix |
|----|-----|------|---------|----------|--------|-----------------|
| F-01 | **P0** | Build/Perf | `injectCriticalCSS` is not idempotent: it strips the old preload `<link>` but not the previously injected `<style>` or `<noscript>` fallback. The `<noscript>` contains the exact stylesheet `<link>` string the function searches for, so **every build injects another 13KB copy**. Pages now have 25 byte-identical `<style>` blocks (md5-verified) and 25 nested `<noscript>`s. | `scripts/prepare.mjs:444–456`; `en/index.html` = 343,613 bytes of which 325,025 are `<style>`; body is 14,623 bytes | ~312KB × 173 pages of pure waste; +13KB/page/build growth; LCP, FCP, mobile data, crawl budget all damaged; nested noscripts are invalid-ish HTML | Make injection idempotent: wrap injected block in a marker (`<style data-critical>`), strip `<style data-critical>[\s\S]*?</style>` and the noscript fallback before re-injecting, and require the stylesheet link **outside** `<noscript>`. Then run one build to collapse all pages to 1 block. Verify: `python3 -c "import re;print(len(re.findall(r'<style',open('en/index.html').read())))"` → 1 |
| F-02 | **P0** | Trust/Deploy | Internal documents publicly served on production: `/research/humanization-summary.md` (documents stripping AI-writing patterns from 12 AR articles), `/traffic-monetization-plan.md`, `/docs/strategy-review.md`, `/research/competitor-gap-analysis.md`, `/marketing/ad-creative-variations.md`, `/seo-audit-report-2026-06-30.md`, `/editorial-review.json` | All verified **HTTP 200** on doyouknow.app, 2026-07-07 | The humanization doc alone can destroy the site's editorial credibility if found (and .md files can get indexed/linked). Monetization/competitor docs leak business strategy | Add `docs/, marketing/, research/, design/, editorial-review.json, seo-audit-report*.md, traffic-monetization-plan.md, MASTER_DOYOUKNOW_STRATEGY.md, .remember/` to deploy EXCLUDE; **also delete already-uploaded copies from the VPS web root** (rsync exclude alone won't remove them). Verify each URL returns 404. Consider moving these to a private repo/dir entirely |
| F-03 | **P1** | Server/UX | Custom 404 never served: Caddyfile has no `handle_errors`; missing URLs return status 404 with **empty body** | `curl -w '%{http_code} %{size_download}' https://doyouknow.app/en/article/nonexistent-page.html` → `404 0`; `deploy/Caddyfile.doyouknow` has no error handling | Dead-end blank page for users and link-equity loss on every broken inbound link; the three 330KB 404.html files are dead weight | Add to Caddyfile: `handle_errors { @404 expression {err.status_code} == 404; rewrite @404 /404.html; file_server }` (optionally map `/ar/*` → `/ar/404.html`). Commit to repo (hard-won rule: server config lives in the repo), deploy, re-run the curl check expecting a body |
| F-04 | **P1** | Social/SEO | All 142 article `og:image`/`twitter:image` point to **SVG** files; image sitemap lists 127 SVG `<image:loc>` entries | `grep og:image en/article/*.html` → 61/61 `.svg`; `ar` → 81/81; `sitemap.xml` image blocks | Facebook, WhatsApp, X, LinkedIn, Telegram do not render SVG previews → every share shows a blank card. Google Images does not index SVG → image sitemap is inert | Generate 1200×630 raster (PNG or JPEG) versions of each featured SVG (one-time script with `sharp` or `resvg`), point og:image/twitter:image at rasters (keep SVG for on-page `<img>` if desired), regenerate image sitemap with rasters. Verify with Facebook Sharing Debugger / X Card Validator on 2–3 URLs |
| F-05 | **P1** | Caching | Mutable assets served `Cache-Control: public, max-age=31536000, immutable` with **no cache-busting**: `style.css`, `site.js`, `search-index.json` are referenced bare and regenerated every build. Compounded by `sw.js`: fixed `CACHE_NAME='dyk-v1'` + cache-first for `/assets/*` — SW users **never** revalidate assets even after a year | Live header on `/assets/css/style.css`: `max-age=31536000, immutable`; `en/index.html` references have no `?v=`; `sw.js:6` + `cacheFirst()` | Returning visitors can run year-old CSS/JS and a stale search index; SW makes it permanent until cache name changes | In prepare.mjs, append `?v=<content-hash>` to the three mutable asset references and stamp the same hash into `CACHE_NAME` in sw.js each build. Alternative (simpler): carve `style.css/site.js/search-index.json` out of the immutable rule → `max-age=3600, must-revalidate` |
| F-06 | **P1** | Deploy hygiene | `deploy/nginx.conf` is a stale parallel config that diverges from live Caddy: 302 `/ → /en/`, different web root, and a CSP (`script-src 'self'; connect-src 'self'`) that would **silently kill Google Analytics** if ever applied | Live `server: Caddy` header; nginx.conf lines 12, 26 | Someone (or an AI agent) "restoring" nginx later would break analytics and change redirect semantics with no test failing | Delete `deploy/nginx.conf` or move to `deploy/attic/` with a header comment "NOT DEPLOYED — Caddy is canonical". Caddyfile is the single source of truth |
| F-07 | **P1** | Schema/SEO | 10 articles have `datePublished`/`dateModified: "2025-06-26"` in Article JSON-LD — a year-off typo (site launched June 2026) that propagates into sitemap `<lastmod>2025-06-26</lastmod>` (9 indexable URLs) | `grep -rl '2025-06-26' en/article ar/article` → burj-khalifa-facts, dubai-frame, dubai-miracle-garden, expo-city-dubai, palm-jumeirah-engineering, kingdom-tower-riyadh, qiddiya-saudi-arabia, red-sea-project-saudi, the-line-neom, riyadh-season | Tells Google these flagship pages (Burj Khalifa, The Line) are a year staler than reality; wrong published dates in rich results | Fix the JSON-LD dates to 2026-06-26 in the 10 files, rebuild (sitemap regenerates), add an audit.mjs rule: `datePublished < site launch date (2026-06-01) → error` |
| F-08 | **P1** | Content safety | World Cup 2026 is **mid-tournament right now** (July 2026). `api/world-cup-2026.json` is `status: "seeded", provider: "verified-schedule-fallback"`, `updatedAt: 2026-06-26`. ~15 WC articles (e.g. `arab-team-semifinals-world-cup-2026.html`) may assert results/standings that events have already contradicted | `api/world-cup-2026.json`; `en|ar/article/*world-cup-2026*` | Factually wrong sports content during peak search interest = trust damage exactly when traffic peaks | Editorial sweep of all WC articles **this week**: rewrite result-dependent claims to be time-safe or update against verified final scores (manual, not live API). Live widgets are correctly disabled and audit-enforced — keep them off. **Needs verification: read each WC article body against the actual tournament state** |
| F-09 | P2 | Security | Live site sends **no Content-Security-Policy** (Caddy config has none; the only CSP lives in the unused nginx.conf) | Live header check on `/en/`: no CSP header | Static site = low risk, but inline-script XSS surface exists (search UI renders user input — **needs verification** that `site.js` escapes query text) | Add CSP to Caddyfile: `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'`. Test GA still fires after deploy |
| F-10 | P2 | PWA/Perf | `sw.js` precaches 43 URLs including ~40 article pages. At current (bugged) page weight that is a **~13MB forced download** on first visit (~1.7MB after F-01 fix). Also `cache.addAll` is all-or-nothing: one renamed/deleted precache URL → SW never installs, silently | `sw.js:9–70` | Mobile data burn; fragile install; hardcoded article list will rot | Trim precache to shell only (offline pages + CSS/JS + logo); cache articles at runtime via the existing stale-while-revalidate path. Add an audit.mjs rule verifying every `sw.js` precache URL exists on disk |
| F-11 | P2 | Perf | Dead `preconnect` hints to `fonts.googleapis.com` / `fonts.gstatic.com` on every page, but no Google Fonts stylesheet is loaded anywhere (system-font stack; audit even bans render-blocking font links) | `en/index.html` head; `grep '@font-face\|@import' assets/css/style.css` → none | Two wasted early connections per page load | Remove both preconnects (and the `dns-prefetch` duplicate) in prepare.mjs's `injectResourceHints` |
| F-12 | P2 | Search UX | `search-index.json` is 347KB (141 entries with full excerpts), fetched on first search interaction and precached by SW | `assets/js/site.js:266`; file size | Slow first search on mobile; grows linearly with content | Trim excerpts to ~160 chars, drop redundant `description`+`excerpt` duplication, split per-language (`search-index.en.json` / `.ar.json` — each page only needs its own) → est. <80KB each |
| F-13 | P2 | Meta | Root `index.html` (noindex language chooser, JS+meta redirect to `/en/`) uses `og-ar.png` as its og:image and `og:title` "doyouknow.app" | `index.html` og tags | Shares of the bare domain show the Arabic card to a majority-EN default audience | Point root og tags at `og-en.png` (or a neutral bilingual card) |
| F-14 | P3 | Hygiene | `robots.txt` disallows `/search`, a path that doesn't exist; audit bans SearchAction schema (correct, since search is client-side only) | `robots.txt` | None (defensive) | Leave as-is; documented here so nobody "fixes" it |
| F-15 | P3 | Content parity | 26 AR-only and 6 EN-only articles exist with self-referencing hreflang only (valid) | `comm` diff of article dirs | Missed bilingual reach on proven topics | Treat as a content backlog, not a bug — see §8/§15 Stage 4 |

---

## 4. Hidden Bug Candidates

Subtle issues a normal review would miss. Each includes why it's plausible and how to verify.

1. **Critical-CSS drift between `style.css` and inlined copies.** The 13KB critical block is extracted at build time and frozen into 173 files. If `style.css` changes but a page isn't rebuilt (partial build, manual edit), inline and external CSS disagree → subtle FOUC/layout shifts. *Verify:* after F-01 fix, hash the inline block across all pages and compare to a fresh `extractCriticalCSS(style.css)` output; add to audit.mjs.
2. **`cache.addAll` all-or-nothing install failure (F-10).** Renaming any of the 40 hardcoded precache articles makes the SW silently stop installing for all new visitors — no test catches it today. *Verify:* `node -e` script that checks every path in `PRECACHE_URLS` exists; DevTools → Application → SW status on prod.
3. **Search UI XSS via query reflection.** Client-side search renders result titles/excerpts and possibly the raw query ("no results for X"). If the query is interpolated as HTML, `?q=<img onerror=...>`-style payloads execute (no CSP live today, F-09). *Verify:* read `assets/js/site.js` search render path (~line 266+) for `innerHTML` with unescaped input; test query `<b>x</b>` in the UI.
4. **`audit.mjs` title/description regex assumes exact attribute order** (`<meta name="description" content="...">`). A page written with `content` before `name` would pass HTML-validity but silently skip length checks. *Verify:* `grep -c 'content="[^"]*" name="description"' -r en ar` (expect 0; if >0 those pages are unaudited).
5. **`try_files {path} {path}/index.html` serves duplicate content at extensionless URLs.** **Needs verification:** whether `https://doyouknow.app/en/article/burj-khalifa-facts` (no `.html`) 404s or serves the page. If Caddy's `try_files` resolves it, every article exists at two URLs (canonical tag mitigates, but crawl waste). *Verify:* `curl -o /dev/null -w '%{http_code}' https://doyouknow.app/en/about` and with `.html`.
6. **`lastmod` vs. reality inversion after every mass rebuild.** `prepare.mjs` rewrites all 173 files on every build (mtimes all identical: `17:51`), but sitemap `lastmod` comes from per-article `dateModified` metadata. If an editor updates article *content* without bumping `dateModified`, Google is told nothing changed. *Verify:* diff article body changes in git history against their JSON-LD `dateModified` values.
7. **`ar/about.html` search-index entry has an English `excerpt`** ("Every article is fact-checked against at least two authoritative sources…") while title/description are Arabic. The audit checks titles only, not excerpts, so this passes. If excerpts render in AR search results, English text appears. *Verify:* search "عن" on /ar/ and inspect the result card; check `excerpt` fields for all `/ar/` entries in `search-index.json`.
8. **World Cup scheduler systemd unit could be enabled on the VPS** even though repo policy disables live features — the audit only checks HTML, not server state. *Verify on VPS:* `systemctl status worldcup-live-scheduler` (expect not-found/disabled).
9. **`.remember/` session logs would ship to prod if ever committed.** Currently protected only by `.remember/.gitignore`. Deploy EXCLUDE does not list it (F-02 fix should add it as belt-and-braces). *Verify:* `git ls-files .remember` → empty, and keep it that way.
10. **Category asymmetry as soft 404 risk:** `ar/category/technology` doesn't exist while EN does (and vice versa for `islamic`/`vision-2030`). Any templated "switch language" link on category pages pointing to the sibling category would 404. *Verify:* `grep -o 'href="/en/category/[^"]*"' ar/category/*.html` and confirm targets exist (audit's link checker should already catch this — confirm it scans category pages).

---

## 5. Unfinished Tasks and Risky Features

- **World Cup live layer (deliberately disabled, correctly guarded):** `assets/js/world-cup-live.js`, `deploy/worldcup-live-scheduler.service`, `scripts/run-worldcup-live-scheduler.mjs`, `scripts/update-worldcup-stats.mjs`, `api/world-cup-2026.json` (seeded fallback only). Audit.mjs actively fails the build if any page references the live script/widget/page. **Status: parked by design — do not enable without solving data source accuracy, quota (100 req/day scaffolding exists), and update timing.**
- **15 noindex editorial-review articles** (`editorial-review.json`): 9 government/legal/finance, 4 health/religious/travel, 2 fast-changing tech. Not stale — a deliberate queue awaiting primary-source review (policy reviewedThrough 2026-06-26). §9 defines the release workflow.
- **Newsletter templates** (`en|ar/newsletter-template.html`): pages exist but no send mechanism/ESP integration found in the repo. Harmless; they're normal audited pages. **Needs verification:** whether they're linked from anywhere user-facing (if not, they're just crawlable dead pages — they *are* in the sitemap if indexable; check and either use or noindex them).
- **`grep` sweep results** (mandatory searches): no TODO/FIXME markers in code; "HACK"/"temporary"/"secret"/"password" hits are all **article prose** (e.g. "life hack", "temporary residence", "secret beaches", ChatGPT password advice) — no code debt markers found. `General.html` appears only in audit/prepare scripts as a *guard against* the legacy category. `localhost/127.0.0.1` only in `scripts/serve.mjs` (dev server). **No hardcoded API keys, tokens, or secrets anywhere** — World Cup scripts read exclusively from env vars; CI secrets are GitHub-managed. ✅
- **`assets/images/og-source.png`** is gitignored but referenced by nothing in HTML — a design source file. Fine; documented so it isn't "cleaned up" into a broken reference (it isn't referenced).
- **Internal strategy docs in repo root** (F-02): not "unfinished," but mislocated — they are business documents living in a publicly-deployed tree.

---

## 6. Technical SEO Strategy

**Canonical strategy (current: correct — preserve).** Every page has exactly one absolute canonical to itself; audit enforces existence, absoluteness, and uniqueness. Root `/` is noindex with canonical → `/en/`. Rule: never introduce URL parameters that serve content; if extensionless duplicates exist (Hidden Bug #5), add a Caddy redirect from extensionless → `.html` rather than more canonicals.

**Hreflang strategy (current: correct — preserve).** Self-referencing + `x-default` (→ `/en/`) on every indexable page; EN↔AR pairs only where a true counterpart exists; AR-only/EN-only articles self-reference. Rule: hreflang pairs must be reciprocal — audit already guarantees targets exist; add a reciprocity check (if A lists B, B must list A) to audit.mjs.

**Sitemap strategy.** Keep the bidirectional canonical↔sitemap invariant (audit-enforced). Fix `lastmod` integrity: F-07 date typos, plus adopt the rule *"content edit ⇒ bump `dateModified`"* (enforceable: audit warns if git-changed article body has unchanged dateModified — CI has the git context to do this). Split consideration at >500 URLs: `sitemap-en.xml` / `sitemap-ar.xml` under an index — not needed at 152.

**Robots/noindex strategy.** Keep `robots.txt` minimal (Allow all + sitemap). Keep noindex via meta tag only (not robots.txt Disallow — Google must crawl to see noindex). Keep the editorial-review.json → noindex → excluded-from-sitemap/search pipeline exactly as is; it's the site's best structural asset.

**Schema strategy.** Article + FAQPage + BreadcrumbList JSON-LD is injected at build time; audit validates JSON parses. Add: (a) date sanity rule (F-07), (b) schema-URL == canonical check, (c) `Organization` sameAs links once social profiles exist. Do not add SearchAction (no server-side search results page; audit already bans it — correct).

**Search-index strategy.** Keep build-time generation + audit validation. Implement F-12 (per-language split, trimmed excerpts). Add excerpt-language check for AR entries (Hidden Bug #7).

**Category/internal-linking strategy.** 11 category pages are healthy hubs. Priorities: every article should link to ≥3 same-category siblings (related-articles block) and its category page via breadcrumb (already present). The World Cup cluster is well-interlinked (pillar + spokes). Gap: no cross-category discovery on article pages beyond related cards — acceptable at this size.

**Regression-audit strategy.** `audit.mjs` is the crown jewel. Extend it with the new rules from this document (single critical-CSS block, precache-URL existence, date sanity, excerpt language, hreflang reciprocity) so every finding class fixed here becomes permanently regression-proof.

---

## 7. Arabic SEO and Localization Strategy

Current state is **genuinely strong** — automated sweep found zero Arabic pages with English titles/descriptions/H1s, zero missing `dir="rtl"`, and the audit enforces Arabic titles/H1s on every `ar/` page. AR is the *larger* library (81 vs 61 articles), correctly treated as a first-class market, with market-specific categories (islamic, vision-2030) rather than mirrored EN ones.

**Rules to maintain:**
- **Titles/meta:** Arabic-script titles ≤75 chars; brand suffix `| doyouknow.app` acceptable (Latin brand in AR titles is normal). Meta descriptions in native Arabic, 40–180 chars (audit-enforced).
- **Content quality:** AR articles must be written-for-Arabic, not translated. The humanization work already done (12 articles) shows awareness of AI-pattern risk ("ليس... بل" counter-assertion, etc.) — continue applying that bar to **new** AR articles at write time, and keep all records of that process **out of the deployed tree** (F-02).
- **RTL layout:** logical CSS properties only (`margin-inline-start`, not `margin-left`); `dir="rtl"` on `<html>`; numerals: Western Arabic numerals (٠١٢ vs 012 — pick one; current pages use Western — keep consistent).
- **Categories:** keep AR-specific taxonomy; never machine-mirror EN categories.
- **Place names:** استخدم الأسماء المتداولة (دبي، أبوظبي، العُلا، الدرعية) — the article set already does this correctly.
- **Internal links:** AR articles link to AR articles/categories only (plus the hreflang pair). Audit's broken-link check covers targets.
- **Schema:** `inLanguage: "ar"`, Arabic headline/description in JSON-LD. **Needs verification:** spot-check 3 AR articles' JSON-LD for Arabic `headline` values.
- **Keyword strategy:** Saudi search intent dominates AR volume (Absher, Qiyas, driving license, insurance articles show this understanding). Priority AR topics: Saudi services (post-review release, §9), Vision-2030 giga-projects (already covered), religious calendar content (Ramadan/Hajj/Umrah — noindex until reviewed, correctly).
- **Leakage checks (automated, add to audit):** AR search-index excerpts must contain Arabic; AR card excerpts on category pages must contain Arabic; alt text on AR pages must be Arabic.

---

## 8. English SEO and Content Strategy

**Topic clusters (current):** Dubai (strongest — ~20 articles: attractions, food, beaches, metro, visas, free zones), Saudi (travel + projects), World Cup 2026 (timely pillar+spokes), Guides, Technology (2 articles, both noindex).

**Cluster strategy:** deepen Dubai and Saudi travel (proven strength, evergreen, monetizable via affiliate later per the monetization plan) before starting new clusters. The 26 AR-only articles are a ready-made EN backlog — translate-adapt the evergreen ones (The Line, AlUla, Diriyah, Edge of the World, Red Sea Project) since demand exists in EN too. Skip AR-only service guides (Absher, Qiyas) — no EN search intent.

**Quality bar per article:** ≥1,200 words for guides / ≥800 for facts pieces; unique title 15–75 chars with the primary query left-anchored; meta description with a hook + specific fact; exactly one H1; H2s that match People-Also-Ask phrasings; ≥1 table or list per guide; FAQ section (feeds the FAQPage schema already auto-injected); ≥2 authoritative sources cited in-text; ≥3 internal links to siblings.

**Metadata rules:** already audit-enforced (lengths, uniqueness via canonical dedup). Add: no two indexable pages share a title (audit currently dedups canonicals, not titles — cheap rule to add).

**Freshness rules:** anything with prices, visa rules, opening hours gets a visible "Last updated" line + `dateModified` bump on review; review calendar: visa/tax/business articles every 90 days (these are mostly noindex pending review anyway — §9), travel listicles every 180 days, facts/engineering pieces yearly.

**E-E-A-T:** about page exists with editorial standards; add a named author/editor entity (`Person` or `Organization` author in Article schema) and cite primary sources (government portals, official project sites) with outbound links — currently **needs verification** how many articles link out to sources at all: `grep -c 'href="https://(?!doyouknow)' per article`.

**Pages to improve first:** the 9 sitemap-visible articles with 2025 dates (F-07 — they're flagship topics: Burj Khalifa, Palm Jumeirah, The Line); `things-to-do-dubai-this-week.html` (**needs verification** — a "this week" page on a static site is a freshness liability; either make it a maintained ritual or retitle to evergreen "this month/season" framing).

---

## 9. Content Safety and Editorial Review Strategy

The `editorial-review.json` → noindex pipeline is the right architecture. Formalize the workflow around it:

**Require primary-source review before indexing (currently noindex — keep until reviewed):**
- Government services: start-business-dubai, uae-corporate-tax, uae-golden-visa-guide (EN); absher-portal-guide, qiyas-guide, qobool-guide, saudi-driving-license, saudi-health-insurance, open-bank-account-saudi (AR) — verify against u.ae / absher.sa / official portals, add "last verified" date, then remove from editorial-review.json (prepare/audit handle the rest).
- Health/religious: hajj-guide, umrah-guide, ramadan-health-guide — verify against official Hajj ministry / health ministry guidance; religious content additionally needs cultural review, not just factual.
- Events: riyadh-season — seasonal; only index while accurate for the current season.
- Fast-moving tech: what-is-chatgpt, what-is-google-gemini — either commit to quarterly updates or leave noindex permanently (they will always be stale; low strategic value — consider retiring).

**Release procedure (per page):** verify every claim against a current primary source → update body + dateModified → remove path from editorial-review.json → `npm run build && npm test` (this reinstates index/sitemap/search automatically) → commit with source URLs in the commit message.

**UAE politics/history rule:** none found in the current corpus (searched). Keep it that way — travel, business, culture, engineering, sports only. History content limited to uncontroversial heritage framing (saudi-arabia-history.html exists for KSA — **needs verification** that its framing stays within official-narrative-safe heritage topics; it currently sits indexable).

**Sports accuracy:** World Cup articles are the acute risk (F-08). Rule: no article states a result/standing unless manually verified after the fact; no live data without a solved provider (quota scaffolding exists but stays off).

**Ongoing workflow:** monthly editorial-review triage (are any noindex pages now verifiable? did any indexed page's facts change?); the JSON file is the single source of truth; never hand-edit noindex meta tags (the build owns them).

---

## 10. Frontend/UI Strategy

Current template system (implicit, enforced by build+audit) is sound for a static editorial site. Target structure:

- **Article template:** breadcrumb → H1 → byline/reading-time (auto-injected) → featured image (SVG on-page is fine) → body with H2 sections, tables, FAQ → related-article cards → footer. Keep exactly one H1 (audit-enforced), heading levels sequential (audit checks the two known skip patterns).
- **Category template:** intro paragraph (unique text, not boilerplate — helps thin-content risk) → card grid → cross-links to sibling categories.
- **Card system:** image + title + excerpt; audit already bans placeholder excerpts/images — keep. Add AR-excerpt-language check (§7).
- **Header/footer:** language switcher must point to the true hreflang pair (or the section home when no pair exists — **needs verification** which fallback is used on AR-only articles).
- **Search UI:** client-side over the JSON index; keyboard nav + recent searches already built. Post-F-12, load per-language index. Escape all rendered query text (Hidden Bug #3).
- **Arabic RTL UI:** already native; keep logical properties; test nav drawer and search overlay in RTL specifically at 360px width.
- **Accessibility:** audit already enforces non-dialog mobile nav and heading levels. Add: skip-to-content link, visible focus states, `aria-label` on the language switcher, alt text on all images (audit checks image existence, not alt presence — cheap rule to add).
- **Trust signals:** "Last verified" dates on service/finance articles (§9), sourced-claims footnotes, about-page link in article bylines.
- **Folder organization:** current layout is good; the only move needed is internal docs out of the web tree (F-02): `docs/, marketing/, research/, design/` → a non-deployed `internal/` directory or separate private repo.

---

## 11. Image and Media Strategy

- **Current state:** 142 SVG featured images (one per article), all referenced files exist (audit-enforced), lazy/eager + dimensions handled by `optimizeImageAttributes` in prepare.mjs. SVG = zero copyright risk, tiny payloads, sharp at any DPI. Good choice **on-page**.
- **Featured image rule:** keep SVG for in-article display; add a raster twin per article for social/Google (F-04): 1200×630, <150KB, PNG or JPEG, generated from the SVG in a one-time + per-new-article build step (`resvg`/`sharp`; note ffmpeg is not on PATH on this machine — not needed for stills).
- **OG image rules:** `og:image`/`twitter:image` must be raster, absolute URL, 1200×630; default `og-en.png`/`og-ar.png` allowed only on non-article pages (audit already bans defaults on indexable articles).
- **Image sitemap:** regenerate with raster URLs; SVG entries are inert to Google Images.
- **Alt text:** required, in the page's language; add presence check to audit.mjs (currently unchecked).
- **Formats roadmap:** if photography is ever introduced, WebP/AVIF with explicit width/height (CLS) and license records kept in a manifest — SVG-only avoids this today.
- **Missing-image audit:** already covered (featured + card images checked against disk). Extend to og:image paths.

---

## 12. Caching and Performance Strategy

- **HTML:** current `max-age=300, must-revalidate` (live-verified) is right for an editorial site — keep.
- **Assets:** split the immutable rule (F-05). Truly immutable (images, logo): keep 1y immutable. Mutable-by-build (`style.css`, `site.js`, `search-index.json`): either content-hash query (`?v=<hash>`, injected by prepare.mjs, mirrored into SW cache name) — preferred — or `max-age=3600, must-revalidate`.
- **Service worker:** version `CACHE_NAME` per build; shrink precache to shell (F-10); keep stale-while-revalidate for HTML.
- **Payload:** F-01 fix cuts every page ~91% (343KB → ~31KB). This is the single biggest CWV lever on the site — LCP and FCP on 3G/4G mobile (the AR audience skews mobile) improve dramatically.
- **JS/CSS loading:** site.js deferred (audit-enforced), single stylesheet preloaded after inline critical CSS — correct pattern once F-01 makes it single-copy. Remove dead font preconnects (F-11).
- **Compression:** Caddy `encode zstd gzip` on — verified. Fine.
- **Third-party:** GA4 only; keep it that way. Any future embed goes behind a click-to-load facade.
- **Monitoring:** weekly PageSpeed Insights on 4 URLs (`/en/`, `/ar/`, one heavy EN article, one AR article) + Search Console CWV report; add a repo doc recording baselines after F-01 ships so regressions are visible.

---

## 13. Deployment and Operations Strategy

- **Pipeline (keep):** push → GitHub Actions → `npm test` (audit gate) → rsync to VPS. The test gate is real protection; never bypass it.
- **EXCLUDE list:** extend per F-02, and treat the EXCLUDE list as security-relevant config: any new repo-root file defaults to *public* — prefer an allowlist mindset (deploy only `en/ ar/ assets/ api/ index.html 404.html sitemap.xml robots.txt manifest*.json sw.js` if the action supports it; otherwise keep EXCLUDE exhaustive).
- **Server cleanup:** rsync exclude does not delete already-uploaded files — **SSH to the VPS and remove** `research/ docs/ marketing/ design/ *.md editorial-review.json` from the web root as part of the F-02 fix, then verify 404s.
- **Caddy is canonical** (live-verified); commit every Caddy change to `deploy/Caddyfile.doyouknow` in the same session it's applied (hard-won rule: server-only edits get wiped). Retire nginx.conf (F-06). Add `handle_errors` (F-03).
- **Rollback:** static site = rollback is `git revert` + push (pipeline redeploys). Document this one-liner in README. No DB, no migrations — rollback risk is near zero.
- **Secrets:** none in repo (verified); VPS SSH key + host live in GitHub Actions secrets. World Cup API key, if ever used, stays in the systemd unit's env file on the VPS, never committed.
- **Disabled live features:** World Cup scheduler stays off; verify the systemd unit is disabled on the box (Hidden Bug #8).
- **Post-deploy verification (add as a final CI step or manual ritual):** `curl` checks — `/en/` returns 200 with `<style data-critical` appearing exactly once; a junk URL returns 404 **with a body**; `/research/humanization-summary.md` returns 404; asset headers as designed.
- **Monitoring:** UptimeRobot (or similar) on `/en/` and `/ar/`; Search Console coverage report weekly.

---

## 14. Testing and QA Strategy

`scripts/audit.mjs` already implements most of a professional SEO test suite (see §2). Additions, each one small:

| Test | Rule | Where |
|---|---|---|
| Critical-CSS singleton | exactly one `<style` block per page; zero nested `<noscript>` | audit.mjs (regression-proof F-01) |
| Schema date sanity | `datePublished`/`dateModified` ∈ [2026-06-01, today] | audit.mjs (F-07) |
| Title uniqueness | no duplicate `<title>` across indexable pages | audit.mjs |
| AR excerpt language | search-index + card excerpts on `ar/` pages contain Arabic | audit.mjs (Hidden Bug #7) |
| Alt-text presence | every `<img>` has non-empty `alt` | audit.mjs (§11) |
| OG image is raster | indexable article og:image ends `.png|.jpg|.webp` | audit.mjs (F-04, after rasters exist) |
| SW precache integrity | every `PRECACHE_URLS` path exists on disk | audit.mjs (F-10 / Hidden Bug #2) |
| Hreflang reciprocity | if A lists B as alternate, B lists A | audit.mjs |
| Deploy smoke tests | 404-with-body, no `/research/*` 200s, single style block on `/en/` | post-deploy curl script (§13) |
| Mobile/RTL manual pass | nav drawer, search overlay, article layout at 360px, LTR + RTL | manual, per major CSS change |
| Performance | PageSpeed on 4 canary URLs after any perf-touching change | manual/weekly (§12) |
| Accessibility | axe-core pass on home/article/category ×2 languages | quarterly manual |

World Cup scheduler already has its own audit (`audit-worldcup-scheduler.mjs`, passing).

---

## 15. Implementation Roadmap

### Stage 0 — Immediate stabilization (same day, ~2–3 hours total)
| # | Task | Pri | Files | Acceptance criteria | Verification |
|---|------|-----|-------|---------------------|--------------|
| 0.1 | Fix `injectCriticalCSS` idempotency + strip accumulated blocks, rebuild all pages | P0 | `scripts/prepare.mjs:444`; all HTML regenerated | Every page has exactly 1 `<style>` block, 1 `<noscript>`, page sizes ~30KB | `python3 -c "import re,glob; bad=[f for f in glob.glob('**/*.html',recursive=True) if len(re.findall('<style',open(f).read()))!=1]; print(bad)"` → `[]`; `npm test` |
| 0.2 | Extend deploy EXCLUDE (docs, marketing, research, design, *.md strategy files, editorial-review.json, .remember) **and** delete already-uploaded copies from the VPS web root | P0 | `.github/workflows/deploy.yml`; VPS | Listed URLs return 404 in prod | `for p in research/humanization-summary.md traffic-monetization-plan.md docs/strategy-review.md marketing/ad-creative-variations.md seo-audit-report-2026-06-30.md editorial-review.json; do curl -s -o /dev/null -w "%{http_code} $p\n" https://doyouknow.app/$p; done` → all 404 |
| 0.3 | Add `handle_errors` to Caddyfile, apply on VPS, commit same session | P1 | `deploy/Caddyfile.doyouknow` | Junk URL returns 404 with the custom page body | `curl -s -w '%{size_download}' -o /dev/null https://doyouknow.app/nope.html` → >10000 bytes |
| 0.4 | Add audit rules: critical-CSS singleton + date sanity | P1 | `scripts/audit.mjs` | `npm test` fails if either regresses | Introduce a deliberate duplicate block locally → test fails |

### Stage 1 — Indexing and SEO blockers (this week)
| # | Task | Pri | Files | Acceptance | Verification |
|---|------|-----|-------|-----------|--------------|
| 1.1 | Fix 2025→2026 dates in 10 articles' JSON-LD, rebuild | P1 | the 10 files from F-07 | No `2025-06-26` anywhere; sitemap lastmod correct | `grep -rl '2025-06-26' en ar sitemap.xml` → empty |
| 1.2 | Generate 1200×630 raster og:images for all 142 articles; update og/twitter tags + image sitemap via prepare.mjs | P1 | new `scripts/render-og-rasters.mjs`; `prepare.mjs` | All indexable articles have raster og:image | audit rule (§14); Facebook Sharing Debugger on 3 URLs shows previews |
| 1.3 | World Cup editorial sweep — verify/neutralize all result-dependent claims mid-tournament | P1 | `en\|ar/article/*world-cup*` | No article asserts an unverified result | Manual read of all ~15 WC articles against verified final results |
| 1.4 | Asset cache-busting: `?v=<hash>` on style.css/site.js/search-index.json + SW cache-name stamp | P1 | `prepare.mjs`, `sw.js` | New build → new hash → clients revalidate | Deploy, DevTools: assets refetched once, then cached |
| 1.5 | Retire `deploy/nginx.conf` (delete or move to attic with warning header) | P1 | `deploy/` | One canonical server config | `ls deploy/` |

### Stage 2 — Arabic/English content quality (weeks 2–4)
| # | Task | Pri | Acceptance |
|---|------|-----|-----------|
| 2.1 | Primary-source review + release of highest-value noindex pages (uae-golden-visa-guide, start-business-dubai, absher-portal-guide, saudi-driving-license) per §9 workflow | P1 | Pages verified, dateModified bumped, removed from editorial-review.json, appear in sitemap |
| 2.2 | Fix `ar/about.html` English excerpt in search index; add AR-excerpt audit rule | P2 | Arabic excerpt; audit rule green |
| 2.3 | Add "last verified" visible dates to service/finance articles | P2 | Date line present + schema dateModified matches |
| 2.4 | Author/E-E-A-T entity in Article schema + outbound primary-source links audit | P2 | ≥2 source links per guide article |

### Stage 3 — UI and performance (weeks 3–5)
| # | Task | Pri | Acceptance |
|---|------|-----|-----------|
| 3.1 | Shrink SW precache to shell; add precache-integrity audit rule | P2 | First-visit SW download <500KB |
| 3.2 | Split search index per language, trim excerpts | P2 | Each index <100KB; search still works both languages |
| 3.3 | Remove dead font preconnects; fix root og:image (F-13) | P2/P3 | Hints gone; root shares show EN card |
| 3.4 | Add CSP to Caddyfile (GA-compatible), verify GA events still fire | P2 | CSP header live; GA realtime shows events |
| 3.5 | Accessibility pass: alt-text audit rule, skip link, focus states, RTL mobile test | P2 | axe-core clean on 6 canary pages |

### Stage 4 — Content scaling and topic authority (ongoing)
- **Trending-topic source of truth:** `google-trends-topics.md` (repo root) is refreshed every Monday and Thursday with topic suggestions. Check it before researching trending-topic batches (e.g. the technology hub) ad hoc — it supersedes manual web research when present and current.
- Translate-adapt the 5 highest-demand AR-only evergreens into EN (The Line, AlUla, Diriyah, Edge of the World, Red Sea Project).
- Deepen Dubai cluster (highest EN traffic potential): parking guide, salaries/cost-of-living, school guide — all evergreen, all safe.
- Post-tournament World Cup wrap-up articles (results now historical fact = safe) to capture the long tail before interest decays.
- Monthly editorial-review triage (§9).

### Stage 5 — Long-term platform quality
- Post-deploy smoke-test step in GitHub Actions (§13).
- CWV baseline doc + weekly PSI ritual (§12).
- Consider extracting shared header/footer into build-time includes in prepare.mjs to end per-page drift (only if drift actually appears — audit would catch symptoms).
- Revisit World Cup live layer **only** with a paid, quota-safe data provider and the existing scheduler guardrails — otherwise delete the parked code after the tournament.

---

## 16. AI Coding Agent Instructions

You are working on a **production static site deployed automatically on push to main**. Every commit to main goes live within minutes, gated only by `npm test`.

**Before anything:**
1. Read this file top to bottom.
2. Run `npm test` — it must pass before AND after your change. If it fails before you start, stop and report.
3. Understand the build: article HTML files are **both source and artifact**. `npm run build` (`scripts/prepare.mjs`) mutates them in place. Never assume generated markup is hand-written; check whether prepare.mjs owns the pattern you're editing before editing it manually — otherwise the next build overwrites you.

**Do not:**
- Do not delete any HTML page, image, or the World Cup scripts/service files without explicit instruction.
- Do not touch `editorial-review.json` semantics or remove noindex from any page listed there — those pages are quarantined pending human primary-source review.
- Do not enable World Cup live widgets/scripts/pages — `audit.mjs` will fail the build, and that is intentional.
- Do not edit files on the VPS without committing the same change to the repo in the same session (server-only edits get wiped on next deploy).
- Do not commit secrets; World Cup scripts read from env only — keep it that way.
- Do not add UAE politics/history content, and do not publish health/legal/immigration/finance/government-service content without the §9 review workflow.
- Do not "fix" `robots.txt` `/search` disallow or the absence of SearchAction schema — both are deliberate.
- Do not run `npm audit fix --force`-style dependency surgery; there are no runtime deps, keep it that way.

**How to work:**
- Edits to shared page chrome (header/footer/meta) usually belong in `prepare.mjs` (which rewrites all pages), then `npm run build`. Verify by diffing 2–3 representative pages (one EN article, one AR article, one category).
- After any build-script change, check idempotency: run `npm run build` **twice** and confirm the second run produces zero diff (`git diff --stat` after the second run must be empty). The F-01 bug existed because nobody did this.
- Every new invariant you establish should become an `audit.mjs` rule in the same PR.
- Verified means observed: for anything user-facing, check the live URL (or local `npm start` server) with curl/browser, not just a passing test.
- Report plainly what was proven vs. assumed, with the commands you ran.

**Updating this file:** when you fix a finding, mark its row `✅ FIXED <date> <commit>` rather than deleting it; append newly discovered findings to §3/§4 with evidence. This file is the running source of truth for site strategy.

---

## 17. Final Launch and Growth Checklist

Pass/fail — re-verify after Stage 0+1 ship:

**Technical (must all pass before spending on traffic):**
- [ ] Every HTML page contains exactly one inline `<style>` block; `en/index.html` < 50KB (F-01)
- [ ] `curl https://doyouknow.app/research/humanization-summary.md` → **404** (and all F-02 URLs)
- [ ] Junk URL returns 404 **with custom page body** (F-03)
- [ ] `grep -rl '2025-06-26' en ar sitemap.xml` → empty (F-07)
- [ ] Facebook Sharing Debugger shows an image preview for 3 sampled articles (F-04)
- [ ] style.css/site.js/search-index.json revalidate after a deploy (F-05: hash change or shorter TTL observed)
- [ ] `npm test` green in CI on latest main; deploy workflow green
- [ ] `deploy/` contains exactly one authoritative server config (F-06)
- [ ] Search Console: sitemap fetched, no coverage errors, hreflang pairs recognized
- [ ] PSI mobile score ≥85 on `/en/` and `/ar/` post-F-01 (record baseline)

**Content (growth gates):**
- [ ] All World Cup articles factually consistent with tournament reality (F-08)
- [ ] ≥4 editorial-review pages released to index via §9 workflow (golden visa + business guides are the traffic prizes)
- [ ] "Last verified" dates visible on all indexed service/finance pages
- [ ] AR search returns Arabic-only result cards (Hidden Bug #7 fixed)

**Operational:**
- [ ] Post-deploy smoke script exists and runs (manually or in CI)
- [ ] Uptime monitoring on `/en/` + `/ar/`
- [ ] World Cup systemd unit confirmed disabled on VPS (Hidden Bug #8)
- [ ] Rollback one-liner documented in README

---
*Generated 2026-07-07 by production-readiness audit. Findings F-01…F-15 + 10 hidden-bug candidates; all evidence commands are reproducible from repo root.*
