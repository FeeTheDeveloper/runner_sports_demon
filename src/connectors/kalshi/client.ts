import { constants, createHmac, createPrivateKey, sign } from "node:crypto";
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
    try {
      if (!Number.isSafeInteger(limit) || limit < 1) throw new Error("Kalshi market limit must be a positive integer");
      const watched = watchedEventTickers();
      const markets = new Map<string, NormalizedMarket>();
      if (watched.length) {
        const found = new Set<string>();
        await this.fetchEventPages(watched, (event, timing) => {
          const ticker = event.event_ticker;
          if (typeof ticker !== "string" || !watched.includes(ticker)) return false;
          const before = markets.size;
          this.addMarkets(event, timing, markets, limit, true);
          if (markets.size > before) found.add(ticker);
          return false;
        });
        const missing = watched.filter(ticker => !found.has(ticker));
        if (missing.length) throw new Error(`Watched Kalshi events absent from open response: ${missing.join(", ")}`);
      }
      await this.fetchEventPages([], (event, timing) => {
        if (typeof event.category === "string" && event.category.toLowerCase() !== "sports") return false;
        this.addMarkets(event, timing, markets, limit, false);
        return markets.size >= limit;
      }, () => markets.size >= limit, Math.min(200, limit));
      return [...markets.values()];
    } catch (error) {
      this.healthTracker.error(error);
      throw error;
    }
  }

  private addMarkets(event: Record<string, unknown>, timing: { receivedTimestamp: string; latencyMs: number }, markets: Map<string, NormalizedMarket>, limit: number, required: boolean): void {
    const nested = Array.isArray(event.markets) ? event.markets as Record<string, unknown>[] : [];
    for (const market of nested) {
      if (typeof market.ticker !== "string" || !market.ticker) continue;
      const id = `kalshi:${market.ticker}`;
      if (markets.has(id)) continue;
      if (markets.size >= limit) {
        if (required) throw new Error(`Watched Kalshi markets exceed configured limit ${limit}`);
        return;
      }
      markets.set(id, normalizeKalshiMarket(event, market, timing));
    }
  }

  private async fetchEventPages(
    tickers: string[],
    onEvent: (event: Record<string, unknown>, timing: { receivedTimestamp: string; latencyMs: number }) => boolean,
    isFull: () => boolean = () => false,
    pageSize = Math.min(200, tickers.length || 200),
  ): Promise<void> {
    let cursor: string | undefined;
    const seenCursors = new Set<string>();
    for (let page = 0; page < 25 && !isFull(); page += 1) {
      const url = new URL(`${this.restBase}/events`);
      url.searchParams.set("status", "open");
      url.searchParams.set("with_nested_markets", "true");
      url.searchParams.set("limit", String(pageSize));
      if (tickers.length) url.searchParams.set("tickers", tickers.join(","));
      if (cursor) url.searchParams.set("cursor", cursor);
      const result = await fetchJson<KalshiEventsResponse>(url, { headers: this.authHeaders("GET", "/trade-api/v2/events") });
      if (!Array.isArray(result.data.events)) throw new Error("Kalshi events response is missing events");
      this.healthTracker.ok(result.latencyMs);
      for (const event of result.data.events) {
        if (!event || typeof event !== "object") throw new Error("Kalshi events response contains an invalid event");
        if (onEvent(event, { receivedTimestamp: result.receivedAt, latencyMs: result.latencyMs })) return;
      }
      cursor = result.data.cursor || undefined;
      if (!cursor) return;
      if (seenCursors.has(cursor)) throw new Error("Kalshi events pagination repeated a cursor");
      seenCursors.add(cursor);
    }
    if (cursor && !isFull()) throw new Error("Kalshi events pagination exceeded 25 pages");
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
    ws.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        this.healthTracker.ok();
        onMessage(parsed);
      } catch (error) {
        this.healthTracker.error(error);
      }
    });
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
      if (!sharedSecret) throw new Error("Kalshi API secret is required when private key auth is not configured");
      signature = createHmac("sha256", sharedSecret).update(`${timestamp}${method}${path}`).digest("base64");
    }
    return { "KALSHI-ACCESS-KEY": keyId, "KALSHI-ACCESS-SIGNATURE": signature, "KALSHI-ACCESS-TIMESTAMP": timestamp };
  }
}

function watchedEventTickers(): string[] {
  const raw = process.env.RUNNER_KALSHI_EVENT_TICKERS?.trim();
  if (!raw) return [];
  const tickers = [...new Set(raw.split(",").map(value => value.trim().toUpperCase()))];
  if (tickers.length > 20 || tickers.some(ticker => !/^[A-Z0-9-]{3,100}$/.test(ticker))) {
    throw new Error("RUNNER_KALSHI_EVENT_TICKERS must contain at most 20 comma-separated Kalshi event tickers");
  }
  return tickers;
}
