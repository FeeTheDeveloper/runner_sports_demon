import { buildRunnerEventId } from "../../normalization/events/canonicalId.js";
import { fetchJson } from "../../utils/http.js";
import type { CfbGame, FootballGame, GameStatus, NflGame } from "../types.js";

interface EspnCompetitor { team?: { displayName?: string; abbreviation?: string }; homeAway?: string; score?: string; curatedRank?: { current?: number }; }
interface EspnCompetition { id?: string; date?: string; competitors?: EspnCompetitor[]; venue?: { fullName?: string }; status?: { type?: { state?: string; description?: string; detail?: string }; period?: number; displayClock?: string }; situation?: { possession?: string }; }
interface EspnScoreboard { events?: Array<{ id?: string; date?: string; competitions?: EspnCompetition[] }>; }

type FootballFlavor = { sport: "CFB"; league: "NCAAF" } | { sport: "NFL"; league: "NFL" };

export function mapEspnStatus(state?: string): GameStatus {
  if (state === "in") return "in_progress";
  if (state === "post") return "final";
  if (state === "scheduled") return "scheduled";
  if (state === "canceled") return "canceled";
  if (state === "postponed") return "postponed";
  return "unknown";
}

export function normalizeEspnFootballScoreboard(
  payload: EspnScoreboard,
  receivedTimestamp: string,
  flavor: FootballFlavor,
  processedTimestamp = new Date().toISOString(),
): FootballGame[] {
  return (payload.events ?? []).flatMap((event): FootballGame[] => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors ?? [];
    const away = competitors.find((competitor) => competitor.homeAway === "away");
    const home = competitors.find((competitor) => competitor.homeAway === "home");
    const awayTeam = away?.team?.displayName;
    const homeTeam = home?.team?.displayName;
    const kickoff = event.date ?? competition?.date;
    if (!event.id || !awayTeam || !homeTeam || !kickoff) return [];
    const sourceTimestamp = event.date ?? kickoff;
    const state = competition?.status?.type;
    const possession = competition?.situation?.possession;
    const base = {
      runnerEventId: buildRunnerEventId({ sport: flavor.sport, startsAt: kickoff, awayTeam, homeTeam, awayCode: away?.team?.abbreviation, homeCode: home?.team?.abbreviation }),
      providerEventId: event.id,
      awayTeam,
      homeTeam,
      awayAbbreviation: away?.team?.abbreviation,
      homeAbbreviation: home?.team?.abbreviation,
      awayRank: flavor.sport === "CFB" ? validRank(away?.curatedRank?.current) : undefined,
      homeRank: flavor.sport === "CFB" ? validRank(home?.curatedRank?.current) : undefined,
      kickoff,
      venue: competition?.venue?.fullName,
      status: mapEspnStatus(state?.state),
      statusDetail: state?.detail ?? state?.description,
      period: competition?.status?.period,
      clock: competition?.status?.displayClock,
      possession: possession === away?.team?.displayName || possession === away?.team?.abbreviation ? "AWAY" as const : possession === home?.team?.displayName || possession === home?.team?.abbreviation ? "HOME" as const : undefined,
      awayScore: parseScore(away?.score),
      homeScore: parseScore(home?.score),
      source: "espn" as const,
      sourceTimestamp,
      receivedTimestamp,
      processedTimestamp,
      raw: event,
    };
    return flavor.sport === "NFL"
      ? [{ ...base, sport: "NFL" as const, league: "NFL" as const }]
      : [{ ...base, sport: "CFB" as const, league: "NCAAF" as const }];
  });
}

export function normalizeEspnScoreboard(payload: EspnScoreboard, receivedTimestamp: string, processedTimestamp = new Date().toISOString()): CfbGame[] {
  return normalizeEspnFootballScoreboard(payload, receivedTimestamp, { sport: "CFB", league: "NCAAF" }, processedTimestamp) as CfbGame[];
}

export function normalizeEspnNflScoreboard(payload: EspnScoreboard, receivedTimestamp: string, processedTimestamp = new Date().toISOString()): NflGame[] {
  return normalizeEspnFootballScoreboard(payload, receivedTimestamp, { sport: "NFL", league: "NFL" }, processedTimestamp) as NflGame[];
}

function validRank(rank?: number): number | undefined { return rank !== undefined && rank > 0 && rank < 26 ? rank : undefined; }
function parseScore(score?: string): number | undefined { const parsed = Number(score); return Number.isFinite(parsed) ? parsed : undefined; }

abstract class EspnFootballScheduleClient<T extends FootballGame> {
  protected abstract readonly baseUrl: string;
  protected abstract normalize(payload: EspnScoreboard, receivedTimestamp: string): T[];

  async fetch(date = new Date().toISOString().slice(0, 10)): Promise<T[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("dates", date.replaceAll("-", ""));
    url.searchParams.set("limit", "500");
    const result = await fetchJson<EspnScoreboard>(url);
    return this.normalize(result.data, result.receivedAt);
  }
}

export class EspnCfbScheduleClient extends EspnFootballScheduleClient<CfbGame> {
  protected readonly baseUrl = process.env.ESPN_CFB_SCOREBOARD_URL ?? process.env.ESPN_SCOREBOARD_URL ?? "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard";
  protected normalize(payload: EspnScoreboard, receivedTimestamp: string): CfbGame[] { return normalizeEspnScoreboard(payload, receivedTimestamp); }
}

export class EspnNflScheduleClient extends EspnFootballScheduleClient<NflGame> {
  protected readonly baseUrl = process.env.ESPN_NFL_SCOREBOARD_URL ?? "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
  protected normalize(payload: EspnScoreboard, receivedTimestamp: string): NflGame[] { return normalizeEspnNflScoreboard(payload, receivedTimestamp); }
}
