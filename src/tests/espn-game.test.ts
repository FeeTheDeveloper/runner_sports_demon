import assert from "node:assert/strict";
import { espnScoreboardEvents, normalizeEspnGame } from "../normalization/games/espn.js";
import { GameStateCache } from "../state/game-state/cache.js";
import { EspnCfbConnector } from "../connectors/espn/client.js";

const event = {
  id: "401000001", date: "2026-09-12T19:30:00Z",
  status: { period: 2, displayClock: "04:21", type: { state: "in", detail: "4:21 - 2nd Quarter", completed: false } },
  competitions: [{ venue: { fullName: "Runner Field" }, situation: { possession: "2", down: 3, distance: 7, yardLine: 42, shortDownDistanceText: "3rd & 7" }, competitors: [
    { id: "1", homeAway: "home", score: "14", curatedRank: { current: 8 }, team: { id: "1", displayName: "USC Trojans", abbreviation: "USC" } },
    { id: "2", homeAway: "away", score: "10", curatedRank: { current: 99 }, team: { id: "2", displayName: "LSU Tigers", abbreviation: "LSU" } },
  ] }],
};
const summary = { boxscore: { teams: [
  { team: { id: "1" }, statistics: [{ name: "totalYards", displayValue: "220" }] },
  { team: { id: "2" }, statistics: [{ name: "totalYards", displayValue: "180" }] },
] }, plays: [{ id: "p1", sequenceNumber: "12", text: "Rush for 8 yards", scoringPlay: false, period: { number: 2 }, clock: { displayValue: "4:21" }, team: { id: "2" } }] };
assert.equal(espnScoreboardEvents({ events: [event] }).length, 1);
const game = normalizeEspnGame(event, { receivedTimestamp: "2026-09-12T19:00:01.000Z" }, summary);
assert.equal(game.runnerEventId, "RUNNER:CFB:2026-09-12:LSU:USC");
assert.equal(game.status, "IN_PROGRESS");
assert.equal(game.home.score, 14);
assert.equal(game.away.rank, undefined);
assert.equal(game.possession, "AWAY");
assert.equal(game.clockSecondsRemaining, 261);
assert.equal(game.stats?.home?.totalYards, "220");
assert.equal(game.plays?.[0].team, "AWAY");
assert.equal(game.sourceTimestampEstimated, true);
const cache = new GameStateCache(); cache.upsert(game);
assert.equal(cache.live().length, 1);
assert.equal(cache.schedule({ date: "2026-09-12", ranked: true }).length, 1);
assert.equal(cache.schedule({ date: "2026-09-13" }).length, 0);
const originalFetch = globalThis.fetch;
const requested: URL[] = [];
globalThis.fetch = (async (input: string | URL) => {
  const url = new URL(input.toString()); requested.push(url);
  return new Response(JSON.stringify(url.pathname.endsWith("/summary") ? summary : { events: [event] }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;
const connector = new EspnCfbConnector();
const discovered = await connector.fetchSchedule("2026-09-12");
assert.equal(discovered.games.length, 1);
assert.ok(requested.some((url) => url.pathname.endsWith("/scoreboard") && url.searchParams.get("dates") === "20260912"));
assert.ok(requested.some((url) => url.pathname.endsWith("/summary") && url.searchParams.get("event") === "401000001"));
assert.equal(connector.health().status, "CONNECTED");
globalThis.fetch = originalFetch;
console.log("ESPN game discovery and normalization tests passed");
