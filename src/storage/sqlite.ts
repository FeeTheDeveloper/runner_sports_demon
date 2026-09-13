import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { CanonicalGameState, GameFlowObservation, GameFlowSnapshot, MarketEvent, NormalizedMarket, ProviderHealth, RawProviderEvent, RunnerBaseline, SportsMarketSnapshot } from "../types.js";
import { stableHash } from "../utils/hash.js";
import type { TotalsDecisionWindow, TotalsFlowState, TotalsMarketSnapshot, TotalsProjection } from "../totals/types.js";

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
  "raw_provider_events",
  "game_state_snapshots",
  "sports_market_snapshots",
  "runner_baselines",
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
  "game_flow_observations",
  "game_flow_snapshots",
  "totals_flow_snapshots", "totals_projections", "totals_market_snapshots", "totals_trend_scores",
  "totals_signals", "totals_decision_windows", "totals_window_transitions", "totals_set_points",
] as const;

export class SqliteStore {
  private static sqliteVerified = false;
  readonly path: string;
  constructor(path = process.env.RUNNER_SCOUT_DB ?? ".runner-scout.db") {
    SqliteStore.ensureSqliteBinary();
    this.path = resolve(path);
    mkdirSync(dirname(this.path), { recursive: true });
  }

  init() {
    const builtSchema = new URL("./schema.sql", import.meta.url);
    const sourceSchema = resolve(process.cwd(), "src/storage/schema.sql");
    this.exec(readFileSync(existsSync(builtSchema) ? builtSchema : sourceSchema, "utf8"));
    this.ensureColumn("provider_health", "status", "text");
    this.ensureColumn("provider_health", "rate_limit_remaining", "real");
    this.ensureColumn("provider_health", "rate_limit_used", "real");
    this.ensureColumn("provider_health", "next_retry_at", "text");
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
    this.transaction(health.map((h) => `insert into provider_health(provider, connected, last_message_at, last_error, reconnect_attempts, event_count, latency_ms, status, rate_limit_remaining, rate_limit_used, next_retry_at, updated_at)
      values(${sqlString(h.provider)}, ${h.connected ? 1 : 0}, ${sqlString(h.lastMessageAt)}, ${sqlString(h.lastError)}, ${h.reconnectAttempts}, ${h.eventCount}, ${sqlNumber(h.latencyMs)}, ${sqlString(h.status)}, ${sqlNumber(h.rateLimitRemaining)}, ${sqlNumber(h.rateLimitUsed)}, ${sqlString(h.nextRetryAt)}, ${sqlString(now)})
      on conflict(provider) do update set connected=excluded.connected,last_message_at=excluded.last_message_at,last_error=excluded.last_error,reconnect_attempts=excluded.reconnect_attempts,event_count=excluded.event_count,latency_ms=excluded.latency_ms,status=excluded.status,rate_limit_remaining=excluded.rate_limit_remaining,rate_limit_used=excluded.rate_limit_used,next_retry_at=excluded.next_retry_at,updated_at=excluded.updated_at;`).join("\n"));
  }


  persistGames(games: CanonicalGameState[], rawEvents: RawProviderEvent[] = []) {
    const statements: string[] = [];
    for (const game of games) {
      const changeHash = stableHash({ ...game, sourceTimestamp: undefined, receivedTimestamp: undefined, processedTimestamp: undefined });
      statements.push(`insert into games(id,sport,league,home_team,away_team,starts_at,status,updated_at)
        values(${sqlString(game.runnerEventId)},${sqlString(game.sport)},${sqlString(game.league)},${sqlString(game.home.name)},${sqlString(game.away.name)},${sqlString(game.startTime)},${sqlString(game.status)},${sqlString(game.processedTimestamp)})
        on conflict(id) do update set sport=excluded.sport,league=excluded.league,home_team=excluded.home_team,away_team=excluded.away_team,starts_at=excluded.starts_at,status=excluded.status,updated_at=excluded.updated_at;
        insert or ignore into game_state_snapshots(runner_event_id,provider,provider_event_id,payload_json,source_timestamp,received_timestamp,processed_timestamp,change_hash)
        values(${sqlString(game.runnerEventId)},${sqlString(game.provider)},${sqlString(game.providerEventId)},${sqlString(JSON.stringify(game))},${sqlString(game.sourceTimestamp)},${sqlString(game.receivedTimestamp)},${sqlString(game.processedTimestamp)},${sqlString(changeHash)});
        insert into provider_mappings(runner_event_id,provider,provider_event_id,mapping_method,confidence,verified)
        values(${sqlString(game.runnerEventId)},${sqlString(game.provider)},${sqlString(game.providerEventId)},'exact',1,1)
        on conflict do nothing;`);
    }
    statements.push(...this.rawProviderSql(rawEvents, "scoreboard"));
    this.transaction(statements.join("\n"));
  }

