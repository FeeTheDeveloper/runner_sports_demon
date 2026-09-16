import type { CanonicalGameState, CanonicalGameTeam, GameStatusState } from "../../types.js";
import { buildRunnerEventId } from "../events/canonicalId.js";

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(record).filter((v): v is Record<string, unknown> => v !== undefined) : [];
}
function number(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function timestamp(value: unknown): string | undefined {
  const candidate = text(value);
  if (!candidate) return undefined;
  const parsed = new Date(candidate);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : undefined;
}
function statusState(status: Record<string, unknown> | undefined): GameStatusState {
  const type = record(status?.type);
  const state = text(type?.state)?.toLowerCase();
  const name = `${text(type?.name) ?? ""} ${text(type?.description) ?? ""}`.toLowerCase();
  if (name.includes("postpon")) return "POSTPONED";
  if (name.includes("cancel")) return "CANCELED";
  if (state === "in") return "IN_PROGRESS";
  if (state === "post" || type?.completed === true) return "FINAL";
  if (state === "pre") return "SCHEDULED";
  return "UNKNOWN";
}
function team(competitor: Record<string, unknown>): CanonicalGameTeam {
  const source = record(competitor.team) ?? {};
  const name = text(source.displayName) ?? text(source.name) ?? text(competitor.displayName);
  if (!name) throw new Error("ESPN competitor is missing a team name");
  const curatedRank = record(competitor.curatedRank);
  const rank = number(curatedRank?.current);
  return {
    providerId: text(source.id) ?? text(competitor.id),
    name,
    shortName: text(source.shortDisplayName),
    abbreviation: text(source.abbreviation),
    rank: rank !== undefined && rank > 0 && rank <= 25 ? rank : undefined,
    score: number(competitor.score),
    winner: typeof competitor.winner === "boolean" ? competitor.winner : undefined,
    logo: text(source.logo),
  };
}
function clockSeconds(clock: string | undefined): number | undefined {
  if (!clock) return undefined;
  const match = clock.match(/^(\d+):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : undefined;
}
function statMap(summary: Record<string, unknown> | undefined, teamId: string | undefined): Record<string, string | number> | undefined {
  if (!summary || !teamId) return undefined;
  const boxscore = record(summary.boxscore);
  const entry = records(boxscore?.teams).find((item) => text(record(item.team)?.id) === teamId);
  if (!entry) return undefined;
  const result: Record<string, string | number> = {};
  for (const stat of records(entry.statistics)) {
    const name = text(stat.name) ?? text(stat.label);
    const value = number(stat.value) ?? text(stat.displayValue);
    if (name && value !== undefined) result[name] = value;
  }
  return Object.keys(result).length ? result : undefined;
}

function competitorStats(competitor: Record<string, unknown>): Record<string, string | number> | undefined {
  const result: Record<string, string | number> = {};
  for (const stat of records(competitor.statistics)) {
    const name = text(stat.name) ?? text(stat.abbreviation);
    const value = number(stat.value) ?? text(stat.displayValue);
    if (name && value !== undefined) result[name] = value;
  }
  return Object.keys(result).length ? result : undefined;
}

export function normalizeEspnGame(
  event: Record<string, unknown>,
  timing: { receivedTimestamp: string },
  summary?: Record<string, unknown>,
): CanonicalGameState {
  const providerEventId = text(event.id);
  if (!providerEventId) throw new Error("ESPN event id is required");
  const competition = records(event.competitions)[0] ?? {};
  const summaryHeader = records(record(summary?.header)?.competitions)[0];
  const authoritativeCompetition = summaryHeader ?? competition;
  const competitors = records(authoritativeCompetition.competitors).length ? records(authoritativeCompetition.competitors) : records(competition.competitors);
  const homeRaw = competitors.find((item) => item.homeAway === "home");
  const awayRaw = competitors.find((item) => item.homeAway === "away");
  if (!homeRaw || !awayRaw) throw new Error(`ESPN event ${String(event.id ?? "unknown")} is missing home/away competitors`);
  const home = team(homeRaw);
  const away = team(awayRaw);
  const startTime = timestamp(event.date ?? authoritativeCompetition.date ?? competition.date);
  if (!startTime) throw new Error(`ESPN event ${String(event.id ?? "unknown")} has no valid start time`);
  const status = record(authoritativeCompetition.status) ?? record(event.status) ?? record(competition.status);
  const statusType = record(status?.type);
  const situation = record(authoritativeCompetition.situation) ?? record(competition.situation);
  const summaryDrives = record(summary?.drives);
  const currentDrive = record(summaryDrives?.current);
  const possessionId = text(situation?.possession) ?? text(record(currentDrive?.team)?.id);
  const possession = possessionId && possessionId === home.providerId ? "HOME" : possessionId && possessionId === away.providerId ? "AWAY" : possessionId ? "UNKNOWN" : undefined;
  const clock = text(status?.displayClock);
  const providerSourceTimestamp = timestamp(authoritativeCompetition.lastUpdated ?? status?.lastUpdated ?? event.lastUpdated);
  const venue = record(authoritativeCompetition.venue);
  const broadcasts = records(authoritativeCompetition.broadcasts).flatMap((broadcast) => Array.isArray(broadcast.names) ? broadcast.names.filter((name): name is string => typeof name === "string") : []);
  const drives = [...records(summaryDrives?.previous), ...(currentDrive ? [currentDrive] : [])].map((drive) => {
    const driveTeam = text(record(drive.team)?.id);
    return {
      id: text(drive.id), team: driveTeam === home.providerId ? "HOME" as const : driveTeam === away.providerId ? "AWAY" as const : undefined,
      description: text(drive.description), result: text(drive.displayResult) ?? text(drive.result),
      start: text(record(drive.start)?.text), end: text(record(drive.end)?.text), plays: number(drive.plays),
    };
  });
  const homeStats = statMap(summary, home.providerId) ?? competitorStats(homeRaw);
  const awayStats = statMap(summary, away.providerId) ?? competitorStats(awayRaw);
  const plays = records(summary?.plays).map((play) => {
    const playTeam = text(record(play.team)?.id);
    return {
      id: text(play.id),
      sequence: number(play.sequenceNumber),
      type: text(record(play.type)?.text),
      text: text(play.text),
      period: number(record(play.period)?.number),
      clock: text(record(play.clock)?.displayValue),
      team: playTeam === home.providerId ? "HOME" as const : playTeam === away.providerId ? "AWAY" as const : undefined,
      scoringPlay: typeof play.scoringPlay === "boolean" ? play.scoringPlay : undefined,
      scoreValue: number(play.scoreValue),
    };
  });
  return {
    runnerEventId: buildRunnerEventId({ sport: "CFB", startsAt: startTime, awayTeam: away.name, homeTeam: home.name, awayCode: away.abbreviation, homeCode: home.abbreviation }),
    sport: "CFB",
    league: "NCAA",
    provider: "espn",
    providerEventId,
    startTime,
    status: statusState(status),
    statusDetail: text(statusType?.detail) ?? text(statusType?.shortDetail) ?? text(statusType?.description),
    completed: typeof statusType?.completed === "boolean" ? statusType.completed : undefined,
    home,
    away,
    period: number(status?.period),
    clock,
    clockSecondsRemaining: clockSeconds(clock),
    possession,
    down: number(situation?.down),
    distance: number(situation?.distance),
    yardLine: number(situation?.yardLine),
    situationText: text(situation?.shortDownDistanceText) ?? text(situation?.downDistanceText),
    venue: text(venue?.fullName),
    broadcasts: broadcasts.length ? broadcasts : undefined,
    stats: homeStats || awayStats ? { home: homeStats, away: awayStats } : undefined,
    drives: drives.length ? drives : undefined,
    plays: plays.length ? plays : undefined,
    sourceTimestamp: providerSourceTimestamp ?? timing.receivedTimestamp,
    sourceTimestampEstimated: providerSourceTimestamp === undefined,
    receivedTimestamp: timing.receivedTimestamp,
    processedTimestamp: new Date().toISOString(),
  };
}

export function espnScoreboardEvents(payload: unknown): Record<string, unknown>[] {
  return records(record(payload)?.events);
}
