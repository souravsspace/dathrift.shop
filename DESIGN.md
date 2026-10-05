---
name: daThriftShop
description: One-of-one pre-loved clothing, each piece wearing its own die-cut swing tag on a logo-green ground.
colors:
  ink: '#04241a'
  ink-soft: '#3d5a4d'
  bottle: '#134533'
  moss: '#1d5c44'
  ivory: '#fbebd6'
  gold: '#d3b07f'
  gold-deep: '#8a6a3a'
  rust: '#a63d26'
typography:
  display:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: 'clamp(3.6rem, 8.4vw, 6rem)'
    fontWeight: 850
    lineHeight: 0.88
    letterSpacing: '-0.02em'
    fontVariation: "'wdth' 68"
  headline:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: 'clamp(3.4rem, 9vw, 6rem)'
    fontWeight: 850
    lineHeight: 0.9
    letterSpacing: '-0.02em'
    fontVariation: "'wdth' 62"
  price:
    fontFamily: 'Archivo, system-ui, sans-serif'
    fontSize: 'clamp(3rem, 5.4vw, 4.6rem)'
    fontWeight: 850
    lineHeight: 0.88
    letterSpacing: '-0.02em'
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 62"
  section:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: 'clamp(2.4rem, 5vw, 3.6rem)'
    fontWeight: 850
    lineHeight: 0.92
    letterSpacing: '-0.02em'
    fontVariation: "'wdth' 68"
  price-sm:
    fontFamily: 'Archivo, system-ui, sans-serif'
    fontSize: 'clamp(1.9rem, 3.6vw, 3rem)'
    fontWeight: 850
    lineHeight: 0.9
    letterSpacing: '-0.02em'
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 62"
  heading:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 750
    lineHeight: 1.2
  title:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: 'clamp(1.5rem, 2.4vw, 2rem)'
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: '-0.02em'
  lead:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: '1.2rem'
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  ui:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: '0.88rem'
    fontWeight: 600
    lineHeight: 1.45
  label:
    fontFamily: 'Martian Mono, ui-monospace, SFMono-Regular, monospace'
    fontSize: '0.68rem'
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: '0.02em'
  stamp:
    fontFamily: 'Archivo, system-ui, sans-serif'
    fontSize: '0.78rem'
    fontWeight: 800
    lineHeight: 1
    letterSpacing: '0.08em'
    fontVariation: "'wdth' 75"
rounded:
  photo-sm: '4px'
  photo: '6px'
  control: '8px'
  pill: '999px'
spacing:
  gutter: 'clamp(18px, 4vw, 64px)'
  rack-row: '72px'
  section: 'clamp(56px, 8vw, 112px)'
  section-lg: 'clamp(72px, 9vw, 136px)'
components:
  button-gold:
    backgroundColor: '{colors.gold}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    padding: '0 26px'
    height: '52px'
  button-gold-hover:
    backgroundColor: '{colors.ivory}'
    textColor: '{colors.ink}'
  button-ink:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.ivory}'
    rounded: '{rounded.pill}'
    padding: '0 26px'
    height: '52px'
  button-ink-hover:
    backgroundColor: '{colors.moss}'
    textColor: '{colors.ivory}'
  button-line:
    textColor: '{colors.ivory}'
    rounded: '{rounded.pill}'
    padding: '0 26px'
    height: '52px'
  swing-tag:
    backgroundColor: '{colors.ivory}'
    textColor: '{colors.ink}'
    padding: '22px'
  category-chip:
    textColor: '{colors.ivory}'
    rounded: '{rounded.pill}'
    padding: '0 18px'
    height: '44px'
  category-chip-active:
    backgroundColor: '{colors.ivory}'
    textColor: '{colors.ink}'
  input-storefront:
    backgroundColor: '{colors.ivory}'
    textColor: '{colors.ink}'
    rounded: '{rounded.photo}'
    padding: '10px 14px'
    height: '50px'
  receipt:
    backgroundColor: '{colors.ivory}'
    textColor: '{colors.ink}'
    padding: '28px 26px 34px'
  admin-action:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.ivory}'
    rounded: '{rounded.control}'
    padding: '0 18px'
    height: '48px'
  admin-action-hover:
    backgroundColor: '{colors.moss}'
---

# Design System: daThriftShop

## Overview

**Creative North Star: "The Tag Is the Interface"**

Every garment on daThriftShop is a single unit, and the system treats each one the way a good thrift rack does: the actual piece, photographed honestly, with a die-cut ivory card tag hanging off it on a gold thread. Price, size, condition, measurements, fit and the Add to bag action all live on that tag. The page is the deep logo-green ground the rack stands on; the tag is the only bright paper in the room, so the eye always lands on the facts.

