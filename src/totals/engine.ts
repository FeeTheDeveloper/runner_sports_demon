import { stableHash } from "../utils/hash.js";
import type { FlowDirection } from "../types.js";
import type { FootballTotalsInputs, HalftimeTotalsPacket, SetPointType, SourceSynchronization, SuppressionReason, TotalsDecisionWindow, TotalsFlowState, TotalsMarketSnapshot, TotalsProjection, TrendClass } from "./types.js";

export interface TotalsEngineConfig {
  minimumConfidence: number;
  minimumEdge: number;
  decayEdgeRatio: number;
  gameFeedStaleMs: number;
  marketFeedStaleMs: number;
  maximumClockConflictSeconds: number;
  maximumSpread: number;
  minimumLiquidity: number;
  timers: { fast: number; normal: number; halftime: number };
  trendThresholds: [number, number, number, number];
  trendWeights: Record<string, number>;
}

export const DEFAULT_TOTALS_CONFIG: TotalsEngineConfig = {
  minimumConfidence: 0.6,
  minimumEdge: 1,
  decayEdgeRatio: 0.5,
  gameFeedStaleMs: 15_000,
  marketFeedStaleMs: 15_000,
  maximumClockConflictSeconds: 5,
  maximumSpread: 0.15,
  minimumLiquidity: 0,
  timers: { fast: 15, normal: 30, halftime: 120 },
  trendThresholds: [50, 65, 75, 85],
  trendWeights: { pace: 20, possessions: 15, efficiency: 15, explosives: 10, opportunities: 15, pressure: 10, regime: 10, conversion: 5 },
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const remainingGameSeconds = (period: number, clock: number) => Math.max(0, (4 - period) * 900 + clock);

export function estimateRemainingPossessions(input: FootballTotalsInputs) {
  const remaining = remainingGameSeconds(input.period, input.clockSecondsRemaining);
  const assumptions: string[] = [];
  let driveSeconds: number;
  if (input.playsPerDrive && input.secondsPerPlay) driveSeconds = input.playsPerDrive * input.secondsPerPlay;
  else {
    driveSeconds = 150;
    assumptions.push("Used 150-second heuristic drive duration because play/drive timing was unavailable.");
  }
  if (input.gameRegime === "LATE_GAME" || input.gameRegime === "COMEBACK_WINDOW") driveSeconds *= 0.88;
  if (input.gameRegime === "BLOWOUT" || input.gameRegime === "GARBAGE_TIME") driveSeconds *= 1.15;
  const total = clamp(remaining / Math.max(75, driveSeconds), 0, 30);
  const possessionAdjustment = input.possession === "HOME" ? 0.25 : input.possession === "AWAY" ? -0.25 : 0;
  return {
    total,
    home: Math.max(0, total / 2 + possessionAdjustment),
    away: Math.max(0, total / 2 - possessionAdjustment),
    assumptions,
    confidencePenalty: assumptions.length ? 0.15 : 0,
  };
}

function adjustedPpd(observed: number | undefined, baseline: number | undefined, opportunities = 0, redZone = 0, explosives = 0, pressure = 0) {
  const assumptions: string[] = [];
  let value: number;
  if (observed !== undefined && baseline !== undefined) value = observed * 0.6 + baseline * 0.4;
  else if (observed !== undefined) { value = observed; assumptions.push("Pregame PPD baseline unavailable."); }
  else if (baseline !== undefined) { value = baseline; assumptions.push("Observed in-game PPD unavailable."); }
  else { value = 1.9; assumptions.push("Used uncalibrated 1.9 PPD fallback."); }
  value += Math.min(0.35, opportunities * 0.025 + redZone * 0.035 + explosives * 0.02);
  value -= Math.min(0.4, pressure * 0.12);
  return { observed, adjusted: clamp(value, 0.25, 5), projected: clamp(value, 0.25, 5), assumptions };
}

export function scoringConversionSuppression(input: FootballTotalsInputs) {
  if (input.opportunityPointsExpectation === undefined || input.actualOpportunityPoints === undefined) return undefined;
  const expectation = Math.max(0, input.opportunityPointsExpectation);
  const actual = Math.max(0, input.actualOpportunityPoints);
  return { scoringOpportunityPointsExpectation: expectation, actualPoints: actual, conversionSuppression: expectation ? clamp((expectation - actual) / expectation, -1, 1) : 0, heuristic: true };
}

export function projectFootballTotals(input: FootballTotalsInputs): { flow: TotalsFlowState; projections: TotalsProjection[] } {
  const possessions = estimateRemainingPossessions(input);
  const homePpd = adjustedPpd(input.homeObservedPointsPerDrive, input.homePregamePointsPerDrive, input.homeScoringOpportunities, input.homeRedZoneEntries, input.homeExplosivePlays, input.homePressureAllowed);
  const awayPpd = adjustedPpd(input.awayObservedPointsPerDrive, input.awayPregamePointsPerDrive, input.awayScoringOpportunities, input.awayRedZoneEntries, input.awayExplosivePlays, input.awayPressureAllowed);
  const homeProjected = input.currentHomePoints + possessions.home * homePpd.projected;
  const awayProjected = input.currentAwayPoints + possessions.away * awayPpd.projected;
  const missing = [input.drivesCompleted, input.playsPerDrive, input.secondsPerPlay, input.homeObservedPointsPerDrive, input.awayObservedPointsPerDrive].filter(v => v === undefined).length;
  const confidence = clamp(0.92 - possessions.confidencePenalty - missing * 0.07, 0.2, 0.95);
  const suppression = scoringConversionSuppression(input);
  const projections: TotalsProjection[] = [
    projection("GAME_TOTAL", input.currentHomePoints + input.currentAwayPoints, homeProjected + awayProjected, possessions.total, (homePpd.projected + awayPpd.projected) / 2, confidence, input, [...possessions.assumptions, ...homePpd.assumptions, ...awayPpd.assumptions]),
    projection("TEAM_TOTAL", input.currentHomePoints, homeProjected, possessions.home, homePpd.projected, confidence, input, [...possessions.assumptions, ...homePpd.assumptions], "HOME", homePpd.observed),
    projection("TEAM_TOTAL", input.currentAwayPoints, awayProjected, possessions.away, awayPpd.projected, confidence, input, [...possessions.assumptions, ...awayPpd.assumptions], "AWAY", awayPpd.observed),
  ];
  const trends = scoreTrends(input, suppression?.conversionSuppression);
  return { flow: {
    runnerEventId: input.runnerEventId, timestamp: input.timestamp, period: `Q${input.period}`, clock: formatClock(input.clockSecondsRemaining),
    currentHomePoints: input.currentHomePoints, currentAwayPoints: input.currentAwayPoints, currentScoreTotal: input.currentHomePoints + input.currentAwayPoints,
    projectedFinalTotal: homeProjected + awayProjected, projectedHomeTeamTotal: homeProjected, projectedAwayTeamTotal: awayProjected,
    expectedRemainingPossessions: possessions.total, homeExpectedRemainingPossessions: possessions.home, awayExpectedRemainingPossessions: possessions.away,
    homeExpectedPointsPerDrive: homePpd.projected, awayExpectedPointsPerDrive: awayPpd.projected,
    scoringPaceDirection: input.tempoDirection ?? "UNKNOWN", possessionPaceDirection: input.tempoDirection ?? "UNKNOWN",
    scoringConversionSuppression: suppression?.conversionSuppression, scoringOpportunityRate: input.drivesCompleted ? ((input.homeScoringOpportunities ?? 0) + (input.awayScoringOpportunities ?? 0)) / input.drivesCompleted : undefined,
    redZoneOpportunityRate: input.drivesCompleted ? ((input.homeRedZoneEntries ?? 0) + (input.awayRedZoneEntries ?? 0)) / input.drivesCompleted : undefined,
    explosivePlayPressure: ((input.homeExplosivePlays ?? 0) + (input.awayExplosivePlays ?? 0)) / Math.max(1, input.drivesCompleted ?? 1),
    clockDrainPressure: input.gameRegime === "BLOWOUT" || input.gameRegime === "GARBAGE_TIME" ? 0.75 : 0.2,
    overTrendScore: trends.over, underTrendScore: trends.under, gameRegime: input.gameRegime, confidence,
    inputs: { ...input, assumptions: [...possessions.assumptions, ...homePpd.assumptions, ...awayPpd.assumptions], modelVersion: "football-heuristic-v1" },
  }, projections };
}

function projection(marketType: TotalsProjection["marketType"], current: number, projected: number, possessions: number, ppd: number, confidence: number, input: FootballTotalsInputs, assumptions: string[], teamId?: string, observed?: number): TotalsProjection {
  return { runnerEventId: input.runnerEventId, timestamp: input.timestamp, modelVersion: "football-heuristic-v1", marketType, teamId, currentPoints: current, projectedPoints: projected, projectedRemainingPoints: projected-current, observedPointsPerDrive: observed, adjustedPointsPerDrive: ppd, projectedPointsPerDrive: ppd, expectedRemainingPossessions: possessions, confidence, assumptions, components: { period: input.period, clockSecondsRemaining: input.clockSecondsRemaining, gameRegime: input.gameRegime } };
}

export function scoreTrends(input: FootballTotalsInputs, conversionSuppression?: number, config = DEFAULT_TOTALS_CONFIG) {
  const w = config.trendWeights;
  const pace = input.tempoDirection === "RISING" ? 1 : input.tempoDirection === "FALLING" ? -1 : 0;
  const efficiency = (((input.homeObservedPointsPerDrive ?? 1.9) + (input.awayObservedPointsPerDrive ?? 1.9)) / 2 - 1.9) / 1.9;
  const explosive = ((input.homeExplosivePlays ?? 0) + (input.awayExplosivePlays ?? 0)) / Math.max(1, input.drivesCompleted ?? 8);
  const opportunity = ((input.homeScoringOpportunities ?? 0) + (input.awayScoringOpportunities ?? 0)) / Math.max(1, input.drivesCompleted ?? 8);
  const pressure = ((input.homePressureAllowed ?? 0) + (input.awayPressureAllowed ?? 0)) / 2;
  const clockDrain = input.gameRegime === "BLOWOUT" || input.gameRegime === "GARBAGE_TIME" ? 1 : 0;
  const over = clamp(45 + pace*w.pace + efficiency*w.efficiency + explosive*w.explosives + opportunity*w.opportunities - pressure*w.pressure + Math.max(0, conversionSuppression ?? 0)*w.conversion - clockDrain*w.regime);
  const under = clamp(45 - pace*w.pace - efficiency*w.efficiency - explosive*w.explosives - opportunity*w.opportunities + pressure*w.pressure + clockDrain*w.regime + Math.max(0, -(conversionSuppression ?? 0))*w.conversion);
  return { over, under, overClass: classifyTrend(over, config), underClass: classifyTrend(under, config) };
}

export function classifyTrend(score: number, config = DEFAULT_TOTALS_CONFIG): TrendClass {
  const [developing, watch, candidate, strong] = config.trendThresholds;
  return score < developing ? "NEUTRAL" : score < watch ? "DEVELOPING" : score < candidate ? "WATCH" : score < strong ? "ACTION_WINDOW_CANDIDATE" : "STRONG_ACTION_WINDOW_CANDIDATE";
}

export function sourceSynchronization(input: FootballTotalsInputs, market: TotalsMarketSnapshot, now = new Date().toISOString(), config = DEFAULT_TOTALS_CONFIG): SourceSynchronization {
  const game = input.gameFeedState ?? { scoreTotal: input.currentHomePoints + input.currentAwayPoints, period: input.period, clockSecondsRemaining: input.clockSecondsRemaining, timestamp: input.sourceTimestamp };
  const conflicts: string[] = [];
  if (game.scoreTotal !== input.currentHomePoints + input.currentAwayPoints) conflicts.push("score");
  if (game.period !== input.period) conflicts.push("period");
  if (Math.abs(game.clockSecondsRemaining - input.clockSecondsRemaining) > config.maximumClockConflictSeconds) conflicts.push("clock");
  const gameFeedAgeMs = Math.max(0, Date.parse(now) - Date.parse(game.timestamp));
  const marketFeedAgeMs = Math.max(0, Date.parse(now) - Date.parse(market.timestamp));
  const confidence = clamp(1 - conflicts.length*0.3 - Math.min(0.4, gameFeedAgeMs/config.gameFeedStaleMs*0.2) - Math.min(0.4, marketFeedAgeMs/config.marketFeedStaleMs*0.2), 0, 1);
  return { confidence, conflicts, gameFeedAgeMs, marketFeedAgeMs };
}

export function evaluateSuppressions(input: FootballTotalsInputs, market: TotalsMarketSnapshot, projection: TotalsProjection, sync: SourceSynchronization, config = DEFAULT_TOTALS_CONFIG): SuppressionReason[] {
  const out: SuppressionReason[] = [];
  if (!market.runnerEventId) out.push("UNMATCHED_EVENT");
  if (market.suspended) out.push("MARKET_SUSPENDED");
  if (projection.confidence < config.minimumConfidence) out.push("LOW_CONFIDENCE");
  if (sync.gameFeedAgeMs > config.gameFeedStaleMs) out.push("STALE_GAME_FEED");
  if (sync.marketFeedAgeMs > config.marketFeedStaleMs) out.push("STALE_MARKET_FEED");
  if (sync.conflicts.length) out.push("GAME_STATE_CONFLICT");
  if (market.liquidity !== undefined && market.liquidity < config.minimumLiquidity) out.push("LOW_LIQUIDITY");
  if (market.bid !== undefined && market.ask !== undefined && market.ask-market.bid > config.maximumSpread) out.push("EXCESSIVE_SPREAD");
  return [...new Set(out)];
}

export function createDecisionWindow(market: TotalsMarketSnapshot, projection: TotalsProjection, trends: { over: number; under: number }, input: FootballTotalsInputs, now = new Date().toISOString(), config = DEFAULT_TOTALS_CONFIG): TotalsDecisionWindow {
  const rawEdge = projection.projectedPoints - market.line;
  const favorableEdge = market.selection === "OVER" ? rawEdge : -rawEdge;
  const sync = sourceSynchronization(input, market, now, config);
  const suppressions = evaluateSuppressions(input, market, projection, sync, config);
  if (favorableEdge < config.minimumEdge) suppressions.push("LOW_EDGE");
  const trend = market.selection === "OVER" ? trends.over : trends.under;
  const status = suppressions.length ? "SUPPRESSED" : trend >= 75 ? "ACTIONABLE" : trend >= 65 ? "ARMED" : trend >= 50 ? "WATCH" : "DETECTED";
  const seconds = timerSeconds(market, input, config);
  const expiresAt = status === "ACTIONABLE" ? new Date(Date.parse(now)+seconds*1000).toISOString() : undefined;
  return { id: stableHash({ market: market.id, projection: projection.timestamp, selection: market.selection }), runnerEventId: input.runnerEventId, marketType: market.marketType, period: market.period, teamId: market.teamId, selection: market.selection, marketLine: market.line, marketPrice: market.price, runnerProjection: projection.projectedPoints, rawEdge, favorableEdge, overTrendScore: trends.over, underTrendScore: trends.under, confidence: projection.confidence*sync.confidence, status, detectedAt: now, openedAt: status === "ACTIONABLE" ? now : undefined, expiresAt, initialEdge: favorableEdge, peakEdge: favorableEdge, currentEdge: favorableEdge, informationDecayIndex: 1, secondsRemaining: expiresAt ? seconds : undefined, nextSetPoint: nextSetPoint(input.period, input.clockSecondsRemaining).type, reasons: [`${market.selection} favorable edge ${favorableEdge.toFixed(2)}`, `trend score ${trend.toFixed(1)}`, `SSC ${sync.confidence.toFixed(2)}`], suppressions: [...new Set(suppressions)], sourceTimestamp: market.timestamp, processedTimestamp: now };
}

export function advanceDecisionWindow(window: TotalsDecisionWindow, currentRawEdge: number, now = new Date().toISOString(), config = DEFAULT_TOTALS_CONFIG): TotalsDecisionWindow {
  if (window.status === "SUPPRESSED" || window.status === "EXPIRED") return window;
  const current = window.selection === "OVER" ? currentRawEdge : -currentRawEdge;
  const initial = window.initialEdge ?? window.favorableEdge;
  const idi = initial > 0 ? current/initial : undefined;
  const expiredByTime = window.expiresAt ? Date.parse(now) >= Date.parse(window.expiresAt) : false;
  const decayed = current < config.minimumEdge || (idi !== undefined && idi < config.decayEdgeRatio);
  const status = expiredByTime ? "EXPIRED" : decayed ? "DECAYING" : window.status;
  return { ...window, status, currentEdge: current, peakEdge: Math.max(window.peakEdge ?? current, current), informationDecayIndex: idi, secondsRemaining: window.expiresAt ? Math.max(0, Math.ceil((Date.parse(window.expiresAt)-Date.parse(now))/1000)) : undefined, nextSetPoint: status === "EXPIRED" || status === "DECAYING" ? "NEXT_POSSESSION" : window.nextSetPoint, processedTimestamp: now };
}

export function nextSetPoint(period: number, clock: number): { type: SetPointType; reason: string } {
  if (period === 2 && clock <= 0) return { type: "HALFTIME", reason: "First-half state is complete; generate halftime reprice." };
  if (period === 3 && clock <= 0) return { type: "END_QUARTER", reason: "Third quarter ended; apply the fourth-quarter profile." };
  if (period === 4) {
    if (clock > 600) return { type: "TEN_MINUTES_Q4", reason: "Next late-game time checkpoint." };
    if (clock > 450) return { type: "SEVEN_THIRTY_Q4", reason: "Next late-game time checkpoint." };
    if (clock > 300) return { type: "FIVE_MINUTES_Q4", reason: "Next late-game time checkpoint." };
    if (clock > 180) return { type: "THREE_MINUTES_Q4", reason: "Next late-game time checkpoint." };
    if (clock > 120) return { type: "TWO_MINUTES_Q4", reason: "Next late-game time checkpoint." };
  }
  return { type: "END_CURRENT_POSSESSION", reason: "Reprice after the current possession resolves." };
}

export function createHalftimePacket(input: FootballTotalsInputs, projections: TotalsProjection[], suppressions: SuppressionReason[] = []): HalftimeTotalsPacket {
  const trends = scoreTrends(input, scoringConversionSuppression(input)?.conversionSuppression);
  const confidence = projections.length ? Math.min(...projections.map(p=>p.confidence)) : 0;
  return { runnerEventId: input.runnerEventId, timestamp: input.timestamp, score: { home: input.currentHomePoints, away: input.currentAwayPoints }, firstHalfPossessions: input.drivesCompleted, metrics: { homeObservedPpd: input.homeObservedPointsPerDrive, awayObservedPpd: input.awayObservedPointsPerDrive, scoringOpportunities: (input.homeScoringOpportunities??0)+(input.awayScoringOpportunities??0), redZoneEntries: (input.homeRedZoneEntries??0)+(input.awayRedZoneEntries??0), turnovers: input.turnovers, missedFieldGoals: input.missedFieldGoals, explosivePlays: (input.homeExplosivePlays??0)+(input.awayExplosivePlays??0), receivingSecondHalf: input.receivingSecondHalf, gameRegime: input.gameRegime }, projections, overTrendScore: trends.over, underTrendScore: trends.under, confidence, disposition: suppressions.length ? "SUPPRESSED" : Math.max(trends.over,trends.under)>=75 ? "ACTIONABLE" : Math.max(trends.over,trends.under)>=50 ? "WATCH" : "PASS", suppressions };
}

export function impliedProbability(price: number): number { return price < 0 ? Math.abs(price)/(Math.abs(price)+100) : 100/(price+100); }
export function noVigProbabilities(overPrice: number, underPrice: number) { const over=impliedProbability(overPrice), under=impliedProbability(underPrice), total=over+under; return { overRaw: over, underRaw: under, overNoVig: over/total, underNoVig: under/total }; }
export function analyzeLadder(markets: TotalsMarketSnapshot[], currentPoints: number) { return [...markets].sort((a,b)=>a.line-b.line).map((m,i,all)=>({ marketId:m.id, line:m.line, price:m.price, additionalPointsRequired:Math.max(0,m.line-currentPoints), likelyScoreCountRequired:Math.ceil(Math.max(0,m.line-currentPoints)/7), ladderPosition:i+1, adjacentLines:[all[i-1]?.line,all[i+1]?.line].filter((v):v is number=>v!==undefined), priceDifference:i? m.price!==undefined&&all[i-1].price!==undefined?m.price-all[i-1].price!:undefined:undefined })); }

function timerSeconds(market: TotalsMarketSnapshot, input: FootballTotalsInputs, config: TotalsEngineConfig) { if (market.marketType.includes("SECOND_HALF") || input.period === 2 && input.clockSecondsRemaining === 0) return clamp(config.timers.halftime,60,180); const fast = market.suspended || (market.bid!==undefined&&market.ask!==undefined&&market.ask-market.bid>0.08) || input.clockSecondsRemaining<300; return clamp(fast?config.timers.fast:config.timers.normal,10,45); }
function formatClock(seconds:number){return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;}
export function flowDirection(delta:number):FlowDirection{return Math.abs(delta)<0.05?"STABLE":delta>0?"RISING":"FALLING";}
