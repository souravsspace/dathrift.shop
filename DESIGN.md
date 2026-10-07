---
name: daThriftShop
description: Light, photo-first storefront for one-of-one pre-loved clothing, inked in the logo's green, ivory and gold.
colors:
  ink: '#04241a'
  ink-soft: '#3d5a4d'
  bottle: '#134533'
  moss: '#1d5c44'
  ivory: '#fbebd6'
  gold: '#d3b07f'
  gold-deep: '#8a6a3a'
  rust: '#a63d26'
  paper: '#faf7f1'
  surface: '#ffffff'
  well: '#efe7da'
  line: 'rgb(4 36 26 / 0.12)'
  line-strong: 'rgb(4 36 26 / 0.26)'
typography:
  hero:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: 'clamp(2.6rem, 6.6vw, 5.25rem)'
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: '-0.03em'
    fontVariation: "'wdth' 76"
  page-title:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: 'clamp(2rem, 4.4vw, 3.25rem)'
    fontWeight: 780
    lineHeight: 1.02
    letterSpacing: '-0.025em'
    fontVariation: "'wdth' 82"
  section-title:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: 'clamp(1.6rem, 3vw, 2.25rem)'
    fontWeight: 760
    lineHeight: 1.08
    letterSpacing: '-0.02em'
    fontVariation: "'wdth' 82"
  title:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 750
    lineHeight: 1.15
    fontVariation: "'wdth' 85"
  price:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 760
    lineHeight: 1.1
    letterSpacing: '-0.01em'
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 80"
  body:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  lede:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 400
    lineHeight: 1.55
  ui:
    fontFamily: 'Archivo, Noto Sans Bengali, Hind Siliguri, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 650
    lineHeight: 1.5
  data:
    fontFamily: 'Martian Mono, ui-monospace, SFMono-Regular, monospace'
    fontSize: '0.75rem'
    fontWeight: 400
    letterSpacing: '0.01em'
  tag-label:
    fontFamily: 'Martian Mono, ui-monospace, SFMono-Regular, monospace'
    fontSize: '0.68rem'
    fontWeight: 600
    letterSpacing: '0.02em'
rounded:
  rail: '3px'
  tag: '4px'
  xs: '6px'
  sm: '8px'
  md: '12px'
  lg: '18px'
  pill: '999px'
spacing:
  gutter: 'clamp(16px, 4vw, 48px)'
  page-max: '1360px'
  header: '64px'
  header-phone: '58px'
  tabbar: '64px'
  card-pad: 'clamp(20px, 3vw, 28px)'
  section: 'clamp(48px, 7vw, 88px)'
  grid-row: 'clamp(28px, 3.4vw, 44px)'
  grid-col: 'clamp(14px, 2vw, 24px)'
components:
  button-ink:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    typography: '{typography.body}'
    rounded: '{rounded.pill}'
    padding: '0 24px'
    height: '50px'
  button-ink-hover:
    backgroundColor: '{colors.moss}'
    textColor: '{colors.paper}'
  button-outline:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    padding: '0 24px'
    height: '50px'
  button-gold:
    backgroundColor: '{colors.gold}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    padding: '0 24px'
    height: '50px'
  button-gold-hover:
    backgroundColor: '{colors.ivory}'
    textColor: '{colors.ink}'
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.sm}'
    padding: '10px 14px'
    height: '50px'
  card:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: '{spacing.card-pad}'
  product-photo:
    backgroundColor: '{colors.well}'
    rounded: '{rounded.md}'
  size-tag:
    textColor: '{colors.ink}'
    typography: '{typography.tag-label}'
    rounded: '{rounded.tag}'
    padding: '0 8px 0 15px'
    height: '24px'
  category-chip:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
  category-chip-active:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    rounded: '{rounded.pill}'
  filter-chip:
    backgroundColor: '{colors.ivory}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
  count-pip:
    backgroundColor: '{colors.gold}'
    textColor: '{colors.ink}'
    typography: '{typography.tag-label}'
    rounded: '{rounded.pill}'
    height: '20px'
  badge-sold:
    backgroundColor: '{colors.rust}'
    textColor: '{colors.surface}'
    rounded: '{rounded.pill}'
    padding: '0 10px'
    height: '26px'
  pay-number-panel:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    rounded: '{rounded.md}'
    padding: '16px 18px'
  swing-tag:
    backgroundColor: '{colors.ivory}'
    textColor: '{colors.ink}'
    padding: '22px'
  footer:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.ivory}'
---

# Design System: daThriftShop

## Overview

**Creative North Star: "The Daylight Rack"**

