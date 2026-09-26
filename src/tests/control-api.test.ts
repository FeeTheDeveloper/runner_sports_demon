import assert from "node:assert/strict";
import { once } from "node:events";
import { existsSync, mkdtempSync, rmdirSync } from "node:fs";
import { request, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Script } from "node:vm";
import { startApi } from "../api/server.js";
import { renderControlDashboard } from "../dashboard/control-web.js";
import { MarketStateCache } from "../state/market-state/cache.js";

const temporaryDirectory = mkdtempSync(join(tmpdir(), "runner-control-api-"));
const missingDatabase = join(temporaryDirectory, "missing.db");
const syntheticToken = "control-api-test-token-not-a-real-secret";
const syntheticProviderSecret = "control-api-test-provider-not-a-real-secret";
const environment = {
  RUNNER_SCOUT_DB: process.env.RUNNER_SCOUT_DB,
  RUNNER_API_BEARER_TOKEN: process.env.RUNNER_API_BEARER_TOKEN,
  RUNNER_API_ALLOWED_ORIGINS: process.env.RUNNER_API_ALLOWED_ORIGINS,
  RUNNER_API_MAX_BODY_BYTES: process.env.RUNNER_API_MAX_BODY_BYTES,
  RUNNER_SITE_SUPABASE_SERVICE_ROLE_KEY: process.env.RUNNER_SITE_SUPABASE_SERVICE_ROLE_KEY,
};
const originalFetch = globalThis.fetch;
let externalRequests = 0;
const servers: Server[] = [];

async function launch(localDashboard: boolean): Promise<Server> {
  const server = startApi(new MarketStateCache(), 0, undefined, undefined, { localDashboard });
  servers.push(server);
  if (!server.listening) await once(server, "listening");
  return server;
}

async function call(server: Server, path: string, method = "GET", headers: Record<string, string> = {}, body?: string) {
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return new Promise<{ status: number; headers: import("node:http").IncomingHttpHeaders; body: string }>((resolve, reject) => {
    const outgoing = request({ hostname: "127.0.0.1", port: address.port, path, method, headers, agent: false }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => { body += chunk; });
      response.on("end", () => resolve({ status: response.statusCode ?? 0, headers: response.headers, body }));
      response.on("error", reject);
    });
    outgoing.setTimeout(5000, () => outgoing.destroy(new Error("Local API request timed out")));
    outgoing.on("error", reject);
    outgoing.end(body);
  });
}

