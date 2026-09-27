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

for (const setting of [undefined, "false", "", "invalid"]) {
  if (setting === undefined) delete process.env.RUNNER_PUBLISH_ENABLED;
  else process.env.RUNNER_PUBLISH_ENABLED = setting;
  const disabled = new SitePublisher();
  assert.equal(disabled.isEnabled(), false, "publishing requires explicit opt-in");
  await disabled.publishEngineStatus({ status: "running" });
  assert.equal(calls.length, 0, "direct publisher methods must respect the disabled gate");
}
process.env.RUNNER_PUBLISH_ENABLED = "true";

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

// Explicit input cannot bypass the model acceptance gate.
await assert.rejects(publisher.publishTick({
  ...baseInput,
  forecasts: [{ market, prediction: { marketId: market.id, modelName: "test_model", fairProbability: 0.6, confidenceScore: 50 } }],
}), /validated production model/);
assert.ok(!calls.some((c) => c.table === "runner_forecasts"), "unregistered models cannot publish official forecasts");
calls.length = 0;
await assert.rejects(publisher.publishTotalsState([{ flow: {} as never, projections: [] }]), /validated production model/);
await assert.rejects(publisher.publishTotalsWindows([{} as never]), /validated production model/);
await assert.rejects(publisher.publishSignals([{} as never]), /validated production model/);
assert.equal(calls.length, 0, "no heuristic publication method may bypass model acceptance");

calls.length = 0;
const retrying = new SitePublisher();
const successfulFetch = globalThis.fetch;
globalThis.fetch = (async () => new Response("PRIVATE_PROVIDER_BODY", { status: 500 })) as typeof fetch;
await assert.rejects(retrying.publishTick(baseInput), error => error instanceof Error && !error.message.includes("PRIVATE_PROVIDER_BODY"));
globalThis.fetch = successfulFetch;
await retrying.publishTick(baseInput);
assert.ok(calls.some(c => c.table === "runner_engine_status"), "failed heartbeat retries on next tick");
calls.length = 0;
await publisher.publishProviderHealth([{ ...health[0], lastMessageAt: new Date(Date.now() + 60_000).toISOString() }]);
assert.equal(calls[0].rows[0].freshness, "stale", "future timestamps must not be fresh");

console.log("site publisher tests passed");
