# Strategy review and production decisions

## Executive decision

Launch as a static bilingual editorial site behind Nginx/CDN. The supplied WordPress plan is useful for a future multi-writer newsroom, but it adds a database, PHP, plugin licensing, caching complexity, and a larger security surface before those capabilities are needed. Static HTML gives the first release the strongest performance and simplest VPS operation.

## What changed from the supplied package

- Replaced the single “General” taxonomy with eight focused topical hubs.
- Preserved separate `/en/` and `/ar/` trees and native RTL rather than presenting Arabic as a visual translation layer.
- Treated English UAE content and Arabic Saudi content as independently commissioned editorial tracks. The language switch therefore opens the other language homepage unless a verified paired translation exists.
- Repaired development-path leakage, broken internal links, duplicate H1 headings, invalid JavaScript, missing policy pages, false newsletter behavior, missing social images, and incomplete publisher assets.
- Added an editorial indexation gate. Fast-changing or higher-risk pages remain `noindex,follow` and outside the sitemap until their claims are checked against current primary sources.
- Added automated validation for internal links, title and description lengths, canonical uniqueness, JSON-LD parsing, heading structure, favicons, and Open Graph metadata.

## SEO principles

There is no honest “maximum SEO score” that guarantees rankings. The launch optimizes the controllable foundations:

1. Crawlable server-rendered HTML with clean language subfolders.
2. One descriptive H1 and one unique canonical per indexable page.
3. Descriptive titles and summaries in both languages.
4. Focused topic hubs and internal links that reinforce subject relationships.
5. Structured data that parses as JSON and describes the page truthfully.
6. Small runtime footprint, cacheable assets, stable layout, and no client-rendering dependency.
7. Conservative indexation for content whose accuracy can materially affect readers.

## Editorial release gate

Before removing `noindex` from a page listed in `editorial-review.json`:

1. Review every time-sensitive claim against the relevant government authority, official venue, official product documentation, or recognized medical source.
2. Add visible source links near the supported claims.
3. Record the reviewer and substantive review date.
4. Update the page metadata and structured-data `dateModified` only when the article materially changes.
5. Remove the page from `editorial-review.json`, rebuild, test, and confirm it appears once in `sitemap.xml`.

## Recommended next growth phase

- Add named author pages with demonstrable expertise before expanding YMYL content.
- Commission true paired translations for the highest-value evergreen pillars; only then add reciprocal article-level hreflang.
- Add original photography or licensed editorial images with explicit dimensions and useful alt text.
- Connect privacy-conscious analytics, Search Console, Bing Webmaster Tools, and a consent-aware newsletter provider after deployment.
- Move to a CMS only when publishing frequency and contributor count make repository-based editorial work the actual bottleneck.
