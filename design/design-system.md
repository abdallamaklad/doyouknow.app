# UI Design System for doyouknow.app

## Design System Overview

A premium, bilingual, content-first design system optimized for mobile-first consumption in the Gulf region (UAE, Saudi Arabia, GCC). The system prioritizes readability, trust, and performance while maintaining a warm, inviting aesthetic that reflects Gulf culture without being cliché.

---

## Brand Identity

### Name
**doyouknow.app** — lowercase, friendly, approachable

### Tagline
"Did you know?" — the universal curiosity hook that works in both English and Arabic

### Personality
- **Curious**: Every article starts with a surprising fact
- **Trustworthy**: Sources, author bios, editorial policy visible
- **Welcoming**: Warm amber tones, not cold corporate blue
- **Bilingual**: Arabic and English feel equally native, not translated
- **Mobile-First**: Designed for the phone in your hand, not the desktop screen

---

## Color System

### Primary Palette
| Color | Hex | Light Mode | Dark Mode |
|-------|-----|-----------|-----------|
| Deep Navy | `#0F172A` | Header, hero bg, primary text | Same |
| Warm Amber | `#F59E0B` | Brand accent, CTAs, hover | Same (brighter) |
| Emerald | `#10B981` | Success, read time, secondary | Same |
| Sky Blue | `#3B82F6` | Links, interactive, secondary | `#60A5FA` |

### Neutral Palette
| Color | Hex | Light Mode | Dark Mode |
|-------|-----|-----------|-----------|
| White | `#FFFFFF` | Card surfaces | `#0B1120` bg |
| Off-White | `#FAFAFA` | Page background | `#0B1120` |
| Light Gray | `#E2E8F0` | Borders, dividers | `#334155` |
| Medium Gray | `#94A3B8` | Muted text, placeholders | `#64748B` |
| Dark Gray | `#475569` | Secondary text | `#94A3B8` |
| Charcoal | `#1E293B` | Card bg dark | `#1E293B` |

### Accent Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Rose | `#F43F5E` | Alerts, trending, urgent |
| Purple | `#8B5CF6` | Featured, special categories |
| Teal | `#14B8A6` | Lifestyle, culture, wellness |
| Orange | `#F97316` | Hero gradients, warm highlights |

### Gradient Usage
```css
/* Hero section */
background: linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EF4444 100%);

/* Card hover glow */
box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);

/* Subtle page background */
background: linear-gradient(180deg, #FAFAFA 0%, #F1F5F9 100%);

/* Dark mode hero */
background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0B1120 100%);
```

---

## Typography

### Font Stack
```css
/* English */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Arabic */
font-family: 'Cairo', 'Tajawal', 'Noto Sans Arabic', sans-serif;

/* Monospace (code, data) */
font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### Type Scale
| Level | Mobile | Tablet | Desktop | Weight | Line Height |
|-------|--------|--------|---------|--------|-------------|
| Display | 28px | 36px | 48px | 700-800 | 1.2 |
| H1 | 24px | 32px | 42px | 700 | 1.3 |
| H2 | 20px | 26px | 32px | 600 | 1.4 |
| H3 | 18px | 22px | 24px | 600 | 1.5 |
| Body | 16px | 16px | 16px | 400 | 1.6 |
| Lead | 18px | 18px | 20px | 400 | 1.6 |
| Small | 14px | 14px | 14px | 400 | 1.5 |
| Caption | 12px | 12px | 12px | 500 | 1.4 |
| Label | 11px | 11px | 11px | 600 | 1.2 |

### Arabic Typography Rules
- `font-family: 'Cairo', 'Tajawal', sans-serif;`
- `line-height: 1.75;` (Arabic needs more space)
- `letter-spacing: 0;` (Arabic doesn't need tracking)
- `word-spacing: 0.05em;` (subtle spacing for readability)
- Headings: weight 700, slightly tighter line-height 1.4
- Body: weight 400, line-height 1.75
- Minimum font-size: 16px (prevents iOS zoom)

---

## Spacing System

### Base Unit: 4px
```css
--space-1: 4px;   /* Micro */
--space-2: 8px;   /* Compact */
--space-3: 12px;  /* Tight */
--space-4: 16px;  /* Standard */
--space-5: 20px;  /* Comfortable */
--space-6: 24px;  /* Relaxed */
--space-7: 32px;  /* Large */
--space-8: 48px;  /* Section */
--space-9: 64px;  /* Hero */
--space-10: 96px; /* Major */
```

### Layout Grid
- Max content width: 1200px
- Article body width: 800px (optimal reading length)
- Mobile padding: 16px
- Tablet padding: 24px
- Desktop padding: 32px
- Header height: 64px (fixed)
- Footer: 3-column grid on desktop, stacked on mobile

---

## Component Library

### Article Cards

**Default Card**
```
┌─────────────────────────────┐
│ [Image: 16:9 aspect ratio]  │
│                              │
├─────────────────────────────┤
│ [CATEGORY BADGE] [Date]      │
│                              │
│ Article Title Goes Here      │
│ That Might Wrap to Two Lines │
│                              │
│ 3 min read · 1.2K views      │
└─────────────────────────────┘
```

- Background: `#FFFFFF` (light) / `#1E293B` (dark)
- Border: `1px solid #E2E8F0` / `#334155`
- Border-radius: 12px
- Padding: 0 (image edge-to-edge) + 16px (text area)
- Shadow: `0 1px 2px rgba(0,0,0,0.05)`
- Hover: `translateY(-6px)`, shadow increases, border color → amber
- Image: `aspect-ratio: 16/9`, `object-fit: cover`, subtle zoom on hover

