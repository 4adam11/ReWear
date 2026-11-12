---
name: rewear-brand
description: "The ReWear brand kit. Use it when designing, building or reviewing any ReWear screen, email, social post or slide: logo use, colour tokens, type, shape, motion, photography, icons and voice. The site shows the same kit at /brand."
---

# ReWear brand kit

ReWear is a marketplace for pre-loved Indian fashion. People buy outfits to keep or rent them for a date: a wedding, a sangeet, Diwali, a college fest. The brand should feel like a well-kept family wardrobe: warm, honest and a little festive, never loud.

Every token named below exists in `client/tailwind.config.js` and every shared class in `client/src/index.css`. Use the names, not raw hex values. The live version of this kit is the Brand page on the site (`/brand`).

## Priority order

When rules compete, protect them in this order:

1. The shopper can do the job: find, judge, buy, rent, sell. Broken flows beat any polish rule.
2. Honesty: real photos, real condition, real prices. Never imply a payment method, delivery promise or check that doesn't exist.
3. Accessibility: 4.5:1 text contrast, 3:1 for field borders and icons, 44px touch targets, keyboard focus, reduced motion.
4. Consistency with this kit.
5. Delight, and only where a moment earns it.

## Essence

- **Line:** Wear it again.
- **Promise:** Every outfit has another celebration in it.
- **Personality:** warm, trustworthy, festive, practical.
- **Not:** luxury-snobbish, discount-shouty, cutesy or tech-cold.

## Logo

The mark is a thrift price tag on a string, with a caramel heart for "pre-loved". It sits on a rounded Espresso tile. The wordmark is "ReWear" in Jost Bold, capital R and capital W, never "Rewear" or "REWEAR".

