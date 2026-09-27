import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = new URL("../../", import.meta.url);
const ajv = new Ajv2020({ allErrors: true });
addFormats.default(ajv);
const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, root), "utf8"));
ajv.addSchema(read("contracts/runner-data-contract.json") as object);
ajv.addSchema(read("contracts/runner-content-card.schema.json") as object);
const validTimestamp = ajv.compile({ type: "string", format: "date-time" });

export type Freshness = "LIVE" | "CURRENT" | "RECENT" | "HISTORICAL" | "FIXTURE" | "UNKNOWN";
export interface Artifact {
  schemaVersion: "runner.data.v1";
  artifactId: string;
  kind: "schedule" | "market" | "observation" | "model" | "content" | "manifest";
  runnerEventId: string; sport: string; league: string; source: string; provider: string;
  retrievedAt: string; eventStartTime: string | null; transformVersion: string;
  freshness: Freshness; confidence: string; redistribution: string;
  intelligence: { classification: string; modelProbability: number | null; marketProbability: number | null; fairPrice: number | null; executablePrice: number | null; edge: number | null; modelEvidence?: Record<string, string> };
  payload: Record<string, unknown>;
}

export const sectionNames = ["Current State", "Verified Evidence", "Runner Analysis", "Market Comparison", "Countercase / Invalidation", "Confidence / Uncertainty", "Source Freshness", "Next Action"] as const;
export const cardTypes = ["pregame", "halftime", "game-total", "team-total", "rushing-prop", "receiving-prop", "countercase", "final-recap", "live-desk", "schedule"] as const;
export type CardType = typeof cardTypes[number];
const requiredEvidence: Record<CardType, string> = {
  pregame: "Verify kickoff, injuries, lineups, weather, opening/current prices, contract rules and pregame baseline.",
  halftime: "Verify halftime score, drives, pace, possession, injuries, second-half receiver and fresh market quotes; compare with the pregame baseline.",
  "game-total": "Verify combined score, clock, drives, points per drive, remaining-possession assumptions and game-total line/price.",
  "team-total": "Verify the selected team, points, possessions, opponent defense, remaining drives and team-total line/price.",
  "rushing-prop": "Verify player identity, availability, snap share, carries, rushing yards, role changes and timestamped rushing prop line/price.",
  "receiving-prop": "Verify player identity, availability, routes, targets, receptions, receiving yards and timestamped receiving prop line/price.",
  countercase: "Record the thesis, contradictory evidence, invalidation threshold, source expiry and next reassessment trigger.",
  "final-recap": "Verify final result and settlement, preserve the original forecast/price, record corrections and calibration inputs; do not invent a prior prediction.",
  "live-desk": "Verify score, period, clock, possession, latest event, regime changes and market response; identify the next reassessment trigger.",
  schedule: "Verify provider event ID, canonical mapping, league, teams, kickoff/time zone, venue and event status.",
};
export interface ContentCard { schemaVersion: "runner.content-card.v1"; cardType: CardType; artifact: Artifact; sections: Record<typeof sectionNames[number], string>; }

/** Receipt age is not proof of a live feed. Historical/fixture labels never upgrade. */
export function freshnessAt(timestamp: unknown, declared?: Freshness, now = Date.now(), currentMs = 90_000): Freshness {
  if (declared === "FIXTURE" || declared === "HISTORICAL" || declared === "UNKNOWN") return declared;
  const time = typeof timestamp === "string" && validTimestamp(timestamp) ? Date.parse(timestamp) : NaN;
  if (!Number.isFinite(time) || time > now) return "UNKNOWN";
  const age = now - time;
  if (age <= currentMs) return declared === "LIVE" ? "LIVE" : "CURRENT";
  return age <= 86_400_000 ? "RECENT" : "HISTORICAL";
}

export function validateArtifact(value: unknown): asserts value is Artifact {
  if (!ajv.validate("runner.data.v1", value)) throw new Error("invalid_runner_artifact");
}
export function validateCard(value: unknown): asserts value is ContentCard {
  if (!ajv.validate("runner.content-card.v1", value)) throw new Error("invalid_runner_content_card");
}

export function readArtifacts(): Artifact[] {
  const value = read("data/fixtures/operations.json");
  if (!Array.isArray(value) || value.length > 1000) throw new Error("invalid_artifact_collection");
  for (const row of value) validateArtifact(row);
  return value.map(row => ({ ...row, freshness: freshnessAt(row.retrievedAt, row.freshness) }));
}

export function makeCard(artifact: Artifact, cardType: CardType): ContentCard {
  validateArtifact(artifact);
  const freshness = freshnessAt(artifact.retrievedAt, artifact.freshness);
  const card: ContentCard = {
    schemaVersion: "runner.content-card.v1", cardType,
    artifact: { ...artifact, kind: "content", freshness },
    sections: {
      "Current State": `${artifact.sport} ${cardType} shell; ${freshness}.`,
      "Verified Evidence": `${artifact.source} Event: ${artifact.runnerEventId}.`,
      "Runner Analysis": "UNKNOWN. Complete this shell only after reviewing verified event evidence. No proprietary model result is asserted.",
      "Market Comparison": "Model probability, market probability, fair price, executable price and edge are distinct fields. Null means UNKNOWN; verify price, timestamp, fees and liquidity before comparison.",
      "Countercase / Invalidation": "Invalidate after a material injury, lineup, weather, score, pace or market change, conflicting sources, or expired evidence.",
      "Confidence / Uncertainty": `${artifact.confidence}; incomplete inputs suppress conclusions.`,
      "Source Freshness": `${freshness}; receipt/authorship ${artifact.retrievedAt}; provider ${artifact.provider}; transform ${artifact.transformVersion}.`,
      "Next Action": `${requiredEvidence[cardType]} Resolve missing fields, then request editorial review before publication.`,
    },
  };
  validateCard(card);
  return card;
}

export function readContent(): ContentCard[] {
  const value = read("data/content/cards.json");
  if (!Array.isArray(value) || value.length > 1000) throw new Error("invalid_content_collection");
  for (const card of value) validateCard(card);
  return value.filter(card => card.artifact.redistribution === "PUBLIC").map(card => {
    const freshness = freshnessAt(card.artifact.retrievedAt, card.artifact.freshness);
    return { ...card, artifact: { ...card.artifact, freshness }, sections: { ...card.sections,
      "Current State": freshness === card.artifact.freshness ? card.sections["Current State"] : `${card.artifact.sport} ${card.cardType}; ${freshness}. Stored narrative requires revalidation.`,
      "Source Freshness": `${freshness}; original receipt ${card.artifact.retrievedAt}.` } };
  });
}

export function metadata(source: string, timestamps: unknown[], currentMs = 90_000) {
  const classifications = timestamps.map(t => freshnessAt(t, undefined, Date.now(), currentMs));
  const freshness = !classifications.length || classifications.includes("UNKNOWN") ? "UNKNOWN"
    : classifications.includes("HISTORICAL") ? "HISTORICAL" : classifications.includes("RECENT") ? "RECENT" : "CURRENT";
  return { generatedAt: new Date().toISOString(), source, freshness, currentLimitSeconds: currentMs / 1000,
    warnings: freshness === "CURRENT" ? [] : ["Data is missing or stale; do not present it as live."] };
}

export const operationsRoot = fileURLToPath(root);
