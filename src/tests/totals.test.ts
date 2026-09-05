import assert from "node:assert/strict";
import {
  advanceTotalsDecisionWindow,
  createTotalsDecisionWindow,
  decisionTimerSeconds,
  nextFootballSetPoint,
} from "../game-flow/totals.js";

const window = createTotalsDecisionWindow({
  runnerEventId: "RUNNER:NFL:2026-09-05:DAL:PHI",
  marketType: "GAME_TOTAL",
  selection: "OVER",
  marketLine: 42.5,
  runnerProjection: 45,
  confidence: 0.8,
  detectedAt: "2026-09-05T20:00:00.000Z",
});
assert.equal(window.status, "ACTIONABLE");
assert.equal(window.secondsRemaining, 30);
assert.equal(advanceTotalsDecisionWindow(window, "2026-09-05T20:00:31.000Z").status, "EXPIRED");
assert.equal(decisionTimerSeconds({ marketType: "HALFTIME_TOTAL" }), 120);
assert.equal(nextFootballSetPoint(4, 280).type, "Q4_3:00");
console.log("totals tests passed");
