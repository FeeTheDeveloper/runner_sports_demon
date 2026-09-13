import type { SportsMarketSnapshot } from "../../types.js";
export class SportsMarketCache {
  private readonly markets = new Map<string, SportsMarketSnapshot>();
  upsertMany(markets: SportsMarketSnapshot[]) { for (const market of markets) this.markets.set(market.id, market); }
  all() { return [...this.markets.values()]; }
  forGame(runnerEventId: string) { return this.all().filter((market) => market.runnerEventId === runnerEventId); }
}
