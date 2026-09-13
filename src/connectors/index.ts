import { KalshiConnector } from "./kalshi/client.js";
import { PolymarketConnector } from "./polymarket/client.js";
import { OddsApiNflConnector } from "./odds-api/client.js";
import type { Connector } from "../types.js";
import { boolEnv } from "../utils/env.js";
import { optionalStringEnv } from "../utils/env.js";

export function createMarketConnectors(): Connector[] {
  const connectors: Connector[] = [new KalshiConnector()];
  if (boolEnv("RUNNER_ENABLE_POLYMARKET", false)) {
    connectors.push(new PolymarketConnector());
  }
  if (optionalStringEnv("ODDS_API_KEY")) connectors.push(new OddsApiNflConnector());
  return connectors;
}
