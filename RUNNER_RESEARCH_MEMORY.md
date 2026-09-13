# Runner Research Memory

Durable validated lessons only. Raw historical facts belong in `rsaa_verse`; forecast-specific records belong in `.runner/research/` and `.runner/predictions/`.

## Validated Lessons

- ESPN CFB/NFL scoreboard records use provider timestamps and must preserve unknown fields.
- ESPN pregame state is `pre` and maps to the Runner `scheduled` state.
- NFL 2025 nflverse PBP produced a validated Verse warehouse with 285 games and 6,045 derived drives.
- Market confidence must be reduced or suppressed when freshness, mapping, liquidity, or required state is missing.

## Known Limitations

- No local R runtime is installed for PFR/R enrichment.
- Odds API and authenticated Kalshi operation depend on local credentials.
- Demon live NFL PBP/drive ingestion and historical model fusion remain incomplete.

## Calibration Findings

No statistically sufficient calibration study has been completed. Do not claim model superiority or profitability.
