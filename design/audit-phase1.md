# Phase 1 Audit — doyouknow.app UI/UX/visual identity

Report only. No code changed. Baseline verified green: `npm test` → **SEO/link audit passed for 790 HTML pages**, World Cup scheduler audit passed.

Method: read `design/design-system.md` tokens as implemented in `assets/css/style.css` (3,045 lines, single stylesheet), the rendered `en/` and `ar/` output, and followed `.claude/skills/design-process.md` (surface-first, then diagnose, then treat).

---

## 0. Headline: the three things that matter most

1. **Arabic article hero images are broken sitewide.** The generated artwork is authored LTR; in Arabic the baked-in text overflows the canvas and is clipped. On `ar/article/burj-khalifa-facts.html` the title renders as the single fragment **"مذهلة"**, the wordmark as **"DOYOU…"**, the category as **"ي والإمارات"**. This affects the hero of ~361 Arabic articles and directly violates the non-negotiable bilingual-parity rule.
2. **Every article headline is printed twice.** The title is typeset *inside* the image and again as the `<h1>`/`<h3>` beside it. In English it also overflows: "Burj Khalifa: 10 Surprising Facts You Did…" runs off the right edge. This also violates the CLAUDE.md rule against rendered text inside images.
3. **The homepage is composed as the wrong surface.** A 361-article knowledge library is presented as a marketing landing page — centered hero, promo card, newsletter CTA — with no search, filter, sort, or browse affordance anywhere above the fold.

---

## 1. Surface archetypes: what each page should be vs. what it is

| Page | Should be | Is today | Verdict |
|---|---|---|---|
| Home | **Explore** (browse 361 articles), Decide/Learn secondary | Decide/Learn — centered hero + promo + CTA | ❌ wrong surface |
| Article | **Decide/Learn** | Decide/Learn | ✅ right archetype, poor execution |
| Category | **Explore** | Title + undifferentiated grid, zero explore tooling | ⚠️ right archetype, no affordances |
| Newsletter | **Configure** (one task) | Minimal form page | ✅ correct, but barren + contradicts home |
| About / Contact | **Decide/Learn** | Prose + filler team cards | ⚠️ credibility risk |

The hero-plus-cards composition is only correct on Decide/Learn. The homepage is the one place it's being used and the one place it doesn't belong.

---

## 2. Slop diagnostic — **8 / 10** (lower is better)

Scored per `design-process.md`. Diagnosis only; treatment deferred to Phase 3.