  persistSportsMarkets(markets: SportsMarketSnapshot[], rawEvents: RawProviderEvent[] = []) {
    const statements: string[] = [];
    for (const market of markets) {
      const changeHash = stableHash({ id: market.id, line: market.line, americanPrice: market.americanPrice, executable: market.executable, status: market.status });
      statements.push(`insert or ignore into sports_market_snapshots(market_id,provider,provider_event_id,runner_event_id,bookmaker_key,market_key,market_kind,selection,line,american_price,executable,status,payload_json,source_timestamp,received_timestamp,processed_timestamp,change_hash)
        values(${sqlString(market.id)},${sqlString(market.provider)},${sqlString(market.providerEventId)},${sqlString(market.runnerEventId)},${sqlString(market.bookmakerKey)},${sqlString(market.marketKey)},${sqlString(market.marketKind)},${sqlString(market.selection)},${sqlNumber(market.line)},${sqlNumber(market.americanPrice)},${market.executable ? 1 : 0},${sqlString(market.status)},${sqlString(JSON.stringify(market))},${sqlString(market.sourceTimestamp)},${sqlString(market.receivedTimestamp)},${sqlString(market.processedTimestamp)},${sqlString(changeHash)});`);
      if (market.runnerEventId) statements.push(`insert into provider_mappings(runner_event_id,provider,provider_event_id,mapping_method,confidence,verified)
        values(${sqlString(market.runnerEventId)},'odds_api',${sqlString(market.providerEventId)},'exact',1,1) on conflict do nothing;`);
    }
    statements.push(...this.rawProviderSql(rawEvents, "odds"));
    this.transaction(statements.join("\n"));
  }

  persistBaseline(baseline: RunnerBaseline) {
    const existing = this.queryJson(`select payload_json from runner_baselines where id=${sqlString(baseline.id)} limit 1;`)[0];
    if (existing) {
      if (String(existing.payload_json) === JSON.stringify(baseline)) return;
      throw new Error(`runner baseline ${baseline.id} is immutable`);
    }
    this.exec(`insert into runner_baselines(id,runner_event_id,phase,target,selection,model_name,model_version,source_type,fair_probability,fair_line,confidence,data_quality,payload_json,source_timestamp,received_timestamp,processed_timestamp)
      values(${sqlString(baseline.id)},${sqlString(baseline.runnerEventId)},${sqlString(baseline.phase)},${sqlString(baseline.target)},${sqlString(baseline.selection)},${sqlString(baseline.modelName)},${sqlString(baseline.modelVersion)},${sqlString(baseline.sourceType)},${sqlNumber(baseline.fairProbability)},${sqlNumber(baseline.fairLine)},${sqlNumber(baseline.confidence)},${sqlNumber(baseline.dataQuality)},${sqlString(JSON.stringify(baseline))},${sqlString(baseline.sourceTimestamp)},${sqlString(baseline.receivedTimestamp)},${sqlString(baseline.processedTimestamp)});`);
  }

  baselines(runnerEventId?: string): RunnerBaseline[] {
    return this.queryJson(`select payload_json from runner_baselines${runnerEventId ? ` where runner_event_id=${sqlString(runnerEventId)}` : ""} order by processed_timestamp desc;`).map((row) => JSON.parse(String(row.payload_json)) as RunnerBaseline);
  }

  gameHistory(runnerEventId: string): CanonicalGameState[] {
    return this.queryJson(`select payload_json from game_state_snapshots where runner_event_id=${sqlString(runnerEventId)} order by processed_timestamp asc;`).map((row) => JSON.parse(String(row.payload_json)) as CanonicalGameState);
  }

  sportsMarketHistory(runnerEventId?: string): SportsMarketSnapshot[] {
    return this.queryJson(`select payload_json from sports_market_snapshots${runnerEventId ? ` where runner_event_id=${sqlString(runnerEventId)}` : ""} order by processed_timestamp asc;`).map((row) => JSON.parse(String(row.payload_json)) as SportsMarketSnapshot);
  }

  private rawProviderSql(events: RawProviderEvent[], fallbackType: string): string[] {
    return events.map((event) => {
      const payload = event.payload as Record<string, unknown>;
      const providerEventId = event.providerEventId ?? (payload && typeof payload === "object" && typeof payload.id === "string" ? payload.id : undefined);
      const eventType = event.eventType ?? (event.provider === "espn" && payload && typeof payload === "object" && "header" in payload ? "summary" : fallbackType);
      const changeHash = stableHash(event.payload);
      return `insert or ignore into raw_provider_events(provider,event_type,provider_event_id,payload_json,source_timestamp,received_timestamp,processed_timestamp,change_hash)
        values(${sqlString(event.provider)},${sqlString(eventType)},${sqlString(providerEventId)},${sqlString(JSON.stringify(event.payload))},${sqlString(event.sourceTimestamp)},${sqlString(event.receivedTimestamp)},${sqlString(new Date().toISOString())},${sqlString(changeHash)});`;
    });
  }

