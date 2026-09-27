import assert from "node:assert/strict";
import { buildRunnerEventId, NFL_TEAM_CODES, teamCode } from "../normalization/events/canonicalId.js";
import { baselineImpliedProbability } from "../models/probability/baseline.js";
import type { NormalizedMarket } from "../types.js";

assert.equal(teamCode("Dallas Cowboys"), "DAL");
for (const [name, code] of Object.entries(NFL_TEAM_CODES)) {
  const game = { sport: "NFL", startsAt: "2026-09-05T20:00:00Z", awayTeam: name, homeTeam: "Philadelphia Eagles" };
  assert.equal(buildRunnerEventId(game), buildRunnerEventId({ ...game, awayCode: code, homeCode: "PHI" }), "Odds API names and ESPN codes must join");
}
assert.throws(() => buildRunnerEventId({ sport: "NFL", startsAt: "2026-09-05", awayTeam: "Unknown Team", homeTeam: "Philadelphia Eagles" }), /Unmapped/);
assert.throws(() => buildRunnerEventId({ sport: "NFL", startsAt: "2026-09-05", awayTeam: "Dallas Cowboys", awayCode: "NYG", homeTeam: "Philadelphia Eagles" }), /Conflicting/);
assert.equal(buildRunnerEventId({ sport: "NFL", startsAt: "2026-09-05T20:00:00Z", awayTeam: "Dallas", homeTeam: "Philadelphia" }), "RUNNER:NFL:2026-09-05:DAL:PHI");
const market = { id: "m", yesPrice: 0.63, spread: 0.02, sourceTimestamp: new Date().toISOString() } as NormalizedMarket;
const prediction = baselineImpliedProbability(market);
assert.equal(prediction?.fairProbability, 0.63);
assert.ok((prediction?.confidenceScore ?? 0) > 0);
console.log("probability tests passed");
