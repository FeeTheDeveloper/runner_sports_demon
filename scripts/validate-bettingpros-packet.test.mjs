import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validatePacket, validateDirectory, savePacket } from './validate-bettingpros-packet.mjs';

const packet = () => ({
  schema_version: 'runner.bettingpros-browser.v1',
  packet_id: 'bp-synthetic-example-1',
  captured_at: '2026-10-02T18:00:00Z',
  source: { platform: 'BettingPros', url: 'https://www.bettingpros.com/nfl/props/', capture_method: 'interactive_browser', account_verified: true, quote_at: null, quote_time_basis: 'NOT_SHOWN' },
  event: { kind: 'PLAYER', runner_event_id: 'RUNNER:NFL:2026-10-04:AAA:BBB', label: 'SYNTHETIC AAA at BBB', scheduled_start_utc: '2026-10-04T17:00:00Z', player: { name: 'Synthetic Player', team: 'AAA', profile_url: 'https://www.bettingpros.com/nfl/props/' } },
  market: { type: 'receptions', period: 'FULL_GAME', selection: 'OVER', line: 4.5, settlement: 'UNVERIFIED' },
  observation: { feature: 'ALT_LINE', feature_state: 'ACCESSIBLE', finding: 'Synthetic alternate-line control was visible.', uncertainty: 'No source quote time.', quote_status: 'UNVERIFIED', attribution: 'BETTINGPROS', runner_model_output: false },
  comparison: { status: 'UNAVAILABLE', sources: [] },
  rights: { class: 'REFERENCE_ONLY', model_input_approved: false, publishable: false },
});

test('valid focused packet and fail-closed provenance, identity, time, and rights', () => {
  const valid = packet();
  assert.deepEqual(validatePacket(valid), []);
  const cases = [
    [p => { p.source.url = 'https://example.com/props'; }, 'source.url'],
    [p => { p.source.url = 'https://www.bettingpros.com/nfl/props/?token=private'; }, 'source.url'],
    [p => { p.event.runner_event_id = 'ATL at NO'; }, 'canonical'],
    [p => { p.market.period = ''; }, 'market.period'],
    [p => { p.source.quote_time_basis = 'SOURCE_DISPLAYED'; }, 'quote_at'],
    [p => { p.observation.quote_status = 'CURRENT'; }, 'fresh'],
    [p => { p.observation.runner_model_output = true; }, 'Runner model'],
    [p => { p.rights.publishable = true; }, 'reference-only'],
    [p => { p.comparison.status = 'VERIFIED'; }, 'independent source'],
    [p => { p.model_probability = 0.7; }, 'not allowed'],
  ];
  for (const [mutate, expected] of cases) {
    const invalid = packet();
    mutate(invalid);
    assert.match(validatePacket(invalid).join('; '), new RegExp(expected), expected);
  }
});

test('save is exclusive and directory validation detects duplicate packet ids', async () => {
  const root = await mkdtemp(join(tmpdir(), 'runner-bp-test-'));
  try {
    const input = join(root, 'input.json');
    const output = join(root, 'saved');
    await writeFile(input, JSON.stringify(packet()));
    const saved = await savePacket(input, output);
    assert.equal(saved, join(output, 'bp-synthetic-example-1.json'));
    assert.equal(await validateDirectory(output), 1);
    await assert.rejects(() => savePacket(input, output), /duplicate packet_id/);
    await writeFile(join(output, 'copy.json'), JSON.stringify(packet()));
    await assert.rejects(() => validateDirectory(output), /duplicate packet_id/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
