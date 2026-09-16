import type { BaselineTarget, RunnerBaseline } from "../../types.js";
import { stableHash } from "../../utils/hash.js";

export interface BaselineInput {
  id?: string;
  runnerEventId: string;
  phase?: "PRE_GAME" | "CURRENT";
  target: BaselineTarget;
  selection: string;
  modelName: string;
  modelVersion: string;
  sourceType: "RUNNER_MODEL" | "EXTERNAL_MODEL";
  fairProbability?: number;
  fairLine?: number;
  confidence: number;
  dataQuality: number;
  inputs: string[];
  sourceTimestamp: string;
  receivedTimestamp?: string;
}

export function validateBaseline(input: BaselineInput): void {
  if (!input || typeof input !== "object") throw new Error("baseline body is required");
  if (!/^RUNNER:[A-Z0-9-]+:\d{4}-\d{2}-\d{2}:[A-Z0-9]+:[A-Z0-9]+$/.test(input.runnerEventId)) throw new Error("valid runnerEventId is required");
  if (!(["MONEYLINE", "SPREAD", "TOTAL", "TEAM_TOTAL"] as unknown[]).includes(input.target)) throw new Error("unsupported baseline target");
  if (input.phase !== undefined && !(["PRE_GAME", "CURRENT"] as unknown[]).includes(input.phase)) throw new Error("unsupported baseline phase");
  if (!(["RUNNER_MODEL", "EXTERNAL_MODEL"] as unknown[]).includes(input.sourceType)) throw new Error("unsupported baseline sourceType");
  if (typeof input.modelName !== "string" || typeof input.modelVersion !== "string" || typeof input.selection !== "string" || !input.modelName.trim() || !input.modelVersion.trim() || !input.selection.trim()) throw new Error("modelName, modelVersion, and selection are required");
  if (input.modelName === "baseline_market_implied_v0" || /market[_ -]?implied/i.test(input.modelName)) throw new Error("pregame baselines cannot use a market-implied model");
  if (!Array.isArray(input.inputs) || input.inputs.length === 0 || input.inputs.some((value) => typeof value !== "string" || !value.trim())) throw new Error("at least one model input is required");
  if (input.inputs.some((value) => /(sportsbook|prediction[_ -]?market|market)[_ -]?(price|odds|implied|probability|consensus)|odds[_ -]?consensus/i.test(value))) throw new Error("pregame baseline inputs must be market-independent");
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) throw new Error("confidence must be between 0 and 1");
  if (!Number.isFinite(input.dataQuality) || input.dataQuality < 0 || input.dataQuality > 1) throw new Error("dataQuality must be between 0 and 1");
  const sourceTime = new Date(input.sourceTimestamp);
  if (!Number.isFinite(sourceTime.getTime())) throw new Error("sourceTimestamp must be valid");
  if (input.target === "MONEYLINE") {
    if (input.fairProbability === undefined || !Number.isFinite(input.fairProbability) || input.fairProbability < 0 || input.fairProbability > 1) throw new Error("moneyline baseline requires fairProbability between 0 and 1");
    if (input.fairLine !== undefined) throw new Error("moneyline baseline cannot include fairLine");
  } else {
    if (input.fairLine === undefined || !Number.isFinite(input.fairLine)) throw new Error(`${input.target} baseline requires fairLine`);
    if (input.fairProbability !== undefined) throw new Error(`${input.target} baseline cannot include fairProbability`);
  }
}

export function createBaseline(input: BaselineInput, now = new Date().toISOString()): RunnerBaseline {
  validateBaseline(input);
  const receivedTimestamp = input.receivedTimestamp ?? now;
  const identity = { ...input, id: undefined, receivedTimestamp: undefined };
  return {
    id: input.id ?? `baseline:${stableHash(identity)}`,
    runnerEventId: input.runnerEventId,
    phase: input.phase ?? "PRE_GAME",
    target: input.target,
    selection: input.selection,
    modelName: input.modelName,
    modelVersion: input.modelVersion,
    sourceType: input.sourceType,
    fairProbability: input.fairProbability,
    fairLine: input.fairLine,
    confidence: input.confidence,
    dataQuality: input.dataQuality,
    inputs: [...input.inputs],
    sourceTimestamp: new Date(input.sourceTimestamp).toISOString(),
    receivedTimestamp: new Date(receivedTimestamp).toISOString(),
    processedTimestamp: now,
  };
}
