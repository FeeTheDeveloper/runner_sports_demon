import type { Connector } from "./types.js";
import { MarketStateCache } from "./state/market-state/cache.js";
import { SqliteStore } from "./storage/sqlite.js";
import { renderTerminalDashboard } from "./dashboard/terminal.js";
import { log } from "./utils/logger.js";
import { SitePublisher } from "./publishing/sitePublisher.js";

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

export async function startIngestion(
  connectors: Connector[],
  cache: MarketStateCache,
  store: SqliteStore,
  options: { limit: number; pollMs: number; once?: boolean; publisher?: SitePublisher },
) {
  const publisher = options.publisher ?? new SitePublisher();
  store.init();
  const tick = async () => {
    const markets = await runIngestionOnce(connectors, cache, store, options.limit);
    const providerHealth = connectors.map((connector) => connector.health());
    renderTerminalDashboard(cache.topByLiquidity(30), providerHealth, { marketEvents: store.count("market_events"), priceEvents: store.count("market_prices") });

    if (publisher.isEnabled()) {
      try {
        await publisher.publishTick({
          markets,
          health: providerHealth,
          engineStatus: "running",
          marketEventCount: store.count("market_events"),
          priceEventCount: store.count("market_prices"),
        });
      } catch (error) {
        log("warn", "site publishing failed; local engine continues", { error: error instanceof Error ? error.message : String(error) });
      }
    }
  };
  await tick();
  if (options.once) return;
  setInterval(() => tick().catch((error) => log("error", "ingestion tick failed", { error: error instanceof Error ? error.message : String(error) })), options.pollMs);
}