A clean, well-lit rail of single garments. The photograph is the product: every piece gets a large 4:5 photo on a sand well, and the surrounding interface steps back into warm paper, white sheets and hairlines. Text is printed in the logo's deep bottle-black green, and that same ink is spent on exactly one solid action per view. Gold appears in small doses (counts, the active-tab marker, underlines, the footer rail) so it reads as a highlight rather than a ground.

The thrift-tag heritage survives in small, physical details rather than costume: a notched ivory size tag with a punched hole on every product card, measurements and piece IDs set in Martian Mono like a printed label, and one die-cut ivory SwingTag hanging where a moment of character earns it (the home hero, the error page, the footer rail). Density is retail-comfortable: generous photo grids, condensed Archivo headlines, short meta lines below names or beside prices.

The owner rejected the earlier dark "swing tag" storefront on 2026-10-07; dark grounds now belong only to the footer and the bKash number panel. No large tags or overlays sit over photos.

**Key Characteristics:**

- Warm paper ground, white hairline cards, sand photo wells.
- One solid ink pill per view; everything else is outline, text link or gold on ink.
- Condensed, heavy Archivo headlines with tight tracking; Martian Mono for anything a tag would print.
- Gold for counts, rails and underlines only; rust only for sold and error.
- Photo-first cards: photo, price with a notched size tag, name, one fit number.
- Lucide outline icons at a 2px stroke, inlined.

## Colors

A light, warm-neutral palette lit by the logo's green ink, with gold and rust as small signal colors.

### Primary

- **Logo Ink** (ink): all primary text, the one solid action per view, the footer ground, the bKash number panel, active category chips and the selected-size chip.
- **Moss Hover** (moss): the hover state of ink actions, focus outlines and focus rings, the "on" state of toggles, done steps and "added" confirmations. Never a resting fill.

### Secondary

- **Tag Gold** (gold): bag and filter counts, the phone tab-bar active marker, the hero headline underline and the hero tag-name underline, the footer rail, the gold button on ink grounds, text selection. Never a page or card ground.
- **Gold Deep** (gold-deep): the top of the SwingTag thread gradient and the "on hold" stamp. Supporting only.

### Tertiary

- **Sold Rust** (rust): the "Sold out" badge, field and form errors, invalid field borders. Nothing decorative is rust.

### Neutral

- **Daylight Paper** (paper): the page ground everywhere on the storefront; also text on ink.
- **White Sheet** (surface): cards, inputs, chips, the search sheet, the phone filter sheet, the tab bar (94% mixed with transparency).
- **Sand Well** (well): the ground behind every product and category photo, and behind thumbnails.
- **Tag Ivory** (ivory): the SwingTag stock, removable filter chips, notices, the pay-step timer pill, the chosen pay plan (55% mixed), empty-state icon discs, text on the ink footer.
- **Bottle** (bottle): icons inside promise rows, assurances and section headings; the footer fact-icon discs; the "in your bag" badge.
- **Ink Soft** (ink-soft): secondary text, meta lines, hints, inactive tabs.
- **Hairline** (line) and **Hairline Strong** (line-strong): card borders, dividers and header rule; outline-button, input and chip borders.

### Named Rules

**The One Ink Action Rule.** Each view has one solid ink button. Every other action is an outline pill, a text link, or (on the ink footer only) the gold pill.

**The Gold Is a Highlight Rule.** Gold marks counts, rails, active markers and underlines. It never fills a surface on the light storefront; the gold pill exists only on ink.

**The Rust Means Gone Rule.** Rust is reserved for sold state and errors. A piece's state is told by the rust "Sold out" badge plus a desaturated photo (saturate 0.4, brightness 0.92), never by a large tag over the image.

## Typography

**Display Font:** Archivo (variable width 62–125%, weight 100–900), with Noto Sans Bengali, Hind Siliguri, system-ui
**Body Font:** Archivo
**Label/Mono Font:** Martian Mono (variable width 75–112.5%), with ui-monospace, SFMono-Regular

**Character:** Archivo is pushed into condensed, heavy settings (`font-stretch` 72–85%, weights 720–800, negative tracking) for headings and prices, and left at normal width for reading. Martian Mono is the tag printer: sizes, measurements, piece IDs, counts, the timer, totals' fine print. Both faces borrow a 2 KB Noto Sans Bengali subset for the taka sign (U+09F3).

### Hierarchy

