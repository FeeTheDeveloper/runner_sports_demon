#!/usr/bin/env node
// Research-only WNBA score/clock analog. Requires a documented, locally supplied history.
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

const reportDir = new URL('../.runner/predictions/', import.meta.url);
const slateDir = new URL('../.runner/slates/', import.meta.url);
const TRAIN_START = 2021;
const TRAIN_END = 2024;
const HOLDOUT = 2025;
const MIN_TRAIN_GAMES = 300;
const MIN_HOLDOUT_GAMES = 100;
const MIN_ANALOG_GAMES = 80;
const TIME_WINDOW = 120;
const MARGIN_WINDOW = 5;

export function secondsRemaining(period, clock) {
  if (!Number.isInteger(period) || period < 1 || period > 4 || typeof clock !== 'string') return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (minutes > 10 || seconds > 59 || (minutes === 10 && seconds !== 0)) return null;
  return (4 - period) * 600 + minutes * 60 + seconds;
}

export function parseHistory(text) {
  const rows = [];
  const gameFacts = new Map();
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let row;
    try { row = JSON.parse(line); } catch { throw new Error(`Invalid JSON on history line ${index + 1}`); }
    if (typeof row.gameId !== 'string' || !row.gameId || !Number.isInteger(row.season) ||
        row.season < TRAIN_START || row.season > HOLDOUT ||
        secondsRemaining(row.period, row.clock) === null ||
        ![row.homeScore, row.awayScore, row.finalHomeScore, row.finalAwayScore]
          .every((value) => Number.isInteger(value) && value >= 0) ||
        row.finalHomeScore === row.finalAwayScore) {
      throw new Error(`Invalid WNBA state on history line ${index + 1}`);
    }
    const facts = `${row.season}:${row.finalHomeScore}:${row.finalAwayScore}`;
    if (gameFacts.has(row.gameId) && gameFacts.get(row.gameId) !== facts) {
      throw new Error(`Conflicting final score or season for game ${row.gameId}`);
    }
    gameFacts.set(row.gameId, facts);
    rows.push({
      gameId: row.gameId, season: row.season,
      seconds: secondsRemaining(row.period, row.clock),
      margin: row.homeScore - row.awayScore,
      homeWon: Number(row.finalHomeScore > row.finalAwayScore),
    });
  }
  return rows;
}

function nearestPerGame(rows, targetSeconds, seasonStart, seasonEnd) {
  const games = new Map();
  for (const row of rows) {
    if (row.season < seasonStart || row.season > seasonEnd ||
        Math.abs(row.seconds - targetSeconds) > TIME_WINDOW) continue;
    const prior = games.get(row.gameId);
    if (!prior || Math.abs(row.seconds - targetSeconds) < Math.abs(prior.seconds - targetSeconds)) {
      games.set(row.gameId, row);
    }
  }
  return [...games.values()];
}

export function analogProbability(rows, targetSeconds, margin) {
  const peers = nearestPerGame(rows, targetSeconds, TRAIN_START, TRAIN_END)
    .filter((row) => Math.abs(row.margin - margin) <= MARGIN_WINDOW);
  if (peers.length < MIN_ANALOG_GAMES) return { probability: null, uniqueGames: peers.length };
  return {
    probability: (peers.reduce((wins, row) => wins + row.homeWon, 0) + 1) / (peers.length + 2),
    uniqueGames: peers.length,
  };
}

export function validateHoldout(rows) {
  const trainGames = new Set(rows.filter((row) => row.season <= TRAIN_END).map((row) => row.gameId)).size;
  const holdoutStates = nearestPerGame(rows, 1200, HOLDOUT, HOLDOUT);
  const scored = holdoutStates.map((row) => ({ ...analogProbability(rows, row.seconds, row.margin), outcome: row.homeWon }))
    .filter((item) => item.probability !== null);
  const baseline = scored.length ? scored.reduce((sum, item) => sum + item.outcome, 0) / scored.length : null;
  const brier = scored.length ? scored.reduce((sum, item) => sum + (item.probability - item.outcome) ** 2, 0) / scored.length : null;
  const baselineBrier = scored.length ? scored.reduce((sum, item) => sum + (baseline - item.outcome) ** 2, 0) / scored.length : null;
  const logLoss = scored.length ? -scored.reduce((sum, item) => sum + item.outcome * Math.log(item.probability) +
    (1 - item.outcome) * Math.log(1 - item.probability), 0) / scored.length : null;
  return {
    status: trainGames >= MIN_TRAIN_GAMES && scored.length >= MIN_HOLDOUT_GAMES && brier < baselineBrier ? 'MEASURED_PASS' : 'INSUFFICIENT_OR_FAILED',
    trainUniqueGames: trainGames,
    holdoutSeason: HOLDOUT,
    holdoutUniqueGames: scored.length,
    minTrainGames: MIN_TRAIN_GAMES,
    minHoldoutGames: MIN_HOLDOUT_GAMES,
    brier, constantBaselineBrier: baselineBrier, logLoss,
    scope: 'Halftime winner only; playoff transfer and other live times are not validated',
  };
}