The world is dense with physical rack metaphor but restrained in decoration. Headings are uppercase condensed Archivo, set tight; tag data is Martian Mono in small caps-height lines; status is a one-press ink stamp, never a badge. Pages end on a gold rack rail with empty hooks. Motion is spring physics borrowed from a hanging tag: it drops in, swings when touched, and settles. The confirmed rejection is the cream-page, serif-headline editorial shop this redesign replaced.

Staff admin inverts the ground: the desk is the tag's own ivory card stock, ruled like a ledger, so the owner reads records in daylight on a phone, while the same stamps mark publication and stock state.

**Key Characteristics:**

- Deep green ground (ink, bottle) with ivory as the only paper surface.
- Chamfered ivory swing tags with a punched gold eyelet and thread carry all product facts.
- Condensed caps Archivo for headings and prices; Martian Mono for tag data.
- One-press status stamps (Sold out, On hold, In your bag, Published, Draft).
- Spring-based tag motion, fully disabled under reduced motion.
- Pages close on a gold rack rail with hooks.

## Colors

A two-ground palette drawn from the logo: deep bottle greens for the storefront ground, ivory for every tag and the admin desk, muted gold for the single action accent, rust held back for "sold" and errors.

### Primary

- **Rack Gold** (gold): the action accent. The primary "Shop the rack" / "Back to the rack" button, the eyelet ring and thread, focus outlines, text selection, the bag count, active thumbnails, the rack rail, and the hero line's highlighted words. Never a large fill.
- **Tarnished Brass** (gold-deep): gold that has to read on ivory. Tag section headings (Condition, Measurements, Fit), the "On hold" stamp, and the shadowed end of the thread gradient.

### Secondary

- **Rust Stamp** (rust): the "Sold out" stamp, form errors, and the review border in admin. It means "no longer available" or "something failed", nothing else.

### Neutral

- **Logo Ink** (ink): the storefront ground, header and footer, primary text on ivory, the ink button, and the 3px admin ledger rule.
- **Bottle Green** (bottle): the second ground layer. The rack section band, photo wells behind loading or missing images, storefront form cards, and the "In your bag" / "Published" stamps.
- **Moss** (moss): hover state for ink buttons and admin actions, admin focus borders, the scrollbar thumb.
- **Ivory Card Stock** (ivory): tag and receipt paper, storefront text on green, the admin ground, and the active chip/nav fill.
- **Faded Ink** (ink-soft): secondary text on ivory: tag meta lines, measurement labels, admin hints, the "Draft" stamp.

Translucent ivory over the green ground (rgb(251 235 214 / 0.12–0.86)) supplies dividers, quiet borders and muted copy; translucent ink over ivory (rgb(4 36 26 / 0.1–0.4)) does the same on paper. Use alpha of the two grounds rather than new greys.

### Named Rules

**The One Paper Rule.** Ivory is the only light surface on the storefront. If something is ivory on the green ground, it is a tag, a receipt, or an order card, and it carries facts about the piece.

**The Gold Means Go Rule.** Gold marks the next action or the hanging hardware. One gold button per view; gold never fills a section.

## Typography

**Display Font:** Archivo variable (width 62–125%, weight 100–900), self-hosted, with Noto Sans Bengali, Hind Siliguri, system-ui fallback.
**Label/Mono Font:** Martian Mono variable, self-hosted, with ui-monospace fallback.

**Character:** Condensed, heavy Archivo reads like the printed price on a card tag; Martian Mono reads like the typed size and measurement lines beneath it. Both come from the same variable-width family logic, so the pairing feels manufactured rather than editorial.

### Hierarchy

Every font size is one of twelve ramp tokens (`--text-*` in `src/routes/layout.css`); no literal sizes.

- **Display** (`--text-display`, 850, width 68%, clamp(3.6rem, 8.4vw, 6rem), line-height 0.88, uppercase): the hero line and the product-page price.
- **Headline** (`--text-headline`, 850, width 62%, clamp(3.4rem, 9vw, 6rem), uppercase): rack and task-page titles (The rack, Your bag, Checkout, error titles).
- **Section** (`--text-section`, 850, width 68%, clamp(2.4rem, 5vw, 3.6rem), uppercase): section headings on ivory, admin page titles, the checkout form title.
- **Price** (`--text-price`, 850, width 62%, tabular): hero tag price. **Price small** (`--text-price-sm`, clamp(1.9rem, 3.6vw, 3rem)): rack and bag tag prices. The price is always the largest thing on its tag.
- **Title** (`--text-title`, 650, clamp(1.5rem, 2.4vw, 2rem)): the product name on the product page.
- **Heading** (`--text-heading`, 750, 1.5rem): admin panel headings, receipt titles, wordmark, legend terms.
- **Lead** (`--text-lead`, 1.2rem): hero and intro copy, footer wordmark.
- **Body** (`--text-body`, 1rem, line-height 1.5): descriptions, buttons, tag names, capped at 40–52ch.
- **UI** (`--text-ui`, 0.88rem): navigation, chips, filters, hints, admin rows and captions.
- **Stamp** (`--text-stamp`, 800, width 75%, 0.78rem): status stamps, measurement rows, receipt rows, fine print.
- **Label** (`--text-label`, Martian Mono, 0.68rem, uppercase, 0.02em): tag meta, tag section headings, breadcrumbs.

