import assert from "node:assert/strict";
import type { NormalizedMarket, ProviderHealth } from "../types.js";

process.env.RUNNER_SITE_SUPABASE_URL = "https://example.test";
process.env.RUNNER_SITE_SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.RUNNER_HEARTBEAT_MS = "30000";
process.env.RUNNER_PUBLISH_ENABLED = "true";

const calls: { table: string; rows: Record<string, unknown>[] }[] = [];
globalThis.fetch = (async (input: string | URL, init?: { body?: unknown }) => {
  const url = new URL(input.toString());
  calls.push({ table: url.pathname.replace("/rest/v1/", ""), rows: JSON.parse(String(init?.body ?? "[]")) });
  return new Response("[]", { status: 200 });
}) as typeof fetch;

const { SitePublisher } = await import("../publishing/sitePublisher.js");

const health: ProviderHealth[] = [{ provider: "kalshi", connected: true, reconnectAttempts: 0, eventCount: 3 }];
const market = {
  id: "m-1",
  provider: "kalshi",
  externalId: "ext-1",
  runnerEventId: "RUNNER:NFL:2026-09-05:DAL:PHI",
  title: "DAL vs PHI",
  yesPrice: 0.62,
  sourceTimestamp: new Date().toISOString(),
} as NormalizedMarket;
const baseInput = {
  markets: [market],
  health,
  engineStatus: "running",
  marketEventCount: 1,
  priceEventCount: 1,
};

const publisher = new SitePublisher();
assert.ok(publisher.isEnabled());

// First tick: heartbeat is due immediately (lastHeartbeatAt starts at 0).
await publisher.publishTick(baseInput);
assert.ok(calls.some((c) => c.table === "runner_engine_status"), "first tick should publish the heartbeat");
assert.ok(calls.some((c) => c.table === "runner_provider_status"), "provider health should always publish");
assert.ok(!calls.some((c) => c.table === "runner_forecasts"), "no market-implied forecast fallback should ever publish");

calls.length = 0;

// Second tick immediately after: heartbeat is interval-gated, but domain publishes are not (TASK-06A).
await publisher.publishTick(baseInput);
assert.ok(!calls.some((c) => c.table === "runner_engine_status"), "heartbeat must stay gated within the interval");
assert.ok(calls.some((c) => c.table === "runner_provider_status"), "provider health must not be gated behind the heartbeat");
assert.ok(!calls.some((c) => c.table === "runner_forecasts"), "still no forecast fallback with no explicit forecasts (TASK-06B)");

calls.length = 0;

// Explicit forecasts supplied by the runtime still publish normally.
await publisher.publishTick({
  ...baseInput,
  forecasts: [{ market, prediction: { marketId: market.id, modelName: "test_model", fairProbability: 0.6, confidenceScore: 50 } }],
});
assert.ok(calls.some((c) => c.table === "runner_forecasts"), "explicit forecasts must still publish");

console.log("site publisher tests passed");