export function predictSlate(slate, rows, holdout) {
  const league = slate?.leagues?.find((item) => item.league === 'WNBA');
  if (!league || league.status !== 'CURRENT_RECEIPT') throw new Error('Current WNBA slate receipt unavailable');
  return league.games.filter((game) => game.phase === 'LIVE').map((game) => {
    const common = { sourceEventId: game.sourceEventId, away: game.away?.abbreviation,
      home: game.home?.abbreviation, awayScore: game.away?.score, homeScore: game.home?.score,
      statusDetail: game.statusDetail };
    const seconds = secondsRemaining(game.period, game.clock);
    if (holdout.status !== 'MEASURED_PASS' || seconds === null ||
        !Number.isInteger(game.home?.score) || !Number.isInteger(game.away?.score)) {
      return { ...common, status: 'SUPPRESSED', reason: 'holdout gate or live state unavailable' };
    }
    const analog = analogProbability(rows, seconds, game.home.score - game.away.score);
    return analog.probability === null ?
      { ...common, status: 'SUPPRESSED', analogUniqueGames: analog.uniqueGames, reason: 'insufficient comparable games' } :
      { ...common, status: 'EXPERIMENTAL', homeWinProbability: Number(analog.probability.toFixed(3)),
        awayWinProbability: Number((1 - analog.probability).toFixed(3)), analogUniqueGames: analog.uniqueGames,
        secondsRemaining: seconds };
  });
}

async function latestSlate() {
  const names = (await readdir(slateDir)).filter((name) => /^\d{4}-\d{2}-\d{2}-.*\.json$/.test(name)).sort();
  if (!names.length) throw new Error('No local slate receipt');
  return new URL(names.at(-1), slateDir);
}

function arg(name) { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; }

async function main() {
  const slatePath = arg('--slate') ? resolve(arg('--slate')) : await latestSlate();
  const slate = JSON.parse(await readFile(slatePath, 'utf8'));
  const league = slate?.leagues?.find((item) => item.league === 'WNBA');
  if (!league || league.status !== 'CURRENT_RECEIPT') throw new Error('Current WNBA slate receipt unavailable');
  const report = { model: 'wnba-score-clock-analog-v0', classification: 'RESEARCH_ONLY',
    generatedAt: new Date().toISOString(), slateReceiptAt: league.receiptAt,
    sourceUpdatedAt: null, date: slate.date, source: league.source ?? 'ESPN scoreboard',
    status: 'BLOCKED_DATA_RIGHTS_OR_HISTORY', history: null, holdout: null, predictions: [],
    limitations: ['Score and clock only', 'No team strength, injuries, possession, market prices or executable edge',
      'Playoff transfer and non-halftime calibration are unvalidated', 'Scoreboard receipt time is not source update time'] };
  const ageMs = Date.now() - Date.parse(league.receiptAt);
  report.slateFreshness = Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= 180000 ? 'CURRENT_RECEIPT' : 'STALE_OR_INVALID';
  const historyPath = arg('--history');
  const rightsPath = arg('--rights-record');
  if (historyPath && rightsPath) {
    const rights = JSON.parse(await readFile(resolve(rightsPath), 'utf8'));
    if (typeof rights.sourceId !== 'string' || !rights.sourceId ||
        typeof rights.evidence !== 'string' || !rights.evidence ||
        !['local_model_training', 'betting_analysis', 'commercial_derived_output']
          .every((use) => rights.permittedUses?.includes(use))) {
      throw new Error('Rights record must identify source/evidence and cover training, betting analysis, and commercial derived output');
    }
    const historyText = await readFile(resolve(historyPath), 'utf8');
    const rows = parseHistory(historyText);
    const holdout = validateHoldout(rows);
    report.history = { sourceId: rights.sourceId, file: basename(historyPath),
      sha256: createHash('sha256').update(historyText).digest('hex'), rawStates: rows.length,
      uniqueGames: new Set(rows.map((row) => row.gameId)).size,
      rightsEvidence: rights.evidence, rightsSelfAttested: true };
    report.holdout = holdout;
    report.status = report.slateFreshness !== 'CURRENT_RECEIPT' ? 'SUPPRESSED_STALE_SLATE' :
      holdout.status === 'MEASURED_PASS' ? 'EXPERIMENTAL' : 'SUPPRESSED_HOLDOUT';
    report.predictions = report.slateFreshness === 'CURRENT_RECEIPT' ? predictSlate(slate, rows, holdout) : [];
  }
  if (process.argv.includes('--write')) {
    await mkdir(reportDir, { recursive: true });
    const stamp = report.generatedAt.replace(/[-:.]/g, '');
    const target = new URL(`${report.date}-wnba-analog-${stamp}.json`, reportDir);
    await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    console.log(target.pathname);
  } else console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href === import.meta.url) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
