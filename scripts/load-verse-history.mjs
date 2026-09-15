import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { validateVerseExport } from "./validate-verse-export.mjs";

// Loads validated rsaa_verse historical exports (see dev/export_runner_demon.py)
// into Demon's local SQLite store as historical_* baseline tables. Idempotent:
// reloading a season deletes and replaces that season's rows.
const DB_PATH = resolve(process.env.RUNNER_SCOUT_DB ?? ".runner-scout.db");
const VERSE_ROOT = resolve(process.env.RUNNER_VERSE_ROOT ?? "../rsaa_verse");
const TABLES = ["historical_team_profiles", "historical_games", "historical_market_history", "historical_drives", "historical_periods", "historical_game_state_samples"];

function exportDirFor(season) {
  const defaultDir = join(VERSE_ROOT, "exports", "runner_demon");
  const seasonDir = join(VERSE_ROOT, "exports", `runner_demon_${season}`);
  if (existsSync(join(seasonDir, "manifest.json"))) return seasonDir;
  if (existsSync(join(defaultDir, "manifest.json"))) {
    const manifest = JSON.parse(readFileSync(join(defaultDir, "manifest.json"), "utf8"));
    if ((manifest.seasons ?? []).includes(season)) return defaultDir;
  }
  throw new Error(`no Verse export found for season ${season} (looked in ${seasonDir} and ${defaultDir})`);
}

function sqlite(sql) {
  execFileSync("sqlite3", [DB_PATH], { input: sql, maxBuffer: 500 * 1024 * 1024 });
}

function loadSeason(season) {
  const exportDir = exportDirFor(season);
  const manifest = validateVerseExport(exportDir);

  const csvDir = mkdtempSync(join(tmpdir(), "runner-verse-history-"));
  try {
    execFileSync("py", ["scripts/verse_history_to_csv.py", "--export-dir", exportDir, "--season", String(season), "--out-dir", csvDir], { stdio: "inherit" });

    const statements = [`delete from historical_seasons where season = ${season};`];
    for (const table of TABLES) statements.push(`delete from ${table} where season = ${season};`);
    sqlite(statements.join("\n"));

    for (const table of TABLES) {
      const csvPath = join(csvDir, `${table}.csv`).replaceAll("\\", "/");
      sqlite([".mode csv", `.import --skip 1 '${csvPath}' ${table}`].join("\n"));
    }

    sqlite(`insert into historical_seasons(season, source_export, feature_version, loaded_at, validation_status)
      values (${season}, '${exportDir.replaceAll("'", "''")}', '${manifest.feature_version}', '${new Date().toISOString()}', '${manifest.validation.status}');`);

    return { season, exportDir, status: "loaded" };
  } finally {
    rmSync(csvDir, { recursive: true, force: true });
  }
}

const requestedSeasons = process.argv.slice(2).map(Number).filter(Number.isInteger);
if (requestedSeasons.length === 0) {
  console.error("usage: node scripts/load-verse-history.mjs <season> [season...]");
  process.exit(1);
}

const results = requestedSeasons.map((season) => {
  try {
    return loadSeason(season);
  } catch (error) {
    return { season, status: "failed", error: error instanceof Error ? error.message : String(error) };
  }
});
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.status === "failed")) process.exit(1);
