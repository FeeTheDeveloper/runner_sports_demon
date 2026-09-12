import type { GameFlowObservation, ObservationSource } from "../types.js";

export interface RunnerIntelInput {
  runnerEventId: string;
  observedAt: string;
  confidence: number;
  notes: string;
  source?: ObservationSource;
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
  coachingAdjustment?: string;
  playerAvailability?: Record<string, number>;
  unitPerformance?: Record<string, number>;
}

export function buildRunnerIntelObservation(input: RunnerIntelInput): GameFlowObservation {
  const receivedAt = new Date().toISOString();
  return {
    id: `RUNNER_AI:${input.runnerEventId}:${input.observedAt}`,
    runnerEventId: input.runnerEventId,
    source: input.source ?? "RUNNER_AI",
    observedAt: input.observedAt,
    receivedAt,
    confidence: clamp(input.confidence, 0, 1),
    sport: "CFB",
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    period: input.period,
    clockSecondsRemaining: input.clockSecondsRemaining,
    possession: input.possession,
    tempo: input.tempo,
    possessionDominance: input.possessionDominance,
    pressure: input.pressure,
    efficiency: input.efficiency,
    fatigue: input.fatigue,
    structuralControl: input.structuralControl,
    playerAvailability: input.playerAvailability,
    unitPerformance: input.unitPerformance,
    coachingAdjustment: input.coachingAdjustment,
    notes: input.notes,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