- **Hero** (800, clamp(2.6rem, 6.6vw, 5.25rem), 0.95, width 76%): the home headline only, with its key phrase underlined in gold (0.12em thick, 0.12em offset, skip-ink off).
- **Page Title** (780, clamp(2rem, 4.4vw, 3.25rem), 1.02, width 82%): one per task or listing page; also the footer's "Read the listing" heading (width 80%) and the product big price (width 72%).
- **Section Title** (760, clamp(1.6rem, 3vw, 2.25rem), 1.08, width 82%): section heads on home, the product name (720, width 85%).
- **Title** (750, 1.25rem, width 85%): card and summary headings, category names, pay-step heading, empty-state heading.
- **Price** (760, width 80%, tabular figures): every price; 1.25rem on cards, 1.125rem on phones.
- **Body** (400, 1rem, 1.5): reading text. Ledes run 1.125rem at 1.55 with a 56ch measure.
- **UI** (650, 0.875rem): nav links, field labels, text links, hints, summary rows.
- **Data** (Martian Mono, 0.75rem, +0.01em): fit lines, category counts, product meta, piece IDs, suggestion meta.
- **Tag Label** (Martian Mono 600, 0.68rem): the size tag, count pips, footer fine print, SwingTag meta (uppercase, +0.02em).

### Named Rules

**The Tabular Is Mono Rule.** Measurements, sizes, piece IDs, counts, timers and transaction IDs are set in Martian Mono; prices use Archivo with tabular figures.

**The No Kicker Rule.** Nothing sits above a heading. Meta lines (category, size, brand, counts) go below the name or beside the price.

**The Storefront Ramp Rule.** Storefront sizes come only from meta, small, body, large, h3, h2, h1 and hero. The label, stamp, ui, lead, heading, section and price-sm steps serve the SwingTag lettering and the staff admin.

## Layout

One centred column: the page frame is 1360px plus a fluid gutter (clamp(16px, 4vw, 48px)) on each side. Sections are separated by clamp(48px, 7vw, 88px) of bottom padding; there are no full-bleed colour bands on the light storefront, only the ink footer.

- **Product grid:** auto-fill columns at a 228px minimum, row gap clamp(28px, 3.4vw, 44px), column gap clamp(14px, 2vw, 24px). At 600px and below it is always two columns (26px × 12px).
- **Home hero:** two columns (1.05fr / 0.95fr) with the 4:5 photo right and the SwingTag hanging off its lower-left corner; single column at 900px. On phones the photo turns square and the hero search and outline button hide, so the photo and its price tag land in the first screen.
- **Product page:** gallery (1.15fr) beside a sticky info column (min 320px) that clears the header by 20px. At 900px it stacks and the gallery bleeds to the screen edges; at 600px the photo turns square so price and bag action sit above the tab bar.
- **Shop:** a sticky toolbar (search, filter toggle, sort) above a sidebar panel plus results; at 900px the panel becomes a bottom-sheet popover.
- **Task pages (bag, checkout, order):** a main column and a sticky summary card (300–380px); stacked at 900px.
- **Header:** 64px (58px on phones), sticky, paper at 92% with a 14px backdrop blur. Phones (760px and below) add a 64px fixed tab bar plus the safe-area inset, and the body pads by the same height.

Breakpoints actually used: 960, 900, 760, 600 and 480px.

## Elevation & Depth

Flat by default. Depth comes from tone (paper ground, white sheets, sand wells) and 1px hairlines, not shadows. Shadows appear only where something truly floats over the page.

### Shadow Vocabulary

- **Lift** (`box-shadow: 0 1px 2px rgb(4 36 26 / 0.06), 0 12px 32px -14px rgb(4 36 26 / 0.28)`): the search sheet and the phone filter sheet.
- **Hanging tag** (`filter: drop-shadow(0 10px 14px rgb(2 20 14 / 0.35)) drop-shadow(0 2px 3px rgb(2 20 14 / 0.3))`): the SwingTag only, as the shadow of a physical tag hanging off its thread.
- **Gallery step** (`box-shadow: 0 2px 10px rgb(4 36 26 / 0.18)`): round previous/next buttons over the product photo.
- **Focus ring** (`box-shadow: 0 0 0 3px rgb(29 92 68 / 0.16)`): focused inputs and search fields, with a moss border.

Dialog backdrops dim with ink at 42% and a 2px blur.

### Named Rules

**The Flat Sheet Rule.** Cards, photos and chips never carry shadows at rest. Only sheets, the hanging tag and buttons floating over photos lift.

## Shapes

Soft corners on rectangles, full pills for anything you press, circles for icon buttons, and one die-cut silhouette borrowed from the garment tag.

