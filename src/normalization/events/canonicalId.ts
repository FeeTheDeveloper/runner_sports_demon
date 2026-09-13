const TEAM_ALIASES: Record<string, string> = {
  dallas: "DAL", cowboys: "DAL", philadelphia: "PHI", eagles: "PHI",
};

export function normalizeToken(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function teamCode(name: string): string {
  const normalized = normalizeToken(name);
  if (TEAM_ALIASES[normalized]) return TEAM_ALIASES[normalized];
  const parts = normalized.split(" ").filter(Boolean);
  const last = parts.at(-1) ?? normalized;
  return last.slice(0, 3).toUpperCase();
}

function providerCode(value: string | undefined, fallback: string): string {
  const clean = value?.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean || teamCode(fallback);
}

export function canonicalSport(sport: string): string {
  const normalized = normalizeToken(sport);
  if (["cfb", "ncaaf", "college football", "americanfootball ncaaf"].includes(normalized)) return "CFB";
  return sport.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function buildRunnerEventId(input: { sport: string; startsAt: string; awayTeam: string; homeTeam: string; awayCode?: string; homeCode?: string }): string {
  const startsAt = new Date(input.startsAt);
  if (!Number.isFinite(startsAt.getTime())) throw new Error("startsAt must be a valid timestamp");
  const date = startsAt.toISOString().slice(0, 10);
  return `RUNNER:${canonicalSport(input.sport)}:${date}:${providerCode(input.awayCode, input.awayTeam)}:${providerCode(input.homeCode, input.homeTeam)}`;
}
