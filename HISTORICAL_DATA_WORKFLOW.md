# Runner Sports Historical Data Workflow

## Mission
Acquire, preserve, normalize, enrich, and mirror a 20-year multi-sport research warehouse without wasting paid API credits.

Historical core: 2006-2025. Live append: 2026+. Legacy extensions may reach earlier when needed for comparable-player/coach research.

Sports: NFL, NCAAF, NCAAB, NBA, WNBA, MLB, NHL.

## Cost hierarchy
1. Existing local raw file (zero network / zero credits)
2. Existing Dropbox archive (zero provider credits)
3. Free/open bulk datasets
4. League/official web data where permitted
5. Existing paid-response cache
6. Paid API only for unresolved coverage, market history, or live resolution

Never spend a paid request on data already present in raw storage.

## Storage contract

```text
data/
  raw/{sport}/{dataset}/season=YYYY/...
  normalized/{sport}/{dataset}/season=YYYY/...
  features/{sport}/{feature_set}/season=YYYY/...
  context/{sport}/season=YYYY/...
  markets/{sport}/season=YYYY/...
  manifests/ingestion.jsonl
  reports/completeness/...
```

Raw is immutable. Corrections create a new acquisition record; they do not silently overwrite evidence.

## File formats
- Raw provider response: original JSON/CSV/Parquet, compressed when appropriate.
- Large normalized/event tables: Parquet.
- Small registries/manifests/config: JSON/JSONL.
- Human audit reports: Markdown/CSV.
- Supabase: serving/index layer, not the only historical archive.

## Every acquisition records
source_id, source_name, source_url/locator, retrieved_at, sport, season, dataset, local path, byte count, SHA-256, quality_status. Add observed/effective timestamps and provider IDs when available.

## NFL first production run

PowerShell from repository root:

```powershell
py -m pip install -r requirements-ingestion.txt
py scripts/ingest_nflverse_pbp.py --start 2006 --end 2025 --root data
```

Rerunning the same command is intentionally cheap: existing season files are hashed and returned as `cached`; no network call occurs unless `--force` is explicitly supplied.

## Dropbox mirror
Dropbox is the durable research/archive layer. Mirror curated artifacts into the already-created `Data Transfer For Runner Sports` hierarchy. Do not manually upload every intermediate temporary file. Prefer completed raw season partitions, normalized partitions, manifests, and completeness reports.

## Paid market data policy
Market history is uniquely expensive. Query it only after the event/game inventory exists. Build the request set from canonical game IDs and coverage gaps first. Cache every response and its request parameters. Intraday snapshots should be acquired at the lowest resolution sufficient for the research question, then higher-resolution windows only around identified game-state events when provider coverage supports it.

## Event intelligence
Normalize play/event streams so models can join game state to market state. Preserve period, clock, score, possession/participants, event type, event outcome, and source timestamp. Derived event windows may include turnovers, fumbles, interceptions, scoring runs, lead changes, substitutions, pitcher/goalie changes, penalties, timeouts, injuries, and other sport-specific regime shifts.

## Player and coach comparable-state layer
Do not compare raw box scores across eras. Build state vectors from era-normalized player/team/coach features plus game state. Store comparable-state results as derived artifacts with model version and feature definitions.

## Expansion order
1. NFL play-by-play bulk acquisition
2. NFL rosters/player/team/coach/regime tables
3. MLB official/open game and pitch/play feeds
4. NHL official/open game and event feeds
5. NBA/WNBA event and player layers
6. NCAAF/NCAAB event and team/player layers
7. Historical market inventory and paid gap-fill
8. Context/adversity evidence ledger
9. Cross-era comparable-state feature store
10. Completeness validation + Dropbox mirror

## Completion definition
A sport-season is not complete merely because a file exists. Completion requires expected event/game coverage, canonical IDs, lineage, validation, normalized tables, and documented known gaps. Paid-provider absence must be represented as an explicit coverage gap rather than fabricated data.
