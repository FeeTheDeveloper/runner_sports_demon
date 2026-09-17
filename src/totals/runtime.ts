import type { SqliteStore } from "../storage/sqlite.js";
import { createDecisionWindow, createHalftimePacket, projectFootballTotals, scoreTrends } from "./engine.js";
import type { FootballTotalsInputs, HalftimeTotalsPacket, TotalsDecisionWindow, TotalsMarketSnapshot, TotalsProjection } from "./types.js";

export interface TotalsEvaluation { flow: ReturnType<typeof projectFootballTotals>["flow"]; projections: TotalsProjection[]; markets: TotalsMarketSnapshot[]; windows: TotalsDecisionWindow[]; halftime?: HalftimeTotalsPacket; }

export class TotalsRuntime {
  private evaluations = new Map<string, TotalsEvaluation>();
  constructor(private readonly store?: SqliteStore) {}

  evaluate(input: FootballTotalsInputs, markets: TotalsMarketSnapshot[], now = new Date().toISOString()): TotalsEvaluation {
    const { flow, projections } = projectFootballTotals(input);
    const trends = scoreTrends(input, flow.scoringConversionSuppression);
    const windows = markets.map(market => {
      const projection = projections.find(p => p.marketType === market.marketType && (!market.teamId || p.teamId === market.teamId));
      return projection ? createDecisionWindow(market, projection, trends, input, now) : undefined;
    }).filter((window): window is TotalsDecisionWindow => window !== undefined);
    const halftime = input.period === 2 && input.clockSecondsRemaining === 0 ? createHalftimePacket(input, projections) : undefined;
    const result = { flow, projections, markets, windows, halftime };
    this.evaluations.set(input.runnerEventId, result);
    this.store?.persistTotals(flow, projections, markets, windows);
    return result;
  }

  get(runnerEventId: string, now = new Date().toISOString()) {
    const evaluation = this.evaluations.get(runnerEventId);
    return evaluation ? refreshWindowExpiry(evaluation, now) : undefined;
  }
  all(now = new Date().toISOString()) { return [...this.evaluations.values()].map(evaluation => refreshWindowExpiry(evaluation, now)); }
  alerts(now = new Date().toISOString()) { return this.all(now).flatMap(e => e.windows).filter(w => w.status === "ACTIONABLE" || w.status === "ARMED" || w.status === "WATCH").sort((a,b)=>(b.favorableEdge*b.confidence)-(a.favorableEdge*a.confidence)); }
}

function refreshWindowExpiry(evaluation: TotalsEvaluation, now: string): TotalsEvaluation {
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) return evaluation;
  let changed = false;
  const windows = evaluation.windows.map(window => {
    const expiresAtMs = window.expiresAt ? Date.parse(window.expiresAt) : Number.NaN;
    if (window.status !== "EXPIRED" && Number.isFinite(expiresAtMs) && expiresAtMs <= nowMs) {
      changed = true;
      return { ...window, status: "EXPIRED" as const, secondsRemaining: 0 };
    }
    return window;
  });
  return changed ? { ...evaluation, windows } : evaluation;
}
