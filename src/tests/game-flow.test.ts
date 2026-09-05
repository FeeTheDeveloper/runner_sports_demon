import assert from "node:assert/strict";
import { analyzeGameFlow, validateGameFlowObservation } from "../game-flow/engine.js";
import type { GameFlowObservation } from "../types.js";

const observation = (overrides: Partial<GameFlowObservation> = {}): GameFlowObservation => ({
  id: "obs-1",
  runnerEventId: "RUNNER:NFL:2026-09-05:DAL:PHI",
  source: "GAME_FEED",
  observedAt: "2026-09-05T20:00:00.000Z",
  receivedAt: "2026-09-05T20:00:01.000Z",
  confidence: 0.95,
  homeScore: 7,
  awayScore: 3,
  period: 1,
  clockSecondsRemaining: 600,
  possessionDominance: 0.7,
  pressure: 0.5,
  efficiency: 0.6,
  structuralControl: 0.6,
  ...overrides,
});

validateGameFlowObservation(observation());
const snapshot = analyzeGameFlow([
  observation(),
  observation({
    id: "obs-2",
    observedAt: "2026-09-05T20:05:00.000Z",
    receivedAt: "2026-09-05T20:05:01.000Z",
    homeScore: 12,
    awayScore: 3,
    possessionDominance: -0.7,
    pressure: -0.5,
    efficiency: -0.6,
    structuralControl: -0.6,
    latentStates: ["SCHEME_SHIFT"],
  }),
]);
assert.equal(snapshot?.regime, "COMEBACK_WINDOW");
assert.equal(snapshot?.momentumDirection, "REVERSING");
assert.deepEqual(snapshot?.latentStates, ["SCHEME_SHIFT"]);
assert.equal(snapshot?.totals.currentScoreTotal, 15);
assert.equal(snapshot?.totals.scoringPaceDirection, "RISING");
assert.throws(() => validateGameFlowObservation(observation({ confidence: 2 })), /confidence/);
console.log("game flow tests passed");
