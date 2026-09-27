import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { startSerialPolling } from "../utils/polling.js";
import { SqliteStore, EXPORT_TABLES } from "../storage/sqlite.js";
import { runIngestionOnce } from "../ingestion.js";
import { MarketStateCache } from "../state/market-state/cache.js";
import type { Connector, GameFlowObservation, NormalizedMarket } from "../types.js";
import { GameFlowEngine } from "../game-flow/engine.js";
import { canPublishModel, readModelRegistry } from "../models/registry.js";

assert.equal(canPublishModel("baseline_market_implied_v0", readModelRegistry()), false);
assert.equal(canPublishModel("football-heuristic-v1", readModelRegistry()), false);
assert.equal(canPublishModel("unknown", readModelRegistry()), false);
assert.equal(canPublishModel("fixture-v1", [{ model_name: "fixture", model_version: "fixture-v1", production_status: "production", calibration: "validated" }]), false, "labels alone are insufficient");

let release!: () => void;
let entered!: () => void;
let calls = 0;
const second = new Promise<void>(r => { entered = r; });
const blocked = new Promise<void>(r => { release = r; });
const polling = await startSerialPolling(async () => {
  calls += 1;
  if (calls === 2) { entered(); await blocked; }
}, 5, error => { throw error; });
await second;
await delay(25);
assert.equal(calls, 2, "slow tasks must not overlap subsequent polls");
let drained = false;
const stopping = polling.stop().then(() => { drained = true; });
await delay(10);
assert.equal(drained, false, "stop waits for active work");
release();
await stopping;
await delay(15);
assert.equal(calls, 2, "stop prevents rescheduling");

let errors = 0;
let completed!: () => void;
const recovered = new Promise<void>(r => { completed = r; });
let iterations = 0;
const retry = await startSerialPolling(async () => {
  iterations++;
  if (iterations === 2) throw new Error("transient fixture failure");
  if (iterations === 3) completed();
}, 5, () => { errors++; });
await recovered;
await retry.stop();
assert.equal(errors, 1, "polling recovers after a failed later tick");
const abort = new AbortController();
abort.abort();
await startSerialPolling(async () => { throw new Error("must not start"); }, 5, () => {}, abort.signal);

const cache = new MarketStateCache();
const fixtureMarket = { id: "fixture" } as NormalizedMarket;
const connector = { provider: "kalshi", fetchMarkets: async () => [fixtureMarket], health: () => ({ provider: "kalshi", connected: true, reconnectAttempts: 0, eventCount: 1 }) } as Connector;
await assert.rejects(runIngestionOnce([connector], cache, { persistMarkets() { throw new Error("disk full"); } } as unknown as SqliteStore, 1));
assert.equal(cache.all().length, 0, "failed persistence cannot publish an uncommitted cache state");