- **Rail** (3px): the gold active marker on the phone tab bar (rounded on its lower corners, 28 × 3px) and the gold rail under admin tabs. A deliberate cap on a 3px bar, not a general corner.
- **Tag** (4px): the right corners of the notched size tag; the ends of the footer rail.
- **XS** (6px): suggestion thumbnails.
- **SM** (8px): inputs, size chips, notices, measurement cells, gallery thumbs, the logo mark.
- **MD** (12px): product and category photos, the pay plan options, the bKash number panel, suggestion rows.
- **LG** (18px): cards, the hero photo, the product gallery, empty states, sheets (top corners only on phones).
- **Pill** (999px): every button, the search fields, category and filter chips, badges, count pips, the timer.
- **Circle** (50%): icon-only buttons (search submit, sheet close, gallery steps), empty-state icon discs, footer fact icons.

**Silhouettes.** The size tag is clipped with a notched left point (`polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)`) and a 4px paper-coloured punched hole. The SwingTag is an ivory card with chamfered top corners (18–26px cuts), a masked hole, a gold eyelet and a gold thread.

## Components

### Buttons

Rounded, firm and quiet, with a small press.

- **Shape:** full pill (999px), 50px minimum height, 24px side padding, 650 weight, a 1.5px border slot.
- **Ink (primary):** ink ground, paper text; one per view. Hover goes to moss.
- **Outline:** white ground, strong hairline border, ink text; hover darkens the border to ink.
- **Gold:** gold ground, ink text, used on the ink footer; hover goes to ivory.
- **Press / disabled:** scales to 0.97 on press over 160ms; disabled sits at 50% opacity.
- **Text link:** 0.875rem, 650 weight, underline in strong hairline at 5px offset that turns to the text colour on hover; 44px tap height.
- **Back link:** an outline pill with a left arrow, 40px high, hairline border that turns ink on hover.

### Chips

- **Category chips (shop):** white pills with a hairline border and a mono count; the current one turns ink with paper text. They swap results without a page reload.
- **Size chips (filters):** mono, 8px corners, strong hairline; checked turns ink.
- **Active-filter chips:** ivory pills, each removable; hover mixes in 35% gold. A plain "Clear all" text pill ends the row.
- **Count pip:** a 20px gold pill with ink mono figures, on the bag link, tab bar and filter toggle.

### Cards / Containers

- **Corner Style:** 18px.
- **Background:** white sheet on paper.
- **Shadow Strategy:** none (see The Flat Sheet Rule).
- **Border:** 1px hairline.
- **Internal Padding:** clamp(20px, 3vw, 28px) for summaries and the pay step.
- **Empty state:** a 1.5px dashed strong-hairline box with an ivory icon disc, centred title and a short 40ch line.

### Product Card (signature)

Photo-first. A 4:5 photo on the sand well with 12px corners, zooming to 1.04 over 600ms on hover. Below it: the price (title size, condensed) with the notched ivory-gold size tag beside it on the same line, then the name (550 weight, two-line clamp), then one mono fit line, the first measurement in inches ("Chest 41 in" or "Waist 32 in"), falling back to brand or category. A sold piece gets a desaturated photo and a small rust "Sold out" pill in the top-left corner; nothing larger ever covers the photo. Shared photos morph between pages with view transitions.

### Inputs / Fields

- **Style:** white, 1.5px strong hairline, 8px corners, 50px high, 16px text so phones do not zoom. Placeholders (ink-soft at 75%) carry the example values instead of hint text below.
- **Hover:** border goes to ink at 40%.
- **Focus:** moss border plus a 3px moss ring at 16%.
- **Error:** rust border and a rust 0.875rem message with a circle-x icon beneath.
- **Search fields:** the same treatment as a pill; the hero version ends in a round ink submit button.

### Navigation

- **Desktop header:** logo mark plus "daThriftShop" (800, width 108%), a centred white pill search field (max 460px) that opens the search sheet, then Shop, Orders and Bag as pill links with icons; hover and current page get a 6% ink wash. Below 960px the search field collapses to a round icon.
- **Phone:** a slim header (logo, name, search icon) plus a fixed four-tab bar (Home, Shop, Search, Bag) on white at 94% with blur and a hairline top. Tabs are icon over a 0.75rem label in ink-soft; the current tab turns ink and wears the 28 × 3px gold rail marker at its top edge.
- **Search sheet:** a white dialog with 18px corners and the lift shadow on desktop, full screen on phones; suggestion rows show a thumbnail, name, mono meta and price or a sold pill.

### Filter Panel

