# Redesign kickoff brief: doyouknow.app UI/UX/visual identity elevation

Paste this as the first prompt to Claude Code in the repo root, or attach it as context.

---

Goal: elevate the UI, UX, and visual identity of doyouknow.app to a top-tier professional standard, the level of craft people associate with Notion, Linear, or Stripe, while keeping the content-first, curiosity-driven character of the brand and its existing navy + warm amber identity.

Phase 1: Audit (report only, no code changes)
- Read `design/design-system.md`, the global CSS, layout templates, and the rendered `en/` and `ar/` output.
- Read `.claude/skills/design-process.md` and follow its workflow, including the surface-first rule.
- For each page type (home, article, category, newsletter, about/contact), name the surface archetype it should be (Decide/Learn, Explore, etc.) and list what is wrong today: composition, hierarchy, type, color use, spacing, RTL quality, mobile behavior.
- Run the slop diagnostic on the current pages and report the score with evidence.

Phase 2: Directions (wait for my pick before implementing)
- Propose 3 design directions: conservative (refine current system), strong-fit (best interpretation of the brief), divergent (bolder but still on-brand).
- Present them as one self-contained HTML option board at `design/directions.html` using real tokens and real sample content from the site, in both EN and AR, light and dark.
- Reference `.claude/skills/design-templates/` for vocabulary where useful. Do not clone any referenced brand.

Phase 3: Implement (only after I pick a direction)
- Update `design/design-system.md` first, then implement across the repo reusing existing structure.
- Follow every hard rule in CLAUDE.md: no fake claims, no slop, Arabic/RTL parity, preserved GA4/GSC + SEO + newsletter, accessibility, performance.
- Verify per the definition of done in CLAUDE.md: build + audit pass, browser screenshots of key pages EN/AR at 390px and 1440px, light/dark.
- Work on a feature branch. Do not push to main.

Constraints recap: bilingual parity is non-negotiable; mobile-first Gulf audience; keep the site fast on real mobile networks; every element must earn its place.
