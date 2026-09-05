import type { NormalizedMarket } from "../../types.js";
import type { ProbabilityPrediction } from "../../models/probability/baseline.js";

export function computeDivergence(market: NormalizedMarket, prediction: ProbabilityPrediction) {
  const marketProbability = market.yesPrice;
  if (marketProbability === undefined) return undefined;
  const edge = prediction.fairProbability - marketProbability;
  const confidenceScore = Math.max(0, Math.min(100, prediction.confidenceScore - Math.abs((market.spread ?? 0) * 100)));
  return { marketId: market.id, signalType: "MODEL_DIVERGENCE", fairProbability: prediction.fairProbability, marketProbability, edge, confidenceScore, signalStrength: Math.abs(edge) * (confidenceScore / 100) };
}
