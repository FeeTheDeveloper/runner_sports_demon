import { stableHash } from "../utils/hash.js";
import type {
  FlowDirection,
  GameFlowObservation,
  GameFlowSnapshot,
  NextSetPointType,
  TotalsDecisionWindow,
  TotalsFlowState,
  TotalsSignalType,
  TotalsWindowStatus,
} from "../types.js";

const DEFAULT_MARKETS = ["GAME_TOTAL", "TEAM_TOTAL", "HALFTIME_TOTAL", "QUARTER_TOTAL"];

export function deriveTotalsFlowState(
  observations: GameFlowObservation[],
  snapshot: Pick<GameFlowSnapshot, "runnerEventId" | "updatedAt" | "homeScore" | "awayScore" | "period" | "clockSecondsRemaining">,
): TotalsFlowState {
  const currentScoreTotal = (snapshot.homeScore ?? 0) + (snapshot.awayScore ?? 0);
  const previous = observations.at(-2);
  const latest = observations.at(-1);
  const previousTotal = previous?.homeScore !== undefined && previous.awayScore !== undefined
    ? previous.homeScore + previous.awayScore : undefined;
  const scoreDelta = previousTotal === undefined ? undefined : currentScoreTotal - previousTotal;
  const tempoDelta = latest?.tempo !== undefined && previous?.tempo !== undefined ? latest.tempo - previous.tempo : undefined;
  const elapsed = elapsedGameSeconds(latest);
  const projectedFinalTotal = elapsed !== undefined && elapsed > 0
    ? currentScoreTotal / elapsed * 3600 : undefined;

  return {
    runnerEventId: snapshot.runnerEventId,
    timestamp: snapshot.updatedAt,
    currentScoreTotal,
    ...(projectedFinalTotal !== undefined ? { projectedFinalTotal } : {}),
    scoringPaceDirection: direction(scoreDelta),
    possessionPaceDirection: direction(tempoDelta),
  };
}

function elapsedGameSeconds(observation?: GameFlowObservation): number | undefined {
  if (observation?.clockSecondsRemaining === undefined || observation.period === undefined) return undefined;
  const periodLength = 900;
  const periodsBefore = Math.max(0, observation.period - 1);
  return periodsBefore * periodLength + (periodLength - observation.clockSecondsRemaining);
}

function direction(delta: number | undefined): FlowDirection {
  if (delta === undefined) return "UNKNOWN";
  if (Math.abs(delta) < 0.05) return "STABLE";
  return delta > 0 ? "RISING" : "FALLING";
}

export interface TotalsMarketInput {
  runnerEventId: string;
  marketType: string;
  selection: string;
  marketLine: number;
  marketPrice?: number;
  runnerProjection: number;
  confidence: number;
  reasons?: string[];
  signalType?: TotalsSignalType;
  detectedAt?: string;
  now?: string;
}

export interface DecisionTimerConfig {
  fastSeconds?: number;
  normalSeconds?: number;
  halftimeSeconds?: number;
}

export function decisionTimerSeconds(
  input: Pick<TotalsMarketInput, "marketType"> & { volatility?: number; feedLatencyMs?: number; priceMovementSpeed?: number; liquidity?: number; eventSensitivity?: number; timeRemainingSeconds?: number },
  config: DecisionTimerConfig = {},
): number {
  const halftime = input.marketType.toUpperCase().includes("HALFTIME");
  if (halftime) return clamp(config.halftimeSeconds ?? 120, 60, 180);
  const fast = config.fastSeconds ?? 15;
  const normal = config.normalSeconds ?? 30;
  const sensitivity = (input.volatility ?? 0) + (input.priceMovementSpeed ?? 0) + (input.eventSensitivity ?? 0);
  const seconds = sensitivity >= 1.5 || (input.feedLatencyMs ?? 0) >= 1500 || (input.liquidity !== undefined && input.liquidity < 0.2)
    ? fast : normal;
  return clamp(seconds, 10, 45);
}

export function createTotalsDecisionWindow(input: TotalsMarketInput, timerConfig?: DecisionTimerConfig): TotalsDecisionWindow {
  const detectedAt = input.detectedAt ?? input.now ?? new Date().toISOString();
  const seconds = decisionTimerSeconds(input, timerConfig);
  const expiresAt = new Date(Date.parse(detectedAt) + seconds * 1000).toISOString();
  const edge = input.runnerProjection - input.marketLine;
  const status: TotalsWindowStatus = input.confidence >= 0.7 && Math.abs(edge) >= 1 ? "ACTIONABLE" : "WATCH";
  return {
    id: stableHash({ ...input, detectedAt }),
    runnerEventId: input.runnerEventId,
    marketType: input.marketType,
    market: input.marketType,
    selection: input.selection,
    marketLine: input.marketLine,
    marketPrice: input.marketPrice,
    runnerProjection: input.runnerProjection,
    edge,
    confidence: input.confidence,
    status,
    detectedAt,
    openedAt: status === "ACTIONABLE" ? detectedAt : undefined,
    windowOpenedAt: status === "ACTIONABLE" ? detectedAt : undefined,
    expiresAt,
    windowExpiresAt: expiresAt,
    secondsRemaining: seconds,
    peakEdge: edge,
    currentEdge: edge,
    nextSetPoint: "next possession",
    nextSetPointType: "NEXT_POSSESSION",
    nextSetPointReason: "Reprice after the next possession resolves.",
    marketsToReevaluate: DEFAULT_MARKETS,
    reasons: input.reasons ?? [],
    ...(input.signalType ? { reasons: [...(input.reasons ?? []), input.signalType] } : {}),
  };
}

export function advanceTotalsDecisionWindow(
  window: TotalsDecisionWindow,
  now = new Date().toISOString(),
  currentEdge = window.currentEdge ?? window.edge,
): TotalsDecisionWindow {
  const expires = window.windowExpiresAt ?? window.expiresAt;
  const expired = expires !== undefined && Date.parse(now) >= Date.parse(expires);
  const peakEdge = Math.max(window.peakEdge ?? currentEdge, currentEdge);
  return {
    ...window,
    currentEdge,
    peakEdge,
    secondsRemaining: expires ? Math.max(0, Math.ceil((Date.parse(expires) - Date.parse(now)) / 1000)) : undefined,
    status: expired ? "EXPIRED" : Math.abs(currentEdge) < Math.abs(window.edge) * 0.5 ? "DECAYING" : window.status,
    nextSetPoint: expired ? "next possession" : window.nextSetPoint,
    nextSetPointType: expired ? "NEXT_POSSESSION" : window.nextSetPointType,
    marketsToReevaluate: expired ? DEFAULT_MARKETS : window.marketsToReevaluate,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