try {
  process.env.RUNNER_SCOUT_DB = missingDatabase;
  process.env.RUNNER_API_BEARER_TOKEN = syntheticToken;
  process.env.RUNNER_SITE_SUPABASE_SERVICE_ROLE_KEY = syntheticProviderSecret;
  process.env.RUNNER_API_ALLOWED_ORIGINS = "*";
  process.env.RUNNER_API_MAX_BODY_BYTES = "128";
  globalThis.fetch = (async () => {
    externalRequests++;
    throw new Error("Provider access is forbidden in local dashboard integration tests");
  }) as typeof fetch;

  const local = await launch(true);
  const address = local.address();
  assert.ok(address && typeof address !== "string");
  assert.equal(address.address, "127.0.0.1", "the dashboard must bind exclusively to IPv4 loopback");

  for (const path of ["/", "/dashboard"]) {
    const page = await call(local, path);
    assert.equal(page.status, 200);
    assert.match(page.headers["content-type"] ?? "", /^text\/html/);
    assert.match(page.body, /RUNNER CONTROL CENTER/);
    assert.match(page.body, /id="market-search"/);
    assert.match(page.body, /id="schedule-form"/);
    assert.equal(page.headers["cache-control"], "no-store");
    assert.equal(page.headers["x-content-type-options"], "nosniff");
    assert.match(String(page.headers["content-security-policy"] ?? ""), /frame-ancestors 'none'/);
    assert.ok(!page.body.includes(syntheticToken));
    assert.ok(!page.body.includes(syntheticProviderSecret));
  }

  const html = renderControlDashboard();
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0, "the rendered dashboard must include its client script");
  for (const script of scripts) new Script(script[1], { filename: "rendered-control-client.js" });
  for (const view of ["overview", "markets", "schedule", "totals", "providers", "content", "workflows", "models"]) {
    assert.ok(html.includes(`href="#${view}" data-nav="${view}"`), `${view} must be navigable`);
    assert.ok(html.includes(`id="view-${view}" data-view="${view}"`), `${view} must have a destination panel`);
  }

  for (const path of ["/assets/runner-logo.png", "/assets/runner-demon.png"]) {
    const asset = await call(local, path);
    assert.equal(asset.status, 200);
    assert.equal(asset.headers["content-type"], "image/png");
    assert.equal((await call(local, path, "GET", { host: "hostile.example" })).status, 403);
  }
  assert.equal((await call(local, "/assets/unknown.png")).status, 404);
  const result = await call(local, "/control/status", "GET", { origin: "https://example.invalid" });
  assert.equal(result.status, 200);
  const snapshot = JSON.parse(result.body);
  assert.equal(snapshot.mode, "local-snapshot");
  assert.equal(snapshot.database.status, "missing");
  assert.equal(snapshot.database.name, "missing.db");
  assert.equal(snapshot.summary.markets, null, "missing storage must not be reported as an empty inventory");
  assert.deepEqual(snapshot.markets, []);
  assert.deepEqual(snapshot.providers, []);
  assert.equal(snapshot.coordination.historical, true);
  assert.equal(result.headers["access-control-allow-origin"], undefined, "local dashboard must not inherit wildcard API CORS");
  for (const forbidden of [syntheticToken, syntheticProviderSecret, temporaryDirectory, "RUNNER_API_BEARER_TOKEN", "RUNNER_SITE_SUPABASE_SERVICE_ROLE_KEY"]) {
    assert.ok(!result.body.includes(forbidden), "local status must not expose credentials, environment configuration, or full database paths");
  }

  for (const [path, method] of [["/observations", "POST"], ["/totals/evaluate", "POST"], ["/control/status", "PUT"], ["/", "DELETE"], ["/", "OPTIONS"]]) {
    const rejected = await call(local, path, method, { authorization: `Bearer ${syntheticToken}` });
    assert.equal(rejected.status, 405, `${method} ${path} must stay read-only even with valid credentials`);
    assert.equal(rejected.headers.allow, "GET");
    assert.equal(JSON.parse(rejected.body).error, "dashboard_is_read_only");
  }
  for (const host of ["example.invalid", "localhost.example.invalid", "127.0.0.1.example.invalid"]) {
    const rejected = await call(local, "/control/status", "GET", { host });
    assert.equal(rejected.status, 403, "untrusted Host headers must be rejected before serving local data");
    assert.equal(JSON.parse(rejected.body).error, "local_host_required");
  }
  assert.equal((await call(local, "/control/status", "GET", { host: "localhost" })).status, 200);
  const content = await call(local, "/content");
  assert.equal(content.status, 200);
  assert.equal(JSON.parse(content.body).freshness, "FIXTURE");
  assert.equal(JSON.parse(content.body).data.length, 20);
  const saved = await call(local, "/markets/snapshot");
  assert.equal(saved.status, 503);
  assert.equal(JSON.parse(saved.body).freshness, "UNKNOWN");
  assert.equal(JSON.parse((await call(local, "/api/health")).body).scope, "process liveness only; provider health is separate");

  const normal = await launch(false);
  const oldPage = await call(normal, "/");
  assert.equal(oldPage.status, 200);
  assert.match(oldPage.body, /<title>Runner Scout<\/title>/);
  assert.ok(!oldPage.body.includes("RUNNER CONTROL CENTER"), "the regular API must keep its existing dashboard");
  const noControl = await call(normal, "/control/status");
  assert.equal(noControl.status, 404);
  assert.equal(JSON.parse(noControl.body).error, "not_found");
  delete process.env.RUNNER_API_BEARER_TOKEN;
  for (const path of ["/observations", "/totals/evaluate"]) {
    const rejected = await call(normal, path, "POST");
    assert.equal(rejected.status, 503);
    assert.equal(JSON.parse(rejected.body).error, "auth_not_configured");
  }
  process.env.RUNNER_API_BEARER_TOKEN = syntheticToken;
  const unauthorized = await call(normal, "/observations", "POST");
  assert.equal(unauthorized.status, 401);
  assert.equal(JSON.parse(unauthorized.body).error, "unauthorized");
  const oversized = await call(normal, "/observations", "POST", {
    authorization: `Bearer ${syntheticToken}`,
    "content-type": "application/json",
  }, JSON.stringify({ notes: "x".repeat(256) }));
  assert.equal(oversized.status, 400);
  assert.match(JSON.parse(oversized.body).error, /request body exceeds 128 bytes/);
  for (const path of ["/observations", "/totals/evaluate"]) {
    assert.equal((await call(normal, path, "POST", { authorization: "Bearer wrong-token" })).status, 401);
  }
  delete process.env.RUNNER_API_ALLOWED_ORIGINS;
  assert.equal((await call(normal, "/api/health", "GET", { origin: "https://example.invalid" })).headers["access-control-allow-origin"], undefined);
  process.env.RUNNER_API_ALLOWED_ORIGINS = "https://site.example";
  const allowed = await call(normal, "/observations", "OPTIONS", { origin: "https://site.example" });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers["access-control-allow-origin"], "https://site.example");
  assert.equal(allowed.headers.vary, "Origin");
  assert.equal((await call(normal, "/observations", "OPTIONS", { origin: "https://untrusted.example" })).headers["access-control-allow-origin"], undefined);
  process.env.RUNNER_API_MAX_BODY_BYTES = "1048576";
  const authorized = { authorization: `Bearer ${syntheticToken}`, "content-type": "application/json" };
  const observation = await call(normal, "/observations", "POST", authorized, JSON.stringify({
    id: "synthetic-api-observation", runnerEventId: "FIXTURE:NFL:AWAY:HOME", source: "HUMAN_ANALYST",
    observedAt: "2026-09-19T12:00:00Z", receivedAt: "2026-09-19T12:00:01Z", confidence: 0.5,
  }));
  assert.equal(observation.status, 201);
  assert.equal(JSON.parse(observation.body).freshness, "HISTORICAL");
  const evaluation = await call(normal, "/totals/evaluate", "POST", authorized, JSON.stringify({ input: {
    runnerEventId: "FIXTURE:NFL:AWAY:HOME", timestamp: "2026-09-19T12:00:01Z", sourceTimestamp: "2026-09-19T12:00:00Z",
    period: 2, clockSecondsRemaining: 0, currentHomePoints: 10, currentAwayPoints: 7,
  }, markets: [] }));
  assert.equal(evaluation.status, 201);
  assert.equal(JSON.parse(evaluation.body).freshness, "HISTORICAL");
  assert.equal(JSON.parse((await call(normal, "/markets/live")).body).freshness, "UNKNOWN");
  assert.equal(externalRequests, 0, "page and status requests must not fetch providers");
  assert.equal(existsSync(missingDatabase), false, "read-only status must never initialize a database");
  console.log("control API integration tests passed");
} finally {
  await Promise.all(servers.map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  })));
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(environment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  rmdirSync(temporaryDirectory);
}
