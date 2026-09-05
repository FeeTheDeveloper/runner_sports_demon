#!/usr/bin/env node
import { loadDotEnv, intEnv } from "./utils/env.js";
import { createMarketConnectors } from "./connectors/index.js";
import { MarketStateCache } from "./state/market-state/cache.js";
import { SqliteStore } from "./storage/sqlite.js";
import { startIngestion } from "./ingestion.js";
import { startApi } from "./api/server.js";

loadDotEnv();
const command = process.argv[2] ?? "start";
const cache = new MarketStateCache();
const store = new SqliteStore();

if (command === "start") {
  const api = process.argv.includes("--api");
  if (api) startApi(cache, intArg("--port", 8787));
  await startIngestion(createMarketConnectors(), cache, store, { limit: intEnv("RUNNER_SCOUT_MARKET_LIMIT", 250), pollMs: intEnv("RUNNER_SCOUT_POLL_MS", 30_000), once: process.argv.includes("--once") });
} else if (command === "init-db") {
  store.init();
  console.log(`Initialized ${store.path}`);
} else {
  console.log("Usage: runner-scout start [--once] [--api --port 8787] | init-db");
}

function intArg(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  const parsed = Number(process.argv[index + 1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}
