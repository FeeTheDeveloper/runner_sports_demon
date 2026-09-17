import assert from "node:assert/strict";
import { Script, createContext } from "node:vm";
import { renderControlDashboard } from "../dashboard/control-web.js";

// A deliberately small DOM surface exercises emitted client behavior without a browser.
// Unknown selectors fail rather than silently creating elements missing from the HTML.
class Element {
  innerHTML = "";
  textContent = "";
  value = "";
  hidden = false;
  disabled = false;
  className = "";
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  listeners = new Map<string, () => unknown>();
  classes = new Set<string>();
  classList = { toggle: (name: string, force: boolean) => force ? this.classes.add(name) : this.classes.delete(name) };
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  removeAttribute(name: string) { this.attributes.delete(name); }
  addEventListener(name: string, callback: () => unknown) { this.listeners.set(name, callback); }
  fire(name: string) {
    const callback = this.listeners.get(name);
    assert.ok(callback, `Expected a ${name} handler`);
    return callback();
  }
}

const html = renderControlDashboard();
const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Element()]));
function element(id: string): Element {
  const found = elements.get(id);
  assert.ok(found, `Client requested absent element #${id}`);
  return found;
}
const panels = [...html.matchAll(/id="([^"]+)" data-view="([^"]+)"/g)].map(match => {
  const panel = element(match[1]);
  panel.dataset.view = match[2];
  return panel;
});
const navigation = [...html.matchAll(/data-nav="([^"]+)"/g)].map(match => {
  const link = new Element();
  link.dataset.nav = match[1];
  return link;
});
element("provider-filter").value = "all";
element("market-sort").value = "recent";
element("handoff-filter").value = "all";
const location = { hash: "" };
const windowListeners = new Map<string, () => void>();
const intervals: Array<() => void> = [];
let requested = 0;
let snapshot = {
  generatedAt: "2026-09-16T12:00:00Z",
  mode: "local-snapshot",
  database: { status: "missing" },
  summary: { markets: null as number | null, marketEvents: null as number | null },
  markets: [] as Array<Record<string, unknown>>,
  providers: [], activity: [], windows: [], handoffs: [], models: [], repositories: [],
  coordination: { historical: true, updatedAt: null, blockers: [] },
};
const context = createContext({
  document: {
    hidden: false,
    title: "",
    querySelector(selector: string) { assert.ok(selector.startsWith("#")); return element(selector.slice(1)); },
    querySelectorAll(selector: string) {
      if (selector === "[data-view]") return panels;
      if (selector === "[data-nav]") return navigation;
      throw new Error(`Unexpected selector ${selector}`);
    },
  },
  location,
  window: { addEventListener: (name: string, callback: () => void) => windowListeners.set(name, callback) },
  AbortSignal,
  fetch: async (url: string) => {
    assert.equal(url, "/control/status", "hydration and refresh must only request local status");
    requested++;
    return { ok: true, json: async () => structuredClone(snapshot) };
  },
  setTimeout: () => 1,
  clearTimeout: () => {},
  setInterval: (callback: () => void) => { intervals.push(callback); return 1; },
});
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
new Script(scripts[0][1], { filename: "rendered-control-client.js" }).runInContext(context, { timeout: 1000 });
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
await flush();

assert.equal(requested, 1);
assert.equal(element("connection").textContent, "Local workspace connected", "missing databases must still hydrate the workspace");
assert.equal(element("snapshot-note").textContent, "Database not created yet");
assert.equal(element("error-banner").hidden, true);
assert.match(element("market-rows").innerHTML, /No market snapshots yet/);
assert.equal(element("metric-markets").textContent, "—", "unknown market count must not become zero");
assert.equal(element("refresh").disabled, false);

location.hash = "#markets";
windowListeners.get("hashchange")!();
assert.equal(element("view-markets").hidden, false);
assert.equal(element("view-overview").hidden, true);
assert.equal(navigation.find(link => link.dataset.nav === "markets")!.attributes.get("aria-current"), "page");
location.hash = "#unexpected";
windowListeners.get("hashchange")!();
assert.equal(element("view-overview").hidden, false, "unknown routes must return to Overview");

element("pause").fire("click");
assert.equal(element("pause").attributes.get("aria-pressed"), "true");
assert.equal(element("pause-label").textContent, "Resume refresh");
intervals[0]();
await flush();
assert.equal(requested, 1, "paused automatic refresh must not request another snapshot");
element("pause").fire("click");
await flush();
assert.equal(element("pause").attributes.get("aria-pressed"), "false");
assert.equal(requested, 2, "resuming refresh must load a current snapshot");

const maliciousTitle = '<img src=x onerror="alert(1)">';
snapshot = { ...snapshot, database: { status: "ready" }, summary: { markets: 2, marketEvents: 0 }, markets: [
  { title: maliciousTitle, provider: "kalshi", sport: "NFL", runnerEventId: "test-event", yesPrice: 0.6, liquidity: 10 },
  { title: "Other game", provider: "odds_api", sport: "NFL", runnerEventId: "other-event", yesPrice: 0.4, liquidity: 5 },
] };
element("refresh").fire("click");
await flush();
assert.equal(element("market-result-count").textContent, "2");
assert.ok(!element("market-rows").innerHTML.includes(maliciousTitle), "provider titles must not become executable HTML");
assert.match(element("market-rows").innerHTML, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
element("provider-filter").value = "kalshi";
element("provider-filter").fire("change");
assert.equal(element("market-result-count").textContent, "1");
assert.ok(!element("market-rows").innerHTML.includes("Other game"));
element("market-search").value = "no match";
element("market-search").fire("input");
assert.equal(element("market-result-count").textContent, "0");
assert.match(element("market-rows").innerHTML, /No matching markets/);
assert.equal(element("error-banner").hidden, true);
console.log("control client interaction tests passed");
