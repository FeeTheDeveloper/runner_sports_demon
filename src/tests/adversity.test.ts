import assert from "node:assert/strict";
import { alignAdversityEvent } from "../adversity/market-alignment.js";
import { validateAdversityEvent } from "../adversity/events.js";
import type { SportsbookMarketSnapshot } from "../types.js";

const event = validateAdversityEvent({
  id: "a3-1",
  runnerEventId: "RUNNER:NFL:2026-09-05:DAL:PHI",
  sport: "NFL",
  eventType: "PLAYER_INJURY",
  polarity: "ADVERSE",
  affectedTeam: "DAL",
  severity: 0.9,
  source: "HUMAN_ANALYST",
  sourceTimestamp: "2026-09-05T20:20:00.000Z",
  receivedTimestamp: "2026-09-05T20:20:02.000Z",
  processedTimestamp: "2026-09-05T20:20:02.100Z",
  confidence: 0.8,
  causality: "UNKNOWN",
  raw: { note: "quarterback left field" },
});

const snapshots: SportsbookMarketSnapshot[] = [
  {
    id: "s1", runnerEventId: event.runnerEventId, provider: "odds_api", sportsbook: "book-a", marketId: "spread",
    marketType: "SPREAD", selection: "DAL", teamId: "DAL", line: -3, americanOdds: -110,
    sourceTimestamp: event.sourceTimestamp, receivedTimestamp: event.receivedTimestamp, processedTimestamp: event.processedTimestamp,
    status: "open", dataQuality: "M3", raw: {},
  },
  {
    id: "s2", runnerEventId: event.runnerEventId, provider: "odds_api", sportsbook: "book-a", marketId: "total",
    marketType: "TOTAL", selection: "OVER", line: 47.5, americanOdds: -110,
    sourceTimestamp: event.sourceTimestamp, receivedTimestamp: event.receivedTimestamp, processedTimestamp: event.processedTimestamp,
    status: "open", dataQuality: "M3", raw: {},
  },
];

const alignments = alignAdversityEvent(event, snapshots);
assert.equal(alignments.length, 2);
assert.equal(alignments[0].impactClass, "DIRECT");
assert.equal(alignments[1].impactClass, "INDIRECT");
assert.equal(alignments[0].causality, "UNKNOWN");
assert.throws(() => validateAdversityEvent({ ...event, severity: 2 }));
console.log("adversity tests passed");