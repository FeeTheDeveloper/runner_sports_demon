import type { NormalizedMarket, ProviderHealth } from "../types.js";

export function renderTerminalDashboard(markets: NormalizedMarket[], health: ProviderHealth[], counts: { marketEvents: number; priceEvents: number }) {
  console.clear();
  console.log("RUNNER LIVE MARKET SCOUT — Kalshi + Polymarket");
  console.log(`Updated: ${new Date().toISOString()} | persisted market events=${counts.marketEvents} price events=${counts.priceEvents}`);
  console.log(health.map((h) => `${h.provider}:${h.connected ? "UP" : "DOWN"}${h.latencyMs ? ` ${Math.round(h.latencyMs)}ms` : ""}${h.lastError ? ` (${h.lastError})` : ""}`).join(" | "));
  console.log("".padEnd(120, "-"));
  console.log(["PROVIDER".padEnd(11), "PROB".padStart(7), "BID".padStart(7), "ASK".padStart(7), "LIQ".padStart(10), "VOL".padStart(10), "SPORT".padEnd(7), "MARKET"].join(" "));
  for (const market of markets.slice(0, 30)) {
    console.log([
      market.provider.padEnd(11),
      fmtPct(market.yesPrice).padStart(7),
      fmtPct(market.bid).padStart(7),
      fmtPct(market.ask).padStart(7),
      fmtNum(market.liquidity).padStart(10),
      fmtNum(market.volume).padStart(10),
      (market.sport ?? "").slice(0, 7).padEnd(7),
      market.title.slice(0, 60),
    ].join(" "));
  }
}
function fmtPct(v?: number) { return v === undefined ? "-" : `${(v * 100).toFixed(1)}%`; }
function fmtNum(v?: number) { return v === undefined ? "-" : Math.round(v).toLocaleString("en-US"); }
