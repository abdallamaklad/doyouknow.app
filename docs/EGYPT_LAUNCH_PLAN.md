# Egypt Country Launch — Build Plan & Execution Brief

**Repo:** `~/Documents/Doyouknow` (github: abdallamaklad/doyouknow.app), static bilingual EN/AR site.
**Executor (heavy build):** Kimi.  **Commit/push/deploy:** Codex.  **Plan + verification:** Claude.
**Scope (decided by Abdalla):** Full parity with the Saudi hub (culture/travel/history, ~28 articles) **plus** a practical-guides cluster (~12). Content angle: **mix of culture/history + traveler practical utility.** Bilingual EN + AR, true RTL.

---

## 1. What "a country" means here (the model)
Not a data record — a **content hub**:
1. **Hub (category) pages** — hand-authored HTML per language, e.g. `en/category/saudi.html`, `ar/category/saudi.html`, listing the cluster's article cards.
2. **Article pages** — standalone HTML in `en/article/<slug>.html` + `ar/article/<slug>.html`.
3. **Wiring in `scripts/prepare.mjs`** — the `categoryGroups` array is the **single source of truth** mapping slug → category (drives breadcrumbs, hreflang pairing, category badge, "more in category").
4. **Nav links** — primary + mobile nav + homepage category explorer.
5. **Generated artifacts** — `npm run build` regenerates OG rasters (walks article dir automatically, no manifest), sitemap.xml, feeds, RSS. `npm test` (`scripts/audit.mjs`) validates links/hreflang/meta/Arabic.

**Reference to copy from: Saudi Arabia** — `saudi` + `saudi-guides` groups in `prepare.mjs`, hub pages `*/category/saudi.html` + `saudi-guides.html`, any `saudi-*` article.

---

## 2. Egypt cluster (slugs)

### Hub A — `egypt` (culture/travel/history), ~28
History & heritage: `egypt-ancient-history`, `pyramids-of-giza-facts`, `great-sphinx-facts`, `egyptian-pharaohs-guide`, `valley-of-the-kings-guide`, `egyptian-mummies-facts`, `rosetta-stone-facts`, `tutankhamun-facts`, `egyptian-hieroglyphs-guide`, `grand-egyptian-museum-guide`
Cities & places: `cairo-complete-guide`, `luxor-travel-guide`, `aswan-travel-guide`, `alexandria-travel-guide`, `sharm-el-sheikh-guide`, `hurghada-guide`, `dahab-guide`, `siwa-oasis-guide`
Nature: `nile-river-facts`, `red-sea-egypt-guide`, `white-desert-egypt`, `egypt-western-desert-guide`
Culture: `egyptian-cuisine-guide`, `koshari-egyptian-food-guide`, `coptic-heritage-egypt`, `islamic-cairo-guide`, `egyptian-music-culture`, `egyptian-traditional-crafts`

### Hub B — `egypt-guides` (practical), ~12
`egypt-e-visa-guide`, `egypt-tourist-visa-guide`, `best-time-visit-egypt`, `getting-around-egypt`, `egypt-sim-mobile-guide`, `egypt-money-currency-guide`, `egypt-tipping-baksheesh-guide`, `egypt-safety-guide`, `cairo-airport-guide`, `nile-cruise-guide`, `egypt-driving-guide`, `egypt-bank-account-guide`

> Existing Egypt content is World-Cup-only (`egypt-world-cup-2026`, `egypt-midfield-world-cup-2026`) — leave in the `world-cup-2026` group; do NOT move.

---

## 3. Per-article contract (copy Saudi exactly)
**Copy an existing Saudi article** (e.g. `en/article/saudi-cuisine-guide.html` + its AR pair) and swap content. Every file MUST keep:
- `<html lang="en|ar">`, the FULL inlined critical `<style>` block byte-for-byte (AR RTL handled by `[lang="ar"]` rules in it).
- `<meta description>`, canonical `https://doyouknow.app/<lang>/article/<slug>.html`.
- hreflang trio en/ar/x-default (x-default → `/en/`).
- OG + Twitter; `og:image` = `https://doyouknow.app/assets/images/articles/<lang>-<slug>.png`; `og:locale` en_AE / ar_AE.
- **BreadcrumbList JSON-LD**: Home → Egypt (or Egypt Guides) → Article.
- **Article JSON-LD** matching Saudi articles that have it.
- gtag block (`G-6VQZY87LJB`) verbatim.
- Header nav + breadcrumb + body + **Sources section** (cite official: Egypt e-Visa portal, Ministry of Tourism & Antiquities, EgyptAir, UNESCO for heritage) + related articles + footer.

