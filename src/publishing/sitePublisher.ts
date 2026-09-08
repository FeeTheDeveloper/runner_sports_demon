import type { NormalizedMarket, ProviderHealth } from "../types.js";
import { boolEnv, intEnv, optionalStringEnv } from "../utils/env.js";

interface PublishTickInput {
  markets: NormalizedMarket[];
  health: ProviderHealth[];
  engineStatus: string;
  marketEventCount: number;
  priceEventCount: number;
}

export class SitePublisher {
  readonly enabled: boolean;
  readonly timeoutMs: number;
  readonly heartbeatMs: number;
  private readonly baseUrl?: string;
  private readonly serviceRoleKey?: string;
  private lastHeartbeatAt = 0;

  constructor() {
    this.baseUrl = optionalStringEnv("RUNNER_SITE_SUPABASE_URL");
    this.serviceRoleKey = optionalStringEnv("RUNNER_SITE_SUPABASE_SERVICE_ROLE_KEY");
    this.timeoutMs = intEnv("RUNNER_PUBLISH_TIMEOUT_MS", 10_000);
    this.heartbeatMs = intEnv("RUNNER_HEARTBEAT_MS", 30_000);
    this.enabled = boolEnv("RUNNER_PUBLISH_ENABLED", true) && Boolean(this.baseUrl && this.serviceRoleKey);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async publishTick(input: PublishTickInput): Promise<void> {
    if (!this.enabled) return;
    const timestamp = new Date().toISOString();
    if (Date.now() - this.lastHeartbeatAt < this.heartbeatMs && input.engineStatus === "running") {
      return;
    }
    this.lastHeartbeatAt = Date.now();

    const payloads: Record<string, Record<string, unknown>[]> = {
      runner_live_forecasts: input.markets.slice(0, 25).map((market) => ({
        id: market.id,
        provider: market.provider,
        external_id: market.externalId,
        runner_event_id: market.runnerEventId ?? null,
        title: market.title,
        market_status: market.marketStatus,
        yes_price: market.yesPrice ?? null,
        no_price: market.noPrice ?? null,
        bid: market.bid ?? null,
        ask: market.ask ?? null,
        liquidity: market.liquidity ?? null,
        volume: market.volume ?? null,
        source_timestamp: market.sourceTimestamp,
        received_timestamp: market.receivedTimestamp,
        processed_timestamp: market.processedTimestamp,
        published_at: timestamp,
      })),
      runner_pick_health: input.health.map((entry) => ({
        provider: entry.provider,
        connected: entry.connected,
        last_message_at: entry.lastMessageAt ?? null,
        last_error: entry.lastError ?? null,
        reconnect_attempts: entry.reconnectAttempts,
        event_count: entry.eventCount,
        latency_ms: entry.latencyMs ?? null,
        published_at: timestamp,
      })),
      runner_game_flow: [{
        runner_event_id: "engine",
        source: "engine",
        summary: "local market intake",
        market_count: input.markets.length,
        observed_at: timestamp,
      }],
      runner_live_signals: [{
        signal_name: "market_ingestion",
        signal_value: input.markets.length,
        observed_at: timestamp,
      }],
      runner_totals_state: [{
        source: "runner-scout",
        status: input.engineStatus,
        market_count: input.markets.length,
        market_event_count: input.marketEventCount,
        price_event_count: input.priceEventCount,
        published_at: timestamp,
      }],
      runner_totals_windows: [],
      runner_provider_health: input.health.map((entry) => ({
        provider: entry.provider,
        connected: entry.connected,
        last_message_at: entry.lastMessageAt ?? null,
        last_error: entry.lastError ?? null,
        reconnect_attempts: entry.reconnectAttempts,
        event_count: entry.eventCount,
        latency_ms: entry.latencyMs ?? null,
        published_at: timestamp,
      })),
      runner_engine_status: [{
        status: input.engineStatus,
        heartbeat_at: timestamp,
        market_count: input.markets.length,
        market_event_count: input.marketEventCount,
        price_event_count: input.priceEventCount,
      }],
    };

    await Promise.allSettled(
      Object.entries(payloads)
        .filter(([, rows]) => rows.length > 0)
        .map(([table, rows]) => this.upsert(table, rows)),
    );
  }

  private async upsert(table: string, rows: Record<string, unknown>[]): Promise<void> {
    const url = new URL(`/rest/v1/${table}`, this.baseUrl!);
    url.searchParams.set("on_conflict", "id");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.serviceRoleKey!,
        Authorization: `Bearer ${this.serviceRoleKey}`,
      },
      body: JSON.stringify(rows),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Site publisher failed for ${table}: ${response.status} ${response.statusText} ${text.slice(0, 300)}`);
    }
  }
}
