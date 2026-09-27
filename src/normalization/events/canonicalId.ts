const TEAM_ALIASES: Record<string, string> = {
  dallas: "DAL", cowboys: "DAL", philadelphia: "PHI", eagles: "PHI",
};

// Verified against ESPN's NFL team directory on 2026-09-26. Full names avoid
// collisions such as New York/Los Angeles and cross-provider nickname prefixes.
export const NFL_TEAM_CODES: Record<string, string> = {
  "Arizona Cardinals": "ARI", "Atlanta Falcons": "ATL", "Baltimore Ravens": "BAL", "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR", "Chicago Bears": "CHI", "Cincinnati Bengals": "CIN", "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL", "Denver Broncos": "DEN", "Detroit Lions": "DET", "Green Bay Packers": "GB",
  "Houston Texans": "HOU", "Indianapolis Colts": "IND", "Jacksonville Jaguars": "JAX", "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV", "Los Angeles Chargers": "LAC", "Los Angeles Rams": "LAR", "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN", "New England Patriots": "NE", "New Orleans Saints": "NO", "New York Giants": "NYG",
  "New York Jets": "NYJ", "Philadelphia Eagles": "PHI", "Pittsburgh Steelers": "PIT", "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA", "Tampa Bay Buccaneers": "TB", "Tennessee Titans": "TEN", "Washington Commanders": "WSH",
};
const nflByName = new Map(Object.entries(NFL_TEAM_CODES).map(([name, code]) => [normalizeToken(name), code]));

export function normalizeToken(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function teamCode(name: string): string {
  const normalized = normalizeToken(name);
  if (nflByName.has(normalized)) return nflByName.get(normalized)!;
  if (TEAM_ALIASES[normalized]) return TEAM_ALIASES[normalized];
  const parts = normalized.split(" ").filter(Boolean);
  const last = parts.at(-1) ?? normalized;
  return last.slice(0, 3).toUpperCase();
}

export function buildRunnerEventId(input: { sport: string; startsAt: string; awayTeam: string; homeTeam: string; awayCode?: string; homeCode?: string }): string {
  const date = new Date(input.startsAt).toISOString().slice(0, 10);
  if (input.sport.toUpperCase() === "NFL") {
    const resolveNfl = (name: string, supplied?: string) => {
      const code = nflByName.get(normalizeToken(name)) ?? TEAM_ALIASES[normalizeToken(name)];
      if (!code) throw new Error("Unmapped NFL team; verified canonical mapping required");
      const alias: Record<string, string> = { WAS: "WSH", JAC: "JAX", LA: "LAR" };
      const provided = supplied ? normalizeCode(supplied) : code;
      if ((alias[provided] ?? provided) !== code) throw new Error("Conflicting NFL team identity");
      return code;
    };
    return `RUNNER:NFL:${date}:${resolveNfl(input.awayTeam, input.awayCode)}:${resolveNfl(input.homeTeam, input.homeCode)}`;
  }
  return `RUNNER:${input.sport.toUpperCase()}:${date}:${input.awayCode ? normalizeCode(input.awayCode) : teamCode(input.awayTeam)}:${input.homeCode ? normalizeCode(input.homeCode) : teamCode(input.homeTeam)}`;
}

function normalizeCode(value: string): string { return value.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase(); }
