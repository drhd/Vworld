# Hamed Davamnejad — The Throughline

A single-page personal brand site. One continuous drawn line — the
throughline — descends through four tonal strata (Frame → Root →
Synthesis → Method) and resolves at one action. Persian (RTL) primary,
English (LTR) secondary.

## Run it

No build step. Open `index.html`, or serve the folder from any static
host:

```
python3 -m http.server 8000
```

## Edit the words (most common change)

**Everything you can read on the page lives in one file: `js/content.js`.**

- `SITE.fa` is the Persian site, `SITE.en` is the English site — same
  shape, edit values only.
- `SITE.gates` holds the four EDGE letters and their meanings. The
  current meanings are **placeholders** — swap them when the real
  E-D-G-E definitions are settled.
- `SITE.contact.email` feeds the CTA button and the colophon.

Nothing else needs to change; the layout renders whatever is there.

## Edit the look

All design tokens — the four strata colors, brass accent, type scale,
spine position, motion timing — are CSS custom properties in
**`css/tokens.css`**. Layout and components are in `css/main.css`.

## How it's built

| File | Role |
| --- | --- |
| `index.html` | Semantic shell: header, throughline mount, `<main>` |
| `js/content.js` | All copy and data, both languages |
| `js/main.js` | Renders content, builds/draws the throughline SVG, strata + reveal observers, language switch |
| `css/tokens.css` | Every design decision as a variable |
| `css/main.css` | Layout, strata, motion |
| `fonts/` | Self-hosted variable fonts: Vazirmatn (fa), Besley (en) — OFL licensed |

- The throughline is an SVG path measured from the live layout (the
  four gate kickers + the CTA) and drawn with `stroke-dashoffset`
  tied to scroll. It rebuilds on resize and language switch, and
  mirrors automatically in RTL.
- `prefers-reduced-motion` is fully respected: no snap, no reveals,
  line fully drawn.
- No dependencies, no build tooling, no external requests — hostable
  on any static host reachable from Iran.
