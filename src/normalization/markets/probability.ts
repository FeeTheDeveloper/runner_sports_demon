export function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function centsToProbability(value: unknown): number | undefined {
  const n = optionalNumber(value);
  if (n === undefined) return undefined;
  if (n > 1) return n / 100;
  return n;
}

export function midpoint(bid?: number, ask?: number, last?: number): number | undefined {
  if (bid !== undefined && ask !== undefined) return (bid + ask) / 2;
  return last;
}

export function spread(bid?: number, ask?: number): number | undefined {
  return bid !== undefined && ask !== undefined ? Math.max(0, ask - bid) : undefined;
}
