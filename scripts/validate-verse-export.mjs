import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REQUIRED_ARTIFACTS = ["team_profiles.parquet", "game_baselines.parquet", "drive_baselines.parquet", "period_baselines.parquet", "game_state_baselines.parquet", "market_history.parquet"];

export function validateVerseExport(exportDir) {
  const manifestPath = join(exportDir, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error(`Verse export manifest missing: ${manifestPath}`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.schema_version !== "runner.verse-export.v1") throw new Error("unsupported Verse export schema version");
  if (manifest.validation?.status !== "passed") throw new Error("Verse export validation is not passed");
  for (const artifact of manifest.artifacts ?? []) {
    const path = join(exportDir, artifact.path);
    if (!existsSync(path)) throw new Error(`Verse artifact missing: ${artifact.path}`);
    const digest = createHash("sha256").update(readFileSync(path)).digest("hex");
    if (digest !== artifact.sha256) throw new Error(`Verse artifact checksum mismatch: ${artifact.path}`);
    if (!Number.isInteger(artifact.rows) || artifact.rows < 0) throw new Error(`invalid row count: ${artifact.path}`);
  }
  for (const requiredArtifact of REQUIRED_ARTIFACTS) if (!(manifest.artifacts ?? []).some((artifact) => artifact.path === requiredArtifact)) throw new Error(`required artifact missing from manifest: ${requiredArtifact}`);
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const exportDir = resolve(process.argv[2] ?? "../rsaa_verse/exports/runner_demon");
  const manifest = validateVerseExport(exportDir);
  console.log(JSON.stringify({ exportDir, schema_version: manifest.schema_version, feature_version: manifest.feature_version, seasons: manifest.seasons, artifacts: manifest.artifacts.length, validation: manifest.validation.status }));
}


