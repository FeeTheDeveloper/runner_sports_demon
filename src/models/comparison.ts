import type { MarketModelComparison, RunnerBaseline, SportsMarketSnapshot } from "../types.js";
import { normalizeToken } from "../normalization/events/canonicalId.js";

export function americanImpliedProbability(price: number): number | undefined {
  if (!Number.isFinite(price) || price === 0) return undefined;
  return price > 0 ? 100 / (price + 100) : Math.abs(price) / (Math.abs(price) + 100);
}

function selectionMatches(baseline: RunnerBaseline, market: SportsMarketSnapshot): boolean {
  const selection = baseline.selection.toUpperCase();
  if (selection === "HOME" || selection === "AWAY") return market.teamSide === selection;
  return normalizeToken(baseline.selection) === normalizeToken(market.selection)
    || (market.participant !== undefined && normalizeToken(baseline.selection) === normalizeToken(market.participant));
}

export function compareMarketToBaseline(baseline: RunnerBaseline, market: SportsMarketSnapshot, now = new Date().toISOString()): MarketModelComparison {
  const suppressionReasons: string[] = [];
  if (!Number.isFinite(baseline.confidence) || baseline.confidence < 0 || baseline.confidence > 1 || !Number.isFinite(baseline.dataQuality) || baseline.dataQuality < 0 || baseline.dataQuality > 1) suppressionReasons.push("INVALID_RUNNER_PROJECTION");
  if (baseline.target === "MONEYLINE" && (baseline.fairProbability === undefined || !Number.isFinite(baseline.fairProbability) || baseline.fairProbability < 0 || baseline.fairProbability > 1)) suppressionReasons.push("INVALID_RUNNER_PROJECTION");
  if (baseline.target !== "MONEYLINE" && (baseline.fairLine === undefined || !Number.isFinite(baseline.fairLine))) suppressionReasons.push("INVALID_RUNNER_PROJECTION");
  if (baseline.runnerEventId !== market.runnerEventId) suppressionReasons.push("UNMATCHED_EVENT");
  if (baseline.target !== market.marketKind) suppressionReasons.push("UNSUPPORTED_MARKET");
  if (!selectionMatches(baseline, market)) suppressionReasons.push("UNMATCHED_SELECTION");
  if (!market.executable || market.americanPrice === undefined || market.status.toLowerCase() !== "open") suppressionReasons.push("NO_EXECUTABLE_PRICE");
  const marketAge = new Date(now).getTime() - new Date(market.sourceTimestamp).getTime();
  if (!Number.isFinite(marketAge) || marketAge > 120_000) suppressionReasons.push("STALE_MARKET_DATA");
  if (baseline.phase === "CURRENT") {
    const projectionAge = new Date(now).getTime() - new Date(baseline.sourceTimestamp).getTime();
    if (!Number.isFinite(projectionAge) || projectionAge > 120_000) suppressionReasons.push("STALE_RUNNER_PROJECTION");
  }
  const marketProbability = market.americanPrice === undefined ? undefined : americanImpliedProbability(market.americanPrice);
  if (marketProbability === undefined) suppressionReasons.push("INVALID_MARKET_PRICE");
  if (baseline.target !== "MONEYLINE" && market.line === undefined) suppressionReasons.push("MISSING_MARKET_LINE");
  if (suppressionReasons.length) return unavailable(baseline.runnerEventId, suppressionReasons, now, baseline, market);
  if (baseline.target === "MONEYLINE") {
    return {
      runnerEventId: baseline.runnerEventId, baselineId: baseline.id, marketSnapshotId: market.id,
      target: baseline.target, selection: baseline.selection, available: true,
      fairProbability: baseline.fairProbability, marketProbability,
      probabilityEdge: baseline.fairProbability! - marketProbability!, americanPrice: market.americanPrice,
      confidence: baseline.confidence, dataQuality: baseline.dataQuality,
      executionAssessment: "NOT_EVALUATED", suppressionReasons: [], processedTimestamp: now,
    };
  }
  const lineEdge = baseline.target === "TOTAL" || baseline.target === "TEAM_TOTAL"
    ? (baseline.selection.toUpperCase() === "UNDER" ? market.line! - baseline.fairLine! : baseline.fairLine! - market.line!)
    : market.line! - baseline.fairLine!;
  return {
    runnerEventId: baseline.runnerEventId, baselineId: baseline.id, marketSnapshotId: market.id,
    target: baseline.target, selection: baseline.selection, available: true,
    fairLine: baseline.fairLine, marketLine: market.line, lineEdge, americanPrice: market.americanPrice,
    confidence: baseline.confidence, dataQuality: baseline.dataQuality,
    executionAssessment: "NOT_EVALUATED", suppressionReasons: [], processedTimestamp: now,
  };
}

export function comparisonsForGame(runnerEventId: string, baselines: RunnerBaseline[], markets: SportsMarketSnapshot[], now = new Date().toISOString()): MarketModelComparison[] {
  const relevant = baselines.filter((baseline) => baseline.runnerEventId === runnerEventId);
  if (!relevant.length) return [unavailable(runnerEventId, ["RUNNER_PROJECTION_UNAVAILABLE"], now)];
  return relevant.flatMap((baseline) => {
    const candidates = markets.filter((market) => market.runnerEventId === runnerEventId && market.marketKind === baseline.target && selectionMatches(baseline, market));
    if (!candidates.length) return [unavailable(runnerEventId, ["MATCHING_EXECUTABLE_MARKET_UNAVAILABLE"], now, baseline)];
    return candidates.map((market) => compareMarketToBaseline(baseline, market, now));
  });
}
function unavailable(runnerEventId: string, reasons: string[], now: string, baseline?: RunnerBaseline, market?: SportsMarketSnapshot): MarketModelComparison {
  return { runnerEventId, baselineId: baseline?.id, marketSnapshotId: market?.id, target: baseline?.target, selection: baseline?.selection, available: false, confidence: baseline?.confidence, dataQuality: baseline?.dataQuality, executionAssessment: "NOT_EVALUATED", suppressionReasons: [...new Set(reasons)], processedTimestamp: now };
}
