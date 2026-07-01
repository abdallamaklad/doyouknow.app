# Humanization Summary — doyouknow.app Arabic Articles

**Date:** 2026-01-24  
**Scope:** 12 Arabic HTML articles  
**Goal:** Remove AI-generated writing patterns per `humanizer-zh` skill guidelines

---

## Files Processed

| # | File | Status |
|---|------|--------|
| 1 | `hidden-gems-uae.html` | ✅ Humanized (first batch) |
| 2 | `expo-city-dubai.html` | ✅ Humanized (first + second batch) |
| 3 | `deep-dive-dubai.html` | ✅ Humanized (first + second batch) |
| 4 | `dubai-frame.html` | ✅ Humanized (first + second batch) |
| 5 | `dubai-vs-abu-dhabi.html` | ✅ Humanized (first + second batch) |
| 6 | `dubai-police-lamborghini.html` | ✅ Humanized (first + second batch) |
| 7 | `dubai-miracle-garden.html` | ✅ Humanized (first + second batch) |
| 8 | `save-money-dubai.html` | ✅ Humanized (second batch) |
| 9 | `sheikh-zayed-grand-mosque-guide.html` | ✅ Humanized (first + second batch) |
| 10 | `louvre-abu-dhabi.html` | ✅ Humanized (first + second batch) |
| 11 | `palm-jumeirah-engineering.html` | ✅ Humanized (first batch) |
| 12 | `yas-island-abu-dhabi.html` | ✅ Humanized (first + second batch) |

---

## AI Patterns Eliminated

### 1. "ليس... بل" (Negative Parallelism / Counter-assertion)

The most pervasive AI pattern. Replaced with natural Arabic alternatives:

- **hidden-gems-uae.html** — 7 occurrences (e.g., "ليست مجرد مطعم... بل هي انعكاس")
- **deep-dive-dubai.html** — 3 occurrences (e.g., "ليس مجرد رقم قياسي... بل هو إضافة")
- **expo-city-dubai.html** — 2 occurrences ("وليس مجرد ذكرى", "وليس مجرد سياحة")
- **dubai-frame.html** — 1 occurrence ("فهي ليست مجرد موقع للتصوير")
- **dubai-vs-abu-dhabi.html** — 1 occurrence ("الهريص... ليست مجرد عناصر قائمة")
- **dubai-police-lamborghini.html** — 1 occurrence ("ليست مجرد عرض")
- **dubai-miracle-garden.html** — 1 occurrence ("ليست مجرد معلم سياحي")
- **sheikh-zayed-grand-mosque-guide.html** — 2 occurrences ("ليست مجرد زخارف", "ليس مجرد معلم سياحي")
- **save-money-dubai.html** — 1 occurrence ("ليس ممكناً فقط — بل هو شائع")
- **yas-island-abu-dhabi.html** — 1 occurrence ("ليست مجرد ألعاب — بل هي انغماس")

**Strategy:** Rewrote using natural contrast ("لكن", "لا", "أكثر من", "تتجاوز") rather than the formulaic "ليس... بل" structure.

### 2. "إضافة إلى ذلك" / "علاوة على ذلك" / "بالإضافة إلى ذلك"

Filler/connecting phrases that signal AI enumeration:

- **dubai-police-lamborghini.html** — 2 occurrences replaced with "أيضاً" or direct continuation
- **louvre-abu-dhabi.html** — 1 occurrence replaced with "أيضاً"

### 3. "ما يميز... هو" / "ما يجعل... هو"

Inline-header vertical-list structures:

- **dubai-police-lamborghini.html** — 1 occurrence ("ما يجعل هذه القصة مثيرة...")
- **yas-island-abu-dhabi.html** — 1 occurrence ("ما يميز هذه الحديقة...")
- **deep-dive-dubai.html** — 1 occurrence ("أبرز ما يميز ديب دايف دبي هو...")

**Strategy:** Reordered sentences to avoid the "X هو Y" analytical structure, or rephrased as direct description.

### 4. "تجربة مذهلة" / "تجربة ساحرة"

Promotional/advertising language:

- **sheikh-zayed-grand-mosque-guide.html** — 1 heading changed: "تجربة ساحرة" → "زيارة لا تُنسى"

### 5. "القيمة" (Abstract Noun as Subject)

- **deep-dive-dubai.html** — 1 occurrence: "القيمة لا تقتصر على المحترفين" → "الفائدة لا تقتصر على المحترفين"

### 6. English Words Mixed in Arabic Text

- **dubai-police-lamborghini.html** — "justice" → "العدالة" (in Arabic text)

### 7. Duplicate Paragraphs

- **sheikh-zayed-grand-mosque-guide.html** — Removed duplicate `<p>` block
- **louvre-abu-dhabi.html** — Removed duplicate `<p>` block

### 8. Malformed HTML

- **dubai-police-lamborghini.html** — Fixed a `<p>` tag that closed prematurely mid-paragraph, leaving raw text outside any tag.

---

## Natural Arabic Rewriting Techniques Applied

1. **Varied sentence openings** — Reduced repetitive sentence-start patterns (e.g., "إضافة إلى ذلك", "ما يميز")
2. **Conversational tone** — Added direct address, rhetorical questions, and colloquial phrasing where appropriate
3. **Specific details over abstraction** — Replaced generic positive conclusions with concrete observations
4. **Removed promotional superlatives** — "تجربة ساحرة" → "زيارة لا تُنسى", "تحفة هندسية" kept but contextualized
5. **Preserved all HTML structure** — Every schema markup, link, canonical URL, meta tag, navigation, footer, and share button was preserved

---

## Verification

- **Node scripts:** `node scripts/prepare.mjs && node scripts/audit.mjs` → **PASSED** (SEO/link audit passed for 145 HTML pages)
- **Grep audit:** All 12 files confirmed free of:
  - `ليس مجرد` / `ليست مجرد`
  - `إضافة إلى ذلك` / `علاوة على ذلك` / `بالإضافة إلى ذلك`
  - `تجربة مذهلة` / `تجربة ساحرة`
  - Abstract `القيمة` subject patterns
- Remaining natural `ليس... بل` constructions (e.g., "الهدف ليس... بل الإمساك") are **rhetorical devices**, not AI patterns

---

## Total Changes

- **First batch:** 42 replacements across 11 files (Python batch transformation)
- **Second batch:** 22 replacements across 8 files (targeted fixes)
- **Total:** ~64 textual replacements across 12 files
- **HTML fixes:** 1 malformed tag repair, 2 duplicate paragraph removals

---

*Summary generated by AI content editor for doyouknow.app*
