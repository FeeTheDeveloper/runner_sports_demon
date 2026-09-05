import WebSocket from "ws";
import type { Connector, NormalizedMarket, ProviderHealth } from "../../types.js";
import { HealthTracker } from "../providerHealth.js";
import { fetchJson } from "../../utils/http.js";
import { normalizePolymarketMarket } from "../../normalization/markets/marketNormalizer.js";

export class PolymarketConnector implements Connector {
  readonly provider = "polymarket" as const;
  private readonly healthTracker = new HealthTracker(this.provider);
  private readonly gammaBase = process.env.POLYMARKET_GAMMA_BASE ?? "https://gamma-api.polymarket.com";
  private readonly clobWsUrl = process.env.POLYMARKET_CLOB_WS_URL ?? "wss://ws-subscriptions-clob.polymarket.com/ws/market";

  health(): ProviderHealth { return this.healthTracker.snapshot(); }

  async fetchMarkets(limit = 250): Promise<NormalizedMarket[]> {
    const markets: NormalizedMarket[] = [];
    const pageSize = Math.min(250, limit);
    try {
      for (let offset = 0; markets.length < limit && offset < 5000; offset += pageSize) {
        const url = new URL(`${this.gammaBase}/markets`);
        url.searchParams.set("active", "true");
        url.searchParams.set("closed", "false");
        url.searchParams.set("tag_id", "1");
        url.searchParams.set("related_tags", "true");
        url.searchParams.set("order", "volume24hr");
        url.searchParams.set("ascending", "false");
        url.searchParams.set("limit", String(pageSize));
        url.searchParams.set("offset", String(offset));
        const result = await fetchJson<Record<string, unknown>[]>(url);
        for (const market of result.data) markets.push(normalizePolymarketMarket(market, { receivedTimestamp: result.receivedAt, latencyMs: result.latencyMs }));
        this.healthTracker.ok(result.latencyMs);
        if (result.data.length < pageSize) break;
      }
      return Array.from(new Map(markets.slice(0, limit).map((market) => [market.id, market])).values());
    } catch (error) {
      this.healthTracker.error(error);
      throw error;
    }
  }

  connectMarketStream(assetIds: string[], onMessage: (message: unknown) => void): WebSocket {
    if (assetIds.length === 0) throw new Error("Polymarket WebSocket requires at least one CLOB asset id");
    const ws = new WebSocket(this.clobWsUrl);
    ws.on("open", () => {
      this.healthTracker.ok();
      ws.send(JSON.stringify({ assets_ids: assetIds, type: "market" }));
    });
    ws.on("message", (data) => { this.healthTracker.ok(); onMessage(JSON.parse(data.toString())); });
    ws.on("close", () => this.healthTracker.reconnecting());
    ws.on("error", (error) => this.healthTracker.error(error));
    return ws;
  }
}
