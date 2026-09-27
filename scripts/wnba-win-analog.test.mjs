import test from 'node:test';
import assert from 'node:assert/strict';
import { analogProbability, parseHistory, predictSlate, secondsRemaining, validateHoldout } from './wnba-win-analog.mjs';

function state(gameId, season, margin) {
  return { gameId, season, period: 3, clock: '10:00', homeScore: 50 + margin,
    awayScore: 50, finalHomeScore: margin >= 0 ? 90 : 80,
    finalAwayScore: margin >= 0 ? 80 : 90 };
}

test('WNBA clock uses ten-minute regulation quarters and suppresses overtime', () => {
  assert.equal(secondsRemaining(3, '10:00'), 1200);
  assert.equal(secondsRemaining(4, '0:00'), 0);
  assert.equal(secondsRemaining(5, '5:00'), null);
  assert.equal(secondsRemaining(1, '12:00'), null);
});

test('history parser rejects invalid scores and keeps one independent game per analog', () => {
  assert.throws(() => parseHistory(JSON.stringify({ ...state('x', 2024, 1), awayScore: -1 })), /Invalid WNBA state/);
  const one = parseHistory([state('same', 2024, 3), state('same', 2024, 3)]
    .map((row) => JSON.stringify(row)).join('\n'));
  assert.equal(analogProbability(one, 1200, 3).uniqueGames, 1);
});

test('WNBA holdout is chronological and blocks insufficient independent games', () => {
  const small = parseHistory(JSON.stringify(state('one', 2024, 1)));
  assert.equal(validateHoldout(small).status, 'INSUFFICIENT_OR_FAILED');
  const all = [];
  for (let i = 0; i < 400; i += 1) all.push(state(`train-${i}`, 2021 + i % 4, i % 2 ? 4 : -4));
  for (let i = 0; i < 120; i += 1) all.push(state(`test-${i}`, 2025, i % 2 ? 4 : -4));
  const rows = parseHistory(all.map((row) => JSON.stringify(row)).join('\n'));
  const holdout = validateHoldout(rows);
  assert.equal(holdout.trainUniqueGames, 400);
  assert.equal(holdout.holdoutUniqueGames, 120);
  assert.equal(holdout.status, 'MEASURED_PASS');
  const slate = { leagues: [{ league: 'WNBA', status: 'CURRENT_RECEIPT', games: [{
    sourceEventId: 'synthetic', phase: 'LIVE', period: 3, clock: '10:00',
    away: { abbreviation: 'AWY', score: 50 }, home: { abbreviation: 'HME', score: 54 },
  }] }] };
  const prediction = predictSlate(slate, rows, holdout)[0];
  assert.equal(prediction.status, 'EXPERIMENTAL');
  assert.ok(prediction.homeWinProbability > 0.9);
  assert.equal(prediction.analogUniqueGames, 200);
  assert.equal(predictSlate(slate, rows, { status: 'INSUFFICIENT_OR_FAILED' })[0].status, 'SUPPRESSED');
});
