import { createServer } from "node:http";
import { MarketStateCache } from "../state/market-state/cache.js";

export function startApi(cache: MarketStateCache, port = 8787) {
  const server = createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    response.setHeader("access-control-allow-origin", "*");
    if (request.method === "OPTIONS") { response.statusCode = 204; response.end(); return; }
    if (request.url === "/health") response.end(JSON.stringify({ ok: true, updatedAt: new Date().toISOString() }));
    else if (request.url === "/markets/live") response.end(JSON.stringify({ data: cache.all() }));
    else if (request.url === "/edges/live" || request.url === "/signals/live" || request.url === "/games/live") response.end(JSON.stringify({ data: [] }));
    else { response.statusCode = 404; response.end(JSON.stringify({ error: "not_found" })); }
  });
  server.listen(port, () => console.log(`Runner Scout API listening on http://localhost:${port}`));
  return server;
}
