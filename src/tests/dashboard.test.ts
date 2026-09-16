import assert from "node:assert/strict";
import { renderWebDashboard } from "../dashboard/web.js";
const html = renderWebDashboard();
for (const tab of ["LIVE DESK", "GAMES", "MARKETS", "TOTALS", "PROPS", "ALERTS", "MODELS", "REPLAY", "PROVIDERS"]) assert.ok(html.includes(tab));
assert.ok(html.includes("Raw Market Monitor"));
assert.ok(html.includes("Runner projection unavailable"));
console.log("dashboard contract tests passed");
