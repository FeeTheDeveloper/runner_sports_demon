---
version: alpha
name: Runner Demon
description: A precision sports intelligence cockpit with a custom Runner Challenger concept as its signature.
colors:
  primary: "#cf2038"
  primary-hover: "#d7273d"
  background: "#080e1b"
  sidebar: "#0b1220"
  panel: "#111b2c"
  raised: "#152238"
  border: "#26344a"
  text: "#f3f6fc"
  muted: "#a1aec3"
  dim: "#8191aa"
  accent: "#62a5ff"
  success: "#76dfba"
  warning: "#f4c278"
  danger: "#ff91a0"
  scrollbar-thumb: "#465b78"
  scrollbar-track: "#0b1220"
  scrollbar-hover: "#6e89ad"
  scrollbar-active: "#91baff"
typography:
  sans:
    fontFamily: '"Segoe UI", Arial, sans-serif'
  display:
    fontFamily: 'Bahnschrift, "Arial Narrow", "Segoe UI", sans-serif'
  mono:
    fontFamily: '"Cascadia Code", Consolas, monospace'
rounded:
  DEFAULT: "10px"
  control: "5px"
  card: "8px"
spacing:
  page-max: "1760px"
  page-padding: "32px"
  grid-gap: "20px"
components:
  button: {}
  card: {}
  table: {}
  input: {}
  navigation: {}
  toast: {}
---

# Runner Demon Design System

## Overview

### Creative North Star

A navy motorsport garage: the supplied Runner identity on a Challenger-inspired concept car, with operational telemetry arranged like a pit wall.

### Product context and register

- Audience: Runner Sports operators inspecting saved markets, provider freshness, schedules, research and editorial briefs. NFL and college football are evidenced by the repository.
- English UI; device-local date/time formatting. No additional markets or localization are implied.
- Desktop operations dashboard with a usable narrow layout; dense utility beneath one expressive overview hero.
- Brand/product hybrid. The car is concept artwork, not a vehicle configuration or factory specification claim.
- Restraint: familiar tables, labeled controls, visible source and freshness states. Avoid decorative gauges that invent performance measurements.
- Token ownership: Model B. `src/dashboard/control-styles.ts` is canonical runtime CSS; this document mirrors its roles. Review both in the same diff. The app has no secondary theme or component framework.

## Colors

Dark navy surfaces progress from background through panel to raised. Red marks primary actions and selected navigation; blue marks links and telemetry. Mint, amber and pale red encode success, warning and error with visible text labels. The legacy `--lime` token maps to success mint. `--brand` maps to primary; `--blue` to accent. Foreground/muted/dim map directly. Scrollbar tokens are global, including hover and drag states. Forced colors use platform colors; there is no light theme.

## Typography

Segoe UI handles readable controls and prose; Bahnschrift brings a restrained automotive character to headings; Cascadia Code/Consolas handles timestamps and metadata. System fallbacks avoid external font loading. Headings range from 15px panel titles to 49px hero display; body is 13px. Technical metadata is compact. Numeric metrics use tabular figures. Uppercase is reserved for short labels; ordinary prose remains sentence case.

## Layout

224px fixed sidebar, 64px top bar and a 1760px maximum content area. Four metrics and four quick links lead into a two-column operational grid. Below 1200px quick links use two columns; below 1000px overview panels stack; at 760px navigation becomes horizontal rows and the page becomes single-column. Tables own bounded 620px scroll regions; the page itself scrolls normally. The hero reserves height before its image loads. Content cards use two columns then one on narrow screens. No whole-page horizontal scrolling is intended.

## Elevation & Depth

Hierarchy comes from tonal surfaces and 1px borders. Only the transient toast has a shadow. The car uses a dark gradient for text legibility. Tables have sticky headers inside their scroll regions. No decorative blur or floating overlays.

## Shapes

10px panels, 8px metric cards, 5px controls, and small rectangular pills. Circular shapes are limited to avatars and status dots. Red inset navigation accents echo the livery.

## Components

### Foundational visual states

Hover raises surface contrast. Focus-visible uses a 2px blue outline with 4px offset. Active controls move 1px. Disabled controls retain their dimensions at reduced opacity. Selected navigation has text, border, and red inset stripe. Busy operations use explanatory status text with disabled initiating controls. Empty states describe the missing data and the next useful action. Errors retain prior readable data when available.

### Buttons and actions

Red primary, bordered secondary, blue text links. Buttons are at least 39px tall; busy states preserve geometry. Dashboard controls read data and export snapshots. There are no trading or publishing buttons.

### Navigation and data display

Eight hash routes: overview, markets, schedule, totals, providers, content, workflows, models. Current route uses aria-current. Market tables expose search, provider filter and sorting; at most 250 rendered rows with bounded scrolling. Activity charts include labels and explicit empty states. Freshness labels are distinct from local server connectivity.

### Forms and overlays

Native select and date controls are deliberate platform-owned popups with app-owned field styles. Schedule form uses novalidate and an inline alert connected to its date input. Search has an explicit clear action that returns focus. Toasts announce transient feedback without replacing persistent errors. No custom dialogs or browser alert/confirm/prompt.

### Iconography

Existing inline SVG line icons, generally 16–20px, always accompanied by accessible text. The supplied logo is an image with meaningful alternative text.

### Motion

150–180ms color/surface transitions and a 1px pressed state. No idle animation. Reduced motion removes animation and transitions. Vehicle artwork is static.

### Content and data visualization

Use factual verbs: load, reload, refresh, inspect, export. Unknown values display em dashes rather than fabricated zeroes. Historical data and editorial fixture shells retain explicit labels. Blue chart bars represent recorded activity; no decorative financial metrics.

## Do's and Don'ts

- Do keep the Runner livery and brand palette consistent.
- Do preserve source, timestamp and freshness evidence.
- Don't imply a connected local server proves a live provider feed.
- Don't add simulated performance numbers, trading, or publication affordances.