**Featured Card** (Hero Article)
```
┌─────────────────────────────────────┐
│ [Full-bleed image with dark       │
│  overlay, text overlay at bottom] │
│                                     │
│ [CATEGORY]                          │
│ The Featured Article Title         │
│ That Is Longer and More            │
│ Prominent                          │
│                                     │
│ 8 min read · By Author Name       │
└─────────────────────────────────────┘
```

- Full width, 16:9 or 21:9 aspect ratio
- Dark overlay: `rgba(15, 23, 42, 0.7)`
- Text: white, positioned at bottom-left
- Category badge: amber background, navy text
- Hover: overlay lightens, image zooms slightly

**Horizontal Card** (Related Articles)
```
┌─────────────────────────────────────┐
│ [4:3 Image] │ Title of Related     │
│               │ Article Goes Here   │
│               │ 5 min read          │
└─────────────────────────────────────┘
```

- Flex row: image left (30%), text right (70%)
- Padding: 16px
- Border: `1px solid #E2E8F0`
- Hover: border → amber, `translateX(4px)` (EN) / `translateX(-4px)` (AR)

### Category Badges
| Category | Background | Text | Icon |
|----------|-----------|------|------|
| Dubai & UAE | `#FEF3C7` | `#B45309` | 🏙️ |
| Saudi Arabia | `#FEF3C7` | `#B45309` | 🕌 |
| World Cup | `#DBEAFE` | `#1D4ED8` | ⚽ |
| Islamic Finance | `#D1FAE5` | `#047857` | 💰 |
| Lifestyle | `#FCE7F3` | `#BE185D` | 🌴 |
| Technology | `#E0E7FF` | `#4338CA` | 💻 |
| Sports | `#FEF9C3` | `#A16207` | 🏆 |
| General | `#E2E8F0` | `#475569` | 📰 |

- Border-radius: 9999px (pill)
- Padding: 4px 12px
- Font-size: 12px
- Font-weight: 600
- Uppercase for English, normal for Arabic

### Buttons

**Primary Button**
- Background: `#F59E0B`
- Text: `#0F172A`
- Padding: 12px 24px
- Border-radius: 8px
- Font-weight: 600
- Hover: `brightness(1.1)`, `translateY(-2px)`, shadow amber
- Active: `translateY(0)`, shadow reduces
- Dark mode: same colors, slightly brighter on hover

**Secondary Button**
- Background: `#0F172A`
- Text: `#FFFFFF`
- Same sizing as primary
- Hover: `background: #1E293B`, `translateY(-2px)`

**Ghost Button**
- Background: transparent
- Text: `#0F172A`
- Border: `1px solid #E2E8F0`
- Hover: `background: #F1F5F9`, border → amber

**Icon Button**
- Size: 40px × 40px
- Border-radius: 8px
- Background: `#F1F5F9`
- Icon: 20px, color `#475569`
- Hover: background → `#E2E8F0`, icon → `#0F172A`

