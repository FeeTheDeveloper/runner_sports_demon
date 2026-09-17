import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { readControlSnapshot } from "../dashboard/control.js";

const temporary = mkdtempSync(join(tmpdir(), "runner-control-test-"));
const root = join(temporary, "runner_sports_demon");
const dbPath = join(root, "fixture.db");
const privateMarker = "PRIVATE_SENTINEL_MUST_NOT_LEAVE_STORAGE";
const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
try {
  mkdirSync(join(root, ".runner", "handoffs"), { recursive: true });
  mkdirSync(join(temporary, "rsaa_verse"));
  writeFileSync(join(root, ".env"), "EXAMPLE=" + privateMarker);
  writeFileSync(join(root, "MODEL_REGISTRY.json"), JSON.stringify({ models: [{ model_name: "test-model", model_version: "v1", sports: ["NFL"], calibration: "pending", production_status: "research", raw: privateMarker }] }));
  writeFileSync(join(root, ".runner", "system-status.json"), JSON.stringify({ updated_at: "2026-09-13T00:00:00Z", blockers: ["Recorded blocker"], credentials: privateMarker }));
  writeFileSync(join(root, ".runner", "handoffs", "test.json"), JSON.stringify({ handoff_id: "HO-TEST", objective: "Verify snapshot", status: "requested", priority: "P1", from_agent: "lead", to_agent: "qa", raw: privateMarker }));
  writeFileSync(join(root, ".runner", "handoffs", "invalid.json"), "invalid");

  const missing = readControlSnapshot(root, dbPath);
  assert.equal(missing.database.status, "missing");
  assert.equal(missing.summary.markets, null, "unavailable counts must not imply an empty database");
  assert.deepEqual(missing.markets, []);
  assert.equal(existsSync(dbPath), false, "inspection must not initialize a missing database");
  assert.deepEqual(missing.repositories.map(row => row.present), [true, true, false]);
  assert.equal(missing.coordination.historical, true);
  assert.equal(missing.handoffs.length, 1, "invalid records must not become phantom handoffs");
  assert.equal(missing.models[0].name, "test-model");
  assert.equal(JSON.stringify(missing).includes(privateMarker), false);

  const now = new Date().toISOString();
  const old = new Date(Date.now() - 600_000).toISOString();
  const future = new Date(Date.now() + 600_000).toISOString();
  const schema = readFileSync(resolve("src/storage/schema.sql"), "utf8");
  const payload = JSON.stringify({ expiresAt: old, selection: "OVER", marketLine: 40.5, runnerProjection: 44, edge: 3.5, confidence: 0.7, raw: privateMarker });
  execFileSync("sqlite3", [dbPath], { input: schema + `
    with recursive ids(n) as (select 1 union all select n+1 from ids where n < 251)
    insert into markets(id,provider,external_id,title,sport,status,raw_json,source_timestamp,received_timestamp,processed_timestamp,updated_at)
    select 'm-'||n,'kalshi','e-'||n,'Fixture '||n,'NFL','open',${quote(privateMarker)},${quote(now)},${quote(now)},${quote(now)},${quote(now)} from ids;
    insert into market_prices(market_id,yes_price,no_price,bid,ask,spread,volume,liquidity,source_timestamp,received_timestamp,processed_timestamp,change_hash)
    values('m-1',0.4,0.6,0.39,0.41,0.02,100,50,${quote(old)},${quote(old)},${quote(old)},'old'),
    ('m-1',0.45,0.55,0.44,0.46,0.02,200,60,${quote(now)},${quote(now)},${quote(now)},'new');
    insert into market_events(market_id,provider,event_type,change_hash,payload_json,source_timestamp,received_timestamp,processed_timestamp)
    values('m-1','kalshi','ticker','recent',${quote(privateMarker)},${quote(now)},${quote(now)},${quote(now)}),
    ('m-1','kalshi','ticker','future',${quote(privateMarker)},${quote(future)},${quote(future)},${quote(future)}),
    ('m-1','kalshi','ticker','ancient',${quote(privateMarker)},'2000-01-01T00:00:00Z','2000-01-01T00:00:00Z','2000-01-01T00:00:00Z');
    insert into game_flow_observations values('obs','event','HUMAN_ANALYST',${quote(now)},${quote(now)},0.8,${quote(privateMarker)});
    insert into provider_health values('stale',1,${quote(old)},${quote(privateMarker)},2,10,50,${quote(now)}),
    ('connected',1,${quote(now)},${quote(privateMarker)},0,20,30,${quote(now)}),
    ('future',1,${quote(future)},${quote(privateMarker)},0,20,30,${quote(now)}),
    ('invalid',1,'invalid',${quote(privateMarker)},0,20,30,${quote(now)}),
    ('old-heartbeat',1,${quote(now)},${quote(privateMarker)},0,20,30,${quote(old)}),
    ('disconnected',0,${quote(now)},${quote(privateMarker)},0,20,30,${quote(now)});
    insert into totals_decision_windows values('window','event','GAME_TOTAL','ACTIONABLE',${quote(old)},${quote(now)},${quote(payload)}),
    ('invalid-window','event','GAME_TOTAL','ACTIONABLE',${quote(old)},${quote(now)},'invalid-json');
  `, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  const before = readFileSync(dbPath);
  const modifiedAt = statSync(dbPath).mtimeMs;
  const snapshot = readControlSnapshot(root, dbPath);
  assert.equal(snapshot.database.status, "ready");
  assert.deepEqual(snapshot.summary, { markets: 251, marketEvents: 3, priceEvents: 2, observations: 1, totalsWindows: 2 });
  assert.equal(snapshot.markets.length, 250, "market listing is bounded while counts remain complete");
  assert.equal(snapshot.markets.find(row => row.id === "m-1")?.yesPrice, 0.45, "display most recent persisted price");
  const providerStatus = Object.fromEntries(snapshot.providers.map(row => [row.provider, row.status]));
  assert.deepEqual(providerStatus, { connected: "connected", disconnected: "disconnected", future: "unknown", invalid: "unknown", "old-heartbeat": "stale", stale: "stale" });
  assert.equal(snapshot.activity.length, 24);
  assert.equal(snapshot.activity.reduce((sum, bucket) => sum + bucket.count, 0), 1, "future and old events must not appear as recent activity");
  assert.equal(snapshot.windows.find(row => row.id === "window")?.status, "EXPIRED");
  assert.equal(snapshot.windows.find(row => row.id === "window")?.storedStatus, "ACTIONABLE");
  assert.equal(snapshot.windows.find(row => row.id === "invalid-window")?.status, "UNKNOWN");
  const serialized = JSON.stringify(snapshot);
  assert.equal(serialized.includes(privateMarker), false);
  for (const key of ["raw_json", "payload_json", "last_error", "credentials"]) assert.equal(serialized.includes(key), false);
  assert.deepEqual(readFileSync(dbPath), before, "inspection cannot change database bytes");
  assert.equal(statSync(dbPath).mtimeMs, modifiedAt);

  const corrupt = join(root, "corrupt.db");
  writeFileSync(corrupt, privateMarker);
  const unavailable = readControlSnapshot(root, corrupt);
  assert.equal(unavailable.database.status, "unavailable");
  assert.equal(JSON.stringify(unavailable).includes(privateMarker), false, "database errors must not leak storage content");
  assert.equal(readControlSnapshot(root, root).database.status, "unavailable");
  console.log("control snapshot tests passed");
} finally {
  if (dirname(resolve(temporary)) !== resolve(tmpdir()) || !temporary.includes("runner-control-test-")) throw new Error("Unexpected test cleanup path");
  rmSync(temporary, { recursive: true, force: true });
}
