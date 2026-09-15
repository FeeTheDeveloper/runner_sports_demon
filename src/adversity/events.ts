import type { AdversityEvent, EventPolarity, ObservationSource } from "../types.js";

const sources: ObservationSource[] = ["GAME_FEED", "YOUTUBE_TV_OBSERVATION", "HUMAN_ANALYST", "CLAUDE_RESEARCH", "RUNNER_AI", "VERIFIED_NEWS"];

export function validateAdversityEvent(input: unknown): AdversityEvent {
  if (!input || typeof input !== "object") throw new Error("adversity event must be an object");
  const value = input as Record<string, unknown>;
  const requiredStrings = ["id", "runnerEventId", "eventType", "sourceTimestamp", "receivedTimestamp", "processedTimestamp", "causality"];
  for (const field of requiredStrings) if (typeof value[field] !== "string" || value[field].length === 0) throw new Error(`${field} is required`);
  if (value.sport !== "NFL") throw new Error("sport must be NFL");
  if (!sources.includes(value.source as ObservationSource)) throw new Error("unsupported adversity source");
  if (!isUnitInterval(value.severity) || !isUnitInterval(value.confidence)) throw new Error("severity and confidence must be between 0 and 1");
  const polarity = value.polarity;
  if (!isPolarity(polarity)) throw new Error("invalid adversity polarity");
  if (!isCausality(value.causality)) throw new Error("invalid adversity causality");
  return value as unknown as AdversityEvent;
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isPolarity(value: unknown): value is EventPolarity {
  return value === "ADVERSE" || value === "POSITIVE" || value === "NEUTRAL" || value === "UNKNOWN";
}

function isCausality(value: unknown): value is AdversityEvent["causality"] {
  return value === "SUPPORTED" || value === "UNKNOWN" || value === "CONTESTED";
}