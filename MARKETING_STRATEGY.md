# Marketing Strategy — doyouknow.app

**Last updated:** 2026-07-10 · **Owner:** Abdalla Maklad (Quantara LLC)
**Note:** this file is excluded from the production deploy (see `.github/workflows/deploy.yml` EXCLUDE list). Keep it that way — it is an internal business document.

---

## 1. Positioning

- **What it is:** a bilingual (English/Arabic) editorial knowledge site: clear, fact-checked, curiosity-driven explainers and practical guides about the UAE, Saudi Arabia, Islamic culture, and the wider world.
- **Who it is for:** curious readers and residents/visitors of the Gulf who want a trustworthy, fast answer — in their own language.
- **Core promise:** *"Did you know? Now you do."* — every article leaves you knowing something surprising or useful, verified against primary sources.
- **Differentiation:**
  1. **True bilingual parity** — 111 EN + 111 AR articles, native RTL Arabic written for the region (not machine-translated filler). Almost no competitor covers Gulf explainers at parity in both languages.
  2. **Machine-enforced quality** — audit-gated builds: canonical/hreflang/sitemap/schema correctness is CI-enforced, so technical SEO never regresses.
  3. **Editorial honesty** — sensitive topics (government, finance, health, religion) sit in a noindex review queue until verified against primary sources (`editorial-review.json`).
  4. **Speed** — pure static HTML, ~30KB critical CSS, no framework. Fast on Gulf mobile networks.
- **Category framing:** not "news," not "listicle content farm" — an *explainer library* for the Gulf. Closest analogues: a bilingual, Gulf-focused mix of Mental Floss (curiosity) and Time Out/Expatica (practical guides).

## 2. Audience

| Audience | Pain points | Desired outcome | Best topics | Best channels | Best CTA |
|---|---|---|---|---|---|
| Curious general readers | Clickbait fatigue; shallow answers | One surprising, true fact fast | "Why Saudi has no rivers", Burj Khalifa facts | Google, X, Reddit | "Read the 2-minute explainer" |
| Gulf residents & expats | Bureaucracy confusion (visas, licenses, banking) | Step-by-step, current, sourced guide | Golden visa, Absher, driving license, corporate tax | Google search, WhatsApp shares | "Follow the checklist" |
| Arabic-first readers (KSA/UAE/Egypt) | Thin Arabic web content; EN-only guides | Native Arabic answer, correct terms | Vision 2030, أدلة عملية, الثقافة الإسلامية | Google.sa/.ae, TikTok AR, X AR | "اقرأ الدليل الكامل" |
| Students & teachers | Reliable citable facts | Sourced facts for projects | History, geography, engineering explainers | Google, Wikipedia adjacency | "See the sources" |
| Tourists planning Gulf trips | Overwhelming, salesy travel content | Honest what-to-do/what-it-costs | Best time to visit Dubai, Jeddah guide, AlUla | Google, Pinterest, TripAdvisor gaps | "Plan with the full guide" |
| Social discovery audience | Short attention; wants the hook | The "wait, really?" moment | Dubai police Lamborghinis, UAE imports sand | TikTok/Reels/Shorts, X | "Full story at doyouknow.app" |
| Football/World Cup audience (time-boxed) | Match noise, little Arab-angle analysis | Arab-teams angle, records, legacy | WC 2026 cluster (21 articles/lang) | Google Discover, X | "Read the Arab football story" |

## 3. Brand and Messaging

- **One-line pitch:** "Bilingual, fact-checked explainers about the Gulf and the world — did you know? Now you do."
- **Current tagline (keep):** EN "Did you know? Now you do." · AR "هل تعلم؟ الآن تعلم." — short, memorable, bilingual-parallel. Do not churn this.
- **Alternate taglines (only if repositioning):** "The Gulf, explained." / "الخليج، ببساطة" · "Facts worth sharing." / "حقائق تستحق المشاركة"
- **Homepage headline options:** current hero works. A/B candidate: "Surprising facts and practical guides about the UAE, Saudi Arabia, and the world — in English and العربية."
- **Social bio options:**
  - EN: "Fact-checked explainers about the UAE, Saudi & the world 🇦🇪🇸🇦 · English + العربية · Did you know? Now you do."
  - AR: "شروحات موثقة عن الإمارات والسعودية والعالم · بالعربية والإنجليزية · هل تعلم؟ الآن تعلم."
