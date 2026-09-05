import type { Connector } from "./types.js";
import { MarketStateCache } from "./state/market-state/cache.js";
import { SqliteStore } from "./storage/sqlite.js";
import { renderTerminalDashboard } from "./dashboard/terminal.js";
import { log } from "./utils/logger.js";

export async function runIngestionOnce(connectors: Connector[], cache: MarketStateCache, store: SqliteStore, limit: number) {
  const settled = await Promise.allSettled(connectors.map((connector) => connector.fetchMarkets(limit)));
  const markets = settled.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    log("error", "connector fetch failed", { provider: connectors[index].provider, error: result.reason instanceof Error ? result.reason.message : String(result.reason) });
    return [];
  });
  cache.upsertMany(markets);
  store.persistMarkets(markets);
  store.persistHealth(connectors.map((connector) => connector.health()));
  return markets;
}

export async function startIngestion(connectors: Connector[], cache: MarketStateCache, store: SqliteStore, options: { limit: number; pollMs: number; once?: boolean }) {
  store.init();
  const tick = async () => {
    await runIngestionOnce(connectors, cache, store, options.limit);
    renderTerminalDashboard(cache.topByLiquidity(30), connectors.map((connector) => connector.health()), { marketEvents: store.count("market_events"), priceEvents: store.count("market_prices") });
  };
  await tick();
  if (options.once) return;
  setInterval(() => tick().catch((error) => log("error", "ingestion tick failed", { error: error instanceof Error ? error.message : String(error) })), options.pollMs);
}
