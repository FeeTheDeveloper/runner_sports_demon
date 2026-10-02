import { readFile, readdir, mkdir, open, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const defaultPacketDir = join(repoRoot, '.runner', 'research', 'bettingpros');
const allowedFeatures = new Set(['GAME_ODDS', 'PLAYER_PROP', 'ALT_LINE', 'SHARP_AI', 'SMART_MONEY', 'SYSTEMS']);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const isoUtc = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) && !Number.isNaN(Date.parse(value));

function exactKeys(value, keys, label, errors) {
  if (!isObject(value)) { errors.push(`${label} must be an object`); return false; }
  for (const key of keys) if (!own(value, key)) errors.push(`${label}.${key} is required`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) errors.push(`${label}.${key} is not allowed`);
  return true;
}

function httpsUrl(value, host) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    if ([...url.searchParams.keys()].some(key => /key|token|secret|signature|session|distinct_id/i.test(key))) return false;
    if (host && (url.search || url.hash || ![host, `www.${host}`].includes(url.hostname))) return false;
    return true;
  } catch { return false; }
}

export function validatePacket(packet) {
  const errors = [];
  if (!exactKeys(packet, ['schema_version', 'packet_id', 'captured_at', 'source', 'event', 'market', 'observation', 'comparison', 'rights'], 'packet', errors)) return errors;
  if (packet.schema_version !== 'runner.bettingpros-browser.v1') errors.push('schema_version must be runner.bettingpros-browser.v1');
  if (!/^bp-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(packet.packet_id ?? '')) errors.push('packet_id must be a safe bp- identifier');
  if (!isoUtc(packet.captured_at)) errors.push('captured_at must be an ISO UTC timestamp');

  if (exactKeys(packet.source, ['platform', 'url', 'capture_method', 'account_verified', 'quote_at', 'quote_time_basis'], 'source', errors)) {
    if (packet.source.platform !== 'BettingPros') errors.push('source.platform must be BettingPros');
    if (!httpsUrl(packet.source.url, 'bettingpros.com')) errors.push('source.url must be an HTTPS BettingPros URL');
    if (packet.source.capture_method !== 'interactive_browser') errors.push('source.capture_method must be interactive_browser');
    if (packet.source.account_verified !== true) errors.push('source.account_verified must be true');
    if (!['SOURCE_DISPLAYED', 'NOT_SHOWN'].includes(packet.source.quote_time_basis)) errors.push('source.quote_time_basis is invalid');
    if (packet.source.quote_time_basis === 'NOT_SHOWN' && packet.source.quote_at !== null) errors.push('quote_at must be null when source time is not shown');
    if (packet.source.quote_time_basis === 'SOURCE_DISPLAYED' && !isoUtc(packet.source.quote_at)) errors.push('source displayed quote_at must be ISO UTC');
    if (isoUtc(packet.source.quote_at) && isoUtc(packet.captured_at) && Date.parse(packet.source.quote_at) > Date.parse(packet.captured_at)) errors.push('quote_at cannot be after captured_at');
  }

  if (exactKeys(packet.event, ['kind', 'runner_event_id', 'label', 'scheduled_start_utc', 'player'], 'event', errors)) {
    if (!['EVENT', 'PLAYER'].includes(packet.event.kind)) errors.push('event.kind must be EVENT or PLAYER');
    if (!/^RUNNER:[A-Z0-9]+:\d{4}-\d{2}-\d{2}:[A-Z0-9]+:[A-Z0-9]+$/.test(packet.event.runner_event_id ?? '')) errors.push('event.runner_event_id must be canonical and unambiguous');
    if (!nonempty(packet.event.label)) errors.push('event.label is required');
    if (!isoUtc(packet.event.scheduled_start_utc)) errors.push('event.scheduled_start_utc must be ISO UTC');
    if (packet.event.kind === 'EVENT' && packet.event.player !== null) errors.push('event.player must be null for EVENT');
    if (packet.event.kind === 'PLAYER') {
      if (exactKeys(packet.event.player, ['name', 'team', 'profile_url'], 'event.player', errors)) {
        if (!nonempty(packet.event.player.name) || !nonempty(packet.event.player.team)) errors.push('player name and team are required');
        if (!httpsUrl(packet.event.player.profile_url, 'bettingpros.com')) errors.push('player profile_url must be an HTTPS BettingPros URL');
      }
    }
  }

  if (exactKeys(packet.market, ['type', 'period', 'selection', 'line', 'settlement'], 'market', errors)) {
    for (const key of ['type', 'period', 'selection', 'settlement']) if (!nonempty(packet.market[key])) errors.push(`market.${key} is required`);
    if (packet.market.line !== null && (typeof packet.market.line !== 'number' || !Number.isFinite(packet.market.line))) errors.push('market.line must be a finite number or null');
  }

  if (exactKeys(packet.observation, ['feature', 'feature_state', 'finding', 'uncertainty', 'quote_status', 'attribution', 'runner_model_output'], 'observation', errors)) {
    if (!allowedFeatures.has(packet.observation.feature)) errors.push('observation.feature is invalid');
    if (!['ACCESSIBLE', 'LOCKED', 'UNVERIFIED'].includes(packet.observation.feature_state)) errors.push('observation.feature_state is invalid');
    if (!nonempty(packet.observation.finding) || packet.observation.finding.length > 500) errors.push('observation.finding must be 1-500 characters');
    if (!nonempty(packet.observation.uncertainty) || packet.observation.uncertainty.length > 500) errors.push('observation.uncertainty must be 1-500 characters');
    if (packet.observation.quote_status !== 'UNVERIFIED') errors.push('browser observation cannot assert a fresh or executable quote');
    if (packet.observation.attribution !== 'BETTINGPROS' || packet.observation.runner_model_output !== false) errors.push('BettingPros analysis cannot be labelled Runner model output');
  }

  if (exactKeys(packet.comparison, ['status', 'sources'], 'comparison', errors)) {
    if (!['VERIFIED', 'UNAVAILABLE'].includes(packet.comparison.status)) errors.push('comparison.status is invalid');
    if (!Array.isArray(packet.comparison.sources)) errors.push('comparison.sources must be an array');
    else {
      if (packet.comparison.status === 'VERIFIED' && packet.comparison.sources.length === 0) errors.push('verified comparison requires an independent source');
      if (packet.comparison.status === 'UNAVAILABLE' && packet.comparison.sources.length !== 0) errors.push('unavailable comparison cannot list verified sources');
      for (const [index, item] of packet.comparison.sources.entries()) {
        if (exactKeys(item, ['provider', 'url', 'observed_at'], `comparison.sources[${index}]`, errors)) {
          if (!['KALSHI', 'ODDS_API', 'ESPN', 'OFFICIAL'].includes(item.provider)) errors.push(`comparison.sources[${index}].provider is invalid`);
          if (!httpsUrl(item.url) || new URL(item.url).hostname.endsWith('bettingpros.com')) errors.push(`comparison.sources[${index}].url must be independent HTTPS`);
          if (!isoUtc(item.observed_at)) errors.push(`comparison.sources[${index}].observed_at must be ISO UTC`);
        }
      }
    }
  }

  if (exactKeys(packet.rights, ['class', 'model_input_approved', 'publishable'], 'rights', errors)) {
    if (packet.rights.class !== 'REFERENCE_ONLY' || packet.rights.model_input_approved !== false || packet.rights.publishable !== false) errors.push('BettingPros packet rights must remain reference-only, not model input, not publishable');
  }
  return errors;
}

