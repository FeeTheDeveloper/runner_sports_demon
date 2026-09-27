#!/usr/bin/env node
// Local research receipts for the complete NFL, WNBA, and MLB date slates.
// ESPN retrieval time is not the league's last update time. No trading actions.

import { createHash } from 'node:crypto';
import { mkdir, open, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const feeds = Object.freeze({
  NFL: 'football/nfl',
  WNBA: 'basketball/wnba',
  MLB: 'baseball/mlb',
});
const root = new URL('../.runner/slates/', import.meta.url);

export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error('date must be a real YYYY-MM-DD calendar date');
  }
  return value;
}

export function normalizeEvent(event, league) {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((team) => team.homeAway === 'home');
  const away = competitors.find((team) => team.homeAway === 'away');
  if (!event?.id || !home?.team?.abbreviation || !away?.team?.abbreviation) return null;
  const status = event.status?.type?.name ?? 'UNKNOWN';
  const phase = status === 'STATUS_FINAL' ? 'FINAL' :
    ['STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_END_PERIOD'].includes(status) ? 'LIVE' :
    ['STATUS_RAIN_DELAY', 'STATUS_DELAYED'].includes(status) ? 'DELAYED' :
    ['STATUS_POSTPONED', 'STATUS_CANCELED'].includes(status) ? 'TERMINAL_OTHER' :
    status === 'STATUS_SCHEDULED' ? 'SCHEDULED' : 'UNKNOWN';
  const score = (team) => /^\d+$/.test(String(team.score)) ? Number(team.score) : null;
  return {
    league,
    source: 'ESPN scoreboard',
    sourceEventId: String(event.id),
    kickoff: event.date ?? null,
    away: { name: away.team.displayName ?? null, abbreviation: away.team.abbreviation, score: score(away) },
    home: { name: home.team.displayName ?? null, abbreviation: home.team.abbreviation, score: score(home) },
    status,
    phase,
    statusDetail: event.status?.type?.detail ?? null,
    period: Number.isInteger(event.status?.period) ? event.status.period : null,
    clock: event.status?.displayClock ?? null,
    sourceUpdatedAt: null,
  };
}

async function fetchLeague(league, date) {
  const ymd = date.replaceAll('-', '');
  const url = `https://site.api.espn.com/apis/site/v2/sports/${feeds[league]}/scoreboard?dates=${ymd}&limit=200`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Runner local research/0.1' } });
  if (!response.ok) throw new Error(`ESPN ${league} returned HTTP ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body.events)) throw new Error(`ESPN ${league} events missing`);
  const games = body.events.map((event) => normalizeEvent(event, league));
  if (games.some((game) => !game)) throw new Error(`ESPN ${league} included an unmapped game`);
  return { league, status: 'CURRENT_RECEIPT', receiptAt: new Date().toISOString(), sourceUpdatedAt: null, count: games.length, games };
}

export async function snapshot(date) {
  const responses = await Promise.allSettled(Object.keys(feeds).map((league) => fetchLeague(league, date)));
  const leagues = responses.map((result, index) => result.status === 'fulfilled' ? result.value : {
    league: Object.keys(feeds)[index], status: 'UNKNOWN', receiptAt: null, sourceUpdatedAt: null,
    count: null, games: [], error: result.reason instanceof Error ? result.reason.message : 'feed unavailable',
  });
  return {
    schema: 'runner.experimental-live-slate.v1',
    date,
    generatedAt: new Date().toISOString(),
    classification: 'SCOREBOARD_FACTS_ONLY_NO_MODEL_OR_MARKET_EDGE',
    leagues,
    coverage: Object.fromEntries(leagues.map((feed) => [feed.league, {
      status: feed.status, scheduledGames: feed.count,
      live: feed.games.filter((game) => game.phase === 'LIVE').length,
      final: feed.games.filter((game) => game.phase === 'FINAL').length,
      delayed: feed.games.filter((game) => game.phase === 'DELAYED').length,
    }])),
    limitations: ['Retrieval freshness is not ESPN update freshness', 'No authenticated odds or Kalshi positions', 'No independent Runner model output', 'No live broadcast or transcript ingestion'],
  };
}

function fingerprint(report) {
  return createHash('sha256').update(JSON.stringify(report.leagues.map((feed) => ({
    league: feed.league, status: feed.status,
    games: feed.games.map(({ sourceEventId, status, statusDetail, period, clock, away, home }) =>
      ({ sourceEventId, status, statusDetail, period, clock, awayScore: away.score, homeScore: home.score })),
  })))).digest('hex');
}

async function lastFingerprint(date) {
  try {
    const files = (await readdir(root)).filter((name) => name.startsWith(`${date}-`) && name.endsWith('.json')).sort();
    if (!files.length) return null;
    return fingerprint(JSON.parse(await readFile(new URL(files.at(-1), root), 'utf8')));
  } catch { return null; }
}

async function writeReport(report) {
  await mkdir(root, { recursive: true });
  if (await lastFingerprint(report.date) === fingerprint(report)) return null;
  const stamp = report.generatedAt.replace(/[-:.]/g, '').replace('Z', 'Z');
  const path = new URL(`${report.date}-${stamp}.json`, root);
  const handle = await open(path, 'wx');
  try { await handle.writeFile(`${JSON.stringify(report, null, 2)}\n`); }
  finally { await handle.close(); }
  return path;
}

async function main() {
  const args = process.argv.slice(2);
  const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
  const date = parseDate(value('--date') ?? new Date().toISOString().slice(0, 10));
  const watch = args.includes('--watch');
  const write = watch || args.includes('--write');
  const interval = Number(value('--interval-seconds') ?? 120);
  if (!Number.isInteger(interval) || interval < 60) throw new Error('interval must be at least 60 seconds');
  do {
    const report = await snapshot(date);
    const path = write ? await writeReport(report) : null;
    console.log(path ? join('.', '.runner', 'slates', path.pathname.split('/').at(-1)) :
      path === null && write ? `${report.generatedAt} no change` : JSON.stringify(report, null, 2));
    if (!watch) break;
    if (report.leagues.every((feed) => feed.status === 'CURRENT_RECEIPT' && feed.count > 0 &&
      feed.games.every((game) => ['FINAL', 'TERMINAL_OTHER'].includes(game.phase)))) break;
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));
  } while (true);
}

if (process.argv[1] && new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href === import.meta.url) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
