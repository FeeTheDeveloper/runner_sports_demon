#!/usr/bin/env python3
"""Convert a validated rsaa_verse Demon export (parquet) into CSVs matching
runner_sports_demon's historical_* SQLite tables, for scripts/load-verse-history.mjs.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import duckdb

# table -> (source parquet filename, select list). `{season}` is substituted with
# the --season argument for tables whose source parquet has no season column.
TABLES = {
    "historical_team_profiles": (
        "team_profiles.parquet",
        "select {season} as season, team, drives, avg_drive_yards, avg_drive_plays, avg_drive_epa from source",
    ),
    "historical_games": (
        "game_baselines.parquet",
        "select game_id, season, game_date, home_team, away_team, home_score, away_score, "
        "closing_total, closing_spread, venue, play_count, seconds_remaining_at_end from source",
    ),
    "historical_market_history": (
        "market_history.parquet",
        "select game_id, season, closing_total, closing_spread from source",
    ),
    "historical_drives": (
        "drive_baselines.parquet",
        "select {season} as season, game_id, drive_id, offense, defense, start_quarter, end_quarter, "
        "plays, yards, first_downs, penalties, sacks, interceptions, fumbles_lost, touchdowns, "
        "scoring_events, epa from source",
    ),
    "historical_periods": (
        "period_baselines.parquet",
        "select {season} as season, game_id, team, quarter, plays, yards, average_epa, success_rate, "
        "touchdowns, interceptions, fumbles_lost from source",
    ),
    "historical_game_state_samples": (
        "game_state_baselines.parquet",
        "select {season} as season, game_id, play_id, quarter, game_seconds_remaining, score_differential, "
        "possession, yardline_100, down, ydstogo, epa, success, yards_gained from source",
    ),
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--export-dir", required=True)
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--out-dir", required=True)
    args = parser.parse_args()

    export_dir = Path(args.export_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    connection = duckdb.connect()
    written = {}
    for table, (filename, query) in TABLES.items():
        source = str((export_dir / filename).resolve()).replace("\\", "/").replace("'", "''")
        sql = query.format(season=args.season).replace("from source", f"from read_parquet('{source}')")
        target = out_dir / f"{table}.csv"
        connection.execute(f"copy ({sql}) to ? (header, delimiter ',')", [str(target)])
        written[table] = connection.execute("select count(*) from read_csv_auto(?)", [str(target)]).fetchone()[0]
    print(json.dumps({"export_dir": str(export_dir), "season": args.season, "out_dir": str(out_dir), "rows": written}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
