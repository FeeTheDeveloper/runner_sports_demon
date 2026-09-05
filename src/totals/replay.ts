import { TotalsRuntime, type TotalsEvaluation } from "./runtime.js";
import type { FootballTotalsInputs, TotalsMarketSnapshot } from "./types.js";

export interface TotalsReplayFrame { input: FootballTotalsInputs; markets: TotalsMarketSnapshot[]; }

/** LIVE and REPLAY share TotalsRuntime; replay only controls ordering and analytical time. */
export function replayTotals(frames: TotalsReplayFrame[]): TotalsEvaluation[] {
  const runtime = new TotalsRuntime();
  return [...frames]
    .sort((a,b)=>a.input.timestamp.localeCompare(b.input.timestamp))
    .map(frame=>runtime.evaluate(frame.input, frame.markets, frame.input.timestamp));
}
