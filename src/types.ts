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
