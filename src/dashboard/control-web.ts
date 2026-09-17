import { controlStyles } from "./control-styles.js";
import { controlClient } from "./control-client.js";

function icon(name: string): string {
  const paths: Record<string, string> = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    markets: '<path d="M3 17l5-6 5 3 8-10M3 21h18"/>',
    schedule: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
    totals: '<path d="M5 20V10m7 10V4m7 16v-7"/>',
    providers: '<path d="M2 12h4l3-8 6 16 3-8h4"/>',
    workflows: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M6 9v9h9m3-3V6H9"/>',
    models: '<path d="M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5M3 16l9 5 9-5"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0112-1l2 3M4 15l2 3a7 7 0 0012-1"/>',
    download: '<path d="M12 3v12m-5-5l5 5 5-5M4 17v4h16v-4"/>',
  };
  return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] ?? paths.overview) + '</svg>';
}

export function renderControlDashboard(): string {
  const nav = (id: string, title: string, count = "") => '<a href="#' + id + '" data-nav="' + id + '" aria-label="' + title + '">' + icon(id) + '<span>' + title + '</span>' + (count ? '<small id="' + count + '">—</small>' : '') + '</a>';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><meta name="theme-color" content="#101211"><title>Runner — Control Center</title><style>${controlStyles}</style></head>
<body><a class="skip" href="#main">Skip to content</a>
<aside class="sidebar">
  <a class="brand" href="#overview" aria-label="Runner home"><span class="brand-mark">R<span></span></span><span>RUNNER<small>SPORTS & ANALYTICS</small></span></a>
  <div class="workspace"><span class="workspace-icon">D</span><div>Demon workspace<small>Local intelligence engine</small></div><span class="workspace-dot"></span></div>
  <div class="nav-label">WORKSPACE</div><nav aria-label="Main navigation">${nav("overview", "Overview")}${nav("markets", "Markets", "nav-markets")}${nav("schedule", "Game schedule")}${nav("totals", "Totals desk")}</nav>
  <div class="nav-label second">OPERATIONS</div><nav aria-label="Operations">${nav("providers", "Data providers")}${nav("workflows", "Work queue", "nav-work")}${nav("models", "Model registry")}</nav>
  <div class="sidebar-bottom"><div class="local-chip"><span class="dot lime"></span> LOCAL WORKSPACE</div><p>Intelligence first.<br>Every signal needs evidence.</p><div class="owner"><span>KF</span><div>King Fee<small>Fee The Developer</small></div></div></div>
</aside>
<div class="shell"><header class="topbar"><div class="breadcrumb">Workspace <span>/</span> <b id="breadcrumb">Overview</b></div><div class="topbar-right"><span class="local-tag">LOCAL</span><span id="clock"></span><span class="avatar">KF</span></div></header>
<main id="main" tabindex="-1">
  <div class="page-heading"><div><div class="eyebrow">RUNNER CONTROL CENTER</div><h1 id="page-title">Workspace overview<span class="heading-dot">.</span></h1><p id="page-description">Your intelligence engine. One clear view.</p></div><div class="heading-actions"><button id="pause" class="button secondary" type="button" aria-pressed="false"><span id="pause-symbol">Ⅱ</span><span id="pause-label">Pause refresh</span></button><button id="refresh" class="button primary" type="button">${icon("refresh")} Refresh data</button></div></div>
  <div class="session-bar"><span><span class="dot" id="connection-dot"></span><b id="connection">Connecting to local workspace</b><span class="session-divider">/</span><span id="snapshot-note">Reading saved engine state</span></span><span id="last-read">Waiting for snapshot</span></div>
  <div id="error-banner" class="error-banner" role="alert" hidden></div>
  <section id="view-overview" data-view="overview">
    <div class="metrics">
      <article class="metric"><div><span>Stored markets</span>${icon("markets")}</div><strong id="metric-markets">—</strong><small>Across recorded market sources</small></article>
      <article class="metric"><div><span>Market events</span>${icon("totals")}</div><strong id="metric-events">—</strong><small>Saved for analysis and replay</small></article>
      <article class="metric"><div><span>Fresh provider samples</span>${icon("providers")}</div><strong id="metric-providers">—</strong><small>Received within the last 90 seconds</small></article>
      <article class="metric"><div><span>Open handoffs</span>${icon("workflows")}</div><strong id="metric-handoffs">—</strong><small>From the shared engineering queue</small></article>
    </div>
    <div class="overview-grid"><article class="panel activity-panel"><div class="panel-head"><div><h2>Market activity</h2><p>Recorded events over the last 24 hours</p></div><span class="pill neutral">24H · UTC</span></div><div class="chart-summary"><strong id="activity-total">—</strong><span>events recorded</span><span class="chart-key"><i></i> Market events</span></div><div id="activity-chart" class="activity-chart" role="img" aria-label="Market activity is loading"></div><div class="chart-axis"><span id="chart-start">24 hours ago</span><span>12 hours ago</span><span>Now</span></div><p class="chart-caption" id="chart-caption">Reading the local event store…</p></article>
    <article class="panel system-panel"><div class="panel-head"><div><h2>Intelligence pipeline</h2><p>Three repositories. One system.</p></div><span class="tiny-arrow">↗</span></div><div id="pipeline" class="pipeline"></div><div class="pipeline-foot"><span class="dot lime"></span> Local snapshot mode <span class="pill neutral">READ ONLY</span></div></article></div>
    <div class="overview-grid lower-grid"><article class="panel"><div class="panel-head"><div><h2>Provider pulse</h2><p>Freshness from recorded provider telemetry</p></div><a href="#providers" class="text-link">View all ↗</a></div><div id="provider-pulse" class="provider-pulse"></div></article><article class="panel"><div class="panel-head"><div><h2>Engineering handoffs</h2><p>What moves the engine forward</p></div><a href="#workflows" class="text-link">Open queue ↗</a></div><div id="handoff-preview" class="handoff-preview"></div></article></div>
  </section>
  <section id="view-markets" data-view="markets" hidden><div class="panel"><div class="panel-head"><div><h2>Market inventory <span class="count" id="market-result-count">0</span></h2><p>Saved snapshots · up to 250 most recently updated markets</p></div></div><div class="toolbar"><label class="search"><span>⌕</span><input id="market-search" type="search" placeholder="Search markets or events…" aria-label="Search markets"></label><select id="provider-filter" aria-label="Filter by provider"><option value="all">All providers</option><option value="kalshi">Kalshi</option><option value="polymarket">Polymarket</option><option value="odds_api">Odds API</option></select><select id="market-sort" aria-label="Sort markets"><option value="recent">Most recent</option><option value="liquidity">Highest liquidity</option><option value="price">Highest probability</option></select></div><div class="table-scroll"><table><thead><tr><th>Market / Event</th><th>Provider</th><th>Yes price</th><th>Bid / Ask</th><th>Liquidity</th><th>Updated</th></tr></thead><tbody id="market-rows"></tbody></table></div></div></section>
  <section id="view-schedule" data-view="schedule" hidden><div class="panel"><div class="panel-head"><div><h2>Game schedule</h2><p>Request an authoritative ESPN scoreboard for your selected date</p></div><span class="pill neutral">ON DEMAND</span></div><form id="schedule-form" class="toolbar"><label>League<select id="schedule-sport"><option value="nfl">NFL</option><option value="cfb">College football</option></select></label><label>Game date<input id="schedule-date" type="date" required></label><button type="submit" id="schedule-load" class="button primary">Load schedule ↗</button><span id="schedule-status" class="muted" role="status"></span></form><div id="schedule-games" class="games-grid"><div class="empty"><span class="empty-icon">◷</span><h3>Your game day starts here.</h3><p>Choose a league and date, then load the schedule.<br>Scores and availability come directly from ESPN.</p></div></div></div></section>
  <section id="view-totals" data-view="totals" hidden><div class="notice"><span>i</span>Totals are research outputs from an uncalibrated heuristic. Saved windows are evaluated for expiry; they are not trading instructions.</div><div class="panel"><div class="panel-head"><div><h2>Decision windows</h2><p>Most recent saved totals evaluations</p></div></div><div class="table-scroll"><table><thead><tr><th>Event / Market</th><th>Selection</th><th>Projection</th><th>Line</th><th>Edge</th><th>Status</th></tr></thead><tbody id="window-rows"></tbody></table></div></div></section>
  <section id="view-providers" data-view="providers" hidden><div class="notice"><span>i</span>These are saved health samples, not active connection checks. Samples older than 90 seconds are marked stale.</div><div id="provider-cards" class="provider-cards"></div></section>
  <section id="view-workflows" data-view="workflows" hidden><div class="panel"><div class="panel-head"><div><h2>Shared work queue</h2><p>Repository handoffs · engineering ownership and next steps</p></div><select id="handoff-filter" aria-label="Filter handoffs"><option value="all">All handoffs</option><option value="open">Open only</option><option value="complete">Complete only</option></select></div><div id="handoff-list" class="handoff-list"></div></div><div class="panel blockers-panel"><div class="panel-head"><div><h2>Recorded blockers</h2><p id="coordination-date">Historical coordination record</p></div><span class="pill amber">REQUIRES REVALIDATION</span></div><ul id="blocker-list" class="blocker-list"></ul></div></section>
  <section id="view-models" data-view="models" hidden><div class="notice"><span>i</span>Registry status describes implementation. It does not establish predictive accuracy or authorize automated trading.</div><div id="model-cards" class="model-cards"></div></section>
  <footer><span><span class="footer-logo">R /</span> RUNNER SPORTS & ANALYTICS <span class="footer-divider">·</span> Built for the information advantage.</span><button id="export" type="button" class="text-link">${icon("download")} Export status</button></footer>
</main></div><div id="toast" class="toast" role="status" hidden></div><script>${controlClient}</script></body></html>`;
}
