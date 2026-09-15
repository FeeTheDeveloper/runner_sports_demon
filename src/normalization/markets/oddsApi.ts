import type { SportsMarketKind, SportsMarketSnapshot } from "../../types.js";
import { normalizeToken } from "../events/canonicalId.js";

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item)) : [];
}
function number(value: unknown): number | undefined {
  const parsed = value === null || value === undefined || value === "" ? NaN : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
function marketKind(key: string): SportsMarketKind {
  if (key === "h2h") return "MONEYLINE";
  if (key === "spreads") return "SPREAD";
  if (key === "totals") return "TOTAL";
  if (key.includes("team_totals")) return "TEAM_TOTAL";
  if (key.includes("player")) return "PROP";
  return "DERIVATIVE";
}
function stablePart(value: string): string { return normalizeToken(value).replaceAll(" ", "-") || "unknown"; }

export function normalizeOddsApiEvent(
  event: Record<string, unknown>,
  timing: { receivedTimestamp: string },
  runnerEventId?: string,
): SportsMarketSnapshot[] {
  const providerEventId = String(event.id ?? "");
  if (!providerEventId) throw new Error("Odds API event id is required");
  const homeTeam = String(event.home_team ?? "");
  const awayTeam = String(event.away_team ?? "");
  const snapshots: SportsMarketSnapshot[] = [];
  for (const book of records(event.bookmakers)) {
    const bookmakerKey = String(book.key ?? "");
    if (!bookmakerKey) continue;
    const bookmakerName = String(book.title ?? bookmakerKey);
    for (const market of records(book.markets)) {
      const marketKey = String(market.key ?? "");
      if (!marketKey) continue;
      const kind = marketKind(marketKey);
      const providerTimestamp = typeof market.last_update === "string" ? market.last_update : typeof book.last_update === "string" ? book.last_update : undefined;
      for (const outcome of records(market.outcomes)) {
        const selection = String(outcome.name ?? "");
        if (!selection) continue;
        const description = typeof outcome.description === "string" ? outcome.description : undefined;
        const price = number(outcome.price);
        const teamSide = selection === homeTeam ? "HOME" as const : selection === awayTeam ? "AWAY" as const : undefined;
        snapshots.push({
          id: `odds_api:${providerEventId}:${bookmakerKey}:${marketKey}:${stablePart(description ? `${description}-${selection}` : selection)}`,
          provider: "odds_api",
          providerEventId,
          runnerEventId,
          sport: "CFB",
          startTime: typeof event.commence_time === "string" ? event.commence_time : undefined,
          homeTeam: homeTeam || undefined,
          awayTeam: awayTeam || undefined,
          bookmakerKey,
          bookmakerName,
          marketKey,
          marketKind: kind,
          selection,
          teamSide,
          participant: description,
          line: number(outcome.point),
          americanPrice: price,
          executable: price !== undefined && Math.abs(price) >= 100,
          status: "open",
          sourceTimestamp: providerTimestamp ?? timing.receivedTimestamp,
          sourceTimestampEstimated: providerTimestamp === undefined,
          receivedTimestamp: timing.receivedTimestamp,
          processedTimestamp: new Date().toISOString(),
          raw: outcome,
        });
      }
    }
  }
  return snapshots;
}