### Named Rules

**The Word-Space Rule.** Every condensed uppercase heading uses -0.02em tracking with word-spacing 0.16em, so tight caps never collapse into one word.

**The Mono Is Data Rule.** Martian Mono sets only facts a tag would print: category, size, measurements, totals, order references. Never prose, never a heading above a heading.

## Layout

A full-bleed page with a fluid side gutter (clamp(18px, 4vw, 64px)) and no fixed container on the storefront; admin caps at 1440px. Bands alternate grounds (ink hero, bottle rack, ivory "read the tag", ink footer) with generous fluid vertical padding (clamp(56px, 8vw, 112px) to clamp(72px, 9vw, 136px)).

- **Hero:** two equal columns, copy left and the featured photo right with its oversized tag hanging over the photo's lower edge; collapses to one column at 900px.
- **Rack:** auto-fill grid of min(100%, 300px) columns with a 72px row gap so each tag (pulled up 64px over its photo, 82% wide, offset right) has room to hang.
- **Product:** photo gallery 1.1fr, tag column 0.9fr (min 340px); the tag holds every fact and the buy action. The gallery is one scroll-snap track of up to ten 4:5 photos, cover first: phones swipe it, thumbnails jump to a photo, and a mono "2 / 7" count sits in the photo's lower corner.
- **Task pages (bag, checkout, order):** main column plus a 300–400px sticky receipt; one column under 900px. Bag lines are photo (96–150px) plus tag, the tag overlapping the photo by 18px.
- **Admin:** two columns (0.8fr form / 1.4fr list), single under 900px; form pairs stack under 560px.

Breakpoints observed: 900px (layout collapse), 600px (compact tags; filters become a two-column grid of 48px, 16px-text controls so iOS never zooms; category chips wrap rather than scroll), 560px (admin stacking), 480px (header compaction), 380px (the bag link keeps its icon and count while its label becomes screen-reader-only, so the full daThriftShop wordmark fits a 320px phone). Most shoppers are on phones: design and check at 390px first, then 320px. Touch targets are at least 44px throughout.

## Elevation & Depth

Flat surfaces, physical objects. Grounds, bands, cards and admin panels have no shadow; depth is carried by layered greens and by the ivory paper. The only cast shadow belongs to the hanging tag, because it is the one object that physically hangs off the page.

### Shadow Vocabulary

- **Hanging tag** (`filter: drop-shadow(0 10px 14px rgb(2 20 14 / 0.35)) drop-shadow(0 2px 3px rgb(2 20 14 / 0.3))`): every swing tag, following its chamfered silhouette.
- **Eyelet punch** (`box-shadow: inset 0 1px 1px rgb(0 0 0 / 0.35)`): inside the gold eyelet ring.
- **Focus halo** (`box-shadow: 0 0 0 3px rgb(211 176 127 / 0.35)` on storefront inputs; `rgb(29 92 68 / 0.18)` on admin inputs): focus state only.

### Named Rules

**The Only Tags Hang Rule.** A drop shadow means "this hangs from a thread". Panels, receipts, cards and buttons stay flat.

## Shapes

Two form languages that never mix. The tag is cut, not rounded: a rectangle with both top corners chamfered (18px on rack cards, 24px on the product tag, 26px on the hero tag, 12px on small screens), a round punched hole near the top center, a 3px gold eyelet ring around it, and a 1.5px gold thread rising above. The receipt has a perforated tear-off foot (a repeating 6px half-circle mask). Everything interactive around the tags is soft: pill buttons, chips and nav (999px), 4–6px photo corners, 6px storefront inputs, 8px admin controls and selects.

Photos are always 4:5.

## Components

### Buttons

Confident, round, and few.

- **Shape:** full pill (999px), 52px tall, 0 26px padding, 700 weight.
- **Gold:** the page's next step (Shop the rack, Back to the rack, Pay). Hover lifts to ivory.
- **Ink:** the action on an ivory tag or receipt (Add to bag, Checkout). Hover to moss.
- **Line:** secondary action on the green ground; 40% ivory border, hover to full ivory border with an 8% ivory wash.
- **Press:** scale 0.97 on active; colors ease over 220ms with the shared ease-out. Disabled is 50% opacity.
- **Text button:** underlined 0.85rem inline action (Remove), 40px tall.

### Chips (category filter)

- **Style:** 44px pill, 22% ivory hairline border on green, 600 weight.
- **State:** hover borders gold; current category fills ivory with ink text.

