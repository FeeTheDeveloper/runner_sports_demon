import { constants, createPrivateKey, sign } from "node:crypto";
import WebSocket from "ws";
import type { Connector, NormalizedMarket, ProviderHealth } from "../../types.js";
import { HealthTracker } from "../providerHealth.js";
import { fetchJson } from "../../utils/http.js";
import { normalizeKalshiMarket } from "../../normalization/markets/marketNormalizer.js";

interface KalshiEventsResponse { events?: Record<string, unknown>[]; cursor?: string; }

export class KalshiConnector implements Connector {
  readonly provider = "kalshi" as const;
  private readonly healthTracker = new HealthTracker(this.provider);
  private readonly restBase = process.env.KALSHI_REST_BASE ?? "https://external-api.kalshi.com/trade-api/v2";
  private readonly wsUrl = process.env.KALSHI_WS_URL ?? "wss://external-api-ws.kalshi.com/trade-api/ws/v2";

  health(): ProviderHealth { return this.healthTracker.snapshot(); }

  async fetchMarkets(limit = 250): Promise<NormalizedMarket[]> {
    const markets: NormalizedMarket[] = [];
    let cursor: string | undefined;
    try {
      for (let page = 0; markets.length < limit && page < 25; page += 1) {
        const url = new URL(`${this.restBase}/events`);
        url.searchParams.set("status", "open");
        url.searchParams.set("with_nested_markets", "true");
        url.searchParams.set("limit", String(Math.min(200, limit)));
        if (cursor) url.searchParams.set("cursor", cursor);
        const result = await fetchJson<KalshiEventsResponse>(url, { headers: this.authHeaders("GET", "/trade-api/v2/events") });
        for (const event of result.data.events ?? []) {
          if (typeof event.category === "string" && event.category.toLowerCase() !== "sports") continue;
          const nested = Array.isArray(event.markets) ? event.markets as Record<string, unknown>[] : [];
          for (const market of nested) {
            markets.push(normalizeKalshiMarket(event, market, { receivedTimestamp: result.receivedAt, latencyMs: result.latencyMs }));
            if (markets.length >= limit) break;
          }
          if (markets.length >= limit) break;
        }
        this.healthTracker.ok(result.latencyMs);
        cursor = result.data.cursor;
        if (!cursor) break;
      }
      return markets;
    } catch (error) {
      this.healthTracker.error(error);
      throw error;
    }
  }

  connectMarketStream(tickers: string[], onMessage: (message: unknown) => void): WebSocket {
    if (tickers.length === 0) throw new Error("Kalshi WebSocket requires at least one market ticker");
    const headers = this.authHeaders("GET", "/trade-api/ws/v2");
    if (!headers["KALSHI-ACCESS-KEY"]) throw new Error("Kalshi WebSocket requires KALSHI_API_KEY_ID/KALSHI_PRIVATE_KEY_BASE64 or KALSHI_API_KEY/KALSHI_API_SECRET");
    const ws = new WebSocket(this.wsUrl, { headers });
    ws.on("open", () => {
      this.healthTracker.ok();
      ws.send(JSON.stringify({ id: 1, cmd: "subscribe", params: { channels: ["orderbook_snapshot", "orderbook_delta", "ticker_v2", "trade"], market_tickers: tickers } }));
    });
    ws.on("message", (data) => { this.healthTracker.ok(); onMessage(JSON.parse(data.toString())); });
    ws.on("close", () => this.healthTracker.reconnecting());
    ws.on("error", (error) => this.healthTracker.error(error));
    return ws;
  }

  private authHeaders(method: "GET", path: string): Record<string, string> {
    const keyId = process.env.KALSHI_API_KEY_ID ?? process.env.KALSHI_API_KEY;
    const encodedPrivateKey = process.env.KALSHI_PRIVATE_KEY_BASE64;
    const sharedSecret = process.env.KALSHI_API_SECRET;
    if (!keyId || (!encodedPrivateKey && !sharedSecret)) return {};
    const timestamp = Date.now().toString();
    let signature: string;
    if (encodedPrivateKey) {
      const privateKey = createPrivateKey(Buffer.from(encodedPrivateKey, "base64").toString("utf8"));
      signature = sign("sha256", Buffer.from(`${timestamp}${method}${path}`), { key: privateKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }).toString("base64");
    } else {
      signature = sign("sha256", Buffer.from(`${timestamp}${method}${path}`), sharedSecret!).toString("base64");
    }
    return { "KALSHI-ACCESS-KEY": keyId, "KALSHI-ACCESS-SIGNATURE": signature, "KALSHI-ACCESS-TIMESTAMP": timestamp };
  }
}