- **Trust-building messages:** "Fact-checked against at least two authoritative sources" (already on About page — surface it on article pages); "Corrections: corrections@doyouknow.app"; visible dateModified on articles.
- **Arabic messaging notes:** use صانع المحتوى (creator), الأدلة العملية (practical guides); keep Modern Standard Arabic with light Gulf flavor; never mirror-translate idioms; numbers/dates in Arabic-Indic numerals are NOT used (site uses Western numerals consistently — keep consistent).

## 4. Google Trends Content Strategy

- **How to pick topics:** a topic ships only if it scores on 2 of 3: (a) search demand (Trends/keyword evidence), (b) Gulf/bilingual advantage (we can do it better in AR+EN than anyone), (c) evergreen or predictable-seasonal value.
- **Weekly workflow (30 min, e.g. Sunday):**
  1. trends.google.com → Trending Now for SA + AE (filter 7 days).
  2. Check rising queries for existing article topics (freshness updates beat new articles).
  3. Pick ≤2 new topics; draft EN + AR together (never one-language-first backlog).
  4. Anything government/legal/health/religious → add to `editorial-review.json` noindex queue until primary-source verified.
- **Seasonal calendar (verified anchors, 2026–27):**
  - **Jul 19, 2026** — World Cup final → post-tournament recap + "records set" content within 48h of final; then freeze cluster.
  - **Aug 2026** — Back to school UAE/KSA (retail surge, school calendars).
  - **Sep 23, 2026** — Saudi National Day (96th) → update existing article ≥2 weeks prior.
  - **Oct 2026** — Riyadh Season 2026–27 opening; GITEX Global (Dubai World Trade Centre).
  - **Nov 30–Dec 3, 2026** — UAE National Day (55th), 3-day festivities.
  - **Dec 5, 2026–Jan 2027** — Dubai Shopping Festival (31st edition ran Dec 5–Jan 11 pattern).
  - **~Feb 17, 2027** — Ramadan 1448 begins (publish Ramadan content 4–6 weeks early; update ramadan-health-guide).
  - **~Apr–May 2027** — Eid al-Fitr, then Hajj season 1448 (~May) → hajj/umrah guide updates.
- **Evergreen clusters:** Gulf geography curiosities · megaproject explainers (NEOM/Line/Qiddiya) · "how to" resident guides · Islamic knowledge (zakat, Hijri calendar, pillars) · "why is X" economy explainers.
- **Trending-topic rules:** no breaking news (site is not a newsroom); no rumors/leaks; trend must map to an explainer angle that stays true in 6 months; World Cup-style live data stays disabled (audit-enforced).
- **Editorial review rules:** government/legal/finance/health/religious → `editorial-review.json` noindex queue; release only after primary-source verification; prepare.mjs reads that file directly (as of 2026-07-10), so a JSON edit + build is the whole release mechanism.
- **Bilingual workflow:** write EN and AR as siblings in one batch (same slug), hreflang pairs generated by build; AR is written natively (translate meaning, not sentences); both must pass `npm test`.

## 5. SEO Content Plan

- **Target clusters (gap-ranked, from live category counts 2026-07-10):**
  1. **Business & Marketing** (EN 3 / AR 6) — thinnest indexable cluster: UAE corporate tax follow-ups, free-zone comparisons, SME setup costs, hiring in KSA.
  2. **Islamic Knowledge & Culture** (5/5) — Hijri calendar explainer, five pillars series, Islamic finance follow-ups. High-trust, evergreen, strong AR advantage.
  3. **Technology** (EN 0 indexed / AR 2) — chatgpt & gemini articles are the only two and both sit noindex in review; refresh and release them, then add "UAE/Saudi AI strategy" explainers.
  4. **UAE/Saudi Practical Guides** — proven performers (18/8+) — keep extending with seasonal freshness updates.
  5. **World Cup 2026** (21/21) — post-final: one recap article, then stop; convert learnings into "Arab football legacy" evergreen pieces.
- **Article template (enforced by build/audit):** H1 = question or promise · 40–180 char meta description · intro answers the query in 2 sentences · sourced facts · FAQ block (FAQPage schema) · ≥3 same-category internal links · related-articles block · dateModified bumped on every content edit.
- **Internal linking model:** every article → category page (breadcrumb, audit-enforced) + ≥3 sibling links; every category page lists all its articles; new article must be linked FROM at least 2 existing articles within a week of publish.
- **Category expansion rule:** a new category needs 5 committed article slugs before creation (prevents thin hubs).
- **Programmatic opportunities:** none for now — hand-written quality is the moat; revisit only for structured comparisons (e.g. free-zone comparison tables) with human review.
- **Technical SEO tasks:** keep audit.mjs green in CI; pending: apply Caddy `handle_errors` 404 fix on VPS; delete stale internal docs from VPS web root (see MASTER doc §Prod cleanup); monitor accent-contrast a11y flag from PageSpeed (92 score, 2026-07-08).
- **Measurement:** GSC weekly — impressions, clicks, avg position for /en/ vs /ar/ separately; indexed-page count vs sitemap count; GA4 — organic sessions, engaged time per article, search-usage events, contact_form_submit / newsletter_signup events (now real signals as of 2026-07-10).

