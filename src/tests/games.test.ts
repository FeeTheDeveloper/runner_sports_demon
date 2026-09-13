import assert from "node:assert/strict";
import { mapEspnStatus, normalizeEspnScoreboard } from "../games/discovery/espn.js";

const games = normalizeEspnScoreboard({
  events: [{
    id: "401752999",
    date: "2026-09-12T19:30:00Z",
    competitions: [{
      venue: { fullName: "Darrell K Royal-Texas Memorial Stadium" },
      competitors: [
        { homeAway: "away", team: { displayName: "Ohio State Buckeyes", abbreviation: "OSU" }, curatedRank: { current: 1 }, score: "10" },
        { homeAway: "home", team: { displayName: "Texas Longhorns", abbreviation: "TEX" }, curatedRank: { current: 3 }, score: "7" },
      ],
      status: { type: { state: "in", detail: "2nd Quarter" }, period: 2, displayClock: "08:41" },
      situation: { possession: "TEX" },
    }],
  }, { id: "incomplete", competitions: [{ competitors: [] }] }],
}, "2026-09-12T19:30:02Z", "2026-09-12T19:30:03Z");

assert.equal(games.length, 1);
assert.equal(games[0].runnerEventId, "RUNNER:CFB:2026-09-12:OSU:TEX");
assert.equal(games[0].status, "in_progress");
assert.equal(games[0].awayRank, 1);
assert.equal(games[0].homeRank, 3);
assert.equal(games[0].possession, "HOME");
assert.equal(games[0].awayScore, 10);
assert.equal(games[0].homeScore, 7);
assert.equal(mapEspnStatus("post"), "final");
assert.equal(mapEspnStatus("unknown"), "unknown");
console.log("games tests passed");