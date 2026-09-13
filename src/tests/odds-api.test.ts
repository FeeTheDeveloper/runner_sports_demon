import assert from "node:assert/strict";
import { normalizeOddsApiEvent } from "../normalization/markets/oddsApi.js";
import { OddsApiCfbConnector } from "../connectors/odds-api/client.js";
const event = { id: "odds-1", home_team: "USC Trojans", away_team: "LSU Tigers", bookmakers: [{ key: "book", title: "Example Book", last_update: "2026-09-12T19:00:00Z", markets: [
  { key: "h2h", outcomes: [{ name: "USC Trojans", price: -130 }, { name: "LSU Tigers", price: 110 }] },
  { key: "spreads", outcomes: [{ name: "USC Trojans", price: -110, point: -3.5 }] },
  { key: "totals", outcomes: [{ name: "Over", price: -105, point: 51.5 }, { name: "Under", price: -115, point: 51.5 }] },
  { key: "player_pass_tds", outcomes: [{ name: "Over", description: "QB One", price: 120, point: 2.5 }] },
] }] };
const rows = normalizeOddsApiEvent(event, { receivedTimestamp: "2026-09-12T19:00:01Z" }, "RUNNER:CFB:2026-09-12:LSU:USC");
assert.equal(rows.length, 6);
assert.equal(rows.find((row) => row.marketKind === "MONEYLINE")?.teamSide, "HOME");
assert.equal(rows.find((row) => row.marketKind === "SPREAD")?.line, -3.5);
assert.equal(rows.find((row) => row.marketKind === "PROP")?.participant, "QB One");
assert.ok(rows.every((row) => row.executable));
assert.ok(rows.every((row) => row.sourceTimestamp === "2026-09-12T19:00:00Z"));
const disabledConnector = new OddsApiCfbConnector();
await assert.rejects(() => disabledConnector.fetchMarkets(() => undefined), /ODDS_API_KEY/);
assert.equal(disabledConnector.health().status, "DISABLED");
process.env.ODDS_API_KEY = "test-key-not-secret";
const originalFetch = globalThis.fetch;
let requested: URL | undefined;
globalThis.fetch = (async (input: string | URL) => {
  requested = new URL(input.toString());
  return new Response(JSON.stringify([event]), { status: 200, headers: { "x-requests-remaining": "99", "x-requests-used": "1" } });
}) as typeof fetch;
const connector = new OddsApiCfbConnector();
const fetched = await connector.fetchMarkets(() => "RUNNER:CFB:2026-09-12:LSU:USC");
assert.equal(fetched.markets.length, 6);
assert.equal(requested?.pathname, "/v4/sports/americanfootball_ncaaf/odds");
assert.equal(requested?.searchParams.get("markets"), "h2h,spreads,totals");
assert.equal(connector.health().rateLimitRemaining, 99);
assert.equal(connector.health().status, "CONNECTED");
delete process.env.ODDS_API_KEY;
globalThis.fetch = originalFetch;
console.log("Odds API normalization tests passed");
