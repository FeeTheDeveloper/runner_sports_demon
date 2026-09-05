import assert from "node:assert/strict";
import { buildRunnerEventId, teamCode } from "../normalization/events/canonicalId.js";
import { baselineImpliedProbability } from "../models/probability/baseline.js";
import type { NormalizedMarket } from "../types.js";

assert.equal(teamCode("Dallas Cowboys"), "COW");
assert.equal(buildRunnerEventId({ sport: "NFL", startsAt: "2026-09-05T20:00:00Z", awayTeam: "Dallas", homeTeam: "Philadelphia" }), "RUNNER:NFL:2026-09-05:DAL:PHI");
const market = { id: "m", yesPrice: 0.63, spread: 0.02, sourceTimestamp: new Date().toISOString() } as NormalizedMarket;
const prediction = baselineImpliedProbability(market);
assert.equal(prediction?.fairProbability, 0.63);
assert.ok((prediction?.confidenceScore ?? 0) > 0);
console.log("probability tests passed");
