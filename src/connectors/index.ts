import { KalshiConnector } from "./kalshi/client.js";
import { PolymarketConnector } from "./polymarket/client.js";
import type { Connector } from "../types.js";
import { boolEnv } from "../utils/env.js";

export function createMarketConnectors(): Connector[] {
  const connectors: Connector[] = [new KalshiConnector()];
  if (boolEnv("RUNNER_ENABLE_POLYMARKET", false)) {
    connectors.push(new PolymarketConnector());
  }
  return connectors;
}
