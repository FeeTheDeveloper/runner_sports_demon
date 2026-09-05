export type Provider = "kalshi" | "polymarket" | "odds_api" | "espn";

export type ObservationSource =
  | "GAME_FEED"
  | "YOUTUBE_TV_OBSERVATION"
  | "HUMAN_ANALYST"
  | "CLAUDE_RESEARCH"
  | "RUNNER_AI"
  | "VERIFIED_NEWS";

export type GameRegime =
  | "BALANCED"
  | "FAVORITE_CONTROL"
  | "UNDERDOG_CONTROL"
  | "VOLATILE"
  | "COMEBACK_WINDOW"
  | "LATE_GAME"
  | "BLOWOUT"
  | "GARBAGE_TIME"
  | "OVERTIME_RISK";

export type FlowDirection = "RISING" | "FALLING" | "STABLE" | "REVERSING" | "UNKNOWN";

export interface TotalsFlowState {
  runnerEventId: string;
  timestamp: string;
  currentScoreTotal: number;
  projectedFinalTotal?: number;
  projectedHomeTeamTotal?: number;
  projectedAwayTeamTotal?: number;
  expectedRemainingPossessions?: number;
  homeExpectedPointsPerDrive?: number;
  awayExpectedPointsPerDrive?: number;
  scoringPaceDirection: FlowDirection;
  possessionPaceDirection: FlowDirection;
  scoringConversionSuppression?: number;
  redZoneOpportunityRate?: number;
  explosivePlayPressure?: number;
  clockDrainPressure?: number;
  overTrendScore?: number;
  underTrendScore?: number;
}

export type TotalsSignalType =
  | "TOTAL_OVER_BUILDING" | "TOTAL_UNDER_BUILDING"
  | "TEAM_TOTAL_OVER_BUILDING" | "TEAM_TOTAL_UNDER_BUILDING"
  | "HALFTIME_OVER_WINDOW" | "HALFTIME_UNDER_WINDOW"
  | "SECOND_HALF_OVER_WINDOW" | "SECOND_HALF_UNDER_WINDOW"
  | "QUARTER_OVER_WINDOW" | "QUARTER_UNDER_WINDOW"
  | "SCORING_CONVERSION_SUPPRESSION" | "SCORING_REGRESSION_CANDIDATE"
  | "PACE_ACCELERATION" | "PACE_COLLAPSE" | "CLOCK_DRAIN" | "RED_ZONE_SUPPRESSION"
  | "GARBAGE_TIME_OVER" | "GARBAGE_TIME_UNDER" | "TOTAL_MARKET_LAG"
  | "TOTAL_MARKET_OVERREACTION" | "TOTAL_MARKET_UNDERREACTION";

export type TotalsWindowStatus =
  | "DETECTED" | "WATCH" | "ARMED" | "ACTIONABLE"
  | "DECAYING" | "EXPIRED" | "SUPPRESSED";

export type NextSetPointType =
  | "END_CURRENT_POSSESSION" | "NEXT_POSSESSION" | "SCORE" | "TURNOVER"
  | "RED_ZONE_ENTRY" | "END_QUARTER" | "HALFTIME" | "OPENING_3Q_DRIVE"
  | "Q4_10:00" | "Q4_7:30" | "Q4_5:00" | "Q4_3:00" | "Q4_2:00"
  | "MAJOR_INJURY" | "MARKET_SUSPENSION_REOPEN";

export interface TotalsDecisionWindow {
  id: string;
  runnerEventId: string;
  marketType: string;
  selection: string;
  marketLine: number;
  marketPrice?: number;
  runnerProjection: number;
  edge: number;
  overTrendScore?: number;
  underTrendScore?: number;
  confidence: number;
  status: TotalsWindowStatus;
  openedAt?: string;
  expiresAt?: string;
  peakEdge?: number;
  currentEdge?: number;
  nextSetPoint?: string;
  reasons: string[];
  suppressions?: string[];
  market?: string;
  detectedAt?: string;
  windowOpenedAt?: string;
  windowExpiresAt?: string;
  secondsRemaining?: number;
  nextSetPointType?: NextSetPointType;
  nextSetPointReason?: string;
  marketsToReevaluate?: string[];
}

