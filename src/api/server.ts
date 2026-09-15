import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { MarketStateCache } from "../state/market-state/cache.js";
import { GameFlowEngine } from "../game-flow/engine.js";
import { SqliteStore } from "../storage/sqlite.js";
import { TotalsRuntime } from "../totals/runtime.js";
import { renderWebDashboard } from "../dashboard/web.js";
import { LiveDataRuntime, normalizeScheduleDate, validateSport } from "../live-data/runtime.js";
import { createBaseline } from "../models/pregame/baseline.js";
import type { ProviderHealth } from "../types.js";
import { optionalStringEnv } from "../utils/env.js";

function safeTokenMatch(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

function requireBearerAuth(request: IncomingMessage, response: ServerResponse): boolean {
  const expectedToken = optionalStringEnv("RUNNER_API_BEARER_TOKEN");
  if (!expectedToken) {
    response.statusCode = 503;
    response.end(JSON.stringify({ error: "auth_not_configured" }));
    return false;
  }
  const header = request.headers.authorization;
  const provided = typeof header === "string" && header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : undefined;
  if (!provided || !safeTokenMatch(provided, expectedToken)) {
    response.statusCode = 401;
    response.end(JSON.stringify({ error: "unauthorized" }));
    return false;
  }
  return true;
}

function applyCors(request: IncomingMessage, response: ServerResponse): void {
  const allowedOrigins = (optionalStringEnv("RUNNER_API_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  if (allowedOrigins.length === 0) return;
  const requestOrigin = request.headers.origin;
  let allowOrigin: string | undefined;
  if (allowedOrigins.includes("*")) allowOrigin = "*";
  else if (typeof requestOrigin === "string" && allowedOrigins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
    response.setHeader("vary", "Origin");
  }
  if (!allowOrigin) return;
  response.setHeader("access-control-allow-origin", allowOrigin);
  response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  response.setHeader("access-control-allow-headers", "Content-Type, Authorization");
}

export interface ScheduleQuery { date: string; sport: "CFB"; ranked?: boolean; }
export function parseScheduleQuery(url: URL, rankedDefault?: boolean): ScheduleQuery {
  const sport = url.searchParams.get("sport") ?? "CFB";
  validateSport(sport);
  const rankedValue = url.searchParams.get("ranked");
  let ranked = rankedDefault;
  if (rankedValue !== null) {
    if (!["true", "false", "1", "0"].includes(rankedValue.toLowerCase())) throw new Error("ranked must be true or false");
    ranked = ["true", "1"].includes(rankedValue.toLowerCase());
  }
  return { date: normalizeScheduleDate(url.searchParams.get("date") ?? undefined), sport: "CFB", ranked };
}

export function startApi(
  cache: MarketStateCache,
  port = 8787,
  flow = new GameFlowEngine(),
  store?: SqliteStore,
  liveData?: LiveDataRuntime,
  marketHealth: () => ProviderHealth[] = () => [],
) {
  const totals = new TotalsRuntime(store);
  const server = createServer(async (request, response) => {
    response.setHeader("content-type", "application/json");
    applyCors(request, response);
    if (request.method === "OPTIONS") { response.statusCode = 204; response.end(); return; }
    const url = new URL(request.url ?? "/", "http://runner.local");
    const path = url.pathname;
    try {
      if (request.method === "GET" && (path === "/" || path === "/dashboard")) {
        response.setHeader("content-type", "text/html; charset=utf-8");
        response.end(renderWebDashboard()); return;
      }
      if (request.method === "POST" && path === "/observations") {
        if (!requireBearerAuth(request, response)) return;
        const observation = JSON.parse(await readBody(request));
        const snapshot = flow.ingest(observation);
        store?.persistGameFlow(observation, snapshot);
        response.statusCode = 201; response.end(JSON.stringify({ data: snapshot })); return;
      }
      if (request.method === "POST" && path === "/baselines") {
        if (!requireBearerAuth(request, response)) return;
        if (!store) return serviceUnavailable(response, "baseline_store_unavailable");
        const baseline = createBaseline(JSON.parse(await readBody(request)));
        store.persistBaseline(baseline);
        response.statusCode = 201; response.end(JSON.stringify({ data: baseline })); return;
      }
      if (request.method === "POST" && path === "/totals/evaluate") {
        if (!requireBearerAuth(request, response)) return;
        const body = JSON.parse(await readBody(request));
        const result = totals.evaluate(body.input, body.markets ?? []);
        response.statusCode = 201; response.end(JSON.stringify({ data: result })); return;
      }
      if (request.method === "GET" && ["/schedule/today", "/schedule/cfb", "/schedule/ranked"].includes(path)) {
        if (!liveData) return serviceUnavailable(response, "live_game_runtime_unavailable");
        const query = parseScheduleQuery(url, path === "/schedule/ranked" ? true : undefined);
        const games = await liveData.discoverSchedule(query);
        response.end(JSON.stringify({ data: games, filters: query })); return;
      }
      const gameRoute = matchGameRoute(path);
      if (request.method === "GET" && gameRoute && !(gameRoute.id === "live" && !gameRoute.resource)) {
        const id = gameRoute.id;
        if (gameRoute.resource === "totals") {
          const evaluation = totals.get(id);
          if (!evaluation) return notFound(response, "totals_not_found");
          const view = gameRoute.subresource;
          const data = view === "projections" ? evaluation.projections : view === "signals" ? evaluation.windows.flatMap((window) => window.reasons) : view === "windows" ? evaluation.windows : view === "set-points" ? evaluation.windows.map((window) => ({ windowId: window.id, nextSetPoint: window.nextSetPoint })) : evaluation;
          response.end(JSON.stringify({ data })); return;
        }
        if (gameRoute.resource === "markets") { response.end(JSON.stringify({ data: liveData?.gameMarkets(id) ?? [] })); return; }
        if (gameRoute.resource === "baselines") { response.end(JSON.stringify({ data: store?.baselines(id) ?? [] })); return; }
        if (gameRoute.resource === "comparisons") { response.end(JSON.stringify({ data: liveData?.comparisons(id) ?? [{ runnerEventId: id, available: false, executionAssessment: "NOT_EVALUATED", suppressionReasons: ["LIVE_DATA_RUNTIME_UNAVAILABLE"], processedTimestamp: new Date().toISOString() }] })); return; }
        const game = liveData?.game(id);
        const observation = flow.snapshot(id);
        if (!game && !observation) return notFound(response, "game_not_found");
        response.end(JSON.stringify({ data: game ? { ...game, flow: observation } : observation })); return;
      }
      if (path === "/health") {
        const providers = [...marketHealth(), ...(liveData?.health() ?? [])];
        response.end(JSON.stringify({ ok: true, updatedAt: new Date().toISOString(), providers }));
      } else if (path === "/markets/live") response.end(JSON.stringify({ data: cache.all() }));
      else if (path === "/sportsbooks/live") response.end(JSON.stringify({ data: liveData?.sportsMarkets.all() ?? [] }));
      else if (path === "/games/live") {
        const games = liveData?.games.live();
        if (!games) response.end(JSON.stringify({ data: flow.allSnapshots() }));
        else {
          const ids = new Set(games.map((game) => game.runnerEventId));
          const authoritative = games.map((game) => ({ ...game, flow: flow.snapshot(game.runnerEventId) }));
          response.end(JSON.stringify({ data: [...authoritative, ...flow.allSnapshots().filter((snapshot) => !ids.has(snapshot.runnerEventId))] }));
        }
      } else if (path === "/totals/live") response.end(JSON.stringify({ data: totals.all().length ? totals.all() : flow.allSnapshots().map((snapshot) => ({ runnerEventId: snapshot.runnerEventId, timestamp: snapshot.totals.timestamp, totals: snapshot.totals, signals: snapshot.totalsSignals })) }));
      else if (path === "/totals/alerts") response.end(JSON.stringify({ data: totals.alerts() }));
      else if (path === "/edges/live" || path === "/models/comparisons") response.end(JSON.stringify({ data: liveData?.allComparisons() ?? [] }));
      else if (path === "/signals/live") response.end(JSON.stringify({ data: [] }));
      else notFound(response, "not_found");
    } catch (error) {
      response.statusCode = error instanceof SyntaxError ? 400 : 422;
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : "request_failed" }));
    }
  });
  server.listen(port, () => console.log(`Runner Scout API listening on http://localhost:${port}`));
  return server;
}

type GameRoute = { id: string; resource?: "markets" | "baselines" | "comparisons" | "totals"; subresource?: string };
export function matchGameRoute(path: string): GameRoute | undefined {
  const match = path.match(/^\/games\/([^/]+)(?:\/(markets|baselines|comparisons|totals)(?:\/(projections|signals|windows|set-points))?)?$/);
  if (!match) return undefined;
  try { return { id: decodeURIComponent(match[1]), resource: match[2] as GameRoute["resource"], subresource: match[3] }; }
  catch { throw new Error("game id is not valid URL encoding"); }
}
function notFound(response: import("node:http").ServerResponse, error: string) { response.statusCode = 404; response.end(JSON.stringify({ error })); }
function serviceUnavailable(response: import("node:http").ServerResponse, error: string) { response.statusCode = 503; response.end(JSON.stringify({ error })); }
function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => { body += chunk; });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}
