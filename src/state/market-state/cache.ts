import type { NormalizedMarket } from "../../types.js";

export class MarketStateCache {
  private readonly markets = new Map<string, NormalizedMarket>();
  upsert(market: NormalizedMarket) { this.markets.set(market.id, market); }
  upsertMany(markets: NormalizedMarket[]) { for (const market of markets) this.upsert(market); }
  all(): NormalizedMarket[] { return Array.from(this.markets.values()); }
  topByLiquidity(limit = 25): NormalizedMarket[] {
    return this.all().sort((a, b) => (b.liquidity ?? b.volume ?? 0) - (a.liquidity ?? a.volume ?? 0)).slice(0, limit);
  }
}
