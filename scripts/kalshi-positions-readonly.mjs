#!/usr/bin/env node
// Authenticated Kalshi position inventory. GET only; no order or trade methods.
// Credentials must come from the existing untracked Runner environment contract.

import { constants, createPrivateKey, sign } from 'node:crypto';
import { mkdir, open } from 'node:fs/promises';

const base = 'https://external-api.kalshi.com';
const reportDir = new URL('../.runner/positions/', import.meta.url);

export function authHeaders(path, keyId, privateKeyPem, timestamp = Date.now().toString()) {
  if (!path.startsWith('/trade-api/v2/') || path.includes('?')) throw new Error('sign a fixed Kalshi path without a query');
  const key = createPrivateKey(privateKeyPem);
  const input = Buffer.from(`${timestamp}GET${path}`);
  const signature = key.asymmetricKeyType === 'ed25519' ? sign(null, input, key) :
    key.asymmetricKeyType === 'rsa' ? sign('sha256', input, {
      key, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
    }) : null;
  if (!signature) throw new Error('Kalshi key must be RSA or Ed25519');
  return {
    'KALSHI-ACCESS-KEY': keyId,
    'KALSHI-ACCESS-TIMESTAMP': timestamp,
    'KALSHI-ACCESS-SIGNATURE': signature.toString('base64'),
  };
}

async function get(path, params, keyId, privateKeyPem) {
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, value);
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(path, keyId, privateKeyPem),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Kalshi read returned HTTP ${response.status}`);
  return response.json();
}

export async function readOpenPositions(keyId, privateKeyPem) {
  const positions = [];
  const cursors = new Set();
  let cursor = '';
  for (let page = 0; page < 100; page += 1) {
    const body = await get('/trade-api/v2/portfolio/positions',
      { count_filter: 'position', limit: '1000', cursor }, keyId, privateKeyPem);
    if (!Array.isArray(body.market_positions) || typeof body.cursor !== 'string') {
      throw new Error('Kalshi positions response lacks market_positions or cursor');
    }
    for (const item of body.market_positions) {
      if (typeof item.ticker !== 'string' || typeof item.position_fp !== 'string') {
        throw new Error('Kalshi position row is malformed');
      }
      if (Number(item.position_fp) !== 0) positions.push({
        ticker: item.ticker,
        exchangeIndex: item.exchange_index ?? null,
        signedContracts: item.position_fp,
        marketExposureDollars: item.market_exposure_dollars ?? null,
        feesPaidDollars: item.fees_paid_dollars ?? null,
        positionUpdatedAt: item.last_updated_ts ?? null,
        decision: 'UNKNOWN',
        decisionReason: 'No validated Runner fair value, executable exit quote, and lot cost basis',
      });
    }
    cursor = body.cursor;
    if (!cursor) return positions;
    if (cursors.has(cursor)) throw new Error('Kalshi repeated a pagination cursor');
    cursors.add(cursor);
  }
  throw new Error('Kalshi position pagination exceeded 100 pages');
}

async function main() {
  const keyId = process.env.KALSHI_API_KEY_ID;
  const encodedKey = process.env.KALSHI_PRIVATE_KEY_BASE64;
  if (!keyId || !encodedKey) {
    console.log(JSON.stringify({ status: 'NOT_CONFIGURED', source: 'Kalshi portfolio API',
      required: ['KALSHI_API_KEY_ID', 'KALSHI_PRIVATE_KEY_BASE64'], positions: null }));
    return;
  }
  const privateKeyPem = Buffer.from(encodedKey, 'base64').toString('utf8');
  const report = {
    schema: 'runner.private-kalshi-positions.v1',
    status: 'CURRENT_RECEIPT',
    source: 'Kalshi authenticated portfolio API',
    receivedAt: new Date().toISOString(),
    private: true,
    positions: await readOpenPositions(keyId, privateKeyPem),
  };
  if (process.argv.includes('--write')) {
    await mkdir(reportDir, { recursive: true });
    const stamp = report.receivedAt.replace(/[-:.]/g, '');
    const target = new URL(`${stamp}.json`, reportDir);
    const handle = await open(target, 'wx', 0o600);
    try { await handle.writeFile(`${JSON.stringify(report, null, 2)}\n`); }
    finally { await handle.close(); }
    console.log(`Saved private Kalshi position receipt at ${target.pathname.split('/').at(-1)}`);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
}

if (process.argv[1] && new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href === import.meta.url) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