The same panel serves both sizes: a quiet sidebar on desktop where filters apply on change, and a bottom-sheet popover on phones (white, 18px top corners, lift shadow, ink backdrop) with its own Apply button. Toggles are pill switches that turn moss when on.

### SwingTag (signature)

The ivory die-cut tag on a gold thread through a gold eyelet. It is used in exactly three places: the home hero (price in condensed 850-weight figures, a name link with a 2px gold underline, uppercase mono meta), the error page, and the footer rail. It swings on hover where motion is allowed.

### Footer

An ink ground with ivory text. A condensed heading, a short line and a gold "Browse the shop" pill; then a 4px gold rail across the width with the four listing facts (Price, Measurements, Condition, One of one) hanging from it as SwingTags, each with a bottle icon disc holding a gold icon. The rail shows four tags across on desktop and two by two below 1000px. Below that sit the brand row, gold-iconed links, and an outline "Back to top" pill that scrolls smoothly (instantly under reduced motion). Mono fine print closes the page.

### Pay Step (bKash Send Money)

A white card on the order page: a heading with a bottle-green icon and an ivory timer pill holding the 30-minute hold countdown in mono. Two plan options (full total or delivery only) as 12px-cornered bordered rows; the chosen one gets an ink border and an ivory wash. The receiving number sits in a dark ink panel with large tracking-spaced figures and a ghost Copy button. The transaction-ID field is uppercase mono. The form ends in the view's one ink button.

### Motion

Ease-out `cubic-bezier(0.16, 1, 0.3, 1)` everywhere: 160–200ms for state changes, 600ms for photo zooms, a 140ms out / 320ms in page crossfade, and 460ms for shared-photo morphs. Smooth in-page scrolling site-wide. Every animation is removed under `prefers-reduced-motion`.

### Icons

Lucide outline paths inlined in one icon component: 24px grid, 2px stroke, shown at 16–22px. Icons sit beside text labels; icon-only controls carry an aria-label.

### Staff Admin (separate surface)

The staff desk at /admin keeps the older ivory-ledger look and is not part of the storefront system. Its ground is tag ivory; the header is an ink bar with ivory text and tabs that fill the bar height, the current tab marked by the same 3px gold rail along the bottom edge. Page titles are uppercase, condensed (width 68%), 850 weight. Panels are ruled, not carded: a 3px ink rule on top and 1px ink-at-10% dividers between rows. Fields have 6px corners, a 1px ink-at-22% border and a faint ink wash; actions are 8px-cornered ink buttons that hover to moss, with outline and rust-danger variants. Piece states use bordered uppercase stamps (draft dashed, live moss, sold rust, held gold) and the rotated StatusStamp on the piece editor. Results arrive as ink toasts (rust for errors) with a gold icon disc. Phones get an ink bottom action bar with a gold primary pill and ivory bottom sheets. New storefront work must not borrow admin styling, and admin work should keep to these classes rather than adopt the daylight storefront.

## Do's and Don'ts

### Do:

- **Do** set every storefront page on paper (#faf7f1) with white hairline cards (1px, ink at 12%) at 18px corners.
- **Do** spend exactly one solid ink pill per view; make the rest outline pills or text links.
- **Do** give every product photo a 4:5 frame on the sand well with 12px corners, turning square on phones where that keeps price and action in the first screen.
- **Do** build product cards as photo, price plus notched size tag, name, and one mono fit number in inches.
- **Do** set measurements, sizes, piece IDs, counts and timers in Martian Mono, and prices with tabular figures.
- **Do** put meta lines below the name or beside the price.
- **Do** use gold only for counts, the active-tab rail, underlines, the footer rail and the gold pill on ink.
- **Do** use Lucide outline icons from the inlined set at 16–22px with a 2px stroke.
- **Do** keep tap targets at 44px or more and inputs at 16px text.
- **Do** honour reduced motion for every transition, swing and scroll.

### Don't:

- **Don't** add eyebrow or kicker labels above headings.
- **Don't** lay big tags, banners or price overlays over product photos; the only overlay is the small rust "Sold out" pill.
- **Don't** hang the SwingTag anywhere beyond the home hero, the error page and the footer rail.
- **Don't** bring back dark storefront grounds; ink grounds belong to the footer and the bKash number panel only.
- **Don't** use gold as a background on the light storefront, or rust for anything other than sold and errors.
- **Don't** put shadows on cards, photos or chips at rest.
- **Don't** replace the logo's colours, or use system or other display faces in place of Archivo.
- **Don't** carry admin styling (uppercase condensed titles, ledger rules, stamps) into the storefront.
