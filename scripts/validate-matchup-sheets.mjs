#!/usr/bin/env node
// Validates stored third-party matchup sheets against contracts/matchup-sheet.schema.json.
// These sheets are reference material only. This validator also enforces that
// nothing in the store claims Runner authority or model-input approval.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = 'data/raw/nfl/matchup-sheets';
const SCHEMA = 'contracts/matchup-sheet.schema.json';

if (!existsSync(ROOT)) {
  console.log('No matchup-sheet store present; nothing to validate.');
  process.exit(0);
}

const walk = dir => readdirSync(dir).flatMap(entry => {
  const p = join(dir, entry);
  return statSync(p).isDirectory() ? walk(p) : (p.endsWith('.json') ? [p] : []);
});

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(readFileSync(SCHEMA, 'utf8')));

const files = walk(ROOT);
let failures = 0;
const seenEvents = new Map();

for (const file of files) {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  const problems = [];

  if (!validate(doc)) {
    for (const e of validate.errors) problems.push(`schema ${e.instancePath || '/'} ${e.message}`);
  }

  // Authority guard: reference material must never claim Runner standing.
  if (doc.authority?.level !== 'REFERENCE_ONLY') problems.push('authority.level must be REFERENCE_ONLY');
  if (doc.authority?.model_input_approved !== false) problems.push('model_input_approved must be false');
  if (doc.authority?.publishable !== false) problems.push('publishable must be false');
  if (!doc.source?.author) problems.push('source.author is required for third-party material');

  // Canonical id guard: stored abbreviations must match the engine event id.
  if (doc.runner_event_id) {
    const tail = doc.runner_event_id.split(':').slice(-2);
    const stored = Object.values(doc.teams).map(t => t.abbreviation);
    for (const abbr of tail) {
      if (!stored.includes(abbr)) problems.push(`abbreviation ${abbr} from ${doc.runner_event_id} not present in teams`);
    }
    const prior = seenEvents.get(doc.runner_event_id);
    if (prior) problems.push(`duplicate runner_event_id, also in ${prior}`);
    seenEvents.set(doc.runner_event_id, file);
  } else if (doc.runner_event_state !== 'NO_ENGINE_EVENT') {
    problems.push('missing runner_event_id requires runner_event_state NO_ENGINE_EVENT');
  }

  if (problems.length) {
    failures++;
    console.error(`FAIL ${file}`);
    for (const p of problems) console.error(`  - ${p}`);
  }
}

const unmatched = files
  .map(f => JSON.parse(readFileSync(f, 'utf8')))
  .filter(d => d.runner_event_state === 'NO_ENGINE_EVENT')
  .map(d => d.matchup_id);

console.log(`Validated ${files.length} matchup sheets; ${failures} failed.`);
if (unmatched.length) console.log(`Unmatched to an engine event (expected, flagged): ${unmatched.join(', ')}`);
process.exit(failures === 0 ? 0 : 1);
