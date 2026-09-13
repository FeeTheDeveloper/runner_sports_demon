import { buildRunnerEventId } from "../../normalization/events/canonicalId.js";
import { fetchJson } from "../../utils/http.js";
import type { CfbGame, GameStatus } from "../types.js";

interface EspnCompetitor { team?: { displayName?: string; abbreviation?: string }; homeAway?: string; score?: string; curatedRank?: { current?: number }; }
interface EspnCompetition { id?: string; date?: string; competitors?: EspnCompetitor[]; venue?: { fullName?: string }; status?: { type?: { state?: string; description?: string; detail?: string }; period?: number; displayClock?: string }; situation?: { possession?: string }; }
interface EspnScoreboard { events?: Array<{ id?: string; date?: string; competitions?: EspnCompetition[] }>; }

export function mapEspnStatus(state?: string): GameStatus {
  if (state === "in") return "in_progress";
  if (state === "post") return "final";
  if (state === "scheduled") return "scheduled";
  if (state === "canceled") return "canceled";
  if (state === "postponed") return "postponed";
  return "unknown";
}

export function normalizeEspnScoreboard(payload: EspnScoreboard, receivedTimestamp: string, processedTimestamp = new Date().toISOString()): CfbGame[] {
  return (payload.events ?? []).flatMap((event) => {
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
    return [{
      runnerEventId: buildRunnerEventId({ sport: "CFB", startsAt: kickoff, awayTeam, homeTeam, awayCode: away?.team?.abbreviation, homeCode: home?.team?.abbreviation }),
      providerEventId: event.id,
      sport: "CFB",
      league: "NCAAF",
      awayTeam,
      homeTeam,
      awayAbbreviation: away?.team?.abbreviation,
      homeAbbreviation: home?.team?.abbreviation,
      awayRank: validRank(away?.curatedRank?.current),
      homeRank: validRank(home?.curatedRank?.current),
      kickoff,
      venue: competition?.venue?.fullName,
      status: mapEspnStatus(state?.state),
      statusDetail: state?.detail ?? state?.description,
      period: competition?.status?.period,
      clock: competition?.status?.displayClock,
      possession: possession === away?.team?.displayName || possession === away?.team?.abbreviation ? "AWAY" : possession === home?.team?.displayName || possession === home?.team?.abbreviation ? "HOME" : undefined,
      awayScore: parseScore(away?.score),
      homeScore: parseScore(home?.score),
      source: "espn",
      sourceTimestamp,
      receivedTimestamp,
      processedTimestamp,
      raw: event,
    }];
  });
}

function validRank(rank?: number): number | undefined { return rank !== undefined && rank > 0 && rank < 26 ? rank : undefined; }
function parseScore(score?: string): number | undefined { const parsed = Number(score); return Number.isFinite(parsed) ? parsed : undefined; }

export class EspnCfbScheduleClient {
  private readonly baseUrl = process.env.ESPN_SCOREBOARD_URL ?? "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard";

  async fetch(date = new Date().toISOString().slice(0, 10)): Promise<CfbGame[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("dates", date.replaceAll("-", ""));
    url.searchParams.set("limit", "500");
    const result = await fetchJson<EspnScoreboard>(url);
    return normalizeEspnScoreboard(result.data, result.receivedAt);
  }
}