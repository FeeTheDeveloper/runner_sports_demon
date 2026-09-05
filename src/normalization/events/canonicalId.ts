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

export function buildRunnerEventId(input: { sport: string; startsAt: string; awayTeam: string; homeTeam: string }): string {
  const date = new Date(input.startsAt).toISOString().slice(0, 10);
  return `RUNNER:${input.sport.toUpperCase()}:${date}:${teamCode(input.awayTeam)}:${teamCode(input.homeTeam)}`;
}
