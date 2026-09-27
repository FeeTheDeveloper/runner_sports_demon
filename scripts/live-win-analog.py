#!/usr/bin/env python3
"""Experimental NFL score/clock analog; reads local Runner SQLite and ESPN receipt.

Requires Python 3.11+. This is research output, not a calibrated production model.
Run: python scripts/live-win-analog.py --date 2026-09-27 [--write]
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sqlite3
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATABASE = ROOT / ".runner-scout.db"
REPORTS = ROOT / ".runner" / "predictions"
MODEL = "experimental-score-clock-analog-v0"
TRAIN_SEASONS = (2016, 2024)
HOLDOUT_SEASON = 2025
TIME_TOLERANCE_SECONDS = 180
SCORE_TOLERANCE_POINTS = 2
MIN_ANALOG_GAMES = 80


def nearest_states(connection: sqlite3.Connection, seconds_remaining: int, seasons: tuple[int, int]):
    rows = connection.execute(
        """select s.game_id, s.game_seconds_remaining, s.score_differential,
                  s.possession, h.home_team, h.home_score, h.away_score
             from historical_game_state_samples s
             join historical_games h on h.game_id = s.game_id
            where s.season between ? and ?
              and s.game_seconds_remaining between ? and ?
              and s.possession in (h.home_team, h.away_team)
              and h.home_score <> h.away_score""",
        (*seasons, seconds_remaining - TIME_TOLERANCE_SECONDS,
         seconds_remaining + TIME_TOLERANCE_SECONDS),
    )
    nearest = {}
    for game_id, game_seconds, score_diff, possession, home, home_final, away_final in rows:
        if score_diff is None:
            continue
        if game_id not in nearest or abs(game_seconds - seconds_remaining) < abs(
            nearest[game_id][0] - seconds_remaining
        ):
            home_diff = score_diff if possession == home else -score_diff
            nearest[game_id] = (game_seconds, home_diff, int(home_final > away_final))
    return list(nearest.values())


def analog_probability(states, home_diff: int):
    peers = [state for state in states if abs(state[1] - home_diff) <= SCORE_TOLERANCE_POINTS]
    if len(peers) < MIN_ANALOG_GAMES:
        return None, len(peers)
    # Laplace smoothing prevents certainty from finite historical samples.
    return (sum(state[2] for state in peers) + 1) / (len(peers) + 2), len(peers)


def halftime_holdout(connection: sqlite3.Connection):
    train = nearest_states(connection, 1800, TRAIN_SEASONS)
    test = nearest_states(connection, 1800, (HOLDOUT_SEASON, HOLDOUT_SEASON))
    scored = []
    for _, home_diff, outcome in test:
        probability, count = analog_probability(train, home_diff)
        if probability is not None:
            scored.append((probability, outcome))
    if not scored:
        return {"status": "unavailable", "reason": "no holdout games with enough analogs"}
    baseline = sum(outcome for _, outcome in scored) / len(scored)
    return {
        "status": "measured",
        "trainGames": len(train),
        "holdoutSeason": HOLDOUT_SEASON,
        "holdoutGames": len(scored),
        "brier": round(sum((p - y) ** 2 for p, y in scored) / len(scored), 4),
        "constantBaselineBrier": round(sum((baseline - y) ** 2 for _, y in scored) / len(scored), 4),
        "logLoss": round(-sum(y * math.log(p) + (1 - y) * math.log(1 - p)
                              for p, y in scored) / len(scored), 4),
        "scope": "halftime winner only; does not validate prices, edges, other game times, or 2026",
    }


def game_seconds_remaining(game):
    period, clock = game.get("period"), game.get("clock")
    if not isinstance(period, int) or not 1 <= period <= 4 or not isinstance(clock, str):
        return None
    match = re.fullmatch(r"(\d{1,2}):(\d{2})", clock)
    if not match:
        return None
    minutes, seconds = map(int, match.groups())
    if minutes > 15 or seconds > 59:
        return None
    return (4 - period) * 900 + minutes * 60 + seconds


def earliest_saved_predictions(date: str):
    """Freeze the first saved live forecast per event for later result grading."""
    first = {}
    for path in sorted(REPORTS.glob(f"{date}-nfl-analog-*.json")):
        try:
            with path.open(encoding="utf-8") as saved:
                report = json.load(saved)
        except (OSError, ValueError):
            continue
        for prediction in report.get("predictions", []):
            event_id = prediction.get("eventId")
            probability = prediction.get("homeWinProbability")
            if event_id and event_id not in first and isinstance(probability, (int, float)):
                first[event_id] = {
                    "homeWinProbability": probability,
                    "predictedAt": report.get("scoreboardReceiptAt"),
                    "snapshot": path.name,
                }
    return first


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--date", required=True, help="NFL schedule date, YYYY-MM-DD")
    parser.add_argument("--dashboard", default="http://127.0.0.1:8790")
    parser.add_argument("--write", action="store_true", help="save a dated JSON report under .runner/predictions")
    parser.add_argument("--watch", action="store_true", help="repeat local snapshots until this date's NFL slate is final")
    parser.add_argument("--interval-seconds", type=int, default=300, help="watch interval, minimum 60 seconds")
    args = parser.parse_args()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.date):
        parser.error("--date must be YYYY-MM-DD")
    datetime.strptime(args.date, "%Y-%m-%d")
    if args.dashboard != "http://127.0.0.1:8790":
        parser.error("only the local read-only Runner dashboard is supported")
    if not DATABASE.is_file():
        parser.error("local Runner SQLite database is unavailable")
    if args.watch:
        if args.interval_seconds < 60:
            parser.error("watch interval must be at least 60 seconds")
        while True:
            try:
                child = subprocess.run(
                    [sys.executable, str(Path(__file__).resolve()), "--date", args.date,
                     "--dashboard", args.dashboard, "--write"],
                    capture_output=True, text=True, check=True,
                )
                path = Path(child.stdout.strip())
                print(path, flush=True)
                with path.open(encoding="utf-8") as saved:
                    snapshot = json.load(saved)
                if (snapshot["scheduledGames"] > 0 and
                        snapshot["finalGames"] == snapshot["scheduledGames"]):
                    print("All scheduled games final; watch complete.", flush=True)
                    return
            except (subprocess.CalledProcessError, OSError, ValueError, KeyError) as error:
                print(f"Snapshot failed; retrying in {args.interval_seconds}s: {error}",
                      file=sys.stderr, flush=True)
            time.sleep(args.interval_seconds)
    request_url = f"{args.dashboard}/schedule/nfl?date={args.date}"
    with urllib.request.urlopen(request_url, timeout=15) as response:
        schedule = json.load(response)
    if schedule.get("freshness") != "CURRENT" or schedule.get("warnings"):
        parser.error("scoreboard receipt is not current and warning-free")
    connection = sqlite3.connect(DATABASE.resolve().as_uri() + "?mode=ro", uri=True, timeout=5)
    try:
        holdout = halftime_holdout(connection)
        predictions = []
        results = []
        cache = {}
        for game in schedule.get("data", []):
            common = {
                "eventId": game.get("runnerEventId"),
                "away": game.get("awayAbbreviation"),
                "home": game.get("homeAbbreviation"),
                "awayScore": game.get("awayScore"),
                "homeScore": game.get("homeScore"),
                "status": game.get("status"),
                "statusDetail": game.get("statusDetail"),
            }
            if game.get("status") == "final":
                results.append(common)
                continue
            if game.get("status") != "in_progress":
                continue
            seconds_remaining = game_seconds_remaining(game)
            if seconds_remaining is None or not isinstance(game.get("homeScore"), int) or not isinstance(game.get("awayScore"), int):
                predictions.append({**common, "status": "suppressed", "reason": "invalid clock or score"})
                continue
            if seconds_remaining not in cache:
                cache[seconds_remaining] = nearest_states(connection, seconds_remaining, TRAIN_SEASONS)
            probability, count = analog_probability(cache[seconds_remaining], game["homeScore"] - game["awayScore"])
            predictions.append({
                **common,
                "status": "experimental" if probability is not None else "suppressed",
                "homeWinProbability": round(probability, 3) if probability is not None else None,
                "awayWinProbability": round(1 - probability, 3) if probability is not None else None,
                "analogGames": count,
                "secondsRemaining": seconds_remaining,
                "reason": None if probability is not None else "insufficient comparable historical games",
            })
        saved_predictions = earliest_saved_predictions(args.date)
        grades = []
        for result in results:
            prior = saved_predictions.get(result["eventId"])
            if prior and result["homeScore"] != result["awayScore"]:
                outcome = int(result["homeScore"] > result["awayScore"])
                grades.append({
                    "eventId": result["eventId"],
                    "homeWon": bool(outcome),
                    "firstHomeWinProbability": prior["homeWinProbability"],
                    "predictedAt": prior["predictedAt"],
                    "snapshot": prior["snapshot"],
                    "brier": round((prior["homeWinProbability"] - outcome) ** 2, 4),
                })
        report = {
            "model": MODEL,
            "classification": "EXPERIMENTAL_CALCULATION_NOT_PRODUCTION_MODEL",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "scoreboardReceiptAt": schedule.get("generatedAt"),
            "scoreboardSource": schedule.get("source"),
            "providerUpdatedAt": None,
            "date": args.date,
            "scheduledGames": len(schedule.get("data", [])),
            "finalGames": len(results),
            "method": f"One historical state per 2016-2024 game within {TIME_TOLERANCE_SECONDS}s of the live clock and {SCORE_TOLERANCE_POINTS} points of the home score margin; at least {MIN_ANALOG_GAMES} games; Laplace-smoothed home-win frequency.",
            "holdout": holdout,
            "limitations": ["No live possession, injuries, roster, weather, team strength, or market price", "No executable price or betting edge", "Scoreboard freshness is retrieval freshness, not ESPN update time", "Do not publish as a calibrated paid model"],
            "predictions": predictions,
            "finalResults": results,
            "gradedPredictions": len(grades),
            "grades": grades,
        }
        if args.write:
            REPORTS.mkdir(parents=True, exist_ok=True)
            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            target = REPORTS / f"{args.date}-nfl-analog-{stamp}.json"
            with target.open("x", encoding="utf-8") as output:
                json.dump(report, output, indent=2)
                output.write("\n")
            print(str(target))
        else:
            print(json.dumps(report, indent=2))
    finally:
        connection.close()


if __name__ == "__main__":
    main()
