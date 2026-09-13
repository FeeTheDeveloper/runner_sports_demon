export type GameStatus = "scheduled" | "in_progress" | "final" | "postponed" | "canceled" | "unknown";

export interface CfbGame {
  runnerEventId: string;
  providerEventId: string;
  sport: "CFB";
  league: "NCAAF";
  awayTeam: string;
  homeTeam: string;
  awayAbbreviation?: string;
  homeAbbreviation?: string;
  awayRank?: number;
  homeRank?: number;
  kickoff: string;
  venue?: string;
  status: GameStatus;
  statusDetail?: string;
  period?: number;
  clock?: string;
  possession?: "HOME" | "AWAY";
  awayScore?: number;
  homeScore?: number;
  source: "espn";
  sourceTimestamp: string;
  receivedTimestamp: string;
  processedTimestamp: string;
  raw: unknown;
}