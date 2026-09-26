# Runner Demon control center — September 26, 2026

## Delivered

Local dashboard at `http://127.0.0.1:8790`, branch `feat/runner-demon-cockpit`. Restart with `npm run dashboard`. This is a repository implementation, not a hosted deployment. Changes are uncommitted for review.

- Supplied Runner logo, custom generated Challenger/Demon-inspired livery artwork, navy/red/blue theme, automotive hero and telemetry hierarchy.
- Eight working views: overview, markets, schedule, totals, providers, work queue, models and new content studio.
- Studio reads 20 repository editorial shells, filters NFL/NCAAF, expands briefs, reloads and links source JSON. Fixture labels remain visible.
- Market clear action restores focus; schedule input has inline validation; responsive navigation and bounded tables; reduced-motion/forced-color styles and global scrollbars.
- Fixed image allowlist, no arbitrary asset-path access. Artwork provenance is in `assets/dashboard/README.md`.
- Maintained `DESIGN.md`, `UX-CONTRACT.md` and `premium-ui.json`. Runtime tokens remain in `control-styles.ts`.

## Verification

| Check | Evidence |
| --- | --- |
| Build | `npm run build` passed after final responsive/color adjustments |
| Runtime tests | All 14 programs in `npm test` passed, including asset allowlist/Host checks and new studio filtering, escaping, empty state and reload-failure recovery assertions |
| Static UI audit | Strict audit: zero findings; `demon-ui-audit.json` |
| Design lint | Zero errors; 16 orphan-token warnings because component properties are documented in prose rather than schema references |
| Browser desktop | Supplied logo and generated car decoded at natural sizes 627x627 and 1672x941; overview hydrated saved metrics and HISTORICAL label; no console errors observed before failure emulation |
| Browser interactions | Studio loaded 20 cards, NFL reduced to 10, brief disclosure opened; unmatched search returned zero, clear restored 250 and focus; empty date showed inline alert and focused date; pause worked and keyboard Enter resumed |
| Responsive | Inspected 390x844 and 320x780. Fixed initial 320px headline clipping; final headline content/client widths both 228px, page width 310px within 320px viewport |
| Motion | Emulated reduced motion yielded 0s button transition; emulation and viewport overrides reset afterward |
| Failure boundary | Unit tests prove failed studio reload preserves prior cards and enables retry. Browser offline emulation encountered tool timeouts, so no successful browser outage test is claimed. Networking was restored |
| Diff | Reviewed changes and `git diff --check` passed |

## Data and tool boundaries

Observed saved counts: 1,413 markets, 39,236 market events, zero of three fresh provider samples. These are historical engine data, not live-market verification. The dashboard remains read-only; this task did not publish, trade, ingest or deploy.

Frontend Design Premium guided implementation and verification. Mobbin rejected reference search because a paid plan is required. Canva board generation failed twice with `internal_error`; no Canva design exists from these requests. The supplied logo and generated car artwork are integrated locally regardless of those connector limits.

The vehicle is explicitly labeled a custom Demon-inspired 2020 Challenger concept. No factory model specification is asserted.
