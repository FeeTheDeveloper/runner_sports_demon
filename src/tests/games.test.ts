import assert from "node:assert/strict";
import { EspnCfbScheduleClient, EspnNflScheduleClient, mapEspnStatus, normalizeEspnNflScoreboard, normalizeEspnScoreboard } from "../games/discovery/espn.js";

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

const nflGames = normalizeEspnNflScoreboard({
  events: [{
    id: "401772777",
    date: "2026-09-13T17:00:00Z",
    competitions: [{
      venue: { fullName: "Example Stadium" },
      competitors: [
        { homeAway: "away", team: { displayName: "Dallas Cowboys", abbreviation: "DAL" }, score: "0" },
        { homeAway: "home", team: { displayName: "New York Giants", abbreviation: "NYG" }, score: "0" },
      ],
      status: { type: { state: "scheduled", detail: "1:00 PM EDT" }, period: 0, displayClock: "0:00" },
    }],
  }],
}, "2026-09-13T12:00:00Z", "2026-09-13T12:00:01Z");

assert.equal(nflGames.length, 1);
assert.equal(nflGames[0].runnerEventId, "RUNNER:NFL:2026-09-13:DAL:NYG");
assert.equal(nflGames[0].sport, "NFL");
assert.equal(nflGames[0].league, "NFL");
assert.equal(nflGames[0].awayRank, undefined);
assert.equal(nflGames[0].status, "scheduled");
assert.equal(mapEspnStatus("post"), "final");
assert.equal(mapEspnStatus("pre"), "scheduled");
assert.equal(mapEspnStatus("unknown"), "unknown");
assert.equal(new URL((new EspnCfbScheduleClient() as unknown as { baseUrl: string }).baseUrl).pathname, "/apis/site/v2/sports/football/college-football/scoreboard");
assert.equal(new URL((new EspnNflScheduleClient() as unknown as { baseUrl: string }).baseUrl).pathname, "/apis/site/v2/sports/football/nfl/scoreboard");
console.log("games tests passed");
