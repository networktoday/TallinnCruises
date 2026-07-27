# Bloom Design System
### A complete visual & structural spec for high-conversion landing pages

> **Purpose:** This document captures every visual, layout, typographic, and interaction convention used in the *Tallinn Shore Tours* landing page. A developer or designer reading only this file — without ever opening the source code — should be able to produce a visually consistent, conversion-optimised landing page for a different product in the same style.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color Tokens](#2-color-tokens)
3. [Typography System](#3-typography-system)
4. [Spacing, Radius & Shadow Tokens](#4-spacing-radius--shadow-tokens)
5. [Section Flow — The 12-Part Vertical Narrative](#5-section-flow--the-12-part-vertical-narrative)
6. [Component Patterns](#6-component-patterns)
7. [Interactive Behaviors](#7-interactive-behaviors)
8. [Responsive Breakpoints & Mobile Patterns](#8-responsive-breakpoints--mobile-patterns)
9. [Image & Asset Conventions](#9-image--asset-conventions)
10. [Copy Voice & Tone](#10-copy-voice--tone)
11. [How to Adapt This for a New Project](#11-how-to-adapt-this-for-a-new-project)

---

## 1. Design Philosophy

### Concept
**Premium trust through restraint.** The design communicates authority and quality without shouting. It uses a dark navy base (evoking depth, reliability, the sea) punctuated by warm gold accents (premium, heritage, warmth). Cream and sand backgrounds on light sections keep the page airy. The overall feel is a *luxury boutique* — not a budget marketplace.

### Core Principles
- **Benefit-first, not feature-first.** Every section answers "what does the visitor get?" before "what does the product do?".
- **Proof surrounds the ask.** Every CTA is flanked by social proof (numbers, testimonials, guarantee icons).
- **Premium hierarchy.** Display serif for all headlines. Clean sans-serif for body. Mono for metadata, tags, and data labels. This three-layer type stack signals sophistication.
- **Rhythm via alternating backgrounds.** Sections alternate between `--navy` (dark), `--cream`/`--sand` (light), and `--white`. This rhythm creates natural visual breathing and signals section changes without requiring heavy dividers.
- **One primary action.** The entire page funnels toward a single conversion goal: booking the service. Every section either builds trust or removes a barrier.

### Target Audience Pattern
The ideal visitor is:
- Has a specific, time-boxed need (they are in port for 6–8 hours)
- Is risk-averse (they worry about missing their ship)
- Values privacy and quality over price
- Has tried the "standard" option and found it lacking

The design speaks directly to this anxiety-and-aspiration pairing: first acknowledging the risk ("we track your ship"), then surfacing the aspiration ("your day, your pace").

---

## 2. Color Tokens

All colors are defined as CSS custom properties in `:root`. Use these names in all new work to preserve semantic consistency.

### Primary Palette

| Token | Hex | Semantic Role |
|---|---|---|
| `--navy` | `#0B2D3E` | Primary dark background (hero, how-it-works, benefits, booking section) |
| `--navy-mid` | `#123D52` | Slightly lighter navy — trust strip background, hover states on dark buttons |
| `--navy-light` | `#1C5068` | Accent navy — used sparingly in gradients and SVG fills |
| `--gold` | `#D4941E` | Primary accent — CTAs, icons, highlight text, active FAQ, badge backgrounds |
| `--gold-light` | `#F0B843` | Brighter gold — hero stats, label text on dark backgrounds, hover gold |
| `--gold-pale` | `#FDF3DC` | Pale gold tint — signature tag background, testimonial quote mark color |

### Neutral Palette

| Token | Hex | Semantic Role |
|---|---|---|
| `--cream` | `#FAF7F2` | Default page background, testimonials section, hero section |
| `--sand` | `#EFE9DC` | Tour packages section background, contact section background |
| `--white` | `#FFFFFF` | Card backgrounds, FAQ section background, contact form card |
| `--text` | `#1A1A2E` | Default body text color |
| `--text-mid` | `#4A5568` | Secondary body text, card descriptions, form hints |
| `--text-light` | `#718096` | Tertiary text — meta labels, "from" price, ship names in testimonials |
| `--border` | `rgba(0,0,0,0.08)` | Default card/table borders — always semi-transparent for layering |

### Semantic Accent Colors

| Token | Hex | Semantic Role |
|---|---|---|
| `--teal` | `#0D9373` | Success / "good" indicators (comparison table header, "Included" addon tag) |
| Implicit red | `#F43F5E` / bg `#FFF1F2` | "Bad" column in comparison table — never used as a primary brand color |
| Implicit green | `#14532D` / bg `#F0FDF4` | "Good" column in comparison table text |

### Dark Background Text Colors
When placing text on `--navy` or `--navy-mid`:
- Headlines: `--white`
- Body copy: `rgba(255,255,255,0.65)` (or `0.6` for slightly dimmer)
- Labels/tags: `--gold-light`
- Muted/meta: `rgba(255,255,255,0.45)`
- Faintest hints: `rgba(255,255,255,0.25)`–`rgba(255,255,255,0.35)`

---

## 3. Typography System

### Font Stack

| Variable | Family | Fallback | Use |
|---|---|---|---|
| `--font-display` | Playfair Display | Georgia, serif | All H1–H2 headings, prices, logo, seal text, testimonial quote mark |
| `--font-body` | Figtree | sans-serif | Body copy, nav links, buttons, form labels, everything else |
| `--font-mono` | JetBrains Mono | monospace | Tags, eyebrow labels, duration badges, ship names, footer col titles, metadata |

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Figtree:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Type Hierarchy

| Level | Element | Font | Size | Weight | Color | Notes |
|---|---|---|---|---|---|---|
| Hero H1 | `.hero-headline` | Playfair Display | `clamp(52px, 6vw, 80px)` | 700 | `--white` | Line-height 1.05 |
| Hero italic second line | `.hero-headline em` | Playfair Display italic | same | 700 | Transparent | `-webkit-text-stroke: 1.5px --gold-light` |
| Section H2 (light bg) | `h2` in light sections | Playfair Display | `clamp(36px, 4vw, 52px)` | 700 | `--navy` | Line-height 1.15 |
| Section H2 (dark bg) | `h2` in dark sections | Playfair Display | `clamp(36px, 4vw, 52px)` | 700 | `--white` | |
| Section H2 with italic | `h2 em` | Playfair Display italic | same | 700 | `--gold` (light bg) / `--gold-light` (dark bg) | Used for one key word per headline |
| Tour card title | `.tour-card-title` | Playfair Display | `24px` | 600 | `--navy` | |
| Benefit / step title | `.benefit-title`, `.step-title` | Playfair Display | `18–20px` | 600 | Context-based | |
| Body copy | `p` | Figtree | `16px` (sections), `14px` (cards) | 300–400 | `--text-mid` | Line-height 1.7–1.8 |
| Eyebrow label | `.label` | JetBrains Mono | `11px` | 500 | `--gold` or `--gold-light` | `letter-spacing: 0.14em; text-transform: uppercase` — always appears above an H2 |
| Navigation links | `.nav-links a` | Figtree | `14px` | 500 | `rgba(255,255,255,0.75)` | |
| Button text | `.btn` | Figtree | `15px` | 600 | Context | |
| Tour tag / badge | `.tour-tag` | JetBrains Mono | `10px` | 500 | Context | `letter-spacing: 0.12em; text-transform: uppercase` |
| Price amount | `.tour-price-amount` | Playfair Display | `28px` | 600 | `--navy` | |
| Hero stat number | `.trust-num` | Playfair Display | `28px` | 600 | `--gold-light` | |
| Step number | `.step-num` | Playfair Display | `28px` | 600 | `--gold-light` | Inside a circular border |

### The Italic Emphasis Pattern
Every major section H2 contains **one italic word** rendered in gold. This is the single most distinctive typographic feature of the design:

```html
<h2>Cruise line tours are fine. Ours are <em>yours.</em></h2>
<h2>Best ways to see <em>Tallinn</em></h2>
<h2>Ready for your private <em>destination</em>?</h2>
```

The `em` tag applies `font-style: italic` AND changes color to `--gold` (light bg) or `--gold-light` (dark bg). On the hero, the second-line `em` is a *stroke-only outline* using `-webkit-text-stroke`.

### Body Default
```css
body {
  font-family: var(--font-body);
  background: var(--cream);
  color: var(--text);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
```

---

## 4. Spacing, Radius & Shadow Tokens

### Spacing Scale

| Token / Pattern | Value | Usage |
|---|---|---|
| `.section` | `padding: 96px 0` | Full-height sections |
| `.section-sm` | `padding: 64px 0` | Compact sections (FAQ) |
| `.container` | `max-width: 1100px; margin: 0 auto; padding: 0 24px` | All content width limiter |
| Section header `margin-bottom` | `52–60px` | Space between header and grid content |
| Card internal padding | `22–36px` | Generous internal breathing room |
| Form field gap | `12–16px` | Between form rows |
| Grid gap (2-col) | `60–80px` | Text+card or text+form two-column layouts |
| Grid gap (cards) | `24–32px` | Between cards in a grid |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius` | `12px` | Default card radius, form inputs, benefit cards |
| `--radius-lg` | `20px` | Larger cards (tour cards, booking form card, testimonial cards, contact form card) |
| `50px` (hardcoded) | `50px` | All buttons (pill shape) |
| `50%` | `50%` | Circular elements (avatars, seal, step numbers, icon rings) |
| `8px` | `8px` | Small elements — tour tags, comparison rows, form inputs |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow` | `0 4px 24px rgba(11,45,62,0.12)` | Default card shadow — very subtle |
| `--shadow-lg` | `0 12px 48px rgba(11,45,62,0.18)` | Hover/elevated card shadow |
| Button primary shadow | `0 4px 20px rgba(212,148,30,0.35)` | Gold glow under primary buttons |
| Button primary hover | `0 6px 28px rgba(212,148,30,0.5)` | Stronger glow on hover |
| Seal shadow | `0 12px 48px rgba(212,148,30,0.4)` | Floating badge glow |

---

## 5. Section Flow — The 12-Part Vertical Narrative

The page is a linear conversion funnel. Each section has a specific conversion role.

| # | Section ID | Background | Padding | Conversion Role |
|---|---|---|---|---|
| 0 | `#navbar` | Transparent → `rgba(11,45,62,0.97)` on scroll | Fixed | Persistent navigation + always-visible "Book Now" CTA |
| 1 | `#hero` | `--navy` | Full viewport height | First impression — state the unique promise, reduce anxiety, offer quick booking |
| 2 | `#trust-strip` | `--navy-mid` | `48px 0` | Immediately reinforce the 4 core differentiators after the hero |
| 3 | `#why-private` | `--cream` | `96px 0` | Handle the "why not just use the ship's tour?" objection with a comparison table |
| 4 | `#tours` | `--sand` | `96px 0` | Present all available products — let the visitor find their fit |
| 5 | `#how-it-works` | `--navy` | `96px 0` | Remove process anxiety — make booking feel frictionless and safe |
| 6 | `#benefits` | `--navy` | `96px 0` | Amplify desire — 6 specific emotional benefits of choosing private |
| 7 | `#testimonials` | `--cream` | `96px 0` | Social proof from real past customers — overcome final skepticism |
| 8 | `#faq` | `--white` | `64px 0` | Answer every remaining objection — kill doubt before the booking form |
| 9 | `#booking` | `--navy` | `96px 0` | **Primary conversion** — the booking request form |
| 10 | `#contact` | `--sand` | `96px 0` | Soft conversion — for visitors not ready to book; captures leads |
| 11 | `footer` | `#071D29` | `56px 0 32px` | Trust, contact info, navigation, legal links |

### Background Alternation Pattern
```
navy → navy-mid → cream → sand → navy → navy → cream → white → navy → sand → footer-dark
```
The strict alternation between dark navy and light cream/sand prevents visual monotony without any additional graphic decoration.

### Section Header Structure
Every section (except hero and trust strip) uses the same header pattern:
```html
<div class="[section]-header reveal">
  <span class="label">Short Descriptor</span>   <!-- JetBrains Mono, gold, uppercase -->
  <h2>Main headline with <em>italic gold word</em></h2>
</div>
```
Headers are centered on dark sections, left-aligned when part of a two-column layout.

---

## 6. Component Patterns

### 6.1 Navigation Bar

**Structure:** Fixed to top, full-width, transparent initially. Becomes a solid dark glass (`rgba(11,45,62,0.97)` + `backdrop-filter: blur(12px)`) when scrolled past 60px.

**Desktop layout:** Logo (display serif, 22px, white) | Nav links (5 items) | Primary CTA button "Book Now"

**Logo structure:**
```html
<a href="#" class="nav-logo">
  Brand Name
  <span class="nav-logo-sub">Short Tagline</span>  <!-- mono, 10px, gold-light, uppercase -->
</a>
```

**Mobile:** All nav links and the CTA button are hidden below `600px`. A hamburger button (3 spans, each 24×2px) appears. Clicking it reveals `.mobile-menu` — a block-level overlay with large anchor links and a full-width CTA button.

**Nav link hover:** `color: --gold-light`

---

### 6.2 Hero Section

**Layout:** Full-viewport-height two-column grid (`1fr 380px`, gap `60px`), vertically centered. Left column = content. Right column = two floating seal badges stacked above a glassmorphism booking card.

**Background:** `--navy` with two pseudo-elements:
- `::before` — subtle 45°/−45° repeating diamond line pattern at `rgba(255,255,255,0.015)` — almost invisible, adds texture
- `::after` — large radial gradient glow (`rgba(212,148,30,0.12)`) positioned top-right, creates a warm ambient light effect

**Hero content (left column):**
1. Eyebrow label (mono, gold-light, uppercase)
2. H1 with second line as outlined italic (stroke-only text): `color: transparent; -webkit-text-stroke: 1.5px var(--gold-light)`
3. Subtitle paragraph: 18px, weight 300, `rgba(255,255,255,0.65)`, max-width 480px
4. Dual CTA buttons: Primary (`btn-primary`) + Secondary (`btn-outline`)
5. Trust strip row: 3–4 stat items (large number in Playfair gold-light, small muted label) separated by `1px × 40px` vertical dividers

**Hero right column:**
1. Two "wax seal" circular badges (180×180px, `--gold` background, animated `float` keyframe, spinning dashed border ring via `spin-slow` animation, navy text)
2. A glassmorphism quick-booking card (`rgba(255,255,255,0.05)`, `backdrop-filter: blur(12px)`, border `rgba(255,255,255,0.12)`)

**Quick booking card fields:** Date input, guests select, tour picker (custom button that opens a modal), "Book Now →" anchor, micro-disclaimer note

**Diagonal transition:** An SVG at the hero's bottom creates a slanted edge transitioning into the trust strip section.

---

### 6.3 Trust Strip

**Layout:** 4-column grid (`repeat(4, 1fr)`), `48px 0` padding, `--navy-mid` background. Collapses to 2-column at 968px, 1-column at 600px.

**Each trust card:**
- Centered flex column
- 52×52px circular icon ring: `background: rgba(212,148,30,0.15); border: 1px solid rgba(212,148,30,0.3)`
- Title: Playfair 17px/600, white
- Description: 13px/300, `rgba(255,255,255,0.5)`, line-height 1.6

All 4 cards have the `.reveal` class (scroll-triggered fade-in) with staggered delays (0.1s–0.3s).

---

### 6.4 Comparison Table (Why Private Section)

**Layout:** Two-column grid with a left text column and a right comparison table. Gap 64px.

**Table structure:**
```
[Colored header row: "Competitor Name" (red) | "Your Brand" (teal)]
[Row: bad cell (pink bg, red text) | good cell (green bg, green text)]
[Row: ...]
...
```

**Bad cell:** `background: #FFF1F2; color: #9F1239; border-radius: 8px 0 0 8px`
**Good cell:** `background: #F0FDF4; color: #14532D; border-radius: 0 8px 8px 0; font-weight: 500`
**Row gap:** `2px` — creates a tight "table-like" visual with each row as a pair of rounded pills

Bad items start with a red/negative emoji. Good items state the positive outcome plainly.

---

### 6.5 Tour Cards (Product Cards)

**Layout:** Vertical stack (`flex-direction: column`, gap `24px`), max-width `880px`, centered. Each card is a horizontal two-column grid (`320px 1fr`) on desktop — image/visual left, body right.

**Card anatomy:**
- Left: `.tour-card-header` — 210px min-height, a photographic background with a `linear-gradient` overlay (navy from transparent to 72% opacity) + a mono duration badge bottom-left
- Right: `.tour-card-body` — tag, title, description, highlights list, footer

**Featured card:** Has `border: 2px solid --gold` and a "Most Popular" badge pill (gold bg, navy text, top-right absolute).

**Tour tag variants:**
| Class | Background | Text Color |
|---|---|---|
| default | `--sand` | `--text-mid` |
| `.tag-signature` | `--gold-pale` | `--gold` |
| `.tag-complete` | `rgba(13,147,115,0.08)` | `--teal` |
| `.tag-diff` | `rgba(11,45,62,0.07)` | `--navy` |

**Highlights list:** No bullet. Each item has a `✦` gold character as `::before`, 13px, separated by bottom borders (`1px solid --border`).

**Card footer:** Price block (stacked: "from" label / large Playfair price / "per person") + a CTA button. Use `btn-primary` for the featured card, `btn-dark` for all others.

**Hover state:** `transform: translateY(-4px); box-shadow: --shadow-lg`

---

### 6.6 How It Works (Numbered Steps)

**Layout:** 4-column grid on `--navy` background. A gold gradient horizontal line (`::after` pseudo-element on `.steps-grid`) connects the centers of the step numbers.

**Each step:**
- 72×72px circle: `background: --navy-mid; border: 2px solid --gold; box-shadow: 0 0 0 6px --navy` (the "ring gap" effect)
- Number inside: Playfair 28px/600, `--gold-light`
- Title: Playfair 20px/600, white
- Description: 14px/300, `rgba(255,255,255,0.5)`

Steps collapse to 2×2 grid at 968px (connector line hidden). The step numbers should follow a logical sequence: Book → Confirm → Meet/Pickup → Return.

---

### 6.7 Benefits Grid (6-Card Grid on Dark)

**Layout:** 3-column grid on `--navy`. Collapses to 2-column at 968px, 1-column at 600px.

**Each benefit card:**
- `background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: --radius; padding: 28px 24px`
- Emoji icon (28px)
- Title: Playfair 18px/600, white
- Description: 14px/300, `rgba(255,255,255,0.7)`, line-height 1.65
- Hover: `background: rgba(255,255,255,0.1); transform: translateY(-3px)`

---

### 6.8 Testimonial Cards

**Layout:** 3-column grid on `--cream`. Collapses to single centered column (max-width 480px) at 968px.

**Each card:**
- White background, `--radius-lg`, `border: 1px solid --border`
- `::before` pseudo-element: `"` in Playfair 80px/700, color `--gold-pale`, absolute top-left (decorative, non-semantic)
- 5 gold stars
- Quote text: 15px/300, `--text-mid`, line-height 1.8
- Author row (separated by top border): circular avatar (44px, `--navy` bg, Playfair gold initials) + name/ship metadata

**Author metadata:** Name in 14px/600 `--navy`. Ship/location in JetBrains Mono 12px `--text-light`.

---

### 6.9 FAQ Accordion

**Layout:** Single column, max-width `780px`, centered, on `--white` background.

**Each FAQ item:**
- Top border `1px solid rgba(11,45,62,0.12)` — last item also has bottom border
- Question button: full-width, flex, space-between, 24px vertical padding, 17px/600 `--navy`, transitions to `--gold` on hover and when open
- Chevron SVG (`24×24px`, gold, `--gold` stroke): rotates `180deg` when item is `.open`
- Answer: `max-height: 0; overflow: hidden` → `max-height: 400px` when open, 0.4s ease transition

**JS behavior:** Only one item can be open at a time. Clicking an open item closes it. Clicking a closed item opens it and closes any currently open item.

---

### 6.10 Booking Form Section

**Layout:** Two-column grid on `--navy` (`gap: 80px`). Left: content + promises. Right: the form card.

**Left column content:**
- Eyebrow label (gold-light)
- H2 with italic gold word
- Body paragraph
- "Booking promises" list: 3–4 items, each with a 28px circular icon ring (gold bg), a short confirmation phrase

**Form card:** `background: rgba(255,255,255,0.07); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.12); border-radius: --radius-lg; padding: 36px`

**Form grid:** 2-column grid with `.full` class spanning both columns for email, phone, and textarea.

**Input styles on dark background:**
```css
background: rgba(255,255,255,0.08);
border: 1px solid rgba(255,255,255,0.15);
border-radius: 8px;
color: --white;
font-size: 14px;
```
Focus state: `border-color: --gold-light`

**Add-ons section:** Divider label + grid of toggle cards. Each add-on card:
- Flex row: emoji + name/hint | check indicator
- Default: semi-transparent, faint border
- Active: gold border, very faint gold bg
- The hidden checkbox is toggled by JS; the visual state is controlled via `.addon-active` class
- Conditional fields appear/hide with `.visible` class when specific add-ons are checked

**Transfer add-on smart behavior:** When a tour that already includes transfers is selected, the transfer add-on becomes `.addon-disabled` and shows an "Included ✓" teal tag instead.

**Form success state:** When the form submits successfully, the form is hidden (`display:none`) and a centered success message (emoji + Playfair title + body text) is shown with `.visible`.

---

### 6.11 Contact Section

**Layout:** Two-column grid on `--sand`. Left: info + contact channels. Right: a white card with a simple 3-field form.

**Contact channels:** Flex column of 3 rows, each with a circular icon ring (40px, gold bg), a bold label and a muted value line.

**Contact form card:** White card (`--radius-lg`, `--shadow`, border `--border`), 32px padding. Light-bg input styles (white bg, `border: 1px solid rgba(11,45,62,0.15)`, gold focus ring `box-shadow: 0 0 0 3px rgba(212,148,30,0.12)`).

Fields: Name, Email, Message (textarea). Full-width submit button (`btn-primary`).

---

### 6.12 Footer

**Layout:** 3-column grid (`2fr 1fr 1fr`) on `#071D29` (slightly darker than `--navy`). Separated from the body by a `1px solid rgba(255,255,255,0.08)` bottom rule. Footer bottom row is a flex row: copyright (left) + legal links (right).

**Brand column (2fr):** Display font logo, short description (14px/300, `rgba(255,255,255,0.4)`), contact items (email, location, season hours) with gold emoji bullets.

**Link columns:** Column title (mono 13px/700, uppercase, `rgba(255,255,255,0.5)`). List items: 14px/300 `rgba(255,255,255,0.45)`, hover to `--gold-light`.

---

### 6.13 Floating Elements

**Scroll-to-top button:** Fixed, bottom-right (`28px`). 44×44px gold circle, navy arrow. Hidden (opacity 0, translateY 12px) until scrolled past 500px. Animates in.

**Wax seal badges:** Two animated circular badges in the hero. `animation: float 4s ease-in-out infinite` (gentle vertical bob). A `spin-slow 20s linear infinite` dashed circle ring orbits around each.

**Tour picker modal:** Fixed overlay (`rgba(0,0,0,0.65)`), centered card, max-width 700px, 90vh scroll. Grid of tour cards (horizontal: 160px image + text body). Click backdrop or ✕ to close.

---

## 7. Interactive Behaviors

### 7.1 Reveal on Scroll
All major content blocks have `class="reveal"` (optionally with `reveal-delay-1` through `reveal-delay-4`). Starting state: `opacity: 0; transform: translateY(24px)`. IntersectionObserver triggers when element is 12% visible (with a `-40px` bottom rootMargin). On intersection: `opacity: 1; transform: translateY(0)`, 0.6s ease transition. Stagger delays: 0.1s, 0.2s, 0.3s, 0.4s.

### 7.2 Navbar Scroll Effect
Navbar listens to `window.scroll`. When `scrollY > 60`: adds `.scrolled` class → `background: rgba(11,45,62,0.97); backdrop-filter: blur(12px); padding shrinks; box-shadow appears`. Smooth transition 0.35s.

### 7.3 Mobile Menu
Hamburger click toggles `.open` on `.mobile-menu`. Any link click inside the mobile menu auto-closes it.

### 7.4 Tour Picker Modal
Clicking the tour picker trigger button opens the modal overlay. Selecting a tour card: populates the hidden input value, updates the button display text, adds `.has-value` class (changes text from muted to white), and closes the modal. Clicking the overlay backdrop or the ✕ button closes the modal.

### 7.5 Quick Booking → Form Prefill
When the hero "Book Now →" button is clicked (before scrolling to the form), it reads values from the quick-booking card (date, guests, tour) and pre-fills the corresponding fields in the main booking form below. Tour match uses `textContent.includes()`.

### 7.6 Add-on Cards Toggle
Each add-on card is a `<label>` wrapping a hidden checkbox. Click handler manually toggles `cb.checked` and `.addon-active` on the card. Two add-ons (Custom Duration, Extra Tickets) have conditional extra fields that show/hide with the `.visible` class.

### 7.7 Transfer Auto-disable
When the booking form's tour select changes, a `syncTransfer()` function checks if the selected tour includes transfer (`'Signature'` or `'Most Complete'` in the value). If yes: transfer card gets `.addon-disabled`, shows "Included ✓" tag, hides check indicator.

### 7.8 FAQ Accordion (Single-open)
Click handler closes all `.faq-item.open` items first, then opens the clicked item if it wasn't already open. Icon rotates 180° via CSS transition. Answer height animates via `max-height` CSS transition.

### 7.9 Booking Form Async Submission
`fetch()` POST to Formspree endpoint with FormData. On success (`res.ok`): hides form, shows `.form-success`. On error: re-enables submit button. If the placeholder ID is still present (dev mode), simulates success after 1.2s delay with `setTimeout`.

### 7.10 Smooth Scroll
All `<a href="#...">` anchor links use `e.preventDefault()` + `window.scrollTo({ behavior: 'smooth' })` with a `80px` offset to account for the fixed navbar height.

### 7.11 Date Input Minimum
On page load, all `input[type="date"]` elements get `min` set to today's ISO date.

---

## 8. Responsive Breakpoints & Mobile Patterns

### Breakpoints

| Breakpoint | Target | Key Changes |
|---|---|---|
| `≤ 968px` | Tablet / small laptop | Hero goes single-column. Trust strip 2×2. Tour cards vertical (no image column). Steps 2×2. Benefits 2-column. Testimonials single-column (max 480px). Why-private single-column. Contact single-column. |
| `≤ 600px` | Mobile | Benefits 1-column. Booking form 1-column (all fields full-width). Footer 1-column. **Nav links and nav CTA hidden; hamburger shown.** Sections get `padding: 64px 0`. Trust strip 1-column. Hero trust dividers hidden. Hero headline hard-capped at `44px`. |
| `≤ 560px` | Small mobile | Tour picker modal cards go single-column. Modal padding reduced to 20px. |

### Mobile-Specific Patterns
- **Navigation:** Full desktop nav is hidden. Hamburger + slide-down mobile menu.
- **Hero:** Right column (seals + quick-booking card) stacks below the text content. Quick-booking card max-width 480px, centered.
- **Tour cards:** Image header stacks above the body (single-column card). Image height reduced to 180px.
- **Forms:** All 2-column form grids become 1-column.
- **Testimonials:** Stacked vertically, centered, max-width 480px.

---

## 9. Image & Asset Conventions

### Tour Card Images
Each tour has a dedicated background image used in the card header:
- `tour-medieval.png` — Classic/Old Town tour (medieval stonework aesthetic)
- `tour-explorer.png` — Signature tour (cityscape/overview aesthetic)
- `tour-custom.png` — Most Complete tour (gardens/coastal aesthetic)
- `tour-stories.png` — Hidden Stories tour (urban/creative aesthetic)

**Image treatment in card header:**
```css
background:
  linear-gradient(to bottom, rgba(var-color,0.08) 0%, rgba(var-color,0.72) 100%),
  url('/image.png') center/cover no-repeat;
```
The navy gradient overlay (8% → 72%) darkens the image from top to bottom, ensuring the white duration badge text is always readable.

**Same images used in tour picker modal** with a slightly different overlay (transparent 0–50%, 35% opacity 50–100%).

### Favicon
`favicon.svg` — SVG format preferred for crispness at all sizes.

### OG Image
`opengraph.jpg` — Standard 1200×630px social share image. Match the brand's navy/gold aesthetic.

### No external image CDNs
All images are served from the same origin as static files in `/public/`.

---

## 10. Copy Voice & Tone

### Core Tone
**Confident, warm, specific.** Never generic, never hypey. The copy sounds like a knowledgeable local friend who happens to run a premium service — not a marketing department.

### Key Patterns

**Direct address:** Always "you" and "your". The product is framed around the visitor's ownership: "Your Private Tour", "Your Rules", "Your group only."

**Specificity as proof:** Avoid vague superlatives. Instead of "many years of experience", write "22+ years". Instead of "quick response", write "within 2–4 hours". Numbers build trust.

**Problem-first framing:** Surface the pain before the solution. "The cruise ship will sell you a seat on a 50-person bus with a fixed schedule" before "we give you Tallinn at your pace."

**Benefit, not feature:** Not "private vehicle included" but "no forced marches behind a flag". Not "flexible itinerary" but "linger at a viewpoint or skip a museum — it's your day."

**The anxiety-resolution formula:** Every section that could trigger fear (missing the ship, getting lost, overpaying) is paired with a direct, confident reassurance: "In over 22 years of operation, we have never caused a guest to miss their ship."

### Eyebrow Labels (`.label`)
Short, all-caps descriptors placed above H2s. Usually 2–4 words. Examples:
- `Simple as can be`
- `The Private Difference`
- `What Guests Say`
- `Reserve Your Spot`
- `Frequently Asked`

These are orientation labels, not headlines. They tell the reader what category of information follows.

### CTA Copy
- Primary CTA: Action + noun + arrow: `"Book Your Private Tour →"`, `"Send Booking Request →"`
- Secondary CTA: Neutral + arrow: `"See All Tours →"`, `"See Our Tours →"`
- Avoid generic "Click here" or "Learn more"

### Section Headline Pattern
```
[Eyebrow label — what this section is]
[H2 — the promise, with italic emphasis on the key benefit word]
[Optional subhead — one sentence expanding on the promise]
```

### FAQ Structure
Questions are written from the *visitor's internal monologue* — the exact anxiety they have:
- "What happens if my ship can't dock?"
- "How do I know you'll get me back on time?"
- "Is this really just my group? No strangers?"

Answers are direct, specific, and end on a reassurance note.

---

## 11. How to Adapt This for a New Project

Use this checklist when reusing the Bloom design system for a different product.

### Phase 1 — Brand Identity
- [ ] **Replace brand name** throughout: HTML `<title>`, nav logo, footer logo, OG tags, email addresses
- [ ] **Write the brand tagline** for `.nav-logo-sub` (mono, gold, 2–3 words)
- [ ] **Swap accent color** if needed: Replace `--gold` (`#D4941E`) and `--gold-light` (`#F0B843`) with your new accent. Keep `--navy` for all dark backgrounds — it pairs with almost any accent color. If you change navy, update all `rgba(11,45,62,...)` rgba instances throughout.
- [ ] **Update `--teal`** (`#0D9373`) if you use a different "success/included" color

### Phase 2 — Content & Copy
- [ ] **Write the hero H1** using the two-line pattern: `[Possessive statement]` / `[Italic-outline second line]`
- [ ] **Write 3–4 hero stat items** (numbers + short labels) for the trust row
- [ ] **Identify your 4 core differentiators** for the trust strip
- [ ] **Rewrite the comparison table** — identify your direct competitor (e.g. the "default" option your audience would otherwise use) and list 5–6 specific ways you're better
- [ ] **Define 3–6 product/service SKUs** for the tour cards. Each needs: tag label, photo, title, description, 4 highlight bullets, price, duration
- [ ] **Write your 4-step process** for "How It Works"
- [ ] **Write 6 benefit cards** — emotional benefits, not technical features
- [ ] **Collect 3 real testimonials** — specific details (ship name, city, outcome) make them credible
- [ ] **Write 8–10 FAQ items** — start from customer anxieties, not product specs
- [ ] **Write booking promises** (3–4 checkmark items near the form)

### Phase 3 — Images
- [ ] **Create 4 product images** (one per card) — square-ish or landscape, `center/cover`, photographically compelling. They'll be darkened by a gradient overlay, so exposure should be slightly brighter than normal.
- [ ] **Create an OG image** (1200×630px) using the brand's navy/accent palette
- [ ] **Create a favicon** (SVG preferred)

### Phase 4 — Forms
- [ ] **Connect Formspree** (or equivalent): Replace `YOUR_FORMSPREE_ID` in both `#booking-form` and `#contact-form` action URLs
- [ ] **Update booking form fields** to match your product's booking needs (dates, group size, options, add-ons)
- [ ] **Update contact form** subject line in the hidden `_subject` field
- [ ] **Update transfer/add-on sync logic** — the `syncTransfer()` function checks for specific tour names; update the condition to match your product's included features

### Phase 5 — Navigation & Links
- [ ] **Update nav link labels** to match your section IDs
- [ ] **Update footer columns** — "Our Tours" column should list your product SKUs
- [ ] **Update footer contact info** — email, location, operating hours/season

### Phase 6 — Meta & SEO
- [ ] Update `<title>` tag (format: `Brand Name — Primary Value Proposition`)
- [ ] Update `<meta name="description">` (150 chars, includes location + service type + primary differentiator)
- [ ] Update `og:title`, `og:description`, `og:url`
- [ ] Update `theme-color` to your primary dark color

### Phase 7 — Polish & Verify
- [ ] Confirm all 4 tour/product images load and look correct on mobile (single-column card view)
- [ ] Test the FAQ accordion — only one item open at a time
- [ ] Test the tour picker modal — selecting a tour should prefill the hero card button label and the booking form's tour select
- [ ] Test the add-on logic if relevant to your product
- [ ] Verify the booking form submits correctly to your form handler
- [ ] Test mobile nav: hamburger works, all links close the menu, mobile CTA is visible
- [ ] Check scroll reveal — all `.reveal` elements animate in correctly
- [ ] Verify the scroll-to-top button appears after scrolling 500px
- [ ] Test date inputs have today as the minimum selectable date

---

## Quick Reference — Key CSS Patterns

```css
/* Section header */
.section-header { text-align: center; margin-bottom: 52px; }
.section-header .label { color: var(--gold); display: block; margin-bottom: 12px; }
.section-header h2 { font-family: var(--font-display); font-weight: 700; color: var(--navy); }
.section-header h2 em { font-style: italic; color: var(--gold); }

/* Card on light bg */
.card {
  background: var(--white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 28px;
  transition: transform 0.3s, box-shadow 0.3s;
}
.card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

/* Card on dark bg */
.dark-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--radius);
}

/* Glassmorphism card */
.glass-card {
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--radius-lg);
}

/* Icon ring (light) */
.icon-ring {
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(212,148,30,0.15);
  border: 1px solid rgba(212,148,30,0.3);
  display: flex; align-items: center; justify-content: center;
}

/* Mono label above heading */
.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--gold); display: block; margin-bottom: 12px;
}
```

---

*Bloom Design System — extracted from Tallinn Shore Tours, July 2026*
