import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

type Row = Record<string, unknown>;
const object = (value: unknown): Row => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const string = (value: unknown): string | null => typeof value === "string" ? value.slice(0, 1000) : null;
const number = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 100).map(item => item.slice(0, 1000)) : [];
function readJson(path: string): Row {
  try { return object(JSON.parse(readFileSync(path, "utf8"))); } catch { return {}; }
}
function directory(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

// One fixed SELECT gives a consistent SQLite snapshot. Only named, display-safe fields
// leave SQLite: provider error messages and raw provider payloads are never selected.
const SNAPSHOT_SQL = `
select 'summary' as section, json_object(
  'markets', (select count(*) from markets),
  'marketEvents', (select count(*) from market_events),
  'priceEvents', (select count(*) from market_prices),
  'observations', (select count(*) from game_flow_observations),
  'totalsWindows', (select count(*) from totals_decision_windows)) as data
union all
select 'markets', json_object('id',m.id,'provider',m.provider,'title',m.title,'sport',m.sport,
  'status',m.status,'runnerEventId',m.runner_event_id,'updatedAt',m.updated_at,'receivedAt',m.received_timestamp,
  'yesPrice',p.yes_price,'noPrice',p.no_price,'bid',p.bid,'ask',p.ask,
  'spread',p.spread,'volume',p.volume,'liquidity',p.liquidity)
from (select id,provider,title,sport,status,runner_event_id,updated_at,received_timestamp from markets order by updated_at desc,id limit 250) m
left join market_prices p on p.id = (select id from market_prices where market_id=m.id order by processed_timestamp desc,id desc limit 1)
union all
select 'providers', json_object('provider',provider,'connected',connected,'lastMessageAt',last_message_at,
  'updatedAt',updated_at,'eventCount',event_count,'reconnectAttempts',reconnect_attempts,'latencyMs',latency_ms,'hasError',has_error)
from (select provider,connected,last_message_at,updated_at,event_count,reconnect_attempts,latency_ms,case when coalesce(last_error,'') <> '' then 1 else 0 end as has_error from provider_health order by provider limit 50)
union all
select 'activity', json_object('hour',strftime('%Y-%m-%dT%H:00:00Z',processed_timestamp),'count',count(*))
from market_events
where julianday(processed_timestamp) >= julianday(strftime('%Y-%m-%dT%H:00:00Z','now','-23 hours'))
  and julianday(processed_timestamp) <= julianday('now')
group by strftime('%Y-%m-%dT%H:00:00Z',processed_timestamp)
union all
select 'windows', json_object('id',id,'runnerEventId',runner_event_id,'marketType',market_type,
  'storedStatus',status,'detectedAt',detected_at,
  'expiresAt',coalesce(json_extract(safe_payload,'$.expiresAt'),json_extract(safe_payload,'$.windowExpiresAt')),
  'selection',json_extract(safe_payload,'$.selection'),'marketLine',json_extract(safe_payload,'$.marketLine'),
  'runnerProjection',json_extract(safe_payload,'$.runnerProjection'),'edge',json_extract(safe_payload,'$.favorableEdge'),
  'confidence',json_extract(safe_payload,'$.confidence'))
from (select id,runner_event_id,market_type,status,detected_at,
  case when json_valid(payload_json) then payload_json else '{}' end as safe_payload
  from totals_decision_windows order by processed_timestamp desc,id limit 100);
`;

/** Local inspection only: never initializes storage, loads credentials, or contacts providers. */
export function readControlSnapshot(root = process.cwd(), dbPath = resolve(root, process.env.RUNNER_SCOUT_DB ?? ".runner-scout.db")) {
  const now = Date.now();
  const statusRecord = readJson(join(root, ".runner", "system-status.json"));
  const registry = readJson(join(root, "MODEL_REGISTRY.json"));
  let files: string[] = [];
  try { files = readdirSync(join(root, ".runner", "handoffs")).filter(file => file.endsWith(".json")).sort().slice(0, 100); } catch { /* No coordination records yet. */ }
  const snapshot = {
    generatedAt: new Date(now).toISOString(),
    mode: "local-snapshot" as const,
    database: { status: "missing" as "ready" | "missing" | "unavailable", name: basename(dbPath), bytes: null as number | null },
    summary: { markets: null as number | null, marketEvents: null as number | null, priceEvents: null as number | null, observations: null as number | null, totalsWindows: null as number | null },
    markets: [] as Row[], providers: [] as Row[], activity: [] as { hour: string; count: number }[], windows: [] as Row[],
    handoffs: files.map(file => {
      const row = readJson(join(root, ".runner", "handoffs", file));
      return { id: string(row.handoff_id), objective: string(row.objective), status: string(row.status), priority: string(row.priority), from: string(row.from_agent), to: string(row.to_agent) };
    }).filter(row => row.id !== null),
    repositories: [
      { name: "runner_sports_demon", role: "Live intelligence engine", present: directory(root) },
      { name: "rsaa_verse", role: "Historical intelligence warehouse", present: directory(resolve(root, "..", "rsaa_verse")) },
      { name: "runner_sports-site", role: "Presentation and product", present: directory(resolve(root, "..", "runner_sports-site")) },
    ],
    models: (Array.isArray(registry.models) ? registry.models : []).slice(0, 100).map(value => {
      const row = object(value);
      return { name: string(row.model_name), version: string(row.model_version), sports: strings(row.sports), objective: string(row.objective), calibration: string(row.calibration), status: string(row.production_status) };
    }),
    coordination: { updatedAt: string(statusRecord.updated_at), blockers: strings(statusRecord.blockers), historical: true as const },
  };
  try {
    const info = statSync(dbPath);
    if (!info.isFile()) { snapshot.database.status = "unavailable"; return snapshot; }
    snapshot.database.bytes = info.size;
  } catch (error) {
    snapshot.database.status = object(error).code === "ENOENT" ? "missing" : "unavailable";
    return snapshot;
  }
  try {
    const result: unknown = JSON.parse(execFileSync("sqlite3", ["-readonly", "-json", resolve(dbPath), SNAPSHOT_SQL], {
      encoding: "utf8", timeout: 5000, maxBuffer: 4 * 1024 * 1024, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    }));
    if (!Array.isArray(result)) throw new Error("Invalid snapshot");
    const grouped: Record<string, Row[]> = {};
    for (const entry of result) {
      const row = object(entry);
      if (typeof row.section !== "string" || typeof row.data !== "string") throw new Error("Invalid snapshot row");
      (grouped[row.section] ??= []).push(object(JSON.parse(row.data)));
    }
    const counts = grouped.summary?.[0] ?? {};
    for (const key of Object.keys(snapshot.summary) as (keyof typeof snapshot.summary)[]) snapshot.summary[key] = number(counts[key]);
    snapshot.markets = (grouped.markets ?? []).map(row => ({
      id: string(row.id), provider: string(row.provider), title: string(row.title), sport: string(row.sport), status: string(row.status), runnerEventId: string(row.runnerEventId), updatedAt: string(row.updatedAt),
      receivedAt: string(row.receivedAt), yesPrice: number(row.yesPrice), noPrice: number(row.noPrice), bid: number(row.bid), ask: number(row.ask), spread: number(row.spread), volume: number(row.volume), liquidity: number(row.liquidity),
    }));
    snapshot.providers = (grouped.providers ?? []).map(row => {
      const messageTime = Date.parse(string(row.lastMessageAt) ?? "");
      const updateTime = Date.parse(string(row.updatedAt) ?? "");
      const valid = Number.isFinite(messageTime) && Number.isFinite(updateTime) && messageTime <= now && updateTime <= now;
      const age = valid ? Math.floor((now - Math.min(messageTime, updateTime)) / 1000) : null;
      const status = age === null ? "unknown" : now - Math.min(messageTime, updateTime) > 90_000 ? "stale" : row.connected === 1 ? "connected" : "disconnected";
      return { provider: string(row.provider), status, hasError: row.hasError === 1, warning: row.hasError === 1 ? "Provider fetch failed; inspect redacted local logs." : null, lastMessageAt: string(row.lastMessageAt), updatedAt: string(row.updatedAt), ageSeconds: age, eventCount: number(row.eventCount), reconnectAttempts: number(row.reconnectAttempts), latencyMs: number(row.latencyMs) };
    });
    const activity = new Map((grouped.activity ?? []).map(row => [string(row.hour), number(row.count) ?? 0]));
    const hour = Math.floor(now / 3_600_000) * 3_600_000;
    snapshot.activity = Array.from({ length: 24 }, (_, index) => {
      const bucket = new Date(hour - (23 - index) * 3_600_000).toISOString().replace(".000Z", "Z");
      return { hour: bucket, count: activity.get(bucket) ?? 0 };
    });
    snapshot.windows = (grouped.windows ?? []).map(row => {
      const expiresAt = string(row.expiresAt);
      const expires = Date.parse(expiresAt ?? "");
      const storedStatus = string(row.storedStatus);
      const status = Number.isFinite(expires) ? expires <= now ? "EXPIRED" : storedStatus : storedStatus === "EXPIRED" || storedStatus === "SUPPRESSED" ? storedStatus : "UNKNOWN";
      return { id: string(row.id), runnerEventId: string(row.runnerEventId), marketType: string(row.marketType), status, storedStatus, detectedAt: string(row.detectedAt), expiresAt, selection: string(row.selection), marketLine: number(row.marketLine), runnerProjection: number(row.runnerProjection), edge: number(row.edge), confidence: number(row.confidence) };
    });
    snapshot.database.status = "ready";
  } catch {
    // Deliberately omit subprocess errors: paths, provider data or credentials may appear there.
    snapshot.database.status = "unavailable";
    for (const key of Object.keys(snapshot.summary) as (keyof typeof snapshot.summary)[]) snapshot.summary[key] = null;
    snapshot.markets = [];
    snapshot.providers = [];
    snapshot.activity = [];
    snapshot.windows = [];
  }
  return snapshot;
}
