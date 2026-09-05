import type { NormalizedMarket } from "../../types.js";
import { centsToProbability, midpoint, optionalNumber, spread } from "./probability.js";

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try { const parsed = JSON.parse(value) as unknown; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function sportFromText(...values: unknown[]): string | undefined {
  const text = values.filter((v): v is string => typeof v === "string").join(" ").toLowerCase();
  const patterns: Array<[RegExp, string]> = [[/wnba/, "WNBA"], [/ncaaf|college football/, "NCAAF"], [/ncaab|college basketball/, "NCAAB"], [/nfl|football/, "NFL"], [/nba|basketball/, "NBA"], [/mlb|baseball/, "MLB"], [/nhl|hockey/, "NHL"]];
  return patterns.find(([r]) => r.test(text))?.[1];
}

export function normalizeKalshiMarket(event: Record<string, unknown>, market: Record<string, unknown>, timing: { receivedTimestamp: string; latencyMs?: number }): NormalizedMarket {
  const bid = centsToProbability(market.yes_bid_dollars ?? market.yes_bid);
  const ask = centsToProbability(market.yes_ask_dollars ?? market.yes_ask);
  const last = centsToProbability(market.last_price_dollars ?? market.last_price);
  const sourceTimestamp = String(market.updated_time ?? event.updated_time ?? timing.receivedTimestamp);
  const title = String(market.title ?? market.subtitle ?? market.yes_sub_title ?? event.title ?? market.ticker);
  return {
    id: `kalshi:${String(market.ticker)}`,
    provider: "kalshi",
    externalId: String(market.ticker),
    eventId: typeof market.event_ticker === "string" ? market.event_ticker : typeof event.event_ticker === "string" ? event.event_ticker : undefined,
    title,
    category: typeof event.category === "string" ? event.category : undefined,
    sport: sportFromText(event.product_metadata && typeof event.product_metadata === "object" ? (event.product_metadata as Record<string, unknown>).sport : undefined, event.series_ticker, event.event_ticker, event.title, title),
    contractSide: "yes",
    yesPrice: midpoint(bid, ask, last),
    noPrice: midpoint(ask !== undefined ? 1 - ask : undefined, bid !== undefined ? 1 - bid : undefined),
    bid,
    ask,
    spread: spread(bid, ask),
    lastTradedPrice: last,
    volume: optionalNumber(market.volume ?? market.volume_fp),
    openInterest: optionalNumber(market.open_interest ?? market.open_interest_value),
    liquidity: optionalNumber(market.liquidity_dollars ?? market.liquidity),
    timestamp: timing.receivedTimestamp,
    sourceTimestamp,
    receivedTimestamp: timing.receivedTimestamp,
    processedTimestamp: new Date().toISOString(),
    marketStatus: String(market.status ?? "unknown"),
    raw: market,
  };
}

export function normalizePolymarketMarket(market: Record<string, unknown>, timing: { receivedTimestamp: string; latencyMs?: number }): NormalizedMarket {
  const outcomes = parseJsonArray(market.outcomes).map(String);
  const prices = parseJsonArray(market.outcomePrices).map(optionalNumber);
  const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  const outcomePrice = yesIndex >= 0 ? prices[yesIndex] : prices[0];
  const bid = optionalNumber(market.bestBid);
  const ask = optionalNumber(market.bestAsk);
  const last = optionalNumber(market.lastTradePrice) ?? outcomePrice;
  const id = String(market.id ?? market.conditionId ?? market.slug);
  const event = Array.isArray(market.events) && typeof market.events[0] === "object" ? market.events[0] as Record<string, unknown> : undefined;
  const title = String(market.question ?? market.title ?? id);
  const tags = Array.isArray(market.tags) ? market.tags.map((t) => typeof t === "object" && t !== null ? String((t as Record<string, unknown>).label ?? (t as Record<string, unknown>).slug ?? "") : String(t)).join(" ") : "";
  return {
    id: `polymarket:${id}`,
    provider: "polymarket",
    externalId: id,
    eventId: typeof market.conditionId === "string" ? market.conditionId : typeof event?.ticker === "string" ? event.ticker : undefined,
    title,
    category: tags || undefined,
    sport: sportFromText(tags, title, event?.title) ?? "Sports",
    contractSide: outcomes[yesIndex >= 0 ? yesIndex : 0],
    yesPrice: midpoint(bid, ask, last),
    noPrice: midpoint(ask !== undefined ? 1 - ask : undefined, bid !== undefined ? 1 - bid : undefined),
    bid,
    ask,
    spread: spread(bid, ask),
    lastTradedPrice: last,
    volume: optionalNumber(market.volumeNum ?? market.volume),
    liquidity: optionalNumber(market.liquidityNum ?? market.liquidity),
    timestamp: timing.receivedTimestamp,
    sourceTimestamp: String(market.updatedAt ?? market.createdAt ?? timing.receivedTimestamp),
    receivedTimestamp: timing.receivedTimestamp,
    processedTimestamp: new Date().toISOString(),
    marketStatus: market.closed === true ? "closed" : market.acceptingOrders === false ? "paused" : "open",
    raw: market,
  };
}
