#!/usr/bin/env python3
"""Runner Sports NFL historical PBP acquisition.

Credit policy: local cache first; one network request per missing season; raw files are
immutable; every successful acquisition is hashed and appended to a JSONL manifest.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import requests

URL = "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{season}.parquet"
SOURCE_ID = "nflverse_pbp"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def append_manifest(manifest: Path, record: dict) -> None:
    manifest.parent.mkdir(parents=True, exist_ok=True)
    with manifest.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, sort_keys=True) + "\n")


def download(season: int, root: Path, force: bool = False) -> dict:
    target = root / "raw" / "nfl" / "play_by_play" / f"season={season}" / f"play_by_play_{season}.parquet"
    manifest = root / "manifests" / "ingestion.jsonl"
    target.parent.mkdir(parents=True, exist_ok=True)
    url = URL.format(season=season)

    if target.exists() and not force:
        return {"season": season, "status": "cached", "path": str(target), "sha256": sha256(target)}

    headers = {"User-Agent": "Runner-Sports-Analytics/1.0 historical-research"}
    with requests.get(url, headers=headers, stream=True, timeout=(15, 180)) as response:
        response.raise_for_status()
        fd, tmp_name = tempfile.mkstemp(prefix="rsa-nfl-", suffix=".parquet", dir=str(target.parent))
        os.close(fd)
        tmp = Path(tmp_name)
        try:
            with tmp.open("wb") as f:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        f.write(chunk)
            if tmp.stat().st_size == 0:
                raise RuntimeError(f"empty response for {season}")
            digest = sha256(tmp)
            tmp.replace(target)
        finally:
            if tmp.exists():
                tmp.unlink()

    record = {
        "source_id": SOURCE_ID,
        "source_name": "nflverse play-by-play",
        "source_url": url,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "sport": "NFL",
        "season": season,
        "dataset": "play_by_play",
        "path": str(target),
        "bytes": target.stat().st_size,
        "sha256": digest,
        "quality_status": "raw_acquired"
    }
    append_manifest(manifest, record)
    return {"season": season, "status": "downloaded", "path": str(target), "sha256": digest}


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--start", type=int, default=2006)
    p.add_argument("--end", type=int, default=2025)
    p.add_argument("--root", default="data")
    p.add_argument("--force", action="store_true")
    args = p.parse_args()
    if args.start > args.end:
        p.error("--start must be <= --end")
    root = Path(args.root)
    failures = 0
    for season in range(args.start, args.end + 1):
        try:
            result = download(season, root, args.force)
            print(json.dumps(result))
        except Exception as exc:
            failures += 1
            print(json.dumps({"season": season, "status": "failed", "error": str(exc)}), file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
