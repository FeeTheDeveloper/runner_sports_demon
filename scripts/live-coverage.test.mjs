import test from 'node:test';
import assert from 'node:assert/strict';
import { constants, generateKeyPairSync, verify } from 'node:crypto';
import { chicagoDate, normalizeEvent, parseDate } from './live-slate.mjs';
import { authHeaders, readOpenPositions } from './kalshi-positions-readonly.mjs';
import { parseCaptions, prepareGeminiInput, safeSourceUrl } from './transcript-intake.mjs';

test('slate keeps delayed games and fails closed on unmapped teams', () => {
  const event = {
    id: '123', date: '2026-09-27T18:00Z',
    status: { type: { name: 'STATUS_RAIN_DELAY', detail: 'Rain Delay' }, period: 2, displayClock: '0:00' },
    competitions: [{ competitors: [
      { homeAway: 'away', score: '3', team: { abbreviation: 'BAL', displayName: 'Baltimore Orioles' } },
      { homeAway: 'home', score: '4', team: { abbreviation: 'NYY', displayName: 'New York Yankees' } },
    ] }],
  };
  const game = normalizeEvent(event, 'MLB');
  assert.equal(game.phase, 'DELAYED');
  assert.equal(game.away.score, 3);
  assert.equal(game.home.score, 4);
  assert.equal(game.gameState.outs, null);
  assert.deepEqual(game.gameState.bases, { first: false, second: false, third: false });
  assert.equal(normalizeEvent({ ...event, competitions: [] }, 'MLB'), null);
  assert.throws(() => parseDate('2026-09-31'));
  assert.equal(chicagoDate(new Date('2026-09-28T02:00:00Z')), '2026-09-27');
});

test('Kalshi read-only signature signs path without query', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const timestamp = '1234567890000';
  const headers = authHeaders('/trade-api/v2/portfolio/positions', 'synthetic-id',
    privateKey.export({ type: 'pkcs1', format: 'pem' }), timestamp);
  assert.equal(headers['KALSHI-ACCESS-KEY'], 'synthetic-id');
  assert.equal(verify('sha256', Buffer.from(`${timestamp}GET/trade-api/v2/portfolio/positions`),
    { key: publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: constants.RSA_PSS_SALTLEN_DIGEST },
    Buffer.from(headers['KALSHI-ACCESS-SIGNATURE'], 'base64')), true);
  assert.throws(() => authHeaders('/trade-api/v2/portfolio/positions?cursor=x', 'id', 'bad'));
});

test('Kalshi position pagination reads only GET and rejects repeated cursors', async () => {
  const { privateKey } = generateKeyPairSync('ed25519');
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), method: options.method });
    return { ok: true, json: async () => calls.length === 1 ? {
      market_positions: [{ ticker: 'SYNTHETIC', position_fp: '2.00' }], cursor: 'next',
    } : { market_positions: [], cursor: '' } };
  };
  try {
    const positions = await readOpenPositions('synthetic-id', pem);
    assert.equal(positions.length, 1);
    assert.equal(positions[0].decision, 'UNKNOWN');
    assert.deepEqual(calls.map((call) => call.method), ['GET', 'GET']);
    assert.match(calls[1].url, /cursor=next/);
  } finally { globalThis.fetch = original; }
});

test('caption intake preserves timing and strips URL tokens before Gemini preparation', () => {
  const segments = parseCaptions('WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nThe home team scored.\n', '.vtt');
  assert.equal(segments.length, 1);
  assert.equal(segments[0].start, '00:00:01.000');
  const sourceUrl = safeSourceUrl('https://www.youtube.com/watch?v=abcdefghijk&secret=do-not-share');
  assert.equal(sourceUrl, 'https://www.youtube.com/watch?v=abcdefghijk');
  const prepared = prepareGeminiInput({ sourceUrl, eventId: null, capturedAt: '2026-09-27T00:00:00Z', segments });
  assert.match(prepared.text, /UNMAPPED/);
  assert.doesNotMatch(prepared.text, /do-not-share/);
});
