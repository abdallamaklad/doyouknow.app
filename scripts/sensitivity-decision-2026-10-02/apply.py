#!/usr/bin/env python3
"""Apply the owner's 2026-10-02 sensitive-pages decision to a doyouknow.app checkout.

Usage: python3 -I scripts/sensitivity-decision-2026-10-02/apply.py . scripts/sensitivity-decision-2026-10-02/groups.json
Idempotent: notices are inserted once; JSON records are rewritten deterministically.
"""
import json
import sys
from pathlib import Path

repo, groups_path = Path(sys.argv[1]), Path(sys.argv[2])
g = json.loads(groups_path.read_text())

EVIDENCE = ("Quantara Discord, doyouknow operations thread 1529842584544088135, owner message "
            "1555660235018870835 (2026-10-02): \"approve recommendations\" for "
            "doyouknow-flagged-pages-2026-10-01.txt (growth/policy/2026-10-02-owner-decision-sensitive-pages.md)")

# --- Classification -------------------------------------------------------------------------
# Health pages that tell readers what medicine or supplements to use (Hermes classification, t_bd6903b4).
HEALTH_NOINDEX = {
    "are-dietary-supplements-necessary", "does-collagen-powder-actually-do-anything-for-your-skin",
    "how-blood-pressure-medication-actually-lowers-your-numbers", "how-creatine-actually-works-in-muscle",
    "how-melatonin-supplements-actually-affect-your-sleep-cycle", "how-organ-transplant-rejection-actually-gets-suppressed",
    "how-retinol-actually-repairs-and-renews-skin", "how-weight-loss-drugs-actually-work-in-the-body",
    "how-your-body-actually-uses-vitamin-d-from-sunlight", "what-are-fat-soluble-vitamins",
    "what-are-omega-3-fatty-acids", "what-are-probiotics",
}
# Ruling-like religion pages: Hermes's 3 borderline (t_0f5f6e2a) + 3 second-person rite/obligation guides.
RELIGION_NOINDEX = {
    "how-wudu-ablution-rules-actually-work", "how-zakat-calculation-actually-works", "ramadan-health-guide",
    "hajj-guide", "umrah-guide", "friday-prayer-jummah-guide",
}
LEGAL_NOINDEX = {
    "egypt-inheritance-law-guide", "egypt-power-of-attorney-guide", "saudi-inheritance-law-guide",
    "saudi-power-of-attorney-guide", "how-islamic-inheritance-law-faraid-calculations-actually-work",
}
# Government: no page shows a "last checked" date, so procedure pages are noindexed until updated.
# These five carry no procedure (fees/steps) that can go stale, so they stay indexed.
GOV_EXPLAINERS = {
    "how-passports-came-to-exist", "how-passport-power-rankings-work",
    "why-census-data-actually-shapes-government-funding",
    "how-airport-immigration-e-gates-actually-verify-your-identity",
    "how-dubais-salik-toll-system-actually-charges-drivers-without-stopping",
}
# Meets the bar as is: visible "Updated" date in EN and AR plus official sources (moi.gov.ae, u.ae).
GOV_MEETS_BAR = {"uae-driving-license-guide"}
GOV_NOINDEX = (set(g["government"]) - GOV_EXPLAINERS - GOV_MEETS_BAR) | {"golden-visa-investor-track"}
NOINDEX = HEALTH_NOINDEX | RELIGION_NOINDEX | LEGAL_NOINDEX | GOV_NOINDEX

# Keyword false positives in the flagged list: no advice notice makes sense on these.
NO_NOTICE = {"how-diplomatic-immunity-actually-works", "why-grade-inflation-happens-at-universities"}

MEDICAL = (set(g["health"]) | {"why-you-cannot-fully-repay-sleep-debt", "ramadan-health-guide"}) - NO_NOTICE
FINANCIAL = (set(g["finance"]) | {"how-sukuk-islamic-bonds-actually-work", "golden-visa-investor-track",
                                  "islamic-finance-guide",
                                  "how-islamic-microfinance-actually-helps-small-entrepreneurs"}) - NO_NOTICE
LEGAL = set(g["legal"]) | {"how-islamic-inheritance-law-faraid-calculations-actually-work"}

