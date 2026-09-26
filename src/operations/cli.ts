import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { cardTypes, makeCard, operationsRoot, readArtifacts, readContent, validateArtifact } from "./data.js";

const command = process.argv[2] ?? "validate";
const paths = ["data/fixtures/operations.json", "data/normalized/operations.json", "data/snapshots/historical-state.json", "data/content/cards.json", "data/content/cards.md"];
if (command === "content") {
  const cards = readArtifacts().filter(row => row.kind === "schedule" && row.redistribution === "PUBLIC")
    .flatMap(row => cardTypes.map(type => makeCard(row, type)));
  mkdirSync(join(operationsRoot, "data/content"), { recursive: true });
  writeFileSync(join(operationsRoot, "data/content/cards.json"), JSON.stringify(cards, null, 2) + "\n");
  writeFileSync(join(operationsRoot, "data/content/cards.md"), cards.map(card => `# ${card.artifact.sport}: ${card.cardType}\n\n` + Object.entries(card.sections).map(([title, text]) => `## ${title}\n\n${text}\n`).join("\n")).join("\n"));
  const artifact = { ...readArtifacts()[0], artifactId: "operations-manifest", kind: "manifest",
    runnerEventId: "AGGREGATE:OPERATIONS", sport: "MULTI", league: "MULTI", provider: "runner",
    source: "Repository artifact inventory; each member carries its own source and receipt.", freshness: "UNKNOWN", redistribution: "INTERNAL",
    payload: { note: "Inventory of synthetic examples and a historical local-state summary. Hashes attest to file integrity, not provider truth." } };
  writeFileSync(join(operationsRoot, "data/manifests/operations.json"), JSON.stringify({ artifact, files: paths.map(path => ({ path, sha256: createHash("sha256").update(readFileSync(join(operationsRoot, path))).digest("hex") })) }, null, 2) + "\n");
  console.log(`Generated ${cards.length} explicitly labelled content shells.`);
} else if (command === "validate-file") {
  if (!process.argv[3]) throw new Error("Usage: operations validate-file <normalized-json-array>");
  const rows: unknown = JSON.parse(readFileSync(process.argv[3], "utf8"));
  if (!Array.isArray(rows) || rows.length > 1000) throw new Error("invalid_artifact_collection");
  rows.forEach(validateArtifact);
  console.log(`Validated ${rows.length} artifacts; no import or publication performed.`);
} else if (command !== "validate") {
  throw new Error("Usage: operations validate | content | validate-file <normalized-json-array>");
}
const artifacts = readArtifacts();
const cards = readContent();
const manifest = JSON.parse(readFileSync(join(operationsRoot, "data/manifests/operations.json"), "utf8"));
validateArtifact(manifest.artifact);
if (JSON.stringify(manifest.files.map((entry: { path: string }) => entry.path).sort()) !== JSON.stringify([...paths].sort())) throw new Error("incomplete_manifest");
for (const path of ["data/normalized/operations.json", "data/snapshots/historical-state.json"]) {
  const rows = JSON.parse(readFileSync(join(operationsRoot, path), "utf8"));
  if (!Array.isArray(rows)) throw new Error("invalid_artifact_collection");
  rows.forEach(validateArtifact);
}
for (const entry of manifest.files) {
  if (!/^data\/(fixtures|normalized|content|snapshots)\/[a-zA-Z0-9._-]+$/.test(entry.path)) throw new Error("invalid_manifest_path");
  const bytes = readFileSync(join(operationsRoot, entry.path));
  if (createHash("sha256").update(bytes).digest("hex") !== entry.sha256) throw new Error(`Artifact checksum mismatch: ${entry.path}`);
}
console.log(`Validated ${artifacts.length} data artifacts, ${cards.length} content cards and ${manifest.files.length} checksums.`);
const history = readFileSync(join(operationsRoot, "data/manifests/ingestion.jsonl"), "utf8").trim().split(/\r?\n/).map(line => JSON.parse(line));
for (const row of history) {
  const path = String(row.path).replaceAll("\\", "/");
  if (!/^data\/raw\/nfl\/play_by_play\/season=\d{4}\/play_by_play_\d{4}\.parquet$/.test(path)) throw new Error("invalid_history_path");
  if (row.freshness !== "HISTORICAL" || row.league !== "NFL" || !row.provider || !row.source || !row.runnerEventId || !row.transformVersion || !row.redistribution || !Number.isFinite(Date.parse(row.retrievedAt))) throw new Error("incomplete_history_provenance");
  const hash = createHash("sha256").update(readFileSync(join(operationsRoot, path))).digest("hex");
  if (hash !== row.sha256) throw new Error(`Historical checksum mismatch: ${path}`);
}
console.log(`Verified provenance and original SHA-256 checksums for ${history.length} historical season files.`);
