export type GameStatus = "scheduled" | "in_progress" | "final" | "postponed" | "canceled" | "unknown";

interface BaseFootballGame {
  runnerEventId: string;
  providerEventId: string;
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

export interface CfbGame extends BaseFootballGame {
  sport: "CFB";
  league: "NCAAF";
}

export interface NflGame extends BaseFootballGame {
  sport: "NFL";
  league: "NFL";
}

export type FootballGame = CfbGame | NflGame;
