import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { MarketStateCache } from "../state/market-state/cache.js";
import { GameFlowEngine } from "../game-flow/engine.js";
import { SqliteStore } from "../storage/sqlite.js";

export function startApi(cache: MarketStateCache, port = 8787, flow = new GameFlowEngine(), store?: SqliteStore) {
  const server = createServer(async (request, response) => {
    response.setHeader("content-type", "application/json");
    response.setHeader("access-control-allow-origin", "*");
    if (request.method === "OPTIONS") { response.statusCode = 204; response.end(); return; }
    const path = request.url?.split("?")[0];
    if (request.method === "POST" && path === "/observations") {
      try {
        const observation = JSON.parse(await readBody(request));
        const snapshot = flow.ingest(observation);
        store?.persistGameFlow(observation, snapshot);
        response.statusCode = 201;
        response.end(JSON.stringify({ data: snapshot }));
      } catch (error) {
        response.statusCode = 400;
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : "invalid_observation" }));
      }
      return;
    }
    if (path === "/health") response.end(JSON.stringify({ ok: true, updatedAt: new Date().toISOString() }));
    else if (path === "/markets/live") response.end(JSON.stringify({ data: cache.all() }));
    else if (path === "/games/live") response.end(JSON.stringify({ data: flow.allSnapshots() }));
    else if (path === "/totals/live") response.end(JSON.stringify({ data: flow.allSnapshots().map((snapshot) => ({
      runnerEventId: snapshot.runnerEventId,
      timestamp: snapshot.totals.timestamp,
      totals: snapshot.totals,
      signals: snapshot.totalsSignals,
    })) }));
    else if (path === "/edges/live" || path === "/signals/live") response.end(JSON.stringify({ data: [] }));
    else { response.statusCode = 404; response.end(JSON.stringify({ error: "not_found" })); }
  });
  server.listen(port, () => console.log(`Runner Scout API listening on http://localhost:${port}`));
  return server;
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => { body += chunk; });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}
