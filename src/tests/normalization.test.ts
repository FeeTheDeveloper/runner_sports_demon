import assert from "node:assert/strict";
import { normalizePolymarketMarket, normalizeKalshiMarket } from "../normalization/markets/marketNormalizer.js";

const timing = { receivedTimestamp: "2026-09-05T00:00:01.000Z", latencyMs: 10 };
const kalshi = normalizeKalshiMarket({ event_ticker: "KXNBA", category: "Sports", title: "NBA" }, { ticker: "KXNBA-GAME", title: "Lakers win", yes_bid: 55, yes_ask: 57, last_price: 56, status: "active" }, timing);
assert.equal(kalshi.id, "kalshi:KXNBA-GAME");
assert.equal(kalshi.yesPrice, 0.56);
assert.ok(Math.abs((kalshi.spread ?? 0) - 0.02) < 0.000001);

const poly = normalizePolymarketMarket({ id: "1", question: "Will Dallas win?", outcomes: '["Yes","No"]', outcomePrices: '["0.42","0.58"]', acceptingOrders: true }, timing);
assert.equal(poly.id, "polymarket:1");
assert.equal(poly.yesPrice, 0.42);
assert.equal(poly.marketStatus, "open");
console.log("normalization tests passed");
