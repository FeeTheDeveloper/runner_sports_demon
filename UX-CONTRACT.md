# Runner Demon UX contract

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Navigation | control-web.ts and control-client.ts | src/dashboard | Eight hash views and overview fallback | control-client.test.ts and browser |
| Select/Listbox | Native select | src/dashboard/control-web.ts | Provider, league, sort, priority; platform popup | Keyboard and browser |
| Date | Native date input | src/dashboard/control-web.ts | Explicit schedule request | Inline validation and browser |
| Form | loadSchedule | src/dashboard/control-client.ts | novalidate, inline alert and focus | Browser and control API tests |
| Search | Market toolbar | src/dashboard/control-client.ts | Local filter with clear/focus restoration | control-client.test.ts |
| Scrollbar | Global CSS | src/dashboard/control-styles.ts | Page and bounded table geometry | Strict audit and browser |
| Toast | showToast | src/dashboard/control-client.ts | Three-second status feedback | Refresh and pause browser checks |
| Data display | renderContent and renderMarkets | src/dashboard/control-client.ts | Read-only cards, details and table | Escaping, empty and failure tests |

## Workflow and state ownership

- Initial hydration reads local `/control/status`, with no external provider requests. Refresh is deduplicated, disabled while pending and times out after 20 seconds. Automatic refresh runs every 15 seconds while visible and unpaused. Errors retain the last snapshot and mark it potentially stale.
- Filters are local, transient and preserved across hash navigation during the session. Deliberate exception: filters are not URL state because this is a single-user local cockpit; reloading resets them. Hash routes are shareable.
- Market search exposes a clear button only with text; clearing preserves the provider filter and returns focus. A no-match state distinguishes filtering from missing data.
- Schedule fetch happens only on form submission. The date must match a real ISO calendar date. Invalid input receives inline validation and focus. Success, no games, provider error and busy states are distinct.
- Content loads lazily from `/content`; no startup provider request. Reload is deduplicated with a 15-second timeout. Failed reload retains prior cards, shows a retry instruction and re-enables the button. Cards remain fixture editorial shells, with source labels, league filtering and native details disclosure. All returned strings are escaped.
- Snapshot export downloads local JSON. There are no edits, deletes, bulk selection, trading, external publication or approval workflows in this surface.

## Accessibility and resilience

Skip link, one main heading, semantic navigation/sections/tables, labeled inputs, visible keyboard focus, aria-current navigation, aria-pressed pause, status announcements and inline form alert. Native selects/date/details keep platform keyboard behavior; platform popup styling is intentionally accepted. No custom drag, tooltip or modal patterns require replacement. Reduced motion and forced colors are supported. Page widths must remain within the viewport; tables scroll locally. Provider outages must not turn unknown values into current or zero values.

## Verification

`npm test` builds and runs behavior/integration checks. `premium-ui.json` scopes the static UI audit to the dashboard. Browser evidence and known limitations are recorded in `docs/ops/DEMON_COCKPIT_2026-09-26.md` after verification.