const root = mkdtempSync(join(tmpdir(), "runner-recovery-test-"));
const sql = (db: string, statement: string) => execFileSync("sqlite3", ["-bail", db, statement], { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }).trim();
try {
  const flowStore = new SqliteStore(join(root, "flow-recovery.db"));
  flowStore.init();
  const originalObservation: GameFlowObservation = { id: "old-receipt", runnerEventId: "fixture-recovery", source: "GAME_FEED", observedAt: "2026-09-26T12:00:00Z", receivedAt: "2026-09-26T12:00:01Z", confidence: 0.8, homeScore: 7, playerAvailability: { starter: 100, backup: 50 } };
  const newerObservation: GameFlowObservation = { ...originalObservation, id: "new-receipt", observedAt: "2026-09-26T12:05:00Z", receivedAt: "2026-09-26T12:05:01Z", homeScore: 14 };
  const ingest = (engine: GameFlowEngine, observation: GameFlowObservation) => engine.ingest(observation, snapshot => flowStore.persistGameFlow(observation, snapshot), flowStore.gameFlowObservations(observation.runnerEventId));
  const beforeRestart = new GameFlowEngine();
  ingest(beforeRestart, originalObservation);
  const latest = ingest(beforeRestart, newerObservation);
  const originalBytes = sql(flowStore.path, "select payload_json from game_flow_observations where id='old-receipt';");
  const reordered = Object.fromEntries(Object.entries({ ...originalObservation, playerAvailability: { backup: 50, starter: 100 } }).reverse()) as unknown as GameFlowObservation;
  assert.deepEqual(ingest(new GameFlowEngine(), reordered), latest, "restart and equivalent old retry must preserve the latest state and complete history");
  assert.equal(sql(flowStore.path, "select payload_json from game_flow_observations where id='old-receipt';"), originalBytes, "canonical comparison must preserve legacy bytes");
  assert.deepEqual(JSON.parse(sql(flowStore.path, "select payload_json from game_flow_snapshots where runner_event_id='fixture-recovery';")), JSON.parse(JSON.stringify(latest)));
  const staleEngine = new GameFlowEngine();
  const nextObservation = { ...newerObservation, id: "incomplete-history" };
  assert.throws(() => staleEngine.ingest(nextObservation, snapshot => flowStore.persistGameFlow(nextObservation, snapshot)), /CHECK constraint/);
  assert.equal(flowStore.count("game_flow_observations"), 2, "stale history detection rolls back the added row");
  assert.equal(staleEngine.allSnapshots().length, 0, "history conflict cannot mutate the cache");
  assert.throws(() => ingest(new GameFlowEngine(), { ...originalObservation, homeScore: 99 }), /different content/);

  const store = new SqliteStore(join(root, "source.db"));
  store.init();
  sql(store.path, "insert into game_flow_observations values('immutable','fixture','GAME_FEED','2026-09-26','2026-09-26',1,'{}');");
  assert.throws(() => sql(store.path, "insert or replace into game_flow_observations values('immutable','other-event','GAME_FEED','2026-09-26','2026-09-26',1,'{\"changed\":true}');"));
  assert.equal(sql(store.path, "select runner_event_id from game_flow_observations where id='immutable';"), "fixture");
  const schemaTables = [...readFileSync("src/storage/schema.sql", "utf8").matchAll(/create table if not exists (\w+)/g)].map(m => m[1]);
  assert.deepEqual([...EXPORT_TABLES].sort(), schemaTables.sort(), "backup/export coverage includes all application tables");
  sql(store.path, "insert into games(id,sport) values('fixture','NFL'); insert into historical_seasons values(2025,'fixture','v1','2026-01-01','fixture');");
  store.backupTo(join(root, "backup.db"));
  assert.equal(sql(join(root, "backup.db"), "select count(*) from historical_seasons;"), "1");
  assert.throws(() => store.backupTo(join(root, "backup.db")), /already exists/);
  const exported = store.exportTo(join(root, "export"));
  const restored = new SqliteStore(join(root, "restored.db"));
  restored.init();
  assert.deepEqual(restored.importFrom(join(root, "export")), exported);
  assert.equal(restored.count("games"), 1);
  assert.equal(restored.count("historical_seasons"), 1);
  assert.deepEqual(restored.importFrom(join(root, "export")), exported, "repeated import remains idempotent");

  const bad = join(root, "bad"); mkdirSync(bad);
  writeFileSync(join(bad, "games.json"), JSON.stringify([{ id: "should-rollback", sport: "NFL" }, { id: "invalid", sport: null }]));
  assert.throws(() => restored.importFrom(bad));
  assert.equal(restored.count("games"), 1, "SQL constraint failure rolls back every earlier row");
  writeFileSync(join(bad, "games.json"), JSON.stringify([{ 'id) values(1); drop table games; --': "bad" }]));
  assert.throws(() => restored.importFrom(bad), /Unknown import column/);
  assert.equal(restored.count("games"), 1, "import keys cannot become SQL");
  writeFileSync(join(bad, "games.json"), JSON.stringify([{ id: "another", sport: "NFL" }]));
  writeFileSync(join(bad, "historical_seasons.json"), JSON.stringify([{ unknown: true }]));
  assert.throws(() => restored.importFrom(bad));
  assert.equal(restored.count("games"), 1, "validation failure in later table cannot partially import");
} finally {
  assert.equal(dirname(resolve(root)), resolve(tmpdir()));
  rmSync(root, { recursive: true, force: true });
}
console.log("production runtime and recovery tests passed");
