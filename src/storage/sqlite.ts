import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { MarketEvent, NormalizedMarket, ProviderHealth } from "../types.js";
import { stableHash } from "../utils/hash.js";

function sqlString(value: unknown): string {
  if (value === undefined || value === null) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}
function sqlNumber(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "null";
}
function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "1" : "0";
  return sqlString(value);
}

// Ordered parent-before-child so importFrom() satisfies foreign keys on a fresh db.
export const EXPORT_TABLES = [
  "games",
  "markets",
  "market_prices",
  "market_events",
  "market_orderbooks",
  "provider_mappings",
  "provider_health",
  "model_predictions",
  "signals",
  "alerts",
  "edge_events",
  "market_lag_events",
  "replay_sessions",
  "backtest_results",
] as const;

export class SqliteStore {
  readonly path: string;
  constructor(path = process.env.RUNNER_SCOUT_DB ?? ".runner-scout.db") {
    this.path = resolve(path);
    mkdirSync(dirname(this.path), { recursive: true });
  }

  init() {
    const builtSchema = new URL("./schema.sql", import.meta.url);
    const sourceSchema = resolve(process.cwd(), "src/storage/schema.sql");
    this.exec(readFileSync(existsSync(builtSchema) ? builtSchema : sourceSchema, "utf8"));
  }

  persistMarkets(markets: NormalizedMarket[]): MarketEvent[] {
    const events: MarketEvent[] = [];
    this.transaction(markets.map((market) => {
      const changeHash = stableHash({ yesPrice: market.yesPrice, noPrice: market.noPrice, bid: market.bid, ask: market.ask, lastTradedPrice: market.lastTradedPrice, volume: market.volume, openInterest: market.openInterest, liquidity: market.liquidity, status: market.marketStatus });
      events.push({ market, eventType: "snapshot", changeHash });
      return this.marketSql(market, changeHash);
    }).join("\n"));
    return events;
  }

  persistHealth(health: ProviderHealth[]) {
    const now = new Date().toISOString();
    this.transaction(health.map((h) => `insert into provider_health(provider, connected, last_message_at, last_error, reconnect_attempts, event_count, latency_ms, updated_at)
      values(${sqlString(h.provider)}, ${h.connected ? 1 : 0}, ${sqlString(h.lastMessageAt)}, ${sqlString(h.lastError)}, ${h.reconnectAttempts}, ${h.eventCount}, ${sqlNumber(h.latencyMs)}, ${sqlString(now)})
      on conflict(provider) do update set connected=excluded.connected,last_message_at=excluded.last_message_at,last_error=excluded.last_error,reconnect_attempts=excluded.reconnect_attempts,event_count=excluded.event_count,latency_ms=excluded.latency_ms,updated_at=excluded.updated_at;`).join("\n"));
  }

  count(table: string): number {
    const out = this.query(`select count(*) from ${table.replace(/[^a-z_]/g, "")};`).trim();
    return Number(out) || 0;
  }

  /** Dumps every table to <dir>/<table>.json plus a manifest.json. Returns row counts per table. */
  exportTo(dir: string): Record<string, number> {
    mkdirSync(dir, { recursive: true });
    const manifest: Record<string, number> = {};
    for (const table of EXPORT_TABLES) {
      const rows = this.queryJson(`select * from ${table};`);
      writeFileSync(join(dir, `${table}.json`), JSON.stringify(rows, null, 2), "utf8");
      manifest[table] = rows.length;
    }
    writeFileSync(join(dir, "manifest.json"), JSON.stringify({ exportedAt: new Date().toISOString(), dbPath: this.path, tables: manifest }, null, 2), "utf8");
    return manifest;
  }

  /** Loads <dir>/<table>.json (as produced by exportTo) back into this db via insert-or-replace. Missing files are skipped. */
  importFrom(dir: string): Record<string, number> {
    const manifest: Record<string, number> = {};
    for (const table of EXPORT_TABLES) {
      const file = join(dir, `${table}.json`);
      if (!existsSync(file)) continue;
      const rows = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>[];
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        this.transaction(rows.map((row) => `insert or replace into ${table}(${columns.join(",")}) values(${columns.map((c) => sqlValue(row[c])).join(",")});`).join("\n"));
      }
      manifest[table] = rows.length;
    }
    return manifest;
  }

  private marketSql(market: NormalizedMarket, changeHash: string): string {
    const rawJson = JSON.stringify(market.raw);
    const eventJson = JSON.stringify(market);
    return `insert into markets(id,provider,external_id,event_id,runner_event_id,title,category,sport,contract_side,status,raw_json,source_timestamp,received_timestamp,processed_timestamp,updated_at)
      values(${sqlString(market.id)},${sqlString(market.provider)},${sqlString(market.externalId)},${sqlString(market.eventId)},${sqlString(market.runnerEventId)},${sqlString(market.title)},${sqlString(market.category)},${sqlString(market.sport)},${sqlString(market.contractSide)},${sqlString(market.marketStatus)},${sqlString(rawJson)},${sqlString(market.sourceTimestamp)},${sqlString(market.receivedTimestamp)},${sqlString(market.processedTimestamp)},${sqlString(new Date().toISOString())})
      on conflict(id) do update set event_id=excluded.event_id,runner_event_id=excluded.runner_event_id,title=excluded.title,category=excluded.category,sport=excluded.sport,contract_side=excluded.contract_side,status=excluded.status,raw_json=excluded.raw_json,source_timestamp=excluded.source_timestamp,received_timestamp=excluded.received_timestamp,processed_timestamp=excluded.processed_timestamp,updated_at=excluded.updated_at;
      insert or ignore into market_prices(market_id,yes_price,no_price,bid,ask,spread,last_traded_price,volume,open_interest,liquidity,source_timestamp,received_timestamp,processed_timestamp,change_hash)
      values(${sqlString(market.id)},${sqlNumber(market.yesPrice)},${sqlNumber(market.noPrice)},${sqlNumber(market.bid)},${sqlNumber(market.ask)},${sqlNumber(market.spread)},${sqlNumber(market.lastTradedPrice)},${sqlNumber(market.volume)},${sqlNumber(market.openInterest)},${sqlNumber(market.liquidity)},${sqlString(market.sourceTimestamp)},${sqlString(market.receivedTimestamp)},${sqlString(market.processedTimestamp)},${sqlString(changeHash)});
      insert or ignore into market_events(market_id,provider,event_type,change_hash,payload_json,source_timestamp,received_timestamp,processed_timestamp)
      values(${sqlString(market.id)},${sqlString(market.provider)},'snapshot',${sqlString(changeHash)},${sqlString(eventJson)},${sqlString(market.sourceTimestamp)},${sqlString(market.receivedTimestamp)},${sqlString(market.processedTimestamp)});`;
  }

  private transaction(sql: string) { if (sql.trim()) this.exec(`begin;\n${sql}\ncommit;`); }
  private exec(sql: string) { execFileSync("sqlite3", [this.path], { input: sql }); }
  private query(sql: string) { return execFileSync("sqlite3", [this.path, sql], { encoding: "utf8" }); }
  private queryJson(sql: string): Record<string, unknown>[] {
    const out = execFileSync("sqlite3", ["-json", this.path, sql], { encoding: "utf8" }).trim();
    return out ? JSON.parse(out) : [];
  }
}
