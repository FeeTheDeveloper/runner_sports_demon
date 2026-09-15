import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { AdversityEvent, EventMarketAlignment, GameFlowObservation, GameFlowSnapshot, MarketEvent, NormalizedMarket, ProviderHealth, SportsbookMarketSnapshot } from "../types.js";
import { stableHash } from "../utils/hash.js";
import type { TotalsDecisionWindow, TotalsFlowState, TotalsMarketSnapshot, TotalsProjection } from "../totals/types.js";
import type { FootballGame } from "../games/types.js";

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
  "game_flow_observations",
  "game_flow_snapshots",
  "totals_flow_snapshots", "totals_projections", "totals_market_snapshots", "totals_trend_scores",
  "totals_signals", "totals_decision_windows", "totals_window_transitions", "totals_set_points",
  "sportsbook_market_snapshots", "adversity_events", "event_market_alignments",
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

  persistSportsbookSnapshots(snapshots: SportsbookMarketSnapshot[]) {
    this.transaction(snapshots.map((snapshot) => {
      const changeHash = stableHash({
        line: snapshot.line,
        americanOdds: snapshot.americanOdds,
        rawImpliedProbability: snapshot.rawImpliedProbability,
        fairProbability: snapshot.fairProbability,
        marketOverround: snapshot.marketOverround,
        status: snapshot.status,
      });
      return `insert or ignore into sportsbook_market_snapshots(
        id,runner_event_id,provider,sportsbook,market_id,market_type,selection,team_id,player_id,line,american_odds,
        raw_implied_probability,fair_probability,market_overround,book_hold,source_timestamp,received_timestamp,
        processed_timestamp,period,clock,home_score,away_score,status,data_quality,change_hash,payload_json
      ) values(
        ${sqlString(stableHash({ snapshot, changeHash }))},${sqlString(snapshot.runnerEventId)},${sqlString(snapshot.provider)},
        ${sqlString(snapshot.sportsbook)},${sqlString(snapshot.marketId)},${sqlString(snapshot.marketType)},${sqlString(snapshot.selection)},
        ${sqlString(snapshot.teamId)},${sqlString(snapshot.playerId)},${sqlNumber(snapshot.line)},${sqlNumber(snapshot.americanOdds)},
        ${sqlNumber(snapshot.rawImpliedProbability)},${sqlNumber(snapshot.fairProbability)},${sqlNumber(snapshot.marketOverround)},${sqlNumber(snapshot.bookHold)},
        ${sqlString(snapshot.sourceTimestamp)},${sqlString(snapshot.receivedTimestamp)},${sqlString(snapshot.processedTimestamp)},
        ${sqlNumber(snapshot.period)},${sqlString(snapshot.clock)},${sqlNumber(snapshot.homeScore)},${sqlNumber(snapshot.awayScore)},
        ${sqlString(snapshot.status)},${sqlString(snapshot.dataQuality)},${sqlString(changeHash)},${sqlString(JSON.stringify(snapshot.raw))}
      );`;
    }).join("\n"));
  }

  persistAdversityEvent(event: AdversityEvent) {
    this.transaction(`insert or ignore into adversity_events(
      id,runner_event_id,sport,event_type,polarity,affected_team,affected_player_id,affected_player_name,severity,description,
      source,source_timestamp,received_timestamp,processed_timestamp,confidence,causality,payload_json
    ) values(
      ${sqlString(event.id)},${sqlString(event.runnerEventId)},${sqlString(event.sport)},${sqlString(event.eventType)},${sqlString(event.polarity)},
      ${sqlString(event.affectedTeam)},${sqlString(event.affectedPlayerId)},${sqlString(event.affectedPlayerName)},${sqlNumber(event.severity)},${sqlString(event.description)},
      ${sqlString(event.source)},${sqlString(event.sourceTimestamp)},${sqlString(event.receivedTimestamp)},${sqlString(event.processedTimestamp)},
      ${sqlNumber(event.confidence)},${sqlString(event.causality)},${sqlString(JSON.stringify(event.raw))}
    );`);
  }

  persistEventMarketAlignment(alignment: EventMarketAlignment) {
    this.transaction(`insert or ignore into event_market_alignments(
      id,adversity_event_id,runner_event_id,market_id,impact_class,mapping_method,confidence,causality,created_at
    ) values(
      ${sqlString(alignment.id)},${sqlString(alignment.adversityEventId)},${sqlString(alignment.runnerEventId)},${sqlString(alignment.marketId)},
      ${sqlString(alignment.impactClass)},${sqlString(alignment.mappingMethod)},${sqlNumber(alignment.confidence)},${sqlString(alignment.causality)},${sqlString(alignment.createdAt)}
    );`);
  }

  persistGameFlow(observation: GameFlowObservation, snapshot: GameFlowSnapshot) {
    this.transaction(`insert or replace into game_flow_observations(id,runner_event_id,source,observed_at,received_at,confidence,payload_json)
      values(${sqlString(observation.id)},${sqlString(observation.runnerEventId)},${sqlString(observation.source)},${sqlString(observation.observedAt)},${sqlString(observation.receivedAt)},${sqlNumber(observation.confidence)},${sqlString(JSON.stringify(observation))});
      insert or replace into game_flow_snapshots(runner_event_id,updated_at,payload_json)
      values(${sqlString(snapshot.runnerEventId)},${sqlString(snapshot.updatedAt)},${sqlString(JSON.stringify(snapshot))});`);
  }

  persistGames(games: FootballGame[]) {
    const now = new Date().toISOString();
    this.transaction(games.map((game) => `insert into games(id,sport,league,home_team,away_team,starts_at,status,updated_at)
      values(${sqlString(game.runnerEventId)},${sqlString(game.sport)},${sqlString(game.league)},${sqlString(game.homeTeam)},${sqlString(game.awayTeam)},${sqlString(game.kickoff)},${sqlString(game.status)},${sqlString(now)})
      on conflict(id) do update set home_team=excluded.home_team,away_team=excluded.away_team,starts_at=excluded.starts_at,status=excluded.status,updated_at=excluded.updated_at;
      insert or replace into game_state_snapshots(id,runner_event_id,provider,provider_event_id,source_timestamp,received_timestamp,processed_timestamp,payload_json)
      values(${sqlString(stableHash(game))},${sqlString(game.runnerEventId)},${sqlString(game.source)},${sqlString(game.providerEventId)},${sqlString(game.sourceTimestamp)},${sqlString(game.receivedTimestamp)},${sqlString(game.processedTimestamp)},${sqlString(JSON.stringify(game))});`).join("\n"));
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
  private exec(sql: string) { execFileSync("sqlite3", [this.path], { input: sql, maxBuffer: SqliteStore.MAX_BUFFER }); }
  private query(sql: string) { return execFileSync("sqlite3", [this.path, sql], { encoding: "utf8", maxBuffer: SqliteStore.MAX_BUFFER }); }
  private queryJson(sql: string): Record<string, unknown>[] {
    const out = execFileSync("sqlite3", ["-json", this.path, sql], { encoding: "utf8", maxBuffer: SqliteStore.MAX_BUFFER }).trim();
    return out ? JSON.parse(out) : [];
  }
}
