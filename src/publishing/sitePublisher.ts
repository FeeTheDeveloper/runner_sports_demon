import type { GameFlowSnapshot, NormalizedMarket, ProviderHealth } from "../types.js";
import { baselineImpliedProbability, type ProbabilityPrediction } from "../models/probability/baseline.js";
import type { TotalsDecisionWindow, TotalsFlowState, TotalsProjection } from "../totals/types.js";
import { boolEnv, intEnv, optionalStringEnv } from "../utils/env.js";

export interface ForecastPublishInput {
  market: NormalizedMarket;
  prediction: ProbabilityPrediction;
  sport?: string;
  eventId?: string;
  event?: string;
  marketType?: string;
  selection?: string;
  line?: number;
  price?: number;
  expiresAt?: string;
}

export interface PickHealthPublishInput {
  id: string;
  runnerEventId?: string;
  forecastId?: string;
  sport: string;
  eventId?: string;
  event: string;
  selection: string;
  status: "HEALTHY" | "STABLE" | "WEAKENING" | "AT_RISK" | "BROKEN" | "RESOLVED";
  healthScore?: number;
  score?: number;
  originalThesis?: string;
  structuralIntegrity?: string;
  favorableFactors?: string[];
  adverseFactors?: string[];
  invalidationReasons?: string[];
  reasons?: string[];
  asOf?: string;
  payload?: Record<string, unknown>;
}

export interface PublisherContext {
  sport?: string;
  eventId?: string;
  event?: string;
}

export interface PublishTickInput {
  markets: NormalizedMarket[];
  health: ProviderHealth[];
  engineStatus: string;
  marketEventCount: number;
  priceEventCount: number;
  forecasts?: ForecastPublishInput[];
  gameFlow?: GameFlowSnapshot[];
  totals?: Array<{ flow: TotalsFlowState; projections: TotalsProjection[]; windows: TotalsDecisionWindow[] }>;
  pickHealth?: PickHealthPublishInput[];
  publishedAt?: string;
}

const freshness = (timestamp?: string, now = Date.now()): "fresh" | "stale" | "unknown" => {
  if (!timestamp) return "unknown";
  const age = now - Date.parse(timestamp);
  return Number.isFinite(age) && age <= 5 * 60_000 ? "fresh" : "stale";
};

const text = (value: string | undefined, fallback: string) => value?.trim() || fallback;

export class SitePublisher {
  readonly enabled: boolean;
  readonly timeoutMs: number;
  readonly heartbeatMs: number;
  private readonly baseUrl?: string;
  private readonly serviceRoleKey?: string;
  private lastHeartbeatAt = 0;

