// Browser code is kept self-contained so the local dashboard needs no CDN or bundler.
export const controlClient = String.raw`
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number = value => value == null ? '—' : Number(value).toLocaleString('en-US');
  const decimal = value => value == null ? '—' : Number(value).toLocaleString('en-US', {maximumFractionDigits:1});
  const percent = value => value == null ? '—' : (Number(value) * 100).toFixed(1) + '%';
  const dateTime = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'No timestamp';
  const relative = value => {
    if (!value || !Number.isFinite(Date.parse(value))) return 'No sample';
    const seconds = (Date.now() - Date.parse(value)) / 1000;
    if (seconds < 0) return 'Future timestamp';
    if (seconds < 60) return Math.floor(seconds) + 's ago';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
  };
  const titleCase = value => String(value ?? 'unknown').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  const providerName = value => ({kalshi:'Kalshi',polymarket:'Polymarket',odds_api:'The Odds API',espn:'ESPN'}[value] || titleCase(value));
  const statusClass = status => ['connected','complete','ready','present'].includes(String(status).toLowerCase()) ? 'lime' : ['stale','requested','pending','watch','armed','awaiting_implementation'].includes(String(status).toLowerCase()) ? 'amber' : ['disconnected','unavailable','blocked'].includes(String(status).toLowerCase()) ? 'red' : 'neutral';
  const badge = (status, label) => '<span class="pill ' + statusClass(status) + '">' + esc(label || titleCase(status)) + '</span>';
  const empty = (heading, message) => '<div class="empty"><span class="empty-icon">◇</span><h3>' + esc(heading) + '</h3><p>' + esc(message) + '</p></div>';
  const keyValue = (key,value) => '<div class="key-value"><span>' + esc(key) + '</span><b>' + esc(value) + '</b></div>';
  let snapshot = null;
  let paused = false;
  let loading = false;
  let toastTimer;
  const views = {
    overview:['Workspace overview','Your intelligence engine. One clear view.'],
    markets:['Market inventory','Find the market. Inspect the evidence.'],
    schedule:['Game schedule','The games behind the numbers.'],
    totals:['Totals desk','Projection, context, and the decision window.'],
    providers:['Data providers','Know where your information stands.'],
    workflows:['Engineering work queue','Shared ownership. Visible progress.'],
    models:['Model registry','The reasoning behind the signal.']
  };
  function navigate() {
    const route = location.hash.slice(1);
    const view = Object.hasOwn(views, route) ? route : 'overview';
    document.querySelectorAll('[data-view]').forEach(el => { el.hidden = el.dataset.view !== view; });
    document.querySelectorAll('[data-nav]').forEach(el => { const active = el.dataset.nav === view; el.classList.toggle('active',active); if(active) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
    $('#page-title').innerHTML = esc(views[view][0]) + '<span class="heading-dot">.</span>';
    $('#page-description').textContent = views[view][1];
    $('#breadcrumb').textContent = view === 'overview' ? 'Overview' : views[view][0];
    document.title = 'Runner — ' + views[view][0];
  }
  function getProviders() {
    return ['kalshi','polymarket','odds_api',...new Set((snapshot?.providers || []).map(p=>p.provider))]
      .filter((p,i,a)=>a.indexOf(p)===i).map(provider => snapshot?.providers.find(p=>p.provider===provider) || {provider,status:'unknown',eventCount:null});
  }
  function renderProviders() {
    const providers = getProviders();
    $('#provider-pulse').innerHTML = providers.slice(0,3).map(p => '<div class="provider-row"><span class="provider-logo">' + esc(providerName(p.provider)[0]) + '</span><div class="provider-name">' + esc(providerName(p.provider)) + '<small>' + (p.status === 'unknown' ? 'No verified health sample' : 'Recorded provider telemetry') + '</small></div><span class="provider-age">' + esc(relative(p.updatedAt)) + '</span>' + badge(p.status,p.status === 'connected' ? 'Fresh sample' : p.status === 'unknown' ? 'No sample' : titleCase(p.status)) + '</div>').join('');
    $('#provider-cards').innerHTML = providers.map(p => '<article class="provider-card"><div class="card-top"><span class="provider-logo">' + esc(providerName(p.provider)[0]) + '</span>' + badge(p.status,p.status === 'connected' ? 'Fresh sample' : titleCase(p.status)) + '</div><h3>' + esc(providerName(p.provider)) + '</h3><p>Recorded health from the local engine store.</p>' + keyValue('Last recorded',dateTime(p.updatedAt)) + keyValue('Last message',dateTime(p.lastMessageAt)) + keyValue('Events observed',number(p.eventCount)) + keyValue('Latency',p.latencyMs == null ? 'Not recorded' : number(p.latencyMs) + ' ms') + keyValue('Reconnects',number(p.reconnectAttempts)) + '</article>').join('');
  }
  function renderMarkets() {
    const query = $('#market-search').value.toLowerCase().trim();
    const provider = $('#provider-filter').value;
    const sort = $('#market-sort').value;
    const rows = (snapshot?.markets || []).filter(m => (provider === 'all' || m.provider === provider) && (m.title + ' ' + m.runnerEventId + ' ' + m.sport).toLowerCase().includes(query));
    if (sort === 'liquidity') rows.sort((a,b)=>(b.liquidity ?? -1)-(a.liquidity ?? -1));
    if (sort === 'price') rows.sort((a,b)=>(b.yesPrice ?? -1)-(a.yesPrice ?? -1));
    $('#market-result-count').textContent = number(rows.length);
    $('#market-rows').innerHTML = rows.length ? rows.map(m => '<tr><td><b>' + esc(m.title) + '</b><small>' + esc(m.runnerEventId || m.sport || 'Event not mapped') + '</small></td><td>' + esc(providerName(m.provider)) + '</td><td class="price">' + percent(m.yesPrice) + '</td><td>' + percent(m.bid) + ' / ' + percent(m.ask) + '</td><td>' + number(m.liquidity) + '</td><td title="' + esc(dateTime(m.updatedAt)) + '">' + esc(relative(m.updatedAt)) + '</td></tr>').join('') : '<tr><td colspan="6">' + empty(query || provider !== 'all' ? 'No matching markets.' : 'No market snapshots yet.',query || provider !== 'all' ? 'Try another search or provider filter.' : 'Saved markets will appear here when the engine records them.') + '</td></tr>';
  }
  function renderHandoffs() {
    const handoffs = snapshot?.handoffs || [];
    const open = handoffs.filter(h=>h.status !== 'complete');
    $('#handoff-preview').innerHTML = open.slice(0,3).map(h=>'<a href="#workflows" class="handoff-mini"><span class="priority">' + esc(h.priority || '—') + '</span><div><b>' + esc(h.objective) + '</b><small>' + esc(h.to) + ' · ' + esc(titleCase(h.status)) + '</small></div></a>').join('') || empty('Queue is clear.','No open repository handoffs were found.');
    const filter = $('#handoff-filter').value;
    const filtered = handoffs.filter(h=>filter === 'all' || (filter === 'complete' ? h.status === 'complete' : h.status !== 'complete'));
    $('#handoff-list').innerHTML = filtered.map(h=>'<article class="handoff-item"><span class="priority">' + esc(h.priority || '—') + '</span><div class="handoff-detail"><small>' + esc(h.id) + '</small><h3>' + esc(h.objective) + '</h3><p>' + esc(h.from) + ' → ' + esc(h.to) + '</p></div>' + badge(h.status) + '</article>').join('') || empty('No handoffs in this view.','Choose another status to explore the work queue.');
    $('#coordination-date').textContent = 'Historical coordination record · ' + dateTime(snapshot?.coordination.updatedAt);
    $('#blocker-list').innerHTML = (snapshot?.coordination.blockers || []).map(b=>'<li>' + esc(b) + '</li>').join('') || '<li>No blockers in the coordination record.</li>';
  }
  function renderChart() {
    const buckets = snapshot?.activity || [];
    const ready = snapshot?.database.status === 'ready';
    const total = buckets.reduce((sum,b)=>sum+b.count,0);
    const max = Math.max(1,...buckets.map(b=>b.count));
    $('#activity-total').textContent = ready ? number(total) : '—';
    $('#activity-chart').setAttribute('aria-label',ready ? total + ' market events recorded in the last 24 hours' : 'Event history unavailable');
    $('#activity-chart').innerHTML = buckets.map(b=>'<div class="bar ' + (b.count ? '' : 'zero') + '" style="height:' + Math.max(1,b.count/max*100) + '%" title="' + esc(b.hour) + ': ' + number(b.count) + ' events"></div>').join('') + (total ? '' : '<div class="chart-empty"><span>' + (ready ? 'A quiet window.' : 'Waiting for the event store.') + '</span><small>' + (ready ? 'No market events recorded in the last 24 hours.' : 'Activity appears when local engine data is available.') + '</small></div>');
    $('#chart-caption').textContent = ready ? 'Source: saved market events · UTC hourly buckets · refreshed with workspace data' : 'No activity has been inferred or generated.';
    if(buckets.length) $('#chart-start').textContent = new Date(buckets[0].hour).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}) + ' UTC';
  }
  function render() {
    const s = snapshot;
    $('#metric-markets').textContent = number(s.summary.markets);
    $('#metric-events').textContent = number(s.summary.marketEvents);
    $('#metric-providers').textContent = s.database.status === 'ready' ? s.providers.filter(p=>p.status === 'connected').length + ' / ' + getProviders().length : '—';
    $('#metric-handoffs').textContent = number(s.handoffs.filter(h=>h.status !== 'complete').length);
    $('#nav-markets').textContent = number(s.summary.markets);
    $('#nav-work').textContent = number(s.handoffs.filter(h=>h.status !== 'complete').length);
    const repoNames = {runner_sports_demon:'Runner Demon',rsaa_verse:'RSAA Verse','runner_sports-site':'Runner Site'};
    const repoIcons = {runner_sports_demon:'D',rsaa_verse:'V','runner_sports-site':'S'};
    $('#pipeline').innerHTML = s.repositories.map(r=>'<div class="pipeline-row"><span class="repo-icon">' + esc(repoIcons[r.name] || 'R') + '</span><div class="repo-info"><b>' + esc(repoNames[r.name] || r.name) + '</b><small>' + esc(r.role) + '</small></div>' + badge(r.present ? 'present' : 'unknown',r.present ? 'PRESENT' : 'NOT FOUND') + '</div>').join('');
    renderChart(); renderProviders(); renderMarkets(); renderHandoffs();
    $('#window-rows').innerHTML = s.windows.length ? s.windows.map(w=>'<tr><td><b>' + esc(w.runnerEventId) + '</b><small>' + esc(titleCase(w.marketType)) + '</small></td><td>' + esc(w.selection || '—') + '</td><td class="price">' + decimal(w.runnerProjection) + '</td><td>' + decimal(w.marketLine) + '</td><td>' + decimal(w.edge) + '</td><td>' + badge(w.status) + '</td></tr>').join('') : '<tr><td colspan="6">' + empty('No saved decision windows.','Totals evaluations will appear here when recorded by the engine.') + '</td></tr>';
    $('#model-cards').innerHTML = s.models.map((m,i)=>'<article class="model-card"><div class="card-top"><span class="model-number">MODEL / 0' + (i+1) + '</span>' + badge(m.status) + '</div><h3>' + esc(titleCase(m.name)) + '</h3><p>' + esc(m.objective) + '</p>' + keyValue('Version',m.version) + keyValue('Sports',(m.sports || []).join(' · ')) + keyValue('Calibration',titleCase(m.calibration)) + '</article>').join('') || empty('No models registered.','The model registry has no readable entries.');
  }
  async function refresh(manual = false) {
    if(loading) return;
    loading = true; $('#refresh').disabled = true;
    try {
      const response = await fetch('/control/status',{signal:AbortSignal.timeout(20000),cache:'no-store'});
      if(!response.ok) throw new Error('Local status unavailable');
      snapshot = await response.json(); render();
      $('#connection').textContent = 'Local workspace connected'; $('#connection-dot').className = 'dot lime';
      $('#snapshot-note').textContent = snapshot.database.status === 'ready' ? 'Saved engine data' : snapshot.database.status === 'missing' ? 'Database not created yet' : 'Database unavailable';
      $('#last-read').textContent = 'Read at ' + new Date(snapshot.generatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
      $('#error-banner').hidden = snapshot.database.status !== 'unavailable';
      if(snapshot.database.status === 'unavailable') $('#error-banner').textContent = 'The local database could not be read. Repository records remain available. Check the database and sqlite3 installation.';
      if(manual) showToast('Workspace snapshot refreshed');
    } catch {
      $('#connection').textContent = 'Workspace unavailable'; $('#connection-dot').className = 'dot red';
      $('#error-banner').hidden = false;
      $('#error-banner').textContent = 'Could not refresh the local workspace. Displayed data may be stale. Ensure the dashboard server is running, then retry.';
    } finally { loading = false; $('#refresh').disabled = false; }
  }
  async function loadSchedule(event) {
    event.preventDefault();
    $('#schedule-load').disabled = true; $('#schedule-status').textContent = 'Requesting ESPN…';
    $('#schedule-games').innerHTML = empty('Loading the scoreboard…','Waiting for the selected league and date.');
    try {
      const url = '/schedule/' + encodeURIComponent($('#schedule-sport').value) + '?date=' + encodeURIComponent($('#schedule-date').value);
      const response = await fetch(url,{signal:AbortSignal.timeout(35000)});
      if(!response.ok) throw new Error('Schedule unavailable');
      const payload = await response.json(); const games = payload.data || [];
      $('#schedule-status').textContent = games.length + ' games · received ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      $('#schedule-games').innerHTML = games.map(g=>'<article class="game-card"><div class="game-top"><span>' + esc(g.league) + '</span>' + badge(g.status,titleCase(g.status)) + '</div><div class="team-row"><span>' + esc((g.awayRank ? '#' + g.awayRank + ' ' : '') + g.awayTeam) + '</span><strong>' + esc(g.awayScore ?? '—') + '</strong></div><div class="team-row"><span>' + esc((g.homeRank ? '#' + g.homeRank + ' ' : '') + g.homeTeam) + '</span><strong>' + esc(g.homeScore ?? '—') + '</strong></div><div class="game-foot">' + esc(g.statusDetail || dateTime(g.kickoff)) + '<br>' + esc(g.venue || 'Venue not provided') + '</div></article>').join('') || empty('No games on this slate.','ESPN returned no games for the selected league and date.');
    } catch {
      $('#schedule-status').textContent = 'Provider unavailable';
      $('#schedule-games').innerHTML = empty('The scoreboard is unavailable.','ESPN did not return a valid schedule. Try again in a moment.');
    } finally { $('#schedule-load').disabled = false; }
  }
  function showToast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false; toastTimer = setTimeout(()=>$('#toast').hidden = true,3000); }
  $('#refresh').addEventListener('click',()=>refresh(true));
  $('#pause').addEventListener('click',()=>{paused = !paused; $('#pause').setAttribute('aria-pressed',String(paused)); $('#pause-label').textContent = paused ? 'Resume refresh' : 'Pause refresh'; $('#pause-symbol').textContent = paused ? '▷' : 'Ⅱ'; showToast(paused ? 'Automatic refresh paused. Saved data remains visible.' : 'Automatic refresh resumed'); if(!paused) refresh();});
  $('#market-search').addEventListener('input',renderMarkets);
  $('#provider-filter').addEventListener('change',renderMarkets);
  $('#market-sort').addEventListener('change',renderMarkets);
  $('#handoff-filter').addEventListener('change',renderHandoffs);
  $('#schedule-form').addEventListener('submit',loadSchedule);
  $('#export').addEventListener('click',()=>{
    if(!snapshot) return showToast('Load a workspace snapshot before exporting.');
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = 'runner-status-' + snapshot.generatedAt.slice(0,10) + '.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); showToast('Status export downloaded');
  });
  const today = new Date(); $('#schedule-date').value = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  const updateClock = () => {$('#clock').textContent = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});};
  window.addEventListener('hashchange',navigate); navigate(); updateClock(); renderProviders(); refresh();
  setInterval(()=>{updateClock(); if(!paused && !document.hidden) refresh();},15000);
})();
`;