export type LatentStateType =
  | "PLAYER_LIMITATION"
  | "PLAYER_ROLE_SHIFT"
  | "SUBSTITUTION"
  | "SNAP_RESTRICTION"
  | "SCHEME_SHIFT"
  | "COVERAGE_CHANGE"
  | "BLITZ_CHANGE"
  | "TEMPO_CHANGE"
  | "FATIGUE"
  | "WEATHER_CHANGE"
  | "COACHING_ADJUSTMENT"
  | "LINEUP_CHANGE";

export interface GameFlowObservation {
  id: string;
  runnerEventId: string;
  source: ObservationSource;
  observedAt: string;
  receivedAt: string;
  confidence: number;
  sport?: string;
  homeScore?: number;
  awayScore?: number;
  period?: number;
  clockSecondsRemaining?: number;
  possession?: "HOME" | "AWAY" | "NEUTRAL";
  tempo?: number;
  possessionDominance?: number;
  pressure?: number;
  efficiency?: number;
  fatigue?: number;
  structuralControl?: number;
  latentStates?: LatentStateType[];
  playerAvailability?: Record<string, number>;
  unitPerformance?: Record<string, number>;
  coachingAdjustment?: string;
  notes?: string;
}

export interface GameFlowSnapshot {
  runnerEventId: string;
  updatedAt: string;
  observationCount: number;
  homeScore?: number;
  awayScore?: number;
  period?: number;
  clockSecondsRemaining?: number;
  possession?: GameFlowObservation["possession"];
  momentum: number;
  momentumDirection: FlowDirection;
  tempo?: number;
  possessionDominance?: number;
  pressure?: number;
  efficiency?: number;
  fatigue?: number;
  structuralControl?: number;
  regime: GameRegime;
  latentStates: LatentStateType[];
  playerAvailability: Record<string, number>;
  unitPerformance: Record<string, number>;
  coachingAdjustments: string[];
  transitions: Array<{ from: GameRegime; to: GameRegime; observedAt: string }>;
  latestObservationId: string;
  totals: TotalsFlowState;
  totalsSignals: TotalsSignalType[];
}

export interface ProviderHealth {
  provider: Provider;
  connected: boolean;
  lastMessageAt?: string;
  lastError?: string;
  reconnectAttempts: number;
  eventCount: number;
  latencyMs?: number;
}

export interface RawProviderEvent {
  provider: Provider;
  receivedTimestamp: string;
  sourceTimestamp: string;
  payload: unknown;
  latencyMs?: number;
}

export interface NormalizedMarket {
  id: string;
  provider: "kalshi" | "polymarket";
  externalId: string;
  eventId?: string;
  runnerEventId?: string;
  title: string;
  category?: string;
  sport?: string;
  teams?: string[];
  participants?: string[];
  contractSide?: string;
  yesPrice?: number;
  noPrice?: number;
  bid?: number;
  ask?: number;
  spread?: number;
  lastTradedPrice?: number;
  orderBookDepth?: number;
  volume?: number;
  openInterest?: number;
  liquidity?: number;
  timestamp: string;
  sourceTimestamp: string;
  receivedTimestamp: string;
  processedTimestamp: string;
  marketStatus: string;
  raw: unknown;
}

export interface MarketEvent {
  market: NormalizedMarket;
  eventType: "snapshot" | "price_change" | "orderbook" | "trade" | "status_change";
  changeHash: string;
}

export interface Connector {
  readonly provider: Provider;
  health(): ProviderHealth;
  fetchMarkets(limit?: number): Promise<NormalizedMarket[]>;
}