## 6. Social Media Plan

**Content pillars (all platforms):** 1) "Did you know?" fact drops · 2) practical micro-guides ("3 things before you renew your UAE visa") · 3) megaproject visuals (NEOM/Line/Qiddiya) · 4) bilingual culture moments (Saudi coffee, majlis etiquette).

| Platform | Cadence | Format | Notes |
|---|---|---|---|
| TikTok | 3–5/wk | 20–40s fact hooks, AR-first | Biggest Gulf reach; AR captions + EN subtitles |
| Instagram Reels | 3/wk (crosspost TikTok) | Same + carousel facts | Carousels for guides (save-worthy) |
| YouTube Shorts | 2–3/wk (crosspost) | Same vertical clips | Titles = search queries |
| X | 1/day | Fact + link thread; AR & EN alternating | Strong KSA presence; reply-guy the big Gulf accounts |
| LinkedIn | 1–2/wk | Business/Vision-2030 explainers | Feeds the Business cluster + work-with-us pipeline |

- **Hook formulas:** "Did you know [impossible-sounding true thing]?" · "Everyone gets [X] wrong — here's the truth" · "[Big number] and nobody talks about it" · AR: "هل تعلم أن…؟" / "الحقيقة اللي ما يقولها أحد عن…"
- **CTA examples:** "Full story → doyouknow.app (link in bio)" · "احفظ المنشور وشارك الفائدة" · "Which one surprised you? 👇"
- **Hashtag strategy:** 3–5 max: one topical (#NEOM #DubaiLife #رؤية_2030), one category (#DidYouKnow #هل_تعلم), one local (#UAE #السعودية). No hashtag walls.
- **Community:** answer every comment first 2h; repost reader corrections gracefully (trust play); weekly AR question sticker/poll.
- **Production:** repurpose articles — 1 article → 1 script → TikTok+Reels+Shorts (same clip), 1 X thread, 1 LinkedIn post. Use the video-hook pipeline for burned-in text hooks.

## 7. Launch and Growth Plan

**Next 30 days (Jul 10 – Aug 10, 2026):**
1. Ship this audit's fixes to prod; delete exposed internal docs from VPS; apply 404 Caddy fix (manual, verified).
2. World Cup final week (Jul 13–19): daily X threads from existing WC cluster; recap article within 48h of the final (editorially verified scores only).
3. Set up GSC + GA4 dashboards split EN/AR; baseline all KPIs.
4. Open TikTok + X + Instagram handles (@doyouknowapp — bios in §3); publish first 10 clips from top-10 evergreen articles.
5. Back-to-school UAE + KSA guides (EN+AR) published by Aug 1.
6. Wire a real ESP for the newsletter (forms currently mailto-based — honest but low-conversion; Buttondown/Beehiiv free tier fits a static site).

**Next 90 days (through mid-Oct 2026):**
- Saudi National Day refresh (by Sep 9) → Riyadh Season + GITEX articles (by Oct 1).
- Release chatgpt/gemini articles from review with refreshed facts; add 2 Gulf-AI explainers.
- Business cluster +6 articles (EN+AR).
- First newsletter send (monthly digest of top facts).
- Pitch 3 Gulf newsletters/podcasts for mentions; submit to relevant directories (see below).

**Partnerships:** Gulf expat newsletters, university student groups (fact content for projects), Saudi/UAE teacher communities, micro-influencers in the "TIL/فوائد" niche (barter: content collabs, not paid).
**Newsletter:** monthly "5 facts + 1 guide" digest, bilingual toggle; grow via inline CTAs (already sitewide) once ESP is live.
**Directory submissions:** Google News (aspirational — needs author pages first), Bing Webmaster, Feedly (RSS exists), AllTop, Arab bloggers directories.
**Repurposing:** every new article ships with its social kit (1 clip script, 1 thread, 1 carousel) — added to the definition of done.

## 8. Analytics and KPIs

Monthly scorecard (GSC + GA4):
- Organic clicks (target: +20% MoM from baseline)
- Indexed pages vs sitemap URLs (target: >90% of ~240)
- Search impressions, average position, CTR (per language)
- Returning-visitor rate
- Top 10 articles by clicks (per language)
- Language split (sessions EN vs AR) — hypothesis: AR under-monetized, over-performing
- Social referral sessions per platform
- Newsletter subscribers (once ESP live) + contact_form_submit events
- Core Web Vitals pass rate (PageSpeed: Perf 83 / A11y 92 as of 2026-07-08 — protect these)

## 9. Experiments Backlog

| # | Hypothesis | Change | Audience | Metric | Priority |
|---|---|---|---|---|---|
| 1 | Question-form titles lift CTR | Rewrite 10 title tags as questions | Search | GSC CTR | P0 |
| 2 | AR TikTok outperforms EN 3:1 in Gulf | Post same fact both languages | Social | Views/follows | P0 |
| 3 | Freshness bumps rankings | Update 5 stale articles + dateModified | Search | Avg position | P0 |
| 4 | Real ESP lifts signups vs mailto | Install Buttondown form | All readers | Signups/wk | P0 |
| 5 | Related-articles block lifts pages/session | Add 3-card related block variants | On-site | Pages/session | P1 |
| 6 | "Sources" box lifts trust + dwell | Visible sources list top of FAQ | On-site | Engaged time | P1 |
| 7 | WC recap captures post-final surge | Publish recap within 48h of final | Search | Clicks 7d | P0 (time-boxed) |
| 8 | X threads drive measurable referrals | 7 daily threads w/ UTM | X | Referral sessions | P1 |
| 9 | AR search index split speeds search | (shipped 2026-07-08) measure | AR users | search_use events | P2 |
| 10 | Carousel guides get saved 5x more | 3 IG carousels vs 3 reels | IG | Saves | P1 |
| 11 | Category hub intros lift hub rankings | Add 150-word intros to category pages | Search | Hub impressions | P1 |
| 12 | Author page unlocks Google News | Create real author/editorial page | Search | GN acceptance | P2 |
| 13 | FAQ schema wins featured snippets | Audit FAQ answers ≤50 words | Search | Snippet count | P1 |
| 14 | Hijri dates in AR titles lift AR CTR | Test on 3 seasonal AR articles | AR search | CTR | P2 |
| 15 | WhatsApp share button beats generic share | Add WA-specific button (Gulf norm) | Mobile | Share events | P1 |
| 16 | Dark-mode default follows OS | Respect prefers-color-scheme on first visit | All | Bounce | P2 |
| 17 | Internal search no-results suggests topics | Add "popular searches" chips | On-site | Search refinements | P2 |
| 18 | Business cluster attracts B2B inquiries | +6 business articles | LinkedIn/search | work-with-us submits | P1 |
| 19 | Micro-influencer collabs beat cold posting | 3 barter collabs | TikTok | Follower growth | P2 |
| 20 | Evening AR posting beats morning | Post 8–10pm KSA vs 8–10am | Social | Avg views | P2 |
| 21 | Breadcrumb rich results lift CTR | Verify BreadcrumbList rendering in SERP | Search | CTR | P2 |
| 22 | Newsletter digest drives return visits | Monthly send once ESP live | Subscribers | Return rate | P1 |

## 10. Execution Calendar (30 days)

| Week | Actions |
|---|---|
| **Jul 10–13** | Merge audit PR → deploy → verify prod (11-point checklist). Manual VPS cleanup: delete exposed docs, apply 404 Caddy block, `caddy validate` + reload, re-curl checks. Set up GSC/GA4 dashboards. |
| **Jul 14–19 (WC final week)** | Daily X thread from WC cluster (UTM-tagged). Prep recap skeleton. Open @doyouknowapp socials, bios from §3. First 3 TikTok clips (evergreen facts). |
| **Jul 20–26** | Publish WC recap EN+AR (verified results only) within 48h of the Jul 19 final. Freeze WC cluster. Start back-to-school UAE guide (EN+AR). ESP decision + install (exp #4). Title-tag experiment on 10 articles (exp #1). |
| **Jul 27–Aug 2** | Publish back-to-school UAE + KSA (EN+AR). 5 freshness updates on stale top articles (exp #3). 3 more clips + 1 IG carousel (exp #10). Refresh chatgpt/gemini drafts for editorial release. |
| **Aug 3–10** | Release refreshed tech articles from review queue (JSON edit + build). Business cluster: 2 new articles. First monthly newsletter draft. Review KPIs vs baseline; kill/scale experiments. |

---
*Agent notes: numbers above (category counts, scores, dates) verified against repo state and live checks on 2026-07-10. Seasonal dates sourced from Time Out Dubai/Riyadh, visitsaudi.com, dubaidet.gov.ae retail calendar (searched 2026-07-10).*
