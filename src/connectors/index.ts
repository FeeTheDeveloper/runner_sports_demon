import { KalshiConnector } from "./kalshi/client.js";
import { PolymarketConnector } from "./polymarket/client.js";
import type { Connector } from "../types.js";

export function createMarketConnectors(): Connector[] {
  return [new KalshiConnector(), new PolymarketConnector()];
}