  persistGameFlow(observation: GameFlowObservation, snapshot: GameFlowSnapshot) {
    this.transaction(`insert or replace into game_flow_observations(id,runner_event_id,source,observed_at,received_at,confidence,payload_json)
      values(${sqlString(observation.id)},${sqlString(observation.runnerEventId)},${sqlString(observation.source)},${sqlString(observation.observedAt)},${sqlString(observation.receivedAt)},${sqlNumber(observation.confidence)},${sqlString(JSON.stringify(observation))});
      insert or replace into game_flow_snapshots(runner_event_id,updated_at,payload_json)
      values(${sqlString(snapshot.runnerEventId)},${sqlString(snapshot.updatedAt)},${sqlString(JSON.stringify(snapshot))});`);
  }

  persistTotals(flow: TotalsFlowState, projections: TotalsProjection[], markets: TotalsMarketSnapshot[], windows: TotalsDecisionWindow[]) {
    const now = new Date().toISOString();
    const statements = [`insert or replace into totals_flow_snapshots(id,runner_event_id,source_timestamp,processed_timestamp,payload_json) values(${sqlString(stableHash(flow))},${sqlString(flow.runnerEventId)},${sqlString(flow.timestamp)},${sqlString(now)},${sqlString(JSON.stringify(flow))});`];
    for (const p of projections) statements.push(`insert or replace into totals_projections(id,runner_event_id,market_type,team_id,source_timestamp,processed_timestamp,payload_json) values(${sqlString(stableHash(p))},${sqlString(p.runnerEventId)},${sqlString(p.marketType)},${sqlString(p.teamId)},${sqlString(p.timestamp)},${sqlString(now)},${sqlString(JSON.stringify(p))});`);
    for (const m of markets) statements.push(`insert or replace into totals_market_snapshots(id,runner_event_id,market_type,bookmaker,line,price,source_timestamp,processed_timestamp,payload_json) values(${sqlString(m.id)},${sqlString(m.runnerEventId)},${sqlString(m.marketType)},${sqlString(m.bookmaker)},${sqlNumber(m.line)},${sqlNumber(m.price)},${sqlString(m.timestamp)},${sqlString(now)},${sqlString(JSON.stringify(m))});`);
    for (const w of windows) statements.push(`insert or replace into totals_decision_windows(id,runner_event_id,market_type,status,detected_at,processed_timestamp,payload_json) values(${sqlString(w.id)},${sqlString(w.runnerEventId)},${sqlString(w.marketType)},${sqlString(w.status)},${sqlString(w.detectedAt)},${sqlString(w.processedTimestamp)},${sqlString(JSON.stringify(w))});`);
    this.transaction(statements.join("\n"));
  }

  totalsRows(table: "totals_flow_snapshots" | "totals_projections" | "totals_market_snapshots" | "totals_decision_windows", runnerEventId?: string) {
    return this.queryJson(`select payload_json from ${table}${runnerEventId ? ` where runner_event_id=${sqlString(runnerEventId)}` : ""} order by processed_timestamp desc;`).map(row => JSON.parse(String(row.payload_json)) as Record<string, unknown>);
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
        const verb = table === "runner_baselines" ? "insert or ignore" : "insert or replace";
        this.transaction(rows.map((row) => `${verb} into ${table}(${columns.join(",")}) values(${columns.map((c) => sqlValue(row[c])).join(",")});`).join("\n"));
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

  private ensureColumn(table: string, column: string, definition: string) {
    const columns = this.queryJson(`pragma table_info(${table});`).map((row) => String(row.name));
    if (!columns.includes(column)) this.exec(`alter table ${table} add column ${column} ${definition};`);
  }

  private static readonly MAX_BUFFER = 500 * 1024 * 1024;
  private static ensureSqliteBinary() {
    if (SqliteStore.sqliteVerified) return;
    try {
      execFileSync("sqlite3", ["-version"], { stdio: ["ignore", "ignore", "pipe"], maxBuffer: SqliteStore.MAX_BUFFER });
      SqliteStore.sqliteVerified = true;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`sqlite3 binary is required but not available. Install sqlite3 and ensure it is on PATH. ${detail}`);
    }
  }

  private transaction(sql: string) { if (sql.trim()) this.exec(`begin;\n${sql}\ncommit;`); }
  private exec(sql: string) { execFileSync("sqlite3", ["-cmd", ".timeout 5000", this.path], { input: sql, maxBuffer: SqliteStore.MAX_BUFFER }); }
  private query(sql: string) { return execFileSync("sqlite3", ["-cmd", ".timeout 5000", this.path, sql], { encoding: "utf8", maxBuffer: SqliteStore.MAX_BUFFER }); }
  private queryJson(sql: string): Record<string, unknown>[] {
    const out = execFileSync("sqlite3", ["-json", "-cmd", ".timeout 5000", this.path, sql], { encoding: "utf8", maxBuffer: SqliteStore.MAX_BUFFER }).trim();
    return out ? JSON.parse(out) : [];
  }
}
