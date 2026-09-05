import { TOTALS_MARKET_TYPES, type TotalsMarketSnapshot, type TotalsMarketType, type TotalsSelection } from "./types.js";

const aliases: Array<[RegExp, TotalsMarketType]> = [
  [/^(totals|game_total|h2h_totals)$/i, "GAME_TOTAL"],
  [/^(team_totals|team_total)$/i, "TEAM_TOTAL"],
  [/^(1h|first_half)_?(team_)?totals?$/i, "FIRST_HALF_TOTAL"],
  [/^(2h|second_half)_?(team_)?totals?$/i, "SECOND_HALF_TOTAL"],
  [/^(q1|first_quarter)_?(team_)?totals?$/i, "FIRST_QUARTER_TOTAL"],
  [/^(q2|second_quarter)_?(team_)?totals?$/i, "SECOND_QUARTER_TOTAL"],
  [/^(q3|third_quarter)_?(team_)?totals?$/i, "THIRD_QUARTER_TOTAL"],
  [/^(q4|fourth_quarter)_?(team_)?totals?$/i, "FOURTH_QUARTER_TOTAL"],
];

export function normalizeTotalsMarketType(key: string, teamId?: string): TotalsMarketType | undefined {
  const exact = TOTALS_MARKET_TYPES.find(type => type === key.toUpperCase());
  let result = exact ?? aliases.find(([pattern]) => pattern.test(key))?.[1];
  if (!result) return undefined;
  if (teamId && !result.includes("TEAM")) result = result === "GAME_TOTAL" ? "TEAM_TOTAL" : result.replace("_TOTAL", "_TEAM_TOTAL") as TotalsMarketType;
  return result;
}

export function mapProviderTotalsMarket(input: Record<string, unknown>, context: { provider: string; bookmaker?: string; runnerEventId?: string; receivedTimestamp: string }): TotalsMarketSnapshot | undefined {
  const marketKey = String(input.key ?? input.market_key ?? input.marketType ?? "");
  const teamId = typeof input.teamId === "string" ? input.teamId : typeof input.description === "string" ? input.description : undefined;
  const marketType = normalizeTotalsMarketType(marketKey, teamId);
  const name = String(input.name ?? input.selection ?? "").toUpperCase();
  const selection: TotalsSelection | undefined = name === "OVER" || name === "UNDER" ? name : undefined;
  const line = Number(input.point ?? input.line);
  if (!marketType || !selection || !Number.isFinite(line)) return undefined;
  const price = input.price === undefined ? undefined : Number(input.price);
  return { id: `${context.provider}:${String(input.id ?? `${marketKey}:${teamId ?? "game"}:${selection}:${line}`)}`, runnerEventId: context.runnerEventId, provider: context.provider, bookmaker: context.bookmaker ?? context.provider, marketKey, marketType, selection, line, price: Number.isFinite(price) ? price : undefined, timestamp: String(input.last_update ?? input.timestamp ?? context.receivedTimestamp), period: typeof input.period === "string" ? input.period : undefined, teamId, suspended: input.suspended === true, liquidity: typeof input.liquidity === "number" ? input.liquidity : undefined, bid: typeof input.bid === "number" ? input.bid : undefined, ask: typeof input.ask === "number" ? input.ask : undefined };
}
