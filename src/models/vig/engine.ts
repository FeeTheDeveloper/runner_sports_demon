export interface VigCalculation {
  rawImpliedProbability: number;
  fairProbability?: number;
  overround?: number;
}

export function americanImpliedProbability(americanOdds: number): number | undefined {
  if (!Number.isFinite(americanOdds) || americanOdds === 0) return undefined;
  return americanOdds > 0
    ? 100 / (americanOdds + 100)
    : Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
}

export function calculateVig(americanOdds: number[]): VigCalculation[] {
  const raw = americanOdds.map(americanImpliedProbability);
  const valid = raw.filter((probability): probability is number => probability !== undefined);
  const overround = valid.length > 1 ? valid.reduce((sum, probability) => sum + probability, 0) - 1 : undefined;
  return raw.map((rawImpliedProbability) => ({
    rawImpliedProbability: rawImpliedProbability ?? 0,
    fairProbability: rawImpliedProbability !== undefined && overround !== undefined
      ? rawImpliedProbability / (1 + overround)
      : undefined,
    overround,
  }));
}