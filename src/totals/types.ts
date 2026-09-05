import type { FlowDirection, GameRegime } from "../types.js";

export const TOTALS_MARKET_TYPES = [
  "GAME_TOTAL", "TEAM_TOTAL", "FIRST_HALF_TOTAL", "FIRST_HALF_TEAM_TOTAL",
  "SECOND_HALF_TOTAL", "SECOND_HALF_TEAM_TOTAL", "FIRST_QUARTER_TOTAL",
  "FIRST_QUARTER_TEAM_TOTAL", "SECOND_QUARTER_TOTAL", "SECOND_QUARTER_TEAM_TOTAL",
  "THIRD_QUARTER_TOTAL", "THIRD_QUARTER_TEAM_TOTAL", "FOURTH_QUARTER_TOTAL",
  "FOURTH_QUARTER_TEAM_TOTAL",
] as const;
export type TotalsMarketType = typeof TOTALS_MARKET_TYPES[number];
export type TotalsSelection = "OVER" | "UNDER";
export type TotalsWindowStatus = "DETECTED" | "WATCH" | "ARMED" | "ACTIONABLE" | "DECAYING" | "EXPIRED" | "SUPPRESSED";
export type TrendClass = "NEUTRAL" | "DEVELOPING" | "WATCH" | "ACTION_WINDOW_CANDIDATE" | "STRONG_ACTION_WINDOW_CANDIDATE";
export type SuppressionReason = "LOW_EDGE" | "LOW_CONFIDENCE" | "STALE_GAME_FEED" | "STALE_MARKET_FEED" | "GAME_STATE_CONFLICT" | "LOW_LIQUIDITY" | "EXCESSIVE_SPREAD" | "EXCESSIVE_LATENCY" | "MODEL_CONFLICT" | "MARKET_SUSPENDED" | "MISSING_CRITICAL_DATA" | "UNMATCHED_EVENT" | "UNSUPPORTED_MARKET";
export type SetPointType = "END_CURRENT_POSSESSION" | "NEXT_POSSESSION" | "RED_ZONE_ENTRY" | "SCORE" | "TURNOVER" | "MISSED_FIELD_GOAL" | "FOURTH_DOWN_DECISION" | "END_QUARTER" | "HALFTIME" | "OPENING_SECOND_HALF_POSSESSION" | "TEN_MINUTES_Q4" | "SEVEN_THIRTY_Q4" | "FIVE_MINUTES_Q4" | "THREE_MINUTES_Q4" | "TWO_MINUTES_Q4" | "PLAYER_AVAILABILITY_CHANGE" | "REGIME_CHANGE" | "MARKET_SUSPENSION" | "MARKET_REOPEN";

export interface TotalsMarketSnapshot {
  id: string;
  runnerEventId?: string;
  provider: string;
  bookmaker: string;
  marketKey: string;
  marketType: TotalsMarketType;
  selection: TotalsSelection;
  line: number;
  price?: number;
  timestamp: string;
  period?: string;
  teamId?: string;
  suspended?: boolean;
  liquidity?: number;
  bid?: number;
  ask?: number;
}

export interface FootballTotalsInputs {
  runnerEventId: string;
  timestamp: string;
  sourceTimestamp: string;
  period: number;
  clockSecondsRemaining: number;
  currentHomePoints: number;
  currentAwayPoints: number;
  possession?: "HOME" | "AWAY" | "NEUTRAL";
  drivesCompleted?: number;
  homeDrivesCompleted?: number;
  awayDrivesCompleted?: number;
  playsPerDrive?: number;
  secondsPerPlay?: number;
  currentPace?: number;
  homeObservedPointsPerDrive?: number;
  awayObservedPointsPerDrive?: number;
  homePregamePointsPerDrive?: number;
  awayPregamePointsPerDrive?: number;
  homeScoringOpportunities?: number;
  awayScoringOpportunities?: number;
  homeRedZoneEntries?: number;
  awayRedZoneEntries?: number;
  homeExplosivePlays?: number;
  awayExplosivePlays?: number;
  homePressureAllowed?: number;
  awayPressureAllowed?: number;
  turnovers?: number;
  missedFieldGoals?: number;
  failedFourthDowns?: number;
  opportunityPointsExpectation?: number;
  actualOpportunityPoints?: number;
  tempoDirection?: FlowDirection;
  gameRegime?: GameRegime;
  receivingSecondHalf?: "HOME" | "AWAY";
  starterRemoval?: boolean;
  backupQuarterback?: boolean;
  gameFeedState?: { scoreTotal: number; period: number; clockSecondsRemaining: number; timestamp: string };
}

export interface TotalsProjection {
  runnerEventId: string;
  timestamp: string;
  modelVersion: "football-heuristic-v1";
  marketType: TotalsMarketType;
  teamId?: string;
  currentPoints: number;
  projectedPoints: number;
  projectedRemainingPoints: number;
  observedPointsPerDrive?: number;
  adjustedPointsPerDrive: number;
  projectedPointsPerDrive: number;
  expectedRemainingPossessions: number;
  confidence: number;
  assumptions: string[];
  components: Record<string, number | string | boolean | undefined>;
}

export interface TotalsFlowState {
  runnerEventId: string;
  timestamp: string;
  period?: string;
  clock?: string;
  currentHomePoints: number;
  currentAwayPoints: number;
  currentScoreTotal: number;
  projectedFinalTotal?: number;
  projectedHomeTeamTotal?: number;
  projectedAwayTeamTotal?: number;
  projectedCurrentPeriodTotal?: number;
  expectedRemainingPossessions?: number;
  homeExpectedRemainingPossessions?: number;
  awayExpectedRemainingPossessions?: number;
  homeExpectedPointsPerDrive?: number;
  awayExpectedPointsPerDrive?: number;
  scoringPaceDirection: FlowDirection;
  possessionPaceDirection: FlowDirection;
  scoringConversionSuppression?: number;
  scoringOpportunityRate?: number;
  redZoneOpportunityRate?: number;
  explosivePlayPressure?: number;
  clockDrainPressure?: number;
  overTrendScore?: number;
  underTrendScore?: number;
  gameRegime?: GameRegime;
  confidence: number;
  inputs: Record<string, unknown>;
}

export interface TotalsDecisionWindow {
  id: string;
  runnerEventId: string;
  marketType: TotalsMarketType;
  period?: string;
  teamId?: string;
  selection: TotalsSelection;
  marketLine: number;
  marketPrice?: number;
  runnerProjection: number;
  rawEdge: number;
  favorableEdge: number;
  overTrendScore?: number;
  underTrendScore?: number;
  confidence: number;
  status: TotalsWindowStatus;
  detectedAt: string;
  openedAt?: string;
  expiresAt?: string;
  initialEdge?: number;
  peakEdge?: number;
  currentEdge?: number;
  informationDecayIndex?: number;
  secondsRemaining?: number;
  nextSetPoint?: string;
  reasons: string[];
  suppressions?: SuppressionReason[];
  sourceTimestamp?: string;
  processedTimestamp: string;
}

export interface SourceSynchronization {
  confidence: number;
  conflicts: string[];
  gameFeedAgeMs: number;
  marketFeedAgeMs: number;
}

export interface HalftimeTotalsPacket {
  runnerEventId: string;
  timestamp: string;
  score: { home: number; away: number };
  firstHalfPossessions?: number;
  metrics: Record<string, number | string | undefined>;
  projections: TotalsProjection[];
  overTrendScore: number;
  underTrendScore: number;
  confidence: number;
  disposition: "PASS" | "WATCH" | "ACTIONABLE" | "SUPPRESSED";
  suppressions: SuppressionReason[];
}