| # | Tell | Fired | Evidence |
|---|---|---|---|
| 1 | Tech gradient | ✅ | All 722 article SVGs use a navy→sky→amber diagonal (`#0F172A`→`#0EA5E9`→`#F59E0B`) |
| 2 | Generic tech hue | ❌ | Accent is brand-chosen amber, not default indigo. *Not fired* — but see palette sprawl below |
| 3 | Feature-tile grid | ✅ | About `team-grid` (emoji + heading + sentence ×5); `category-explorer` shows 5 arbitrary of 16 categories, all equal weight |
| 4 | Accent rail | ✅ | `.toast` `border-left:4px`, `.search-result-item.selected` 3px, blockquote 4px, `.toc a` 2px |
| 5 | Unearned blur | ✅ | `.site-header` has `backdrop-filter:blur(12px)` over an **opaque** `#FFFFFF` in light mode — a no-op that still forces a compositing layer. (Earned in dark, where bg is `rgba(15,23,42,.85)`) |
| 6 | Monument stat | ❌ | No vanity stats found — CLAUDE.md rule 1 is being respected |
| 7 | Icon topper | ✅ | About team cards centre 👤 / 🇬🇧 / 🇸🇦 above each heading |
| 8 | Center stack | ✅ | `.hero-section`, `.category-explorer`, `.newsletter-cta` all centered; home is one centered column top to bottom |
| 9 | Default type | ✅ | Inter (the tell's own example) + **zero type-scale tokens**; 128 raw `font-size` declarations across ~30 distinct values mixing rem/px/pt and 11 bespoke `clamp()` ramps |
| 10 | Wrong surface | ✅ | Home built as Decide/Learn; should be Explore (§1) |

Per the diagnostic's routing: **10, 8, 3 are the causes** → re-compose, don't recolour. 9 → re-typeset. 1, 4, 5, 7 → delete decoration, replace with real hierarchy.

---

## 3. Per-page findings

### Home (`en/index.html`, `ar/index.html`)

- **"Latest Articles" is not latest.** Cards are ordered alphabetically by slug (`prepare.mjs:1265` → `a.localeCompare(b)`). Rendered dates run 2025-01-20 → 2025-01-20 → 2026-06-26 → 2026-06-15. Note the RSS/JSON feeds *do* sort correctly (`prepare.mjs:1502-1503`), so the site contradicts its own feed.
- **All 11 cards read "GENERAL"** (13 in AR) — the 16-category taxonomy is invisible. Article pages carry correct badges (`badge-dubai`, "Dubai & UAE Places"), so this is a homepage data defect, not a design choice. Cards therefore have no colour-coding, no scent, no differentiation.
- **Dead newsletter real estate.** `.newsletter-signup, .footer-newsletter, .signup-form { display:none !important }` (style.css:2855). Intentional — the comment says "hidden until a consent-aware provider is connected" — but the consequence is a full-width navy CTA block rendering a headline, "coming soon" copy, and an invisible form, plus a truncated-feeling hero. Prime space delivering nothing. Meanwhile `/en/newsletter.html` has a **working** form → the site says "coming soon" and "subscribe now" simultaneously.
- **Trending pills are `<span>`, not links** — `cursor:pointer`, hover lift, zero destination and no keyboard access.
- **Featured card is ~50% decorative void**: at 1440px roughly 560×280px of `linear-gradient(135deg,#FEF3C7,#FDE68A)` holding one 3rem 💡 emoji. Hardcoded colours outside the token system.
- **Composed with inline styles** — the entire featured card is `style="flex:1;min-width:300px;…"`; 9 inline `style` attributes per homepage. The design system is bypassed at the most visible point on the site.
- `.reveal` sets `opacity:0` by default; content depends on JS to become visible.
- "View all →" under *Latest Articles* points at `/en/category/dubai.html` — a single category, not all articles.
- Category tile icons mix registers: `✓ ✦ 💼 ◆ ⚽` (geometric glyphs beside emoji).

### Article

- Title duplication + overflow (§0.2) — the dominant craft failure.
- **Category stated four times in one viewport**: breadcrumb, badge, inside the image, and again in the image's bottom pill.
- **Measure is ~95–100 characters** (`--max-article: 800px` at `1.05rem`). Comfortable reading is 60–75. This is the product's core surface and it's ~30% too wide; worse in Arabic at `line-height:1.75`.
- Dates render as raw ISO (`2026-06-26`, and `2026-06-30` in Arabic) — unlocalised in both languages.
- `.article-body h3` is **defined twice** with conflicting ramps (style.css:1008 `clamp(18px,2.5vw,24px)` vs :1679 `clamp(18px,2.5vw,22px)`). 12 duplicated selectors total.

### Category

- `<p class="category-badge">doyouknow.app</p>` sits above the H1 — an eyebrow that says the site's own name.
- Every card repeats the category you are already inside ("Dubai & UAE Places" ×20+). Pure noise.
- No count, no sort, no filter, no sub-topic navigation. An Explore surface with nothing to explore with.

### Newsletter

- Correct minimal Configure surface; form works (`.newsletter-form` escapes the `display:none` rule).
- Visually barren, and contradicted by the homepage's "coming soon".
- Honest mechanism (mailto) — good, but crude for the brand's stated bar.

### About / Contact

- **Team cards are filler presented as a team**: 👤 / 🇬🇧 / 🇸🇦 avatars, roles "Editorial Director", "English Writer", each with the same subtitle "Team Member" and one-line generic bios. This sits close to the CLAUDE.md rule 1 line on invented claims and reads as placeholder to any careful visitor.

---

## 4. System-level findings

**Typography — the biggest structural gap.** There is no type system: 0 type tokens, 128 `font-size` declarations, ~30 distinct values, units mixed across rem/px/pt, 11 hand-rolled `clamp()` ramps. Every new component invents its own size. This is why the site reads "assembled" rather than "designed", and it must be fixed before any visual polish.

**Colour — sprawl.** 8 `--color-category-*` plus 6 `--color-accent-*` (14 hues, several duplicated: `#8B5CF6`, `#F43F5E`, `#14B8A6`, `#F97316` appear in both sets) — yet the homepage renders one badge style. A rainbow defined and unused. Separately: `--shadow-glow`/`--shadow-amber` hardcode `rgba(245,158,11,…)` which is the *dark*-mode accent, so both shadows are wrong in light mode, where the accent is `#B45309`. `<meta name="theme-color">` is `#F59E0B` while the light accent is `#B45309`.

**RTL — mirrored, not logical.** 70 physical-direction declarations (`padding-left`, `border-right`, `left:`…) against only 4 logical properties, patched by **28 `[lang="ar"]` override blocks**. This is exactly the brittle pattern that produces the broken Arabic artwork: every new component needs a hand-written mirror, and any missed one silently breaks RTL. Should move to `margin-inline`, `padding-inline`, `inset-inline`, `border-inline`.

**Accessibility.**
- Contrast failures (computed):
  - `--color-text-muted #94A3B8` on white = **2.56:1** — used for card dates and read-time. Needs 4.5.
  - same on `#FAFAFA` = **2.46:1**.
  - dark-mode `--color-text-muted #64748B` on `#1E293B` = **3.07:1**.
  - (Passing: text-secondary 4.76:1, light accent 5.02:1, dark accent 6.81:1, dark secondary 5.71:1.)
- Hit targets below the 44px minimum: `.lang-switch`/`.theme-toggle`/`.search-toggle` ≈35px, `.trending-pill` ≈35px, `.nav-links a` ≈35px.
- Good: skip link, `:focus-visible`, `prefers-reduced-motion` block, ARIA on nav/dropdowns, semantic breadcrumbs.

**Tooling defect blocking Phase 3.** `scripts/serve.mjs:11` has no `.svg` MIME entry, so local dev serves SVG as `application/octet-stream` and **every article image renders blank locally**. Production is correct (`image/svg+xml`, verified). Any local visual QA — including the browser verification CLAUDE.md's definition of done requires — is currently unreliable. Fix this first in Phase 3.

**Mobile.** Breakpoints at 900 / 640 / 480px; nav collapses to a drawer at 900. Grid correctly drops to one column. Not visually verified (see below).

---

## 5. What was and was not verified

**Verified:** `npm test` green (790 pages). Token/CSS facts read from source. Contrast ratios computed. Sort order and badge uniformity confirmed in rendered HTML *and* in `prepare.mjs`. Production `Content-Type` confirmed by request. Rendered EN and AR article pages inspected in a real browser at desktop width, dark mode.

**Not verified:** mobile viewport visually — the automation could not resize the browser window past three attempts, so all mobile claims come from CSS breakpoints, not observation. Light mode on production not captured (browser followed system dark). Category, newsletter, and About pages assessed from markup/CSS, not screenshots. All of these should be covered by the Phase 3 screenshot matrix.

---

## 6. Recommended Phase 3 ordering (for reference, not yet actioned)

1. Fix `serve.mjs` SVG MIME — without it nothing else can be visually verified.
2. Rebuild the article-image generator: stop baking titles into artwork; make it RTL-aware. Fixes the #1 and #2 headline defects together.
3. Introduce a real type scale as tokens; retire the 128 ad-hoc sizes.
4. Re-compose the homepage as Explore; fix the sort and the "General" badge data.
5. Migrate RTL to logical properties; delete the 28 override blocks.
6. Contrast + hit-target pass.
7. Resolve the newsletter contradiction (one honest state, not two).
8. Replace About team filler with something true.
