import assert from "node:assert/strict";
import { KalshiConnector } from "../connectors/kalshi/client.js";

const previousFetch = globalThis.fetch;
const previousTickers = process.env.RUNNER_KALSHI_EVENT_TICKERS;
const calls: URL[] = [];
const event = (ticker: string, markets: string[]) => ({ event_ticker: ticker, category: "Sports", title: "NFL", markets: markets.map(name => ({ ticker: name, yes_bid: 45, yes_ask: 47 })) });

try {
  process.env.RUNNER_KALSHI_EVENT_TICKERS = "KXNFLGAME-26SEP28PHICHI,KXNFLTOTAL-26SEP28PHICHI";
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    calls.push(url);
    if (url.searchParams.has("tickers")) return Response.json({ events: [event("KXNFLGAME-26SEP28PHICHI", ["GAME-A"]), event("KXNFLTOTAL-26SEP28PHICHI", ["TOTAL-A"])], cursor: "" });
    return Response.json({ events: [event("KXOTHER", ["FILLER-A", "FILLER-B"]), event("KXNFLGAME-26SEP28PHICHI", ["GAME-A"])], cursor: "" });
  };
  const markets = await new KalshiConnector().fetchMarkets(3);
  assert.deepEqual(markets.map(market => market.externalId), ["GAME-A", "TOTAL-A", "FILLER-A"]);
  assert.equal(calls[0].searchParams.get("tickers"), "KXNFLGAME-26SEP28PHICHI,KXNFLTOTAL-26SEP28PHICHI", "watched events are fetched before broad discovery");
  assert.equal(calls[1].searchParams.has("tickers"), false);

  calls.length = 0;
  globalThis.fetch = async (input) => {
    calls.push(new URL(String(input)));
    return Response.json({ events: [event("KXNFLGAME-26SEP28PHICHI", ["GAME-A"])], cursor: "" });
  };
  await assert.rejects(new KalshiConnector().fetchMarkets(3), /KXNFLTOTAL-26SEP28PHICHI/);
  assert.equal(calls.length, 1, "missing watched events must not silently fall back to broad markets");

  process.env.RUNNER_KALSHI_EVENT_TICKERS = "KXNFLGAME-26SEP28PHICHI";
  globalThis.fetch = async () => Response.json({ events: [event("KXNFLGAME-26SEP28PHICHI", [])], cursor: "" });
  await assert.rejects(new KalshiConnector().fetchMarkets(3), /KXNFLGAME-26SEP28PHICHI/, "an event without markets is not covered");

  globalThis.fetch = async () => Response.json({ events: [event("KXNFLGAME-26SEP28PHICHI", ["GAME-A", "GAME-B"])], cursor: "" });
  await assert.rejects(new KalshiConnector().fetchMarkets(1), /exceed configured limit/);

  process.env.RUNNER_KALSHI_EVENT_TICKERS = "bad ticker";
  const invalid = new KalshiConnector();
  await assert.rejects(invalid.fetchMarkets(3), /RUNNER_KALSHI_EVENT_TICKERS/);
  assert.equal(invalid.health().connected, false);
  assert.match(invalid.health().lastError ?? "", /RUNNER_KALSHI_EVENT_TICKERS/);
} finally {
  globalThis.fetch = previousFetch;
  if (previousTickers === undefined) delete process.env.RUNNER_KALSHI_EVENT_TICKERS;
  else process.env.RUNNER_KALSHI_EVENT_TICKERS = previousTickers;
}
console.log("Kalshi targeted coverage tests passed");