**Quality bar:** 900–1,600 words, accurate, 2026-current (visa/price info as ranges not brittle specifics), genuinely useful — same bar as Saudi. AR = correct MSA, true RTL, no loose machine translation.

---

## 4. Wiring edits (exact)

**`scripts/prepare.mjs` — add 4 groups to `categoryGroups`:**
```js
{ lang:'en', slug:'egypt',        title:'Egypt', description:'…', files:[ …culture slugs… ] },
{ lang:'en', slug:'egypt-guides', title:'Egypt Practical Guides', description:'…', files:[ …guide slugs… ] },
{ lang:'ar', slug:'egypt',        title:'مصر: التاريخ والثقافة', description:'…', files:[ …same culture slugs… ] },
{ lang:'ar', slug:'egypt-guides', title:'أدلة عملية في مصر', description:'…', files:[ …same guide slugs… ] },
```
- Add Egypt to the category **title map** near the Saudi entries (~lines 80–90) so breadcrumb/category titles resolve.
- Add explicit `pairedPages` entries for the hub pages (mirror `world-cup-2026.html` pairing) so EN↔AR hub hreflang resolves.

**Hub pages (author, copy Saudi):**
- `en/category/egypt.html` + `ar/category/egypt.html` ← copy `saudi.html`; swap hero title/desc, pick an unused `--color-category-*` badge, set card grid to the culture cluster.
- `en/category/egypt-guides.html` + `ar/category/egypt-guides.html` ← copy `saudi-guides.html`; swap to guides cluster.

**Nav / discovery:** add **Egypt** to primary nav + mobile nav + homepage category explorer exactly how **Saudi** appears (grep the `/en/category/saudi.html` nav occurrences, add an Egypt sibling in the same spots). Keep EN/AR in sync. Add hub links to `en/index.html` + `ar/index.html`.

**Do NOT touch:** World Cup groups, `editorialReview` queue, `removedContent` set, deploy configs.

---

## 5. Build & validation gate (green before Codex)
```bash
npm run build   # render-og-rasters (auto en-/ar-<slug>.png) + prepare.mjs (sitemap, feeds, hreflang, wiring)
npm test        # scripts/audit.mjs + worldcup audit — links, hreflang pairs, meta, Arabic
```
`npm test` fails on broken internal links, missing hreflang pair, missing meta, or an EN file with no AR pair (and vice-versa). **Every new article needs BOTH EN+AR pairs.** Do not hand to Codex until `npm test` exits 0.
After build confirm: sitemap.xml has new Egypt URLs; feeds/RSS updated; OG rasters exist for every new slug (both langs).

---

## 6. Phasing (keep build green at each boundary)
- **Phase 0 — skeleton:** add 4 `categoryGroups` (but `files:` arrays list ONLY slugs that already exist at each phase, so audit stays green), title-map + pairedPages edits, 4 hub pages, nav. Create 2 EN+AR pairs to start (`pyramids-of-giza-facts`, `egypt-e-visa-guide`).
- **Phase 1:** history/heritage cluster EN+AR; expand `egypt` `files:`.
- **Phase 2:** cities/nature/culture remainder EN+AR.
- **Phase 3:** `egypt-guides` cluster EN+AR; expand that group's `files:`.
- **Phase 4:** final `npm run build && npm test` green; verify sitemap/feeds/OG.
> If budget runs out, STOP at a green phase boundary and report done-vs-pending slugs so the next run resumes cleanly.

---

## 7. Division of labor
| Step | Owner |
|---|---|
| Plan, slug list, verification | Claude |
| All hub pages + articles (EN+AR) + wiring, keep `npm test` green | **Kimi** |
| git add/commit per phase, push `egypt-launch` branch, PR/merge to `main` (fires deploy) | **Codex** |
| Post-deploy live verification | Claude |

**Branch:** `egypt-launch` — do NOT commit to `main` directly (deploy fires on push to `main`; Codex controls merge timing). Deploy = `.github/workflows/deploy.yml` runs `npm test` then rsyncs to VPS; red test blocks deploy (safety net).
Also drop a copy of this plan at `docs/EGYPT_LAUNCH_PLAN.md` in the repo as part of the build.

---

## 8. Post-deploy verification checklist (Claude)
- [ ] `/en/category/egypt.html` + `/ar/…` load and list cluster
- [ ] `/en/category/egypt-guides.html` + `/ar/…` load
- [ ] 3–4 spot articles load EN+AR; hreflang, canonical, breadcrumb, OG render
- [ ] AR = true RTL, correct MSA
- [ ] Egypt in nav on home + article pages
- [ ] live sitemap.xml has Egypt URLs; feeds updated
- [ ] no console/404 errors on hub pages
