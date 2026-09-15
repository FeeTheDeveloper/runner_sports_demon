import type { CanonicalGameState, ProviderHealth, RawProviderEvent } from "../../types.js";
import { fetchJson } from "../../utils/http.js";
import { normalizeEspnGame, espnScoreboardEvents } from "../../normalization/games/espn.js";
import { HealthTracker } from "../providerHealth.js";

export interface EspnScheduleResult {
  games: CanonicalGameState[];
  rawEvents: RawProviderEvent[];
}

function compactDate(date: string): string {
  if (!/^\d{4}-?\d{2}-?\d{2}$/.test(date)) throw new Error("date must use YYYY-MM-DD or YYYYMMDD");
  return date.replaceAll("-", "");
}

export class EspnCfbConnector {
  readonly provider = "espn" as const;
  private readonly healthTracker = new HealthTracker(this.provider);
  private readonly base = process.env.ESPN_CFB_BASE ?? "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

  health(): ProviderHealth { return this.healthTracker.snapshot(); }
  retrying(nextRetryAt: string) { this.healthTracker.reconnecting(nextRetryAt); }

  async fetchSchedule(date: string, includeLiveSummaries = true): Promise<EspnScheduleResult> {
    try {
      const url = new URL(`${this.base}/scoreboard`);
      url.searchParams.set("dates", compactDate(date));
      url.searchParams.set("limit", "1000");
      const scoreboard = await fetchJson<Record<string, unknown>>(url);
      const events = espnScoreboardEvents(scoreboard.data);
      const rawEvents: RawProviderEvent[] = [{ provider: "espn", eventType: "scoreboard", providerEventId: compactDate(date), receivedTimestamp: scoreboard.receivedAt, sourceTimestamp: scoreboard.receivedAt, payload: scoreboard.data, latencyMs: scoreboard.latencyMs }];
      const initial = events.map((event) => normalizeEspnGame(event, { receivedTimestamp: scoreboard.receivedAt }));
      const summaries = new Map<string, { payload: Record<string, unknown>; receivedAt: string; latencyMs: number }>();
      let summaryFailureCount = 0;
      if (includeLiveSummaries) {
        const live = initial.filter((game) => game.status === "IN_PROGRESS");
        const settled = await Promise.allSettled(live.map(async (game) => {
          const result = await this.fetchSummary(game.providerEventId);
          return [game.providerEventId, { payload: result.data, receivedAt: result.receivedAt, latencyMs: result.latencyMs }] as const;
        }));
        const failures: unknown[] = [];
        for (const result of settled) {
          if (result.status === "fulfilled") summaries.set(result.value[0], result.value[1]);
          else failures.push(result.reason);
        }
        summaryFailureCount = failures.length;
      }
      const games = events.map((event) => {
        const id = String(event.id);
        const summary = summaries.get(id);
        if (summary) rawEvents.push({ provider: "espn", eventType: "summary", providerEventId: id, receivedTimestamp: summary.receivedAt, sourceTimestamp: summary.receivedAt, payload: summary.payload, latencyMs: summary.latencyMs });
        return normalizeEspnGame(event, { receivedTimestamp: summary?.receivedAt ?? scoreboard.receivedAt }, summary?.payload);
      });
      if (summaryFailureCount) this.healthTracker.degraded(`ESPN summary failures: ${summaryFailureCount}`, scoreboard.latencyMs);
      else this.healthTracker.ok(scoreboard.latencyMs);
      return { games, rawEvents };
    } catch (error) {
      this.healthTracker.error(error);
      throw error;
    }
  }

  private async fetchSummary(eventId: string) {
    const url = new URL(`${this.base}/summary`);
    url.searchParams.set("event", eventId);
    return fetchJson<Record<string, unknown>>(url);
  }
}