### Cards / Containers

- **Storefront form card:** bottle green, 6px corners, fluid padding clamp(22px, 4vw, 40px), condensed caps heading.
- **Receipt:** flat ivory, sticky at top 90px, no corners, perforated foot, mono rows with a dashed total rule.
- **Order card:** flat ivory, square corners, condensed caps status line.
- **Admin:** no cards. Each section is an admin panel opened by a 3px ink top rule over the ivory ground, rows separated by 10% ink hairlines.

### Inputs / Fields

- **Storefront:** ivory field on bottle, 50px tall, 6px corners, transparent border; focus borders gold with a gold halo.
- **Admin:** white field, 22% ink border, 44px, 6px corners; focus borders moss with a moss halo; disabled is a 5% ink wash.
- **Photo drop:** 1.5px dashed ink border at 35%, 8px corners, 96px minimum, a 4:5 preview thumb; hover and keyboard focus shift to moss. Accepts any image up to 10 MB, iPhone HEIC included.
- **Prefixed field (admin):** the ৳ sign or the /products/ path printed in faded-ink mono inside the field's own border; focus rings the whole field in moss.
- **Cover photo (admin):** position 1 wears the gold "Cover" chip; every other photo carries a 44px ink-outline "Make cover" button.
- **Taka sign:** neither brand face has ৳, so a 2 KB Noto Sans Bengali subset is registered under both family names with `unicode-range: U+09F3`; prices are always ৳ then the en-BD grouped number.

### Navigation

- **Header:** sticky ink bar with the logo mark (40px, 8px corners) and an expanded-width (112%) 800-weight wordmark; nav links are 44px pills with a 10% ivory wash on hover and current page. The bag link carries a stroked inline SVG bag and a gold mono count pill.
- **Footer:** opens on the gold rack rail (4px gold bar, seven 14×22px hooks), then wordmark, one line of copy, and links.
- **Admin header:** the same ink bar, with a mono "staff" tag beside the wordmark and an ivory-filled current nav pill.

### Swing Tag (signature)

The ivory die-cut tag described in Shapes, in three sizes (card, detail, hero). Contents, top to bottom: mono meta line (category · size), condensed price, product name, then on the product page dashed-rule sections for Condition, Measurements (mono, tabular, "measured on the garment"), Fit, and the buy action or status stamp. Tags hang straight at rest. On pointer arrival a tag swings from its eyelet on a spring (stiffness 160, damping 5, starting ±7°) and small pointer moves nudge it up to ±4°. The hero tag drops in once from 48px above at -10° and swings to rest. The product-page tag does not swing.

### Status Stamp (signature)

An uppercase condensed label inside a 2px border with a 1px outline 2px out, rotated -8°, multiplied onto the paper. Rust for Sold out, tarnished brass for On hold, bottle for In your bag and Published, faded ink for Draft. When state changes in front of the user it lands with one press (from 1.9× scale and a 3px blur, 320ms) and then stays still. Admin rows and the editor header carry these stamps for publication and stock state.

### Motion

One grammar, shared by every surface: tags swing on springs, stamps press once, rack rows rise 28px into place once as they scroll in (700ms, 50ms stagger), page navigation crossfades (160ms out, 380ms in) while the garment photo morphs between rack and product page. All of it is skipped under prefers-reduced-motion, and content is visible by default before any motion runs.

## Do's and Don'ts

### Do:

- **Do** put every fact about a piece (price, size, condition, measurements, fit) and its Add to bag action on its swing tag.
- **Do** set condensed caps headings at width 62–68%, weight 850, -0.02em tracking and 0.16em word-spacing.
- **Do** use Martian Mono only for tag data: category, size, measurements, totals, references.
- **Do** show state with a status stamp (Sold out, On hold, In your bag, Published, Draft), pressed once when it changes in view.
- **Do** keep photos at 4:5 on a bottle-green well, and desaturate (saturate 0.45, brightness 0.88) pieces that are not available.
- **Do** build admin as ivory ledger: 3px ink rule per section, hairline rows, no cards.
- **Do** end storefront pages on the gold rack rail with hooks.
- **Do** gate every animation behind prefers-reduced-motion and leave content visible without it.

### Don't:

- **Don't** return to the cream-page, serif-headline editorial shop look.
- **Don't** add eyebrow or kicker labels above headings; the tag's mono meta line is the only small label above a figure, and it lives inside a tag.
- **Don't** tilt tags at rest; they hang straight and only swing in response to a pointer or their entrance.
- **Don't** give panels, receipts, cards or buttons a shadow; only hanging tags cast one.
- **Don't** round the tag's corners; tags are chamfered, interactive controls are round.
- **Don't** use rust for anything but sold-out state and errors, or gold as a section fill.
- **Don't** introduce new greys; use ivory or ink at an alpha over the opposite ground.
