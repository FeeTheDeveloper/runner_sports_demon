import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { MarketStateCache } from "../state/market-state/cache.js";
import { GameFlowEngine } from "../game-flow/engine.js";
import { SqliteStore } from "../storage/sqlite.js";
import { TotalsRuntime } from "../totals/runtime.js";
import { renderWebDashboard } from "../dashboard/web.js";
import { CfbScheduleService, NflScheduleService } from "../games/discovery/service.js";
import { intEnv, optionalStringEnv } from "../utils/env.js";
import { renderControlDashboard } from "../dashboard/control-web.js";
import { readControlSnapshot } from "../dashboard/control.js";
import { freshnessAt, metadata, readContent } from "../operations/data.js";

// Compares the provided bearer token against the configured one in constant time,
// so response timing cannot be used to guess the correct token byte-by-byte.
function safeTokenMatch(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

// Fail-closed bearer-token check for mutating endpoints. Writes an error response and
// returns false when the caller should not proceed; returns true when the request is authorized.
// If RUNNER_API_BEARER_TOKEN is unset, this is a deploy misconfiguration, not an open endpoint:
// every mutating request is rejected with 503 rather than silently allowed through.
function requireBearerAuth(request: IncomingMessage, response: ServerResponse): boolean {
  const expectedToken = optionalStringEnv("RUNNER_API_BEARER_TOKEN");
  if (!expectedToken) {
    response.statusCode = 503;
    response.end(JSON.stringify({ error: "auth_not_configured" }));
    return false;
  }
  const header = request.headers.authorization;
  const match = typeof header === "string" ? header.match(/^Bearer\s+(.+)$/i) : null;
  const provided = match?.[1];
  if (!provided || !safeTokenMatch(provided, expectedToken)) {
    response.statusCode = 401;
    response.end(JSON.stringify({ error: "unauthorized" }));
    return false;
  }
  return true;
}

// CORS is opt-in and configurable via RUNNER_API_ALLOWED_ORIGINS (comma-separated origins,
// or a literal "*" entry to explicitly allow any origin). No env var set => no CORS header at
// all, rather than the previous unconditional Access-Control-Allow-Origin: *.
function applyCors(request: IncomingMessage, response: ServerResponse): void {
  const allowedOrigins = (optionalStringEnv("RUNNER_API_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  if (allowedOrigins.length === 0) return;
  const requestOrigin = request.headers.origin;
  let allowOrigin: string | undefined;
  if (allowedOrigins.includes("*")) {
    allowOrigin = "*";
  } else if (typeof requestOrigin === "string" && allowedOrigins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
    response.setHeader("vary", "Origin");
  }
  if (!allowOrigin) return;
  response.setHeader("access-control-allow-origin", allowOrigin);
  response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  response.setHeader("access-control-allow-headers", "Content-Type, Authorization");
}

export function startApi(cache: MarketStateCache, port = 8787, flow = new GameFlowEngine(), store?: SqliteStore, options: { localDashboard?: boolean } = {}) {
  const totals = new TotalsRuntime(store);
  const cfbSchedule = new CfbScheduleService();
  const nflSchedule = new NflScheduleService();
  const server = createServer(async (request, response) => {
    response.setHeader("content-type", "application/json");
    response.setHeader("cache-control", "no-store");
    response.setHeader("x-content-type-options", "nosniff");
    if (options.localDashboard) {
      const host = (request.headers.host ?? "").split(":")[0];
      if (!["localhost", "127.0.0.1"].includes(host)) {
        response.statusCode = 403; response.end(JSON.stringify({ error: "local_host_required" })); return;
      }
      response.setHeader("content-security-policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
      if (request.method !== "GET") {
        response.statusCode = 405; response.setHeader("allow", "GET"); response.end(JSON.stringify({ error: "dashboard_is_read_only" })); return;
      }
    } else applyCors(request, response);
    if (request.method === "OPTIONS") { response.statusCode = 204; response.end(); return; }
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const path = requestUrl.pathname;
    if (request.method === "GET" && (path === "/" || path === "/dashboard")) {
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(options.localDashboard ? renderControlDashboard() : renderWebDashboard());
      return;
    }
    if (request.method === "GET" && path === "/control/status" && options.localDashboard) {
      try {
        const snapshot = readControlSnapshot();
        const meta = metadata("local SQLite snapshot", snapshot.markets.map(m => m.receivedAt));
        response.end(JSON.stringify({ ...snapshot, ...meta,
          warnings: [...meta.warnings, ...snapshot.providers.filter(p => p.status !== "connected" || p.hasError).map(p => `${p.provider}: ${p.hasError ? "fetch failed; " : ""}${p.status}; inspect source freshness.`)] }));
      }
      catch { response.statusCode = 503; response.end(JSON.stringify({ error: "local_status_unavailable" })); }
      return;
    }
    if (request.method === "GET" && path === "/content") {
      try {
        const data = readContent();
        const labels = [...new Set(data.map(card => card.artifact.freshness))];
        response.end(JSON.stringify({ data, source: "data/content/cards.json", freshness: labels.length === 1 ? labels[0] : "UNKNOWN", warnings: ["Content shells require verified evidence and editorial review."] }));
      }
      catch { response.statusCode = 503; response.end(JSON.stringify({ error: "content_unavailable", freshness: "UNKNOWN" })); }
      return;
    }
    if (request.method === "GET" && path === "/markets/snapshot" && options.localDashboard) {
      const snapshot = readControlSnapshot();
      response.statusCode = snapshot.database.status === "ready" ? 200 : 503;
      response.end(JSON.stringify({ ...metadata("SQLite saved market observations", snapshot.markets.map(m => m.receivedAt)),
        data: snapshot.markets.map(m => ({ ...m, retrievedAt: m.receivedAt, freshness: freshnessAt(m.receivedAt),
          provenance: { provider: m.provider, source: "SQLite markets / market_prices", transformVersion: "runner-operations-v1", timestampBasis: "provider response received by local engine" } })),
        providers: snapshot.providers, databaseStatus: snapshot.database.status }));
      return;
    }
    if (request.method === "GET" && ["/schedule/today", "/schedule/cfb", "/schedule/nfl", "/schedule/ranked"].includes(path)) {
      try {
        const date = requestUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date must use YYYY-MM-DD");
        const requestedSport = path === "/schedule/nfl" || requestUrl.searchParams.get("sport")?.toLowerCase() === "nfl" ? "nfl" : "cfb";
        const games = requestedSport === "nfl" ? await nflSchedule.schedule(date) : await cfbSchedule.schedule(date);
        store?.persistGames(games);
        const data = path === "/schedule/ranked" || requestUrl.searchParams.get("ranked") === "true"
          ? games.filter((game) => game.awayRank !== undefined || game.homeRank !== undefined)
          : games;
        response.end(JSON.stringify({ ...metadata("ESPN scoreboard receipt; sourceTimestamp in legacy rows is kickoff, not provider update time", data.map(game => game.receivedTimestamp), 300_000),
          data: data.map(({ raw, ...game }) => ({ ...game, retrievedAt: game.receivedTimestamp, freshness: freshnessAt(game.receivedTimestamp, undefined, Date.now(), 300_000),
            provenance: { provider: "espn", source: "scoreboard", transformVersion: "espn-football-v1", eventStartTime: game.kickoff } })) }));
      } catch (error) {
        response.statusCode = 502;
        response.end(JSON.stringify({ error: "schedule_unavailable", freshness: "UNKNOWN", source: "ESPN scoreboard", warnings: ["Provider request failed. No fallback is presented as current."] }));
      }
      return;
    }
    if (request.method === "POST" && path === "/observations") {
      if (!requireBearerAuth(request, response)) return;
      try {
        const observation = JSON.parse(await readBody(request));
        const snapshot = flow.ingest(observation);
        store?.persistGameFlow(observation, snapshot);
        response.statusCode = 201;
        response.end(JSON.stringify({ data: snapshot, ...metadata(`Observation: ${observation.source}`, [observation.observedAt], 15_000), provenance: { observedAt: observation.observedAt, receivedAt: observation.receivedAt, observationId: observation.id } }));
      } catch (error) {
        response.statusCode = 400;
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : "invalid_observation" }));
      }
      return;
    }
    if (request.method === "POST" && path === "/totals/evaluate") {
      if (!requireBearerAuth(request, response)) return;
      try {
        const body = JSON.parse(await readBody(request));
        const result = totals.evaluate(body.input, body.markets ?? []);
        response.statusCode = 201;
        response.end(JSON.stringify({ data: result, ...metadata("football-heuristic-v1; uncalibrated research", [body.input.sourceTimestamp, ...(body.markets ?? []).map((m: { timestamp?: string }) => m.timestamp)], 15_000), provenance: { modelFile: "src/totals/engine.ts", version: "football-heuristic-v1", sourceTimestamp: body.input.sourceTimestamp, inputTimestamp: body.input.timestamp } }));
      } catch (error) {
        response.statusCode = 400;
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : "invalid_totals_input" }));
      }
      return;
    }
    const totalsMatch = path.match(/^\/games\/([^/]+)\/totals(?:\/(projections|signals|windows|set-points))?$/);
    if (totalsMatch) {
      const evaluation = totals.get(decodeURIComponent(totalsMatch[1]));
      if (!evaluation) { response.statusCode = 404; response.end(JSON.stringify({ error: "totals_not_found" })); return; }
      const view = totalsMatch[2];
      const data = view === "projections" ? evaluation.projections : view === "signals" ? evaluation.windows.flatMap(w=>w.reasons) : view === "windows" ? evaluation.windows : view === "set-points" ? evaluation.windows.map(w=>({ windowId:w.id,nextSetPoint:w.nextSetPoint })) : evaluation;
      response.end(JSON.stringify({ data })); return;
    }
    if (request.method === "GET" && path === "/games/live") { response.end(JSON.stringify({ data: flow.allSnapshots() })); return; }
    const gameMatch = path.match(/^\/games\/([^/]+)(?:\/(flow|markets|props))?$/);
    if (request.method === "GET" && gameMatch) {
      const runnerEventId = decodeURIComponent(gameMatch[1]);
      const view = gameMatch[2];
      const game = cfbSchedule.find(runnerEventId) ?? nflSchedule.find(runnerEventId);
      if (view === "flow") {
        const data = flow.snapshot(runnerEventId);
        if (!data) { response.statusCode = 404; response.end(JSON.stringify({ error: "game_flow_not_found" })); return; }
        response.end(JSON.stringify({ data })); return;
      }
      if (view === "markets") { response.end(JSON.stringify({ data: cache.all().filter((market) => market.runnerEventId === runnerEventId) })); return; }
      if (view === "props") { response.end(JSON.stringify({ data: [], implemented: false })); return; }
      if (!game) { response.statusCode = 404; response.end(JSON.stringify({ error: "game_not_found" })); return; }
      response.end(JSON.stringify({ data: game })); return;
    }
    if (request.method === "GET" && (path === "/health" || path === "/api/health")) response.end(JSON.stringify({ ok: true, updatedAt: new Date().toISOString(), source: "local process", freshness: "CURRENT", scope: "process liveness only; provider health is separate", mode: options.localDashboard ? "local-snapshot" : "engine" }));
    else if (request.method === "GET" && path === "/markets/live") response.end(JSON.stringify({ ...metadata("in-memory provider observations", cache.all().map(m => m.receivedTimestamp)), data: cache.all().map(({ raw, ...market }) => ({ ...market, retrievedAt: market.receivedTimestamp, freshness: freshnessAt(market.receivedTimestamp), provenance: { provider: market.provider, sourceTimestamp: market.sourceTimestamp, transformVersion: "normalized-market-v1" } })) }));
    else if (path === "/totals/live") response.end(JSON.stringify({ data: totals.all().length ? totals.all() : flow.allSnapshots().map((snapshot) => ({ runnerEventId: snapshot.runnerEventId, timestamp: snapshot.totals.timestamp, totals: snapshot.totals, signals: snapshot.totalsSignals })) }));
    else if (path === "/totals/alerts") response.end(JSON.stringify({ data: totals.alerts() }));
    else if (path === "/edges/live" || path === "/signals/live") response.end(JSON.stringify({ data: [], implemented: false }));
    else { response.statusCode = 404; response.end(JSON.stringify({ error: "not_found" })); }
  });
  if (options.localDashboard) server.listen(port, "127.0.0.1", () => console.log(`Runner Control Center: http://127.0.0.1:${port}`));
  else {
    const host = optionalStringEnv("RUNNER_API_HOST") ?? "127.0.0.1";
    server.listen(port, host, () => console.log(`Runner Scout API listening on http://${host}:${port}`));
  }
  return server;
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    const maxBytes = intEnv("RUNNER_API_MAX_BODY_BYTES", 1_048_576);
    let bytes = 0;
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > maxBytes) {
        reject(new Error(`request body exceeds ${maxBytes} bytes`));
        return;
      }
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}
