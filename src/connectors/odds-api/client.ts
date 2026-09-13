import type { Connector, NormalizedMarket, ProviderHealth } from "../../types.js";
import { buildRunnerEventId } from "../../normalization/events/canonicalId.js";
import { fetchJson } from "../../utils/http.js";
import { optionalStringEnv } from "../../utils/env.js";
import { HealthTracker } from "../providerHealth.js";

interface OddsOutcome { name?: string; price?: number; point?: number; }
interface OddsMarket { key?: string; last_update?: string; outcomes?: OddsOutcome[]; }
interface OddsBookmaker { key?: string; title?: string; last_update?: string; markets?: OddsMarket[]; }
interface OddsEvent { id?: string; commence_time?: string; home_team?: string; away_team?: string; bookmakers?: OddsBookmaker[]; }

export class OddsApiNflConnector implements Connector {
  readonly provider = "odds_api" as const;
  private readonly healthTracker = new HealthTracker(this.provider);
  private readonly baseUrl = process.env.ODDS_API_BASE ?? "https://api.the-odds-api.com/v4";

  health(): ProviderHealth { return this.healthTracker.snapshot(); }

  async fetchMarkets(limit = 250): Promise<NormalizedMarket[]> {
    const apiKey = optionalStringEnv("ODDS_API_KEY");
    if (!apiKey) throw new Error("ODDS_API_KEY is required for Odds API NFL ingestion");
    try {
      const url = new URL(`${this.baseUrl}/sports/americanfootball_nfl/odds`);
      url.searchParams.set("apiKey", apiKey);
      url.searchParams.set("regions", process.env.ODDS_API_REGIONS ?? "us");
      url.searchParams.set("markets", process.env.ODDS_API_MARKETS ?? "h2h,spreads,totals");
      url.searchParams.set("oddsFormat", "american");
      const result = await fetchJson<OddsEvent[]>(url);
      const markets = result.data.flatMap((event) => this.normalizeEvent(event, result.receivedAt)).slice(0, limit);
      this.healthTracker.ok(result.latencyMs);
      return markets;
    } catch (error) {
      this.healthTracker.error(error);
      throw error;
    }
  }

  private normalizeEvent(event: OddsEvent, receivedTimestamp: string): NormalizedMarket[] {
    if (!event.id || !event.commence_time || !event.away_team || !event.home_team) return [];
    const awayTeam = event.away_team;
    const homeTeam = event.home_team;
    const runnerEventId = buildRunnerEventId({ sport: "NFL", startsAt: event.commence_time, awayTeam, homeTeam });
    return (event.bookmakers ?? []).flatMap((bookmaker) => (bookmaker.markets ?? []).flatMap((market) => (market.outcomes ?? []).map((outcome, index) => {
      const price = Number(outcome.price);
      const implied = Number.isFinite(price) ? americanProbability(price) : undefined;
      const externalId = `${event.id}:${bookmaker.key ?? bookmaker.title ?? "book"}:${market.key ?? "market"}:${outcome.name ?? index}`;
      const sourceTimestamp = market.last_update ?? bookmaker.last_update ?? receivedTimestamp;
      return {
        id: `odds_api:${externalId}`,
        provider: "odds_api" as const,
        externalId,
        eventId: event.id,
        runnerEventId,
        title: `${awayTeam} @ ${homeTeam}`,
        category: market.key,
        sport: "NFL",
        teams: [awayTeam, homeTeam],
        contractSide: outcome.name,
        yesPrice: implied,
        lastTradedPrice: implied,
        timestamp: receivedTimestamp,
        sourceTimestamp,
        receivedTimestamp,
        processedTimestamp: new Date().toISOString(),
        marketStatus: "open",
        raw: { event, bookmaker, market, outcome, line: outcome.point },
      } satisfies NormalizedMarket;
    })));
  }
}

function americanProbability(price: number): number {
  if (price > 0) return 100 / (price + 100);
  if (price < 0) return Math.abs(price) / (Math.abs(price) + 100);
  return 0.5;
}