NOTICES = {
    "medical": {
        "en": "<strong>Note:</strong> This article is a general explainer, not medical advice. For personal "
              "symptoms, diagnosis, or treatment decisions, consult a qualified healthcare professional.",
        "ar": "<strong>تنبيه:</strong> هذا المقال شرحٌ عامٌّ مبسَّط وليس استشارة طبية. عند وجود أعراض شخصية أو "
              "قرارات تتعلق بالتشخيص أو العلاج، استشر أخصائي رعاية صحية مؤهلًا.",
    },
    "financial": {
        "en": "<strong>Note:</strong> This article is a general explainer, not financial advice. Before making "
              "decisions about your own money, consult a qualified financial adviser.",
        "ar": "<strong>تنبيه:</strong> هذا المقال شرحٌ عامٌّ مبسَّط وليس استشارة مالية. قبل اتخاذ قرارات تخص "
              "أموالك، استشر مستشارًا ماليًّا مؤهلًا.",
    },
    "legal": {
        "en": "<strong>Note:</strong> This article is a general explainer, not legal advice. Laws change and "
              "differ by country; for your own situation, consult a qualified lawyer.",
        "ar": "<strong>تنبيه:</strong> هذا المقال شرحٌ عامٌّ مبسَّط وليس استشارة قانونية. تتغيّر القوانين "
              "وتختلف من بلد إلى آخر؛ لحالتك الخاصة استشر محاميًا مؤهلًا.",
    },
}
BODY = '<div class="article-body">'

def notices_for(slug):
    kinds = []
    if slug in MEDICAL: kinds.append("medical")
    if slug in FINANCIAL: kinds.append("financial")
    if slug in LEGAL: kinds.append("legal")
    return kinds

inserted = 0
for slug in sorted(MEDICAL | FINANCIAL | LEGAL):
    for lang in ("en", "ar"):
        f = repo / lang / "article" / f"{slug}.html"
        if not f.exists():
            continue
        html = f.read_text(encoding="utf-8")
        if 'class="advice-notice"' in html:
            continue
        # A div, never a <p>: prepare.mjs takes the search excerpt from the first <p> of the body.
        block = "".join(f'<div class="advice-notice" role="note">{NOTICES[k][lang]}</div>' for k in notices_for(slug))
        # Many wave pages nest a second article-body div right inside the first; the outer one is the anchor.
        assert html.count(BODY) >= 1, f
        f.write_text(html.replace(BODY, BODY + block, 1), encoding="utf-8")
        inserted += 1

# --- editorial-review.json: the noindex source of truth for prepare.mjs ----------------------------
er_path = repo / "editorial-review.json"
er = json.loads(er_path.read_text(encoding="utf-8"))
er["pages"]["owner-decision-2026-10-02-sensitive"] = [
    f"/{lang}/article/{slug}.html" for slug in sorted(NOINDEX) for lang in ("en", "ar")
    if (repo / lang / "article" / f"{slug}.html").exists()
]
note = (" Owner decision 2026-10-02 (sensitive pages): health pages that tell readers what medicine or supplements"
        " to use, ruling-like religion pages, inheritance/power-of-attorney legal pages, and government procedure"
        " pages without a visible last-checked date and official source are noindexed until reviewed"
        " (sensitivity-approvals.json records each decision).")
if "Owner decision 2026-10-02" not in er["policy"]:
    er["policy"] += note
er_path.write_text(json.dumps(er, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# --- sensitivity-approvals.json ----------------------------------------------------------------
ap_path = repo / "sensitivity-approvals.json"
ap = json.loads(ap_path.read_text(encoding="utf-8"))
primary = {}
for cat in ("health", "finance", "religion", "government", "legal"):
    for s in g[cat]:
        primary.setdefault(s, cat)
multi_cat = {"golden-visa-investor-track": "government", "why-you-cannot-fully-repay-sleep-debt": "health",
             "how-sukuk-islamic-bonds-actually-work": "finance",
             "how-islamic-inheritance-law-faraid-calculations-actually-work": "legal"}
primary.update(multi_cat)
for slug, cat in sorted(primary.items()):
    kinds = notices_for(slug)
    rec = {"decision": "removed" if slug in NOINDEX else "approved", "category": cat, "date": "2026-10-02",
           "evidence": EVIDENCE, "recorded": "2026-10-20"}
    if slug in NOINDEX:
        rec["action"] = "noindex"
    if kinds:
        rec["notice"] = kinds
    ap["approvals"][slug] = rec
ap_path.write_text(json.dumps(ap, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

print(f"notices inserted into {inserted} pages; noindex slugs {len(NOINDEX)} "
      f"(health {len(HEALTH_NOINDEX)}, religion {len(RELIGION_NOINDEX)}, legal {len(LEGAL_NOINDEX)}, "
      f"government {len(GOV_NOINDEX)}); records {len(ap['approvals'])}; "
      f"notice sets medical {len(MEDICAL)} financial {len(FINANCIAL)} legal {len(LEGAL)}")
