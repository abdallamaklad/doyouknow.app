# Project: doyouknow.app

Bilingual (English + Arabic) static content site. Arabic is a first-class citizen: full RTL layout, native-quality typography, never an afterthought or a translation layer.

## Stack and commands

- Static site: source content and templates rendered into `en/` and `ar/` plus root `index.html`.
- `npm run build` : renders OG rasters then runs `scripts/prepare.mjs` (production build).
- `npm test` : runs `scripts/audit.mjs` + worldcup scheduler audit. Must pass before any UI work is considered done.
- `npm start` : local server (`scripts/serve.mjs`) for visual checks.
- Fonts: Cairo + Tajawal (Arabic), Inter (English) via @fontsource, processed in `scripts/fonts/`.
- Node >= 20. No framework; plain HTML/CSS/JS. Do not introduce a framework.

## Deployment (critical)

- Push to `main` triggers production deploy (rsync --delete to the site server). NEVER commit or push UI work to main without explicit owner approval.
- Do all redesign work on a feature branch (e.g. `redesign/<topic>`). Leave the branch unpushed unless told otherwise.

## Design source of truth

- `design/design-system.md` is the existing brand system: deep navy `#0F172A` + warm amber `#F59E0B` identity, mobile-first Gulf audience, curious/trustworthy/welcoming personality. Evolve it, do not discard it silently. If you change tokens, update that file in the same commit.
- `.claude/skills/` contains the design workflow guides for this project (see below). Follow them for any UI/UX/visual identity work.
- `.claude/skills/design-templates/` holds reference design systems (Notion, Sanity, Mintlify, Linear, Stripe, Apple) with exact CSS values. Use them as vocabulary, not as clones.

## Hard rules for any UI/UX work

1. No fake metrics, testimonials, "trusted by" badges, invented user counts, or unverified claims anywhere. Conservative copy only.
2. No AI design slop: no glossy blue/violet gradients, no default glassmorphism, no icon-topper card grids, no left-accent-rail cards, no everything-centered layouts, no oversized vanity stats. Run the slop diagnostic in `.claude/skills/design-process.md` before calling anything done.
3. Arabic parity: every layout, component, and page must be verified in both `en/` and `ar/` (RTL). Arabic must read natively; fonts Cairo/Tajawal must pair correctly with Latin type.
4. Preserve instrumentation and growth surfaces: GA4/GSC tags, SEO metadata, sitemap/feed/manifest outputs, newsletter signup (`newsletter.html`, `en/newsletter.html`, `ar/newsletter.html`), OG image pipeline. Do not regress prerendered/visible text content on public routes.
5. Accessibility: 44px minimum hit targets, real focus and hover states, WCAG AA contrast for text and controls, `prefers-reduced-motion` respected.
6. Performance: mobile-first Gulf audience on real networks. Keep pages light, subset fonts, minimal weights, no render-blocking bloat, no heavy JS for decoration.
7. Images: use real assets from `assets/`; clean placeholders otherwise. No elaborate fake SVG illustrations or AI-rendered text inside images.

## Definition of done for design work

- `npm run build` and `npm test` pass.
- Visual verification in a browser: key pages (home, article, category, newsletter) in EN and AR, at mobile (390px) and desktop (1440px) widths, light and dark mode where applicable.
- Slop diagnostic report written and compositional issues fixed.
- `design/design-system.md` updated if any token changed.
- Work committed on a feature branch with a clear message. Never pushed to main autonomously.

## Content sensitivity gate (hard rule for every article wave)

Publishing policy (owner-ratified): prohibited topics (politics/conflict, allegations, gambling/lotteries) are never drafted or published. Approval-required topics (religion, health, finance, legal, government-procedure) must not be published without an explicit owner approval record.

Rules for any wave, PR, or content batch:
1. BEFORE drafting a wave, screen every planned slug: `node scripts/sensitivity-screen.mjs <slug> ...`. Drop prohibited matches entirely; hold approval-required matches out of the wave until approved.
2. The pull-request CI workflow `sensitivity-gate` runs `node scripts/sensitivity-screen.mjs --pr` and FAILS the PR if any added article slug is prohibited or approval-required without an approval record. Do not merge a red PR.
3. Owner approvals are recorded per slug in `sensitivity-approvals.json` (decision, category, date, Discord evidence link). An approval must exist BEFORE the slug is added to a wave; recording after publishing is a policy breach.
4. Never weaken, delete, or bypass the screen rules, the workflow, or the approvals file without explicit owner instruction.
