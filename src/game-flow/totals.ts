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

export function deriveTotalsSignals(snapshot: Pick<GameFlowSnapshot, "totals" | "regime">): TotalsSignalType[] {
  const signals: TotalsSignalType[] = [];
  if (snapshot.totals.scoringPaceDirection === "RISING") signals.push("PACE_ACCELERATION");
  if (snapshot.totals.scoringPaceDirection === "FALLING") signals.push("PACE_COLLAPSE");
  if (snapshot.totals.clockDrainPressure !== undefined && snapshot.totals.clockDrainPressure > 0.5) signals.push("CLOCK_DRAIN");
  if (snapshot.regime === "GARBAGE_TIME") {
    signals.push(snapshot.totals.scoringPaceDirection === "RISING" ? "GARBAGE_TIME_OVER" : "GARBAGE_TIME_UNDER");
  }
  return signals;
}

export function nextFootballSetPoint(period?: number, clockSecondsRemaining?: number): {
  type: NextSetPointType;
  reason: string;
  markets: string[];
} {
  if (period === 2 && clockSecondsRemaining !== undefined && clockSecondsRemaining <= 0) {
    return { type: "HALFTIME", reason: "Reprice after halftime adjustments and the opening second-half drive.", markets: DEFAULT_MARKETS };
  }
  if (period === 3 && clockSecondsRemaining !== undefined && clockSecondsRemaining <= 0) {
    return { type: "OPENING_3Q_DRIVE", reason: "Reprice when the opening fourth-quarter drive establishes pace.", markets: DEFAULT_MARKETS };
  }
  if (period === 4 && clockSecondsRemaining !== undefined) {
    for (const [threshold, type] of [[600, "Q4_10:00"], [450, "Q4_7:30"], [300, "Q4_5:00"], [180, "Q4_3:00"], [120, "Q4_2:00"]] as const) {
      if (clockSecondsRemaining <= threshold) return { type, reason: `Reprice at ${type.replace("Q4_", "")} remaining in the fourth quarter.`, markets: DEFAULT_MARKETS };
    }
  }
  return { type: "NEXT_POSSESSION", reason: "Reprice after the next possession resolves.", markets: DEFAULT_MARKETS };
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
    nextSetPoint: nextFootballSetPoint(undefined, undefined).type,
    nextSetPointType: nextFootballSetPoint(undefined, undefined).type,
    nextSetPointReason: nextFootballSetPoint(undefined, undefined).reason,
    marketsToReevaluate: nextFootballSetPoint(undefined, undefined).markets,
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
    nextSetPoint: expired ? nextFootballSetPoint(undefined, undefined).type : window.nextSetPoint,
    nextSetPointType: expired ? nextFootballSetPoint(undefined, undefined).type : window.nextSetPointType,
    marketsToReevaluate: expired ? nextFootballSetPoint(undefined, undefined).markets : window.marketsToReevaluate,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
