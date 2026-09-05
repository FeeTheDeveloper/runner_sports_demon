export type Provider = "kalshi" | "polymarket" | "odds_api" | "espn";

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
