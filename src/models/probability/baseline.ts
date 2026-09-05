import type { NormalizedMarket } from "../../types.js";

export interface ProbabilityPrediction {
  marketId: string;
  modelName: string;
  fairProbability: number;
  confidenceScore: number;
}

export function baselineImpliedProbability(market: NormalizedMarket): ProbabilityPrediction | undefined {
  const fairProbability = market.yesPrice ?? market.lastTradedPrice;
  if (fairProbability === undefined || fairProbability < 0 || fairProbability > 1) return undefined;
  const staleMs = Date.now() - new Date(market.sourceTimestamp).getTime();
  const spreadPenalty = Math.min((market.spread ?? 0.1) * 100, 35);
  const stalePenalty = staleMs > 5 * 60_000 ? 30 : staleMs > 60_000 ? 10 : 0;
  return { marketId: market.id, modelName: "baseline_market_implied_v0", fairProbability, confidenceScore: Math.max(0, Math.min(100, 70 - spreadPenalty - stalePenalty)) };
}
