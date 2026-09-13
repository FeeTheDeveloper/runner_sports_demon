import { EspnCfbConnector } from "../connectors/espn/client.js";
import { OddsApiCfbConnector } from "../connectors/odds-api/client.js";
import type { MarketModelComparison, ProviderHealth, RunnerBaseline } from "../types.js";
import { comparisonsForGame } from "../models/comparison.js";
import { GameStateCache, type ScheduleFilter } from "../state/game-state/cache.js";
import { SportsMarketCache } from "../state/sports-market/cache.js";
import { SqliteStore } from "../storage/sqlite.js";
import { intEnv } from "../utils/env.js";
import { log } from "../utils/logger.js";

export class LiveDataRuntime {
  readonly games = new GameStateCache();
  readonly sportsMarkets = new SportsMarketCache();
  private readonly espn = new EspnCfbConnector();
  private readonly odds = new OddsApiCfbConnector();
  private readonly scheduleFetchedAt = new Map<string, number>();
  private readonly scheduleRequests = new Map<string, Promise<void>>();
  private stopped = false;
  constructor(private readonly store: SqliteStore) {}

  health(): ProviderHealth[] { return [this.espn.health(), this.odds.health()]; }

  async discoverSchedule(filter: ScheduleFilter = {}, force = false) {
    validateSport(filter.sport);
    const date = normalizeScheduleDate(filter.date);
    const cacheMs = intEnv("RUNNER_ESPN_SCHEDULE_CACHE_MS", 60_000);
    const fetchedAt = this.scheduleFetchedAt.get(date) ?? 0;
    if (force || Date.now() - fetchedAt >= cacheMs || this.games.schedule({ date }).length === 0) {
      let request = this.scheduleRequests.get(date);
      if (!request) {
        request = this.fetchAndStoreSchedule(date).finally(() => this.scheduleRequests.delete(date));
        this.scheduleRequests.set(date, request);
      }
      await request;
    }
    return this.games.schedule({ ...filter, date });
  }

  private async fetchAndStoreSchedule(date: string) {
    const result = await this.espn.fetchSchedule(date, true);
    this.games.upsertMany(result.games);
    this.store.persistGames(result.games, result.rawEvents);
    this.scheduleFetchedAt.set(date, Date.now());
    this.store.persistHealth(this.health());
  }

  async refreshOdds() {
    const result = await this.odds.fetchMarkets((event) => {
      const home = typeof event.home_team === "string" ? event.home_team : "";
      const away = typeof event.away_team === "string" ? event.away_team : "";
      const startsAt = typeof event.commence_time === "string" ? event.commence_time : undefined;
      const match = home && away ? this.games.findByTeams(home, away, startsAt) : undefined;
      return match?.runnerEventId;
    });
    this.sportsMarkets.upsertMany(result.markets);
    this.store.persistSportsMarkets(result.markets, [result.rawEvent]);
    this.store.persistHealth(this.health());
    return result.markets;
  }

  game(id: string) { return this.games.get(id); }
  gameMarkets(id: string) { return this.sportsMarkets.forGame(id); }
  baselines(id?: string): RunnerBaseline[] { return this.store.baselines(id); }
  comparisons(id: string): MarketModelComparison[] { return comparisonsForGame(id, this.baselines(id), this.gameMarkets(id)); }
  allComparisons(): MarketModelComparison[] { return this.games.all().flatMap((game) => this.comparisons(game.runnerEventId)); }

  async start(options: { once?: boolean } = {}) {
    const today = normalizeScheduleDate();
    if (options.once) {
      await Promise.allSettled([this.runEspn(today), this.runOdds()]);
      return;
    }
    this.schedule("espn", () => this.runEspn(normalizeScheduleDate()), boundedInterval("RUNNER_ESPN_POLL_MS", 10_000, 5_000));
    this.schedule("odds_api", () => this.runOdds(), boundedInterval("RUNNER_ODDS_POLL_MS", 20_000, 15_000));
  }

  stop() { this.stopped = true; }

  private async runEspn(date: string) {
    try { await this.discoverSchedule({ date, sport: "CFB" }, true); }
    catch (error) {
      this.store.persistHealth(this.health());
      log("error", "ESPN CFB refresh failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  private async runOdds() {
    try { await this.refreshOdds(); }
    catch (error) {
      this.store.persistHealth(this.health());
      log("error", "Odds API CFB refresh failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  private schedule(provider: string, work: () => Promise<unknown>, baseDelay: number) {
    let failures = 0;
    const tick = async () => {
      if (this.stopped) return;
      try { await work(); failures = 0; }
      catch { failures += 1; }
      if (this.stopped) return;
      const providerHealth = this.health().find((health) => health.provider === provider);
      const quotaDelay = providerHealth?.rateLimitRemaining === 0 ? intEnv("RUNNER_ODDS_QUOTA_BACKOFF_MS", 3_600_000) : 0;
      const backoff = failures ? Math.min(intEnv("RUNNER_PROVIDER_MAX_BACKOFF_MS", 300_000), baseDelay * 2 ** Math.min(failures, 5)) : baseDelay;
      const delay = Math.max(quotaDelay, backoff);
      if (failures) {
        const nextRetryAt = new Date(Date.now() + delay).toISOString();
        if (provider === "espn") this.espn.retrying(nextRetryAt); else this.odds.retrying(nextRetryAt);
        this.store.persistHealth(this.health());
      }
      setTimeout(tick, delay);
    };
    void tick();
  }
}

export function normalizeScheduleDate(value?: string, now = new Date()): string {
  if (!value) return now.toISOString().slice(0, 10);
  const match = value.match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
  if (!match) throw new Error("date must use YYYY-MM-DD or YYYYMMDD");
  const normalized = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) throw new Error("date is invalid");
  return normalized;
}
export function validateSport(sport?: string): void {
  if (sport && !["cfb", "ncaaf", "college-football"].includes(sport.toLowerCase())) throw new Error("only CFB schedule discovery is supported");
}
function boundedInterval(name: string, fallback: number, minimum: number): number {
  return Math.max(minimum, intEnv(name, fallback));
}