| Asset | File | Use |
| --- | --- | --- |
| Mark | `client/public/brand/rewear-mark.svg` | App icon, favicon, avatars, social profile |
| Mark, reversed | `client/public/brand/rewear-mark-reversed.svg` | On Espresso or photos where the tile would vanish |
| Mark, one colour | `client/public/brand/rewear-mark-mono.svg` | Stamps, embossing, single-colour print (uses `currentColor`) |
| Lockup | `client/public/brand/rewear-logo.svg` | Mark plus wordmark, light backgrounds |
| Lockup, on dark | `client/public/brand/rewear-logo-ondark.svg` | Mark plus wordmark, Ink or Night backgrounds |
| App icons | `client/public/apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Home-screen icons, listed in `manifest.webmanifest` |

- **Clear space:** keep a gap of a quarter of the mark's width on every side.
- **Minimum size:** 20px for the mark, 96px wide for the lockup.
- **Never:** recolour the tile, stretch it, add shadows or outlines, rotate the tag differently, or set the wordmark in another font.
- In React, use `<Logo />` or `<LogoMark />` from `components/ui/Logo.jsx`. They draw the same SVG as the files.

## Colour

Warm coffee tones on cream, with status colours named after Indian dyes. The interface stays mostly Paper, white and Ink so the clothes carry the colour.

### Core

| Token | Hex | Use |
| --- | --- | --- |
| `ink` | #2b1d14 | Body text, primary buttons, the header |
| `ink-soft` | #4a3a2e | Long descriptions |
| `brand` (Espresso) | #6b4430 | Links, focus ring, logo tile, selected states |
| `brand-dark` | #4a2e20 | Pressed Espresso |
| `caramel` | #c0834f | Stars, rental highlights, chart fills. Not for text under 18px (3.2:1) |
| `gold` | #e8c39e | Highlights and counters on dark surfaces only |
| `accent` | #a0521d | Small warm labels such as "New" (5.7:1, 4.6:1 on Sand) |

### Surfaces

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | #faf6ef | Page background |
| `white` | #ffffff | Panels, cards, inputs |
| `cream` | #f6efe5 | Row hover, quiet fills, disabled inputs |
| `sand` | #f1e8db | Alternate sections, avatar circles |
| `night` / `night-soft` | #3b2a1f / #4a3426 | Dark bands, the category bar, image placeholders on dark |
| `ondark` / `ondark-muted` | #e3d5c4 / #bfae9c | Text on Ink and Night |

### Lines and secondary text

| Token | Hex | Use |
| --- | --- | --- |
| `line` | #e7ddd0 | Panel borders, table rules |
| `line-soft` | #efe6da | Dividers inside a panel |
| `line-strong` | #d9cbb9 | Dashed empty states, chip borders |
| `field` | #9c8a78 | Input, select and textarea borders (3.3:1 on white) |
| `muted` | #6e5d50 | Secondary text (6.3:1) |
| `faint` | #7f6e60 | Placeholders and fine print (4.9:1) |

### Status

Each status colour has `DEFAULT` (icons, text), `strong` (text on its tint), `tint` (background), `wash` (hover on a tint) and `line` (border). Sage and Sindoor also have `ondark` (#9fd0aa, #f3a59c) for icons on Ink, such as in toasts.

| Role | Name | DEFAULT | Use |
| --- | --- | --- | --- |
| `success` | Sage | #3f6b4a | Live, delivered, completed, saved, applied |
| `info` | Neel | #2f6a8a | Confirmed, accepted, verified seller |
| `warning` | Haldi | #8a5210 | In review, open reports, AI flagged |
| `danger` | Sindoor | #a1352b | Errors, rejected, cancelled, destructive buttons |

Status is never shown by colour alone: every badge has a word, every alert has text.

### Occasions

Each occasion has its own colour for tiles, banners and pills (`client/src/utils/catalog.js`): Wedding #7a2331, Party #5a2d58, Ethnic #8c5210, Casual #4f6146, Streetwear #33363d, Designer #7a5a1e. Use the `tint` value for backgrounds and the colour for small accents. Don't use occasion colours for status.

## Type

| Role | Font | Style |
| --- | --- | --- |
| Display (hero) | Jost 700 | 44 to 72px, uppercase, tracking 0.02em |
| Page title (`.page-title`) | Jost 700 | 26 to 30px, uppercase, tracking 0.04em, short Ink bar underneath |
| Section heading | Jost 700 | 18 to 20px, uppercase, tracking 0.04em |
| Label, button, tab (`.kicker`, `.btn`, `.tab`) | Jost 600 | 12 to 13px, uppercase, tracking 0.08 to 0.2em |
| Body | Inter 400 | 14 to 15px, line height 1.6 |
| Small | Inter 400/500 | 12 to 13px |

- Headings balance their lines (`text-wrap: balance`), paragraphs avoid orphans (`pretty`). Both are set globally.
- Prices, counts and tables use `.nums` (tabular figures) so digits line up.
- Write rupees as ₹2,400 with the Indian comma style from `utils/format.js`.

## Shape and space

- **One radius:** 2px (`rounded-sm`) on buttons, inputs, panels, cards, badges, modals and images. Pills (`rounded-full`) only for category chips, counters and avatars.
- **Panels:** `.panel` is white, 1px `line` border, 2px radius. Inside a panel, 20px padding (`p-5`) and `line-soft` dividers.
- **Product photos:** always 3:4 portrait, cropped with Cloudinary `g_auto`, with `.photo-edge` (a 1px 8% black inset) so pale garments keep an edge on cream.
- **Shadows for depth, borders for structure:** menus and popovers use `shadow-menu`; cards lift with `shadow-lift` on hover; tables, inputs and dividers use borders.
- **Touch targets:** at least 44 by 44px for anything you tap. Icon buttons get the padding even if the icon is 20px.
- **Page width:** content sits in `max-w-6xl` (1152px) with 16px side gutters on phones, 24px from `sm`.

## Components

| Need | Use |
| --- | --- |
| Main action | `.btn .btn-dark` (Ink, turns Espresso on hover) |
| Second action | `.btn .btn-outline` |
| On a photo or dark band | `.btn .btn-light` |
| Destructive | `.btn .btn-danger`, and always confirm first |
| Small | add `.btn-sm` (36px tall, still 44px apart) |
| Text input, select, textarea | `.field` |
| Status | `<StatusBadge status="..." />` (uses `.chip`) |
| Verified seller | `<VerifiedBadge />`, with `label` where there is room |
| Box | `.panel` |
| Tabs | `.tab-bar` with `.tab` / `.tab-active` |
| Dialog | `components/ui/Modal.jsx` (focus trap, Escape to close, scroll contained) |

At most one `.btn-dark` per view area. Buttons say what happens ("Place order", "Take listing down"), never "Submit" or "OK".

## Motion

Motion marks a moment; it doesn't decorate. Values below are exact.

- **State changes** (hover, tabs, row highlight): 150ms, `cubic-bezier(0.2, 0, 0, 1)`, colour or opacity only. Name the properties; never `transition: all`.
- **Press:** buttons scale to 0.96 while held, disabled ones never do.
- **First-load entrances** (hero only): `.enter`, `.enter-2`, `.enter-3`: opacity, 4px blur and 12px rise over 300ms, staggered 100ms. Never on routine UI.
- **Milestones:** a glimm sweep in Gold, Caramel and Accent (band tightness 18, swell 0.3) plays when an order is placed and when a new listing is sent for review. The next page appears behind the band. Nothing else gets it. See `components/ui/Milestone.js`.
- **Reduced motion:** movement, scale and blur run only under `prefers-reduced-motion: no-preference`. The sweep is skipped entirely.
- **Hover only on hover devices:** `future.hoverOnlyWhenSupported` is on in Tailwind, so taps on phones don't stick.

## Photography

- Real garments from real wardrobes, in daylight or warm indoor light. Show the whole outfit, then close-ups of embroidery, fabric and any flaw.
- 3:4 portrait. The garment fills most of the frame; plain or tidy backgrounds.
- Every listing photo passes the automatic content check and an admin review before it goes live.
- Don't: stock photos for listings, heavy filters, collages, watermarks, or photos of a different item. Party listings show party wear, not wedding sarees.
- Hero and editorial images may use models; keep skin tones natural and the clothes the subject.

## Icons

- One library: lucide-react, outline style. A filled icon marks the active state (a saved heart).
- 2px stroke beside semibold text, 1.5px beside regular text. 16 to 20px in text, 22 to 24px alone.
- Icons use `currentColor`. An icon alone always has an `aria-label` or visually hidden text.

## Voice

Plain Indian English, short sentences, the way a helpful friend who sells clothes would talk.

| Do | Don't |
| --- | --- |
| "Rent it for your sangeet, send it back after." | "Unlock limitless fashion possibilities!" |
| "₹2,400 · Like new · Size M" | "Amazing deal!!! Grab now" |
| "Your order is confirmed. The seller has 2 days to accept it." | "Success!" |
| "That listing has already been reported by you. An admin will look at it." | "Error 409" |
| "Pay cash on delivery. UPI and card payments are coming soon." | Implying UPI works when it doesn't |

- Say what happened and what happens next.
- Name occasions people actually have: mehendi, haldi, sangeet, reception, Diwali, Eid, college fest.
- No exclamation marks in interface text, no all-caps sentences (uppercase is for short labels set in Jost).
- Errors explain how to fix it, in one sentence.

## Before you ship a screen

- Text contrast 4.5:1 or more, field borders and icons 3:1 or more.
- Works at 375px wide with no sideways scroll; tap targets 44px.
- Every image has `alt` text, or `alt=""` if decorative; photos are 3:4 with `.photo-edge`.
- Focus is visible, dialogs trap focus and close on Escape.
- Prices use `money()` and `.nums`.
- No raw hex values in class names; no `transition-all`; no radius other than `rounded-sm` or `rounded-full`.
- Loading shows a skeleton the size of the content; empty states say what to do next.