async function readPacket(path) {
  const bytes = await readFile(path);
  if (bytes.length > 65536) throw new Error('packet exceeds 64 KiB');
  const packet = JSON.parse(bytes.toString('utf8'));
  const errors = validatePacket(packet);
  if (errors.length) throw new Error(errors.join('; '));
  return packet;
}

export async function validateDirectory(directory = defaultPacketDir) {
  const names = await readdir(directory).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error));
  const ids = new Set();
  for (const name of names.filter(name => name.endsWith('.json')).sort()) {
    const packet = await readPacket(join(directory, name));
    if (ids.has(packet.packet_id)) throw new Error(`duplicate packet_id: ${packet.packet_id}`);
    ids.add(packet.packet_id);
  }
  return ids.size;
}

export async function savePacket(input, directory = defaultPacketDir) {
  const packet = await readPacket(input);
  await mkdir(directory, { recursive: true });
  const names = await readdir(directory);
  for (const name of names.filter(name => name.endsWith('.json'))) {
    if ((await readPacket(join(directory, name))).packet_id === packet.packet_id) throw new Error(`duplicate packet_id: ${packet.packet_id}`);
  }
  const target = join(directory, `${packet.packet_id}.json`);
  const handle = await open(target, 'wx');
  try { await handle.writeFile(JSON.stringify(packet, null, 2) + '\n'); }
  catch (error) { await handle.close(); await unlink(target); throw error; }
  await handle.close();
  return target;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, path] = process.argv.slice(2);
  try {
    if (command === 'validate' && path) { await readPacket(path); console.log('VALID'); }
    else if (command === 'validate-dir') console.log(`VALID ${await validateDirectory(path || defaultPacketDir)} packets`);
    else if (command === 'save' && path) console.log(`SAVED ${await savePacket(path)}`);
    else throw new Error('usage: node scripts/validate-bettingpros-packet.mjs validate <path> | save <path> | validate-dir [directory]');
  } catch (error) { console.error(`INVALID ${error.message}`); process.exitCode = 1; }
}
