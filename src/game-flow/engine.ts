import { stableHash } from "../utils/hash.js";
import type {
  FlowDirection,
  GameFlowObservation,
  GameFlowSnapshot,
  GameRegime,
  LatentStateType,
} from "../types.js";
import { deriveTotalsFlowState } from "./totals.js";

const latentStates = new Set<LatentStateType>([
  "PLAYER_LIMITATION", "PLAYER_ROLE_SHIFT", "SUBSTITUTION", "SNAP_RESTRICTION",
  "SCHEME_SHIFT", "COVERAGE_CHANGE", "BLITZ_CHANGE", "TEMPO_CHANGE", "FATIGUE",
  "WEATHER_CHANGE", "COACHING_ADJUSTMENT", "LINEUP_CHANGE",
]);
const observationSources = new Set(["GAME_FEED", "YOUTUBE_TV_OBSERVATION", "HUMAN_ANALYST", "CLAUDE_RESEARCH", "RUNNER_AI", "VERIFIED_NEWS"]);

function clamp(value: number, min = -1, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: Array<number | undefined>): number | undefined {
  const present = values.filter((value): value is number => value !== undefined);
  return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : undefined;
}

function direction(delta: number | undefined): FlowDirection {
  if (delta === undefined) return "UNKNOWN";
  if (Math.abs(delta) < 0.05) return "STABLE";
  return delta > 0 ? "RISING" : "FALLING";
}

export function validateGameFlowObservation(observation: GameFlowObservation): void {
  if (!observation.runnerEventId || !observation.id) throw new Error("observation id and runnerEventId are required");
  if (!observationSources.has(observation.source)) throw new Error("unsupported observation source");
  if (!Number.isFinite(observation.confidence) || observation.confidence < 0 || observation.confidence > 1) {
    throw new Error("confidence must be between 0 and 1");
  }
  for (const value of [observation.tempo, observation.possessionDominance, observation.pressure, observation.efficiency, observation.fatigue, observation.structuralControl]) {
    if (value !== undefined && (!Number.isFinite(value) || value < -1 || value > 1)) throw new Error("flow metrics must be between -1 and 1");
  }
  if (observation.playerAvailability && Object.values(observation.playerAvailability).some((value) => value < 0 || value > 100)) {
    throw new Error("player availability must be between 0 and 100");
  }
  if (observation.latentStates?.some((state) => !latentStates.has(state))) throw new Error("unsupported latent state");
}

export function analyzeGameFlow(observations: GameFlowObservation[]): GameFlowSnapshot | undefined {
  if (!observations.length) return undefined;
  const ordered = [...observations].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  const latest = ordered.at(-1)!;
  const previous = ordered.at(-2);
  const momentum = clamp(average([
    latest.possessionDominance,
    latest.pressure,
    latest.efficiency,
    latest.structuralControl,
  ]) ?? 0);
  const previousMomentum = previous ? clamp(average([
    previous.possessionDominance, previous.pressure, previous.efficiency, previous.structuralControl,
  ]) ?? 0) : undefined;
  const scoreDiff = latest.homeScore !== undefined && latest.awayScore !== undefined
    ? latest.homeScore - latest.awayScore : undefined;
  const regime = classifyRegime({ ...latest, momentum, scoreDiff });
  const previousRegime = previous ? classifyRegime({
    ...previous,
    momentum: clamp(average([previous.possessionDominance, previous.pressure, previous.efficiency, previous.structuralControl]) ?? 0),
    scoreDiff: previous.homeScore !== undefined && previous.awayScore !== undefined ? previous.homeScore - previous.awayScore : undefined,
  }) : regime;
  const transitions = previousRegime !== regime ? [{ from: previousRegime, to: regime, observedAt: latest.observedAt }] : [];
  const momentumDelta = previousMomentum === undefined ? undefined : momentum - previousMomentum;
  const momentumDirection = previousMomentum !== undefined && previousMomentum * momentum < 0 && Math.abs(momentumDelta ?? 0) >= 0.05
    ? "REVERSING" : direction(momentumDelta);
  return {
    runnerEventId: latest.runnerEventId,
    updatedAt: latest.receivedAt,
    observationCount: observations.length,
    homeScore: latest.homeScore,
    awayScore: latest.awayScore,
    period: latest.period,
    clockSecondsRemaining: latest.clockSecondsRemaining,
    possession: latest.possession,
    momentum,
    momentumDirection,
    tempo: latest.tempo,
    possessionDominance: latest.possessionDominance,
    pressure: latest.pressure,
    efficiency: latest.efficiency,
    fatigue: latest.fatigue,
    structuralControl: latest.structuralControl,
    regime,
    latentStates: [...new Set(ordered.flatMap((observation) => observation.latentStates ?? []))],
    playerAvailability: Object.assign({}, ...ordered.map((observation) => observation.playerAvailability ?? {})),
    unitPerformance: Object.assign({}, ...ordered.map((observation) => observation.unitPerformance ?? {})),
    coachingAdjustments: ordered.flatMap((observation) => observation.coachingAdjustment ? [observation.coachingAdjustment] : []),
    transitions,
    latestObservationId: latest.id,
    totals: deriveTotalsFlowState(ordered, {
      runnerEventId: latest.runnerEventId,
      updatedAt: latest.receivedAt,
      homeScore: latest.homeScore,
      awayScore: latest.awayScore,
      period: latest.period,
      clockSecondsRemaining: latest.clockSecondsRemaining,
    }),
  };
}

function classifyRegime(input: GameFlowObservation & { momentum: number; scoreDiff?: number }): GameRegime {
  if (input.clockSecondsRemaining !== undefined && input.clockSecondsRemaining <= 300) return "LATE_GAME";
  if (input.scoreDiff !== undefined && Math.abs(input.scoreDiff) >= 20) return input.momentum < 0 ? "GARBAGE_TIME" : "BLOWOUT";
  if (input.scoreDiff !== undefined && Math.abs(input.scoreDiff) >= 8) return input.scoreDiff * input.momentum < 0 ? "COMEBACK_WINDOW" : (input.scoreDiff > 0 ? "FAVORITE_CONTROL" : "UNDERDOG_CONTROL");
  if (Math.abs(input.momentum) >= 0.55) return input.momentum > 0 ? "FAVORITE_CONTROL" : "UNDERDOG_CONTROL";
  if (input.latentStates?.length && input.latentStates.includes("FATIGUE")) return "VOLATILE";
  return "BALANCED";
}

export class GameFlowEngine {
  private readonly observations = new Map<string, GameFlowObservation[]>();
  private readonly snapshots = new Map<string, GameFlowSnapshot>();

  ingest(observation: GameFlowObservation): GameFlowSnapshot {
    validateGameFlowObservation(observation);
    const observations = this.observations.get(observation.runnerEventId) ?? [];
    observations.push({ ...observation, id: observation.id || stableHash(observation) });
    this.observations.set(observation.runnerEventId, observations);
    const snapshot = analyzeGameFlow(observations)!;
    this.snapshots.set(observation.runnerEventId, snapshot);
    return snapshot;
  }

  snapshot(runnerEventId: string): GameFlowSnapshot | undefined {
    return this.snapshots.get(runnerEventId);
  }

  allSnapshots(): GameFlowSnapshot[] {
    return [...this.snapshots.values()];
  }
}
