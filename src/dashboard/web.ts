export function renderWebDashboard(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Runner Scout</title>
  <style>
    :root { color-scheme: dark; --ink: #e9eef2; --muted: #8d9aa4; --line: #26333b; --panel: #111a1f; --panel-2: #172329; --lime: #c8f169; --cyan: #77d6d0; --red: #ff8e7d; }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 320px; color: var(--ink); background: radial-gradient(circle at 90% 0%, #24423d 0, #10191d 34rem, #091013 70rem); font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; }
    main { width: min(1440px, calc(100% - 40px)); margin: 0 auto; padding: 42px 0 56px; }
    header { display: flex; align-items: end; justify-content: space-between; gap: 24px; padding-bottom: 34px; }
    .eyebrow { color: var(--lime); font: 700 11px/1.2 ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 8px 0 0; font: 600 clamp(2.2rem, 5vw, 4.5rem)/.95 Georgia, serif; letter-spacing: -.04em; }
    .subtle { color: var(--muted); }
    button { border: 1px solid #52656b; border-radius: 999px; padding: 10px 16px; color: var(--ink); background: #17252a; cursor: pointer; font: inherit; }
    button:hover { border-color: var(--lime); color: var(--lime); }
    .status { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
    .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 14px var(--lime); }
    .dot.off { background: var(--red); box-shadow: 0 0 14px var(--red); }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .metric, .panel { border: 1px solid var(--line); background: color-mix(in srgb, var(--panel) 90%, transparent); }
    .metric { min-height: 112px; padding: 18px; }
    .metric strong { display: block; margin-top: 12px; color: var(--lime); font: 600 2rem/1 Georgia, serif; }
    .panel { overflow: hidden; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; border-bottom: 1px solid var(--line); }
    h2 { margin: 0; font-size: 16px; font-weight: 600; }
    .health { display: flex; flex-wrap: wrap; gap: 8px; }
    .provider { display: inline-flex; align-items: center; gap: 8px; padding: 7px 10px; border: 1px solid var(--line); background: var(--panel-2); color: var(--muted); font: 12px ui-monospace, monospace; }
    .provider b { color: var(--ink); }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 760px; }
    th, td { padding: 14px 20px; border-bottom: 1px solid var(--line); text-align: left; white-space: nowrap; }
    th { color: var(--muted); font: 11px ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
    td.title { width: 100%; max-width: 520px; overflow: hidden; text-overflow: ellipsis; }
    td.price { color: var(--cyan); font-weight: 700; }
    tbody tr:hover { background: #1a292d; }
    .empty { padding: 42px 20px; color: var(--muted); text-align: center; }
    @media (max-width: 720px) { main { width: min(100% - 24px, 600px); padding-top: 24px; } header { align-items: start; flex-direction: column; } .metrics { grid-template-columns: repeat(2, 1fr); } .metric { min-height: 94px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div><div class="eyebrow">Local market intelligence</div><h1>Runner Scout</h1><div class="subtle">Live prediction-market monitor</div></div>
      <div><div class="status"><span id="status-dot" class="dot off"></span><span id="status-text">Connecting</span></div><button id="refresh" type="button">Refresh data</button></div>
    </header>
    <section class="metrics" aria-label="Market summary">
      <div class="metric"><span class="subtle">Live markets</span><strong id="market-count">--</strong></div>
      <div class="metric"><span class="subtle">Providers online</span><strong id="provider-count">--</strong></div>
      <div class="metric"><span class="subtle">Top liquidity</span><strong id="liquidity">--</strong></div>
      <div class="metric"><span class="subtle">Last update</span><strong id="updated">--</strong></div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Provider health</h2><span class="subtle" id="market-note">Waiting for live data</span></div>
      <div class="health" id="health" style="padding: 14px 20px"></div>
    </section>
    <section class="panel" style="margin-top: 18px">
      <div class="panel-head"><h2>Markets by liquidity</h2><span class="subtle">Auto-refreshes every 15 seconds</span></div>
      <div class="table-wrap"><table><thead><tr><th>Provider</th><th>Market</th><th>Yes</th><th>Bid / Ask</th><th>Liquidity</th><th>Volume</th><th>Sport</th></tr></thead><tbody id="markets"><tr><td class="empty" colspan="7">Loading live markets...</td></tr></tbody></table></div>
    </section>
  </main>
  <script>
    const money = value => value == null ? '-' : Math.round(value).toLocaleString('en-US');
    const pct = value => value == null ? '-' : (value * 100).toFixed(1) + '%';
    const time = value => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--';
    async function load() {
      const dot = document.querySelector('#status-dot');
      try {
        const [healthResponse, marketsResponse] = await Promise.all([fetch('/health'), fetch('/markets/live')]);
        if (!healthResponse.ok || !marketsResponse.ok) throw new Error('API unavailable');
        const health = await healthResponse.json();
        const markets = (await marketsResponse.json()).data || [];
        const providers = [...new Set(markets.map(m => m.provider))];
        const topLiquidity = Math.max(0, ...markets.map(m => m.liquidity || 0));
        document.querySelector('#market-count').textContent = markets.length.toLocaleString();
        document.querySelector('#provider-count').textContent = providers.length.toLocaleString();
        document.querySelector('#liquidity').textContent = money(topLiquidity);
        document.querySelector('#updated').textContent = time(health.updatedAt);
        document.querySelector('#status-text').textContent = 'Live';
        dot.classList.remove('off');
        document.querySelector('#market-note').textContent = markets.length + ' markets in local cache';
        document.querySelector('#health').innerHTML = providers.length ? providers.map(provider => '<div class="provider"><span class="dot"></span><b>' + provider + '</b><span>available</span></div>').join('') : '<span class="subtle">No provider data yet</span>';
        document.querySelector('#markets').innerHTML = markets.length ? markets.map(m => '<tr><td>' + (m.provider || '-') + '</td><td class="title" title="' + (m.title || '') + '">' + (m.title || '-') + '</td><td class="price">' + pct(m.yesPrice) + '</td><td>' + pct(m.bid) + ' / ' + pct(m.ask) + '</td><td>' + money(m.liquidity) + '</td><td>' + money(m.volume) + '</td><td>' + (m.sport || '-') + '</td></tr>').join('') : '<tr><td class="empty" colspan="7">No live markets in the cache.</td></tr>';
      } catch (error) {
        document.querySelector('#status-text').textContent = 'Offline';
        dot.classList.add('off');
        document.querySelector('#market-note').textContent = 'Start the local Scout API to connect';
      }
    }
    document.querySelector('#refresh').addEventListener('click', load);
    load();
    setInterval(load, 15000);
  </script>
</body>
</html>`;
}