### Share Bar
```
┌─────────────────────────────────────┐
│ Share: [WhatsApp] [X] [Facebook] [Copy] [Email] │
└─────────────────────────────────────┘
```

- Background: `#F8FAFC` / `#1E293B`
- Padding: 16px
- Border-radius: 12px
- WhatsApp button: green `#25D366`, first and most prominent (GCC primary share)
- Other buttons: icon + label, subtle
- Hover: lift + shadow
- Arabic: buttons stay in original order (icons don't flip)

### Table of Contents
```
Table of Contents
├─ Introduction
├─ Key Facts
├─ Detailed Guide
│  ├─ Section One
│  └─ Section Two
├─ Practical Tips
└─ FAQ
```

- Sticky on desktop (top: 80px)
- Collapsible on mobile (accordion)
- Active section: amber left border + bold text
- Links: smooth scroll to headings
- Arabic: right border instead of left

### FAQ Accordion
```
❓ What is the answer to this question?
   [+]  (expand icon)

   The answer appears here when expanded...
```

- Border: `1px solid #E2E8F0`
- Border-radius: 8px
- Padding: 16px
- First item: open by default
- Hover: border → amber
- Icon: chevron that rotates on toggle
- Animation: `max-height` transition 0.3s ease

### Newsletter CTA
```
┌─────────────────────────────────────┐
│ 📧 Stay in the Know                  │
│                                     │
│ Get weekly surprising facts         │
│ about the UAE, Saudi Arabia,        │
│ and the world.                      │
│                                     │
│ [Enter your email...] [Subscribe]   │
│                                     │
│ No spam. Unsubscribe anytime.       │
└─────────────────────────────────────┘
```

- Background: gradient (amber → orange → red) or dark navy
- Text: white
- Padding: 48px 24px
- Border-radius: 16px
- Input: white background, 48px height
- Button: white bg, amber text (inverted)
- Arabic: RTL layout, input on right

### Author Bio
```
┌─────────────────────────────────────┐
│ [Avatar]                            │
│                                     │
│ Written by John Doe                 │
│ Gulf travel journalist and fact     │
│ enthusiast. 5 years covering        │
│ Dubai, Riyadh, and beyond.          │
│                                     │
│ [Follow on X] [LinkedIn]           │
└─────────────────────────────────────┘
```

- Avatar: 64px circle, subtle border
- Name: 16px, weight 600
- Bio: 14px, secondary color, 2 lines max
- Social links: icon buttons
- Border-top: `1px solid #E2E8F0`

---

## Page Layouts

### Homepage
```
┌─────────────────────────────────────┐
│ [Header: Logo | Nav | Search | Lang]│
├─────────────────────────────────────┤
│ [Hero: Featured Article]            │
│                                     │
│ [Category Explorer: Grid of 8]     │
│                                     │
│ [Latest Articles: 3-card grid]     │
│                                     │
│ [Newsletter Banner]                 │
│                                     │
│ [Footer: Logo | Links | Social |   │
│  Legal]                             │
└─────────────────────────────────────┘
```

### Article Page
```
┌─────────────────────────────────────┐
│ [Header]                            │
├─────────────────────────────────────┤
│ [Breadcrumb: Home > Category >      │
│  Article]                           │
│                                     │
│ [Category Badge] [Date] [Read Time] │
│ [Article Title - H1]                │
│ [Author + Avatar]                   │
│                                     │
│ [Featured Image: 16:9]              │
│                                     │
│ [Table of Contents]                 │
│                                     │
│ [Article Body]                      │
│   H2, H3, paragraphs, lists,      │
│   blockquotes, images, tables       │
│                                     │
│ [Sources Section]                   │
│                                     │
│ [FAQ Accordion]                     │
│                                     │
│ [Related Articles: 3 cards]         │
│                                     │
│ [Share Bar]                         │
│                                     │
│ [Author Bio]                        │
│                                     │
│ [Newsletter CTA]                    │
│                                     │
│ [Footer]                            │
└─────────────────────────────────────┘
```

### Category Page
```
┌─────────────────────────────────────┐
│ [Header]                            │
├─────────────────────────────────────┤
│ [Breadcrumb: Home > Category]       │
│                                     │
│ [Category Title - H1]               │
│ [Category Description]              │
│                                     │
│ [Subcategory Tabs or Filters]       │
│                                     │
│ [Article Grid: 2-col desktop,       │
│  1-col mobile]                      │
│                                     │
│ [Pagination or Load More]           │
│                                     │
│ [Footer]                            │
└─────────────────────────────────────┘
```

---

## Responsive Behavior

### Mobile (< 640px)
- Single column everything
- Hamburger menu (overlay)
- Sticky header, collapsible TOC
- Share bar: horizontal scroll or wrap
- Cards: full width, stacked
- Newsletter: email input + button stacked
- Font: 16px body, 20px H1

### Tablet (640px – 1024px)
- 2-column article grid
- TOC: sidebar or inline
- Header: expanded nav
- Cards: 2 per row
- Font: 16px body, 24px H1

### Desktop (> 1024px)
- 3-column article grid
- Sticky TOC sidebar (left on EN, right on AR)
- Full header with all nav items
- Cards: 3 per row
- Featured article: hero layout
- Font: 16px body, 32px H1

---

## Animation & Motion

### Principles
1. **Purposeful**: Every animation serves UX (feedback, orientation, delight)
2. **Subtle**: Never distracting, always < 500ms
3. **Performant**: Use `transform` and `opacity` only
4. **Respectful**: Honor `prefers-reduced-motion`

### Animations
| Element | Trigger | Effect | Duration | Easing |
|---------|---------|--------|----------|--------|
| Cards | Hover | `translateY(-6px)` + shadow | 0.2s | ease |
| Buttons | Hover | `translateY(-2px)` + brightness | 0.15s | ease |
| Images | Hover | `scale(1.03)` | 0.3s | ease |
| Hero | Load | `fadeIn` + `slideUp` | 0.5s | ease-out |
| Cards on scroll | Enter viewport | `fadeIn` + `slideUp` | 0.4s | ease | stagger 0.1s |
| TOC | Active section | Amber left border | 0.2s | ease |
| FAQ | Toggle | `max-height` + chevron rotate | 0.3s | ease |
| Menu | Open | Slide from right | 0.3s | ease |
| Dark mode | Toggle | Cross-fade colors | 0.3s | ease |
| Share buttons | Click | Scale pulse + toast | 0.2s | ease |
| Newsletter | Submit | Success animation + thank you | 0.5s | ease |
| Loading | Skeleton | Shimmer gradient | 1.5s | linear infinite |

---

## Dark Mode

### Philosophy
Dark mode is not just inverted colors. It's a carefully crafted alternate experience that reduces eye strain for late-night reading (common in the Gulf where peak mobile usage is 9pm–1am).

### Implementation
```css
/* System preference default */
@media (prefers-color-scheme: dark) {
  :root { --theme: dark; }
}

/* User override */
[data-theme="dark"] {
  --color-bg: #0B1120;
  --color-surface: #1E293B;
  --color-surface-elevated: #334155;
  --color-text: #E2E8F0;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;
  --color-border: #334155;
  --color-border-hover: #475569;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.4);
  --image-filter: brightness(0.85) contrast(1.1);
}

/* Smooth transition between modes */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

### Dark Mode Specifics
- Images: `brightness(0.85)` to reduce glare
- Amber accent: 10% brighter for visibility on dark
- Cards: elevated with lighter borders
- Shadows: stronger (darker environment needs more depth)
- Code blocks: `background: #0F172A`, `border: 1px solid #334155`

---

## RTL (Arabic) Specifics

### Layout
- All horizontal layouts mirror (grid columns reverse, flex row reverse)
- Margins/paddings: use logical properties (`margin-inline-start`)
- Text alignment: `text-align: right` default
- Borders: `border-right` for active states instead of `border-left`

### Typography
- `font-family: 'Cairo', 'Tajawal', sans-serif;`
- `line-height: 1.75;` (more than English 1.6)
- `word-spacing: 0.05em;` (subtle breathing room)
- Headings: weight 700, tighter line-height 1.4
- No `letter-spacing` (Arabic doesn't benefit from it)
- Minimum 16px font size

### Components
- TOC: sticky on right side (desktop)
- Share bar: buttons stay in original order (LTR for icons)
- Related cards: hover `translateX(-4px)` instead of `+4px`
- Newsletter: email input on right side
- Breadcrumb: reversed order (Home → Category → Article becomes Article → Category → Home)
- Pagination: reversed (Previous/Next swap)

### Numbers & Dates
- Numbers: LTR override (phone numbers, dates, prices)
- Dates: `2024-01-15` format, LTR
- Prices: `1,000 AED` with LTR override
- Percentages: `85%` with LTR override

---

## Accessibility (WCAG 2.1 AA)

### Color Contrast
- All text on backgrounds: minimum 4.5:1 ratio
- Large text (18px+): minimum 3:1 ratio
- Amber on white: 3.1:1 (use dark text on amber, not white)
- Dark mode: all ratios ≥ 7:1 (AAA where possible)

### Focus States
- All interactive elements: `outline: 2px solid #F59E0B; outline-offset: 2px;`
- Visible focus ring on keyboard navigation
- Remove default browser outline, replace with custom

### Screen Readers
- Semantic HTML: `<article>`, `<nav>`, `<main>`, `<aside>`, `<time>`
- Alt text: descriptive, not "image of..."
- Skip links: "Skip to content" at top of page
- ARIA labels: icon-only buttons, form fields
- Live regions: for search results, toast notifications

### Keyboard Navigation
- All interactive elements: tabbable
- Modal: trap focus, escape to close
- Accordion: arrow keys to navigate, space/enter to toggle
- Carousel: arrow keys to navigate (if applicable)

### Motion
- `prefers-reduced-motion: reduce` → disable all non-essential animations
- Essential animations (loading, progress) → simplify to opacity only
- No parallax or scroll-jacking

---

## Performance Budget

| Metric | Target | Maximum |
|--------|--------|---------|
| First Contentful Paint (FCP) | < 1.0s | 1.5s |
| Largest Contentful Paint (LCP) | < 1.5s | 2.5s |
| Total Blocking Time (TBT) | < 100ms | 200ms |
| Cumulative Layout Shift (CLS) | < 0.05 | 0.1 |
| First Input Delay (FID) | < 50ms | 100ms |
| Time to Interactive (TTI) | < 2.0s | 3.5s |
| Page size (HTML + CSS + JS) | < 200 KB | 500 KB |
| CSS size | < 50 KB | 100 KB |
| JS size | < 20 KB | 50 KB |
| Images (per page) | < 500 KB | 1 MB |
| HTTP requests | < 20 | 30 |

### Performance Strategies
- Single CSS file, minified, cached
- Single JS file, deferred, cached
- SVG for all icons and simple illustrations
- WebP for photos, lazy loaded
- `loading="lazy"` on all images below fold
- `preload` for critical CSS
- `dns-prefetch` for Google Analytics
- `font-display: swap` for fonts
- Brotli compression on server
- Cache headers: 1 hour for HTML, 1 year for assets

---

## Interactive Patterns

### Search
- Trigger: click search icon or `/` key
- Input: full-width overlay, autofocus
- Results: live dropdown with categories
- Empty state: "No results. Try 'Dubai' or 'Saudi'"
- Debounce: 300ms
- Max results: 10

### Language Switcher
- Location: header, right side (left on Arabic)
- Format: `EN | AR` or flag icons + text
- Behavior: swaps `/en/` ↔ `/ar/` in URL, preserves path
- Active state: bold, amber underline
- Transition: instant page reload (no SPA routing)

### Dark Mode Toggle
- Location: header, near language switcher
- Icon: sun/moon toggle
- Behavior: toggles `[data-theme]` attribute, saves to localStorage
- Default: system preference
- Transition: 0.3s cross-fade on all color properties

### Mobile Menu
- Trigger: hamburger icon (header right)
- Behavior: slide from right (EN) / left (AR)
- Content: full navigation, categories, language switcher, dark mode toggle
- Close: X button, swipe, or outside click
- Animation: 0.3s ease slide
- Backdrop: `rgba(0,0,0,0.5)`

### Scroll Progress
- Location: top of page (fixed, thin bar)
- Color: amber gradient
- Behavior: width proportional to scroll position
- Visibility: only on article pages
- Height: 3px

### Back to Top
- Location: bottom right (left on Arabic)
- Trigger: appears after scrolling 500px
- Behavior: smooth scroll to top
- Icon: upward arrow
- Animation: fade in/out

---

## Brand Voice in UI

### Copy Tone
- **Curious**: "Did you know that Dubai has more than 400 skyscrapers?"
- **Helpful**: "Here's everything you need to know about..."
- **Factual**: Numbers, dates, statistics always accurate
- **Warm**: "Welcome to the UAE" not "Welcome to UAE"
- **Bilingual**: Arabic feels native, not translated

### Microcopy
| English | Arabic | Context |
|---------|--------|---------|
| "Read more" | "اقرأ المزيد" | Card CTAs |
| "Share" | "شارك" | Share buttons |
| "Copy link" | "نسخ الرابط" | Copy button |
| "Subscribe" | "اشترك" | Newsletter |
| "Stay in the know" | "تابع معنا" | Newsletter headline |
| "No spam. Unsubscribe anytime." | "لا رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت." | Newsletter subtext |
| "Written by" | "كتب بواسطة" | Author attribution |
| "Updated" | "آخر تحديث" | Date stamp |
| "Min read" | "دقيقة قراءة" | Read time |
| "Did you know?" | "هل تعلم؟" | Brand tagline |
| "Sources" | "المصادر" | Source section |
| "Related Articles" | "مقالات ذات صلة" | Related section |
| "FAQ" | "الأسئلة الشائعة" | FAQ section |
| "Work With Us" | "اعمل معنا" | Sponsorship page |

---

## File Structure

```
doyouknow.app/
├── assets/
│   ├── css/
│   │   └── style.css          # Single CSS file, all design tokens
│   ├── js/
│   │   └── site.js            # Single JS file, all interactions
│   └── images/
│       ├── articles/           # Article featured images
│       ├── icons/              # SVG icons
│       └── logo/               # Logo variations
├── design/
│   ├── design-system.md        # This file
│   └── theme.md               # Theme tokens
├── en/
│   ├── index.html             # English homepage
│   ├── article/               # English articles
│   ├── category/              # English category pages
│   ├── about.html
│   ├── contact.html
│   ├── privacy.html
│   ├── terms.html
│   ├── 404.html
│   └── work-with-us.html
├── ar/
│   ├── index.html             # Arabic homepage
│   ├── article/               # Arabic articles
│   ├── category/              # Arabic category pages
│   ├── about.html
│   ├── contact.html
│   ├── privacy.html
│   ├── terms.html
│   ├── 404.html
│   └── work-with-us.html
├── index.html                 # Root redirect (language detection)
├── sitemap.xml
├── robots.txt
└── package.json
```

---

## Implementation Notes

### CSS Architecture
- Single file: `style.css` (~38 KB)
- CSS custom properties (variables) for all tokens
- Mobile-first media queries
- BEM-like naming (not strict BEM, but consistent)
- No frameworks (Tailwind, Bootstrap) — pure CSS for performance
- Critical CSS: none (file is small enough to load whole)

### JavaScript Architecture
- Single file: `site.js` (~12 KB)
- Vanilla JS, no frameworks
- Deferred loading: `<script defer>`
- Modules: dark mode, mobile menu, FAQ accordion, share, scroll progress, lazy loading, IntersectionObserver for animations
- No jQuery, no React, no Vue (performance priority)

### Image Strategy
- SVG: all icons, logos, simple illustrations, placeholder images
- WebP: photographs (when available)
- Lazy loading: `loading="lazy"` on all images below fold
- `loading="eager"` on hero/first visible image only
- Aspect ratio: `aspect-ratio: 16/9` on all card images (prevents layout shift)
- Alt text: descriptive, never "image"

### Font Loading
- Inter: Google Fonts or local subset
- Cairo: Google Fonts or local subset
- Tajawal: Google Fonts or local subset
- `font-display: swap` on all
- Subset: Arabic + Latin characters only (reduces file size)
- Preload: only display fonts (Inter 400, Cairo 400, Cairo 700)

---

## Version History
- v1.0 — Initial design system (dark/light mode, RTL, bilingual)
- v1.1 — Added animation system, performance budget
- v1.2 — Added component library (cards, buttons, badges, share bar, FAQ, TOC, newsletter, author bio)
- v1.3 — Added page layout templates, interactive patterns, accessibility guidelines
- v1.4 — Added brand voice, microcopy, file structure, implementation notes
