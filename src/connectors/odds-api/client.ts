import type { ProviderHealth, RawProviderEvent, SportsMarketSnapshot } from "../../types.js";
import { fetchJson } from "../../utils/http.js";
import { normalizeOddsApiEvent } from "../../normalization/markets/oddsApi.js";
import { optionalStringEnv } from "../../utils/env.js";
import { HealthTracker } from "../providerHealth.js";

export interface OddsApiResult { events: Record<string, unknown>[]; markets: SportsMarketSnapshot[]; rawEvent: RawProviderEvent; }

export class OddsApiCfbConnector {
  readonly provider = "odds_api" as const;
  private readonly healthTracker = new HealthTracker(this.provider);
  private readonly base = process.env.ODDS_API_BASE ?? "https://api.the-odds-api.com/v4";
  health(): ProviderHealth { return this.healthTracker.snapshot(); }
  retrying(nextRetryAt: string) { if (this.healthTracker.snapshot().status !== "DISABLED") this.healthTracker.reconnecting(nextRetryAt); }

  async fetchMarkets(resolveRunnerId: (event: Record<string, unknown>) => string | undefined): Promise<OddsApiResult> {
    const apiKey = optionalStringEnv("ODDS_API_KEY");
    if (!apiKey) {
      this.healthTracker.disabled("ODDS_API_KEY is not configured");
      throw new Error("ODDS_API_KEY is not configured");
    }
    const url = new URL(`${this.base}/sports/americanfootball_ncaaf/odds`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("regions", process.env.ODDS_API_REGIONS ?? "us");
    url.searchParams.set("markets", process.env.ODDS_API_MARKETS ?? "h2h,spreads,totals");
    url.searchParams.set("oddsFormat", "american");
    url.searchParams.set("dateFormat", "iso");
    try {
      const result = await fetchJson<Record<string, unknown>[]>(url, {}, 0);
      const remaining = numericHeader(result.headers, "x-requests-remaining");
      const used = numericHeader(result.headers, "x-requests-used");
      const markets = result.data.flatMap((event) => normalizeOddsApiEvent(event, { receivedTimestamp: result.receivedAt }, resolveRunnerId(event)));
      if (remaining === 0) this.healthTracker.degraded("Odds API request quota exhausted", result.latencyMs, { remaining, used });
      else this.healthTracker.ok(result.latencyMs, { remaining, used });
      return {
        events: result.data,
        markets,
        rawEvent: { provider: "odds_api", eventType: "odds", providerEventId: "americanfootball_ncaaf", sourceTimestamp: result.receivedAt, receivedTimestamp: result.receivedAt, latencyMs: result.latencyMs, payload: result.data },
      };
    } catch (error) {
      this.healthTracker.error(error, "DEGRADED");
      throw error;
    }
  }
}
function numericHeader(headers: Headers, name: string): number | undefined {
  const raw = headers.get(name);
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}
