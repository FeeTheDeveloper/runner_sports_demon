import type { CanonicalGameState } from "../../types.js";
import { normalizeToken } from "../../normalization/events/canonicalId.js";

export interface ScheduleFilter { date?: string; ranked?: boolean; sport?: string; }
export class GameStateCache {
  private readonly games = new Map<string, CanonicalGameState>();
  upsert(game: CanonicalGameState) { this.games.set(game.runnerEventId, game); }
  upsertMany(games: CanonicalGameState[]) { for (const game of games) this.upsert(game); }
  all(): CanonicalGameState[] { return [...this.games.values()].sort((a, b) => a.startTime.localeCompare(b.startTime)); }
  get(id: string): CanonicalGameState | undefined { return this.games.get(id); }
  live(): CanonicalGameState[] { return this.all().filter((game) => game.status === "IN_PROGRESS"); }
  schedule(filter: ScheduleFilter = {}): CanonicalGameState[] {
    const sport = filter.sport?.toUpperCase();
    return this.all().filter((game) => (!filter.date || game.startTime.slice(0, 10) === filter.date)
      && (!sport || ["CFB", "NCAAF", "COLLEGE-FOOTBALL"].includes(sport))
      && (filter.ranked === undefined || ((game.home.rank !== undefined || game.away.rank !== undefined) === filter.ranked)));
  }
  findByProvider(provider: "espn", providerId: string) { return this.all().find((game) => game.provider === provider && game.providerEventId === providerId); }
  findByTeams(home: string, away: string, startsAt?: string): CanonicalGameState | undefined {
    const homeToken = normalizeToken(home); const awayToken = normalizeToken(away);
    const date = startsAt && Number.isFinite(new Date(startsAt).getTime()) ? new Date(startsAt).toISOString().slice(0, 10) : undefined;
    return this.all().find((game) => normalizeToken(game.home.name) === homeToken && normalizeToken(game.away.name) === awayToken && (!date || game.startTime.slice(0, 10) === date));
  }
}
