import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Guards the Verse historical-baseline pipeline added in DATA_SCHEMA.md: schema
// tables, npm script wiring, and script files must all stay in sync.
const schema = readFileSync(resolve(process.cwd(), "src/storage/schema.sql"), "utf8");
const requiredTables = [
  "historical_seasons",
  "historical_team_profiles",
  "historical_games",
  "historical_market_history",
  "historical_drives",
  "historical_periods",
  "historical_game_state_samples",
];
for (const table of requiredTables) {
  assert.ok(schema.includes(`create table if not exists ${table}`), `schema.sql missing table ${table}`);
}
assert.ok(schema.includes("historical_games_season_idx"), "schema.sql missing historical season index");

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));
assert.equal(pkg.scripts["verse:load-history"], "node scripts/load-verse-history.mjs");
assert.equal(pkg.scripts["verse:validate-export"], "node scripts/validate-verse-export.mjs");

for (const file of ["scripts/load-verse-history.mjs", "scripts/verse_history_to_csv.py", "scripts/validate-verse-export.mjs"]) {
  assert.ok(existsSync(resolve(process.cwd(), file)), `missing ${file}`);
}

const { validateVerseExport } = await import(resolve(process.cwd(), "scripts/validate-verse-export.mjs").replace(/\\/g, "/").replace(/^([a-zA-Z]:)/, "file:///$1"));
assert.equal(typeof validateVerseExport, "function");
assert.throws(() => validateVerseExport(resolve(process.cwd(), "does-not-exist-dir")), /manifest missing/);

console.log("historical schema tests passed");
