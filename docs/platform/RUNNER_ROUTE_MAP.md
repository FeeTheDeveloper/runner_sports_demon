# Runner route map

September 26, 2026. Existing routes were inventoried in source and the Site build manifest. Build success is not authenticated runtime acceptance.

| Journey | Existing surface | Completion requirement |
| --- | --- | --- |
| Sport -> slate | Site /games, shell sport/context controls | Persistent league/date selection and canonical slate |
| Slate -> game | /games/[id] | GAME LAB tabs with actual supported facts and freshness |
| Game -> player | /players and /props | Add /players/[id] using existing Site; join game/log/prop/system context |
| Player -> system | /systems example directory | Replace example metrics with engine read models; add /systems/[id] |
| System -> market | /odds, /markets and prediction-market surfaces | Preserve selection/line/period; explain fees and stale/suspended quotes |
| Market -> live state | /api/runner/live and /api/runner/game-flow | LIVE DESK surface backed by existing Game Flow, explicit supported games |
| Live -> result | /tracker exists | Add official receipts/read detail separately from private tracker |
| Board | /picks and existing homepage | Join candidate/system/model/quote evidence; no fabricated edge |
| Operational control | Demon loopback dashboard; Site /mcp and command queue | Capability checks, secret-free arguments, audited idempotent execution |

Proposed route names /players/[id], /systems/[id], /live and /receipts[/id] are planning targets, not implemented routes. Prefer extending current pages/components over duplicate navigation entries.

## API boundaries

Every private tracker route must authenticate on the server and enforce owner scope even with service-role access. Entitled intelligence APIs must enforce access independently of page middleware. Missing auth configuration must fail closed. Operational commands require named capabilities and exact action authorization, not an unrestricted shared credential.

## Navigation acceptance

Full journey must retain canonical IDs and period/market context, support direct links/back navigation, and expose loading/empty/stale/error/forbidden/not-found states. Test keyboard focus, URL filters, pagination and mobile overflow. A visible tab without a connected panel does not pass.

