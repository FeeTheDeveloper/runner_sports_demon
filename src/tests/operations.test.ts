import assert from "node:assert/strict";
import { cardTypes, freshnessAt, makeCard, metadata, readArtifacts, readContent, validateArtifact, validateCard } from "../operations/data.js";
import { fetchJson } from "../utils/http.js";

const now = Date.parse("2026-09-26T18:00:00Z");
assert.equal(freshnessAt("2026-09-19T18:00:00Z", undefined, now), "HISTORICAL");
assert.equal(freshnessAt("2026-09-26T17:59:00Z", undefined, now), "CURRENT");
assert.equal(freshnessAt("2026-09-26T17:58:29Z", undefined, now), "RECENT");
assert.equal(freshnessAt("2026-09-27T18:00:00Z", undefined, now), "UNKNOWN");
assert.equal(freshnessAt("not-a-date", undefined, now), "UNKNOWN");
assert.equal(freshnessAt("2026-02-30T18:00:00Z", undefined, now), "UNKNOWN");
assert.equal(freshnessAt("2026-09-26T17:59:59Z", "FIXTURE", now), "FIXTURE");
assert.equal(freshnessAt("2026-09-26T17:59:59Z", "HISTORICAL", now), "HISTORICAL");
assert.equal(freshnessAt("2026-09-26T17:59:59Z", "UNKNOWN", now), "UNKNOWN");
assert.equal(metadata("empty", []).freshness, "UNKNOWN");

const artifact = readArtifacts()[0];
assert.throws(() => validateArtifact({ ...artifact, retrievedAt: "2026-02-30T18:00:00Z" }));
assert.throws(() => validateArtifact({ ...artifact, raw: { secret: "synthetic" } }));
assert.throws(() => validateArtifact({ ...artifact, intelligence: { ...artifact.intelligence, modelProbability: 0.9 } }));
assert.throws(() => validateArtifact({ ...artifact, intelligence: { ...artifact.intelligence, classification: "MODEL_OUTPUT" } }));
assert.throws(() => validateArtifact({ ...artifact, intelligence: { ...artifact.intelligence, marketProbability: 2 } }));
const card = makeCard(artifact, "pregame");
validateCard(card);
assert.throws(() => validateCard({ ...card, sections: { "Current State": "Incomplete" } }));
const cards = readContent();
assert.equal(cards.length, 20);
for (const sport of ["NFL", "NCAAF"]) for (const kind of cardTypes) {
  const card = cards.find(c => c.artifact.sport === sport && c.cardType === kind);
  assert.ok(card);
  assert.equal(card.artifact.freshness, "FIXTURE");
  assert.equal(card.artifact.intelligence.modelProbability, null);
  assert.equal(card.artifact.intelligence.edge, null);
}
console.log("operations artifact and freshness tests passed");
const savedFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => new Response("SYNTHETIC_PRIVATE_PROVIDER_BODY", { status: 403 });
  await assert.rejects(fetchJson(new URL("https://provider.example.invalid"), {}, 0), error => {
    assert.ok(error instanceof Error);
    assert.equal(error.message, "Provider HTTP 403");
    assert.ok(!error.message.includes("SYNTHETIC_PRIVATE_PROVIDER_BODY"));
    return true;
  });
  globalThis.fetch = async () => new Response("SYNTHETIC_PRIVATE_PROVIDER_BODY", { status: 200 });
  await assert.rejects(fetchJson(new URL("https://provider.example.invalid"), {}, 0), /Provider returned invalid JSON/);
} finally { globalThis.fetch = savedFetch; }