  constructor() {
    this.baseUrl = optionalStringEnv("RUNNER_SITE_SUPABASE_URL");
    this.serviceRoleKey = optionalStringEnv("RUNNER_SITE_SUPABASE_SERVICE_ROLE_KEY");
    this.timeoutMs = intEnv("RUNNER_PUBLISH_TIMEOUT_MS", 10_000);
    this.heartbeatMs = intEnv("RUNNER_HEARTBEAT_MS", 30_000);
    this.enabled = boolEnv("RUNNER_PUBLISH_ENABLED", true) && Boolean(this.baseUrl && this.serviceRoleKey);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async publishTick(input: PublishTickInput): Promise<void> {
    if (!this.enabled) return;
    const publishedAt = input.publishedAt ?? new Date().toISOString();
    const shouldPublishHeartbeat = Date.now() - this.lastHeartbeatAt >= this.heartbeatMs || input.engineStatus !== "running";
    if (!shouldPublishHeartbeat) return;
    this.lastHeartbeatAt = Date.now();

    const forecasts = input.forecasts ?? input.markets.flatMap((market) => {
      const prediction = baselineImpliedProbability(market);
      return prediction ? [{ market, prediction }] : [];
    });
    await Promise.all([
      this.publishEngineStatus({
        status: input.engineStatus,
        heartbeatAt: publishedAt,
        activeProviders: input.health.filter((entry) => entry.connected).map((entry) => entry.provider),
        activeGames: new Set(input.markets.map((market) => market.runnerEventId).filter(Boolean)).size,
        metadata: { marketEventCount: input.marketEventCount, priceEventCount: input.priceEventCount },
      }),
      this.publishProviderHealth(input.health, publishedAt),
      this.publishForecasts(forecasts, publishedAt),
      input.gameFlow?.length ? this.publishGameFlow(input.gameFlow, publishedAt) : Promise.resolve(),
      input.totals?.length ? this.publishTotals(input.totals, publishedAt) : Promise.resolve(),
      input.totals?.length ? this.publishSignals(input.totals.flatMap((evaluation) => evaluation.windows), publishedAt) : Promise.resolve(),
      input.pickHealth?.length ? this.publishPickHealth(input.pickHealth, publishedAt) : Promise.resolve(),
    ]);
  }

  async publishEngineStatus(input: {
    status: string;
    heartbeatAt?: string;
    lastSuccessfulPublishAt?: string;
    activeProviders?: string[];
    activeGames?: number;
    sqliteStatus?: string;
    errorSummary?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const now = input.heartbeatAt ?? new Date().toISOString();
    await this.upsert("runner_engine_status", [{
      id: "runner-sports-demon",
      status: input.status,
      heartbeat_at: now,
      last_successful_publish_at: input.lastSuccessfulPublishAt ?? now,
      sqlite_status: input.sqliteStatus ?? "ready",
      active_providers: input.activeProviders ?? [],
      active_games: input.activeGames ?? 0,
      error_summary: input.errorSummary ?? null,
      as_of: now,
      freshness: "fresh",
      metadata: input.metadata ?? {},
      updated_at: now,
    }]);
  }

  async publishProviderHealth(entries: ProviderHealth[], publishedAt = new Date().toISOString()): Promise<void> {
    await this.upsert("runner_provider_status", entries.map((entry) => ({
      id: entry.provider,
      provider: entry.provider,
      status: entry.connected ? "CONNECTED" : "DISCONNECTED",
      last_success_at: entry.lastMessageAt ?? null,
      last_error_at: entry.lastError ? publishedAt : null,
      latency_ms: entry.latencyMs ?? null,
      latest_message: entry.lastMessageAt ? "provider message received" : null,
      latest_error: entry.lastError ?? null,
      event_count: entry.eventCount,
      as_of: entry.lastMessageAt ?? publishedAt,
      freshness: freshness(entry.lastMessageAt),
      metadata: { reconnectAttempts: entry.reconnectAttempts },
      updated_at: publishedAt,
    })));
  }

  async publishForecasts(entries: ForecastPublishInput[], publishedAt = new Date().toISOString()): Promise<void> {
    await this.upsert("runner_forecasts", entries.map(({ market, prediction, ...context }) => {
      const asOf = market.processedTimestamp ?? publishedAt;
      return {
        id: prediction.marketId,
        runner_event_id: market.runnerEventId ?? null,
        sport: text(context.sport ?? market.sport, "unknown"),
        event_id: context.eventId ?? market.eventId ?? market.runnerEventId ?? null,
        event: text(context.event ?? market.title, market.id),
        market_type: text(context.marketType, "UNKNOWN"),
        market: market.title,
        selection: text(context.selection ?? market.contractSide, "YES"),
        forecast_type: prediction.modelName,
        probability: prediction.fairProbability,
        fair_probability: prediction.fairProbability,
        fair_price: prediction.fairProbability,
        edge: market.yesPrice === undefined ? null : prediction.fairProbability - market.yesPrice,
        line: context.line ?? null,
        price: context.price ?? market.yesPrice ?? null,
        confidence: prediction.confidenceScore / 100,
        model_version: prediction.modelName,
        state_version_hash: null,
        source: "runner_demon",
        source_timestamp: market.sourceTimestamp,
        as_of: asOf,
        expires_at: context.expiresAt ?? null,
        freshness: freshness(asOf),
        payload: { marketId: market.id, provider: market.provider },
        published_at: publishedAt,
        updated_at: publishedAt,
      };
    }));
  }

  async publishGameFlow(snapshots: GameFlowSnapshot[], publishedAt = new Date().toISOString(), context: PublisherContext = {}): Promise<void> {
    await this.upsert("runner_game_flow", snapshots.map((snapshot) => ({
      id: snapshot.runnerEventId,
      runner_event_id: snapshot.runnerEventId,
      sport: text(context.sport, "unknown"),
      event_id: context.eventId ?? snapshot.runnerEventId,
      period: snapshot.period === undefined ? null : String(snapshot.period),
      clock: snapshot.clockSecondsRemaining === undefined ? null : `${Math.floor(snapshot.clockSecondsRemaining / 60)}:${String(snapshot.clockSecondsRemaining % 60).padStart(2, "0")}`,
      home_score: snapshot.homeScore ?? null,
      away_score: snapshot.awayScore ?? null,
      possession: snapshot.possession ?? null,
      regime: snapshot.regime,
      momentum: snapshot.momentum,
      tempo: snapshot.tempo ?? null,
      structural_control: snapshot.structuralControl ?? null,
      latent_states: snapshot.latentStates,
      coaching_adjustments: snapshot.coachingAdjustments,
      state: snapshot.momentumDirection,
      as_of: snapshot.updatedAt,
      freshness: freshness(snapshot.updatedAt),
      payload: snapshot,
      updated_at: publishedAt,
    })));
  }

  async publishTotals(evaluations: Array<{ flow: TotalsFlowState; projections: TotalsProjection[]; windows: TotalsDecisionWindow[] }>, publishedAt = new Date().toISOString(), context: PublisherContext = {}): Promise<void> {
    await this.publishTotalsState(evaluations.map(({ flow, projections }) => ({ flow, projections })), publishedAt, context);
    await this.publishTotalsWindows(evaluations.flatMap(({ windows }) => windows), publishedAt, context);
  }

  async publishTotalsState(evaluations: Array<{ flow: TotalsFlowState; projections: TotalsProjection[] }>, publishedAt = new Date().toISOString(), context: PublisherContext = {}): Promise<void> {
    const states = evaluations.map(({ flow, projections }) => {
      const game = projections.find((projection) => projection.marketType === "GAME_TOTAL");
      return {
        id: flow.runnerEventId,
        runner_event_id: flow.runnerEventId,
        sport: text(context.sport, "unknown"),
        event_id: context.eventId ?? flow.runnerEventId,
        event: text(context.event, flow.runnerEventId),
        line: null,
        over_probability: null,
        under_probability: null,
        projection: game?.projectedPoints ?? flow.projectedFinalTotal ?? null,
        current_score_total: flow.currentScoreTotal,
        projected_final: flow.projectedFinalTotal ?? null,
        projected_home_total: flow.projectedHomeTeamTotal ?? null,
        projected_away_total: flow.projectedAwayTeamTotal ?? null,
        expected_remaining_possessions: flow.expectedRemainingPossessions ?? null,
        adjusted_efficiency: game?.projectedPointsPerDrive ?? null,
        over_trend_score: flow.overTrendScore ?? null,
        under_trend_score: flow.underTrendScore ?? null,
        suppression_indicators: { scoringConversionSuppression: flow.scoringConversionSuppression },
        edge: null,
        confidence: flow.confidence >= 0.75 ? "HIGH" : flow.confidence >= 0.6 ? "MEDIUM" : "LOW",
        as_of: flow.timestamp,
        freshness: freshness(flow.timestamp),
        payload: flow,
        updated_at: publishedAt,
      };
    });
    await this.upsert("runner_totals", states);
  }

  async publishTotalsWindows(entries: TotalsDecisionWindow[], publishedAt = new Date().toISOString(), context: PublisherContext = {}): Promise<void> {
    const windows = entries.map((window) => ({
      id: window.id,
      runner_event_id: window.runnerEventId,
      sport: text(context.sport, "unknown"),
      window_type: window.marketType,
      start_at: window.openedAt ?? window.detectedAt,
      end_at: window.expiresAt ?? null,
      decision_state: window.status,
      line: window.marketLine,
      projection: window.runnerProjection,
      edge: window.favorableEdge,
      source_timestamp: window.sourceTimestamp ?? null,
      published_at: publishedAt,
      metadata: window,
      updated_at: publishedAt,
    })));
    await this.upsert("runner_totals_windows", windows);
  }

  async publishSignals(entries: TotalsDecisionWindow[], publishedAt = new Date().toISOString(), context: PublisherContext = {}): Promise<void> {
    await this.upsert("runner_signals", entries.map((window) => ({
      id: window.id,
      signal_id: window.id,
      runner_event_id: window.runnerEventId,
      sport: text(context.sport, "unknown"),
      event_id: context.eventId ?? window.runnerEventId,
      event: text(context.event, window.runnerEventId),
      signal_type: window.reasons[0] ?? window.marketType,
      market_type: window.marketType,
      market: window.marketType,
      selection: window.selection,
      direction: window.selection,
      strength: Math.abs(window.favorableEdge) * window.confidence,
      line: window.marketLine,
      market_price: window.marketPrice ?? null,
      runner_projection: window.runnerProjection,
      edge: window.favorableEdge,
      confidence: window.confidence,
      status: window.status,
      reasons: window.reasons,
      suppressions: window.suppressions ?? [],
      detected_at: window.detectedAt,
      opened_at: window.openedAt ?? null,
      expires_at: window.expiresAt ?? null,
      next_set_point: window.nextSetPoint ?? null,
      headline: `${window.selection} ${window.marketType} ${window.status.toLowerCase()}`,
      as_of: window.processedTimestamp,
      freshness: freshness(window.processedTimestamp),
      payload: window,
      updated_at: publishedAt,
    })));
  }

  async publishPickHealth(entries: PickHealthPublishInput[], publishedAt = new Date().toISOString()): Promise<void> {
    await this.upsert("runner_pick_health", entries.map((entry) => ({
      id: entry.id,
      runner_event_id: entry.runnerEventId ?? null,
      forecast_id: entry.forecastId ?? null,
      sport: entry.sport,
      event_id: entry.eventId ?? entry.runnerEventId ?? null,
      event: entry.event,
      selection: entry.selection,
      status: entry.status,
      health_score: entry.healthScore ?? null,
      score: entry.score ?? entry.healthScore ?? null,
      original_thesis: entry.originalThesis ?? null,
      structural_integrity: entry.structuralIntegrity ?? null,
      favorable_factors: entry.favorableFactors ?? [],
      adverse_factors: entry.adverseFactors ?? [],
      invalidation_reasons: entry.invalidationReasons ?? [],
      reasons: entry.reasons ?? [],
      as_of: entry.asOf ?? publishedAt,
      freshness: freshness(entry.asOf ?? publishedAt),
      payload: entry.payload ?? {},
      updated_at: publishedAt,
    })));
  }

  private async upsert(table: string, rows: Record<string, unknown>[]): Promise<void> {
    if (!rows.length) return;
    const url = new URL(`/rest/v1/${table}`, this.baseUrl!);
    url.searchParams.set("on_conflict", "id");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.serviceRoleKey!,
        Authorization: "Bearer " + this.serviceRoleKey!,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Site publisher failed for ${table}: ${response.status} ${response.statusText} ${responseText.slice(0, 300)}`);
    }
  }
}
