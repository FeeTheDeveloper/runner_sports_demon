create table if not exists games (
  id text primary key,
  sport text not null,
  league text,
  home_team text,
  away_team text,
  starts_at text,
  status text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists provider_mappings (
  id integer primary key autoincrement,
  runner_event_id text not null,
  provider text not null,
  provider_event_id text not null,
  provider_market_id text,
  mapping_method text not null check (mapping_method in ('manual','exact','fuzzy','title')),
  confidence real not null check (confidence between 0 and 1),
  verified integer not null default 0,
  created_at text not null default (datetime('now'))
);

create unique index if not exists provider_mappings_unique_idx
  on provider_mappings(provider, provider_event_id, coalesce(provider_market_id, ''));

create table if not exists markets (
  id text primary key,
  provider text not null,
  external_id text not null,
  event_id text,
  runner_event_id text,
  title text not null,
  category text,
  sport text,
  contract_side text,
  status text not null,
  raw_json text not null,
  source_timestamp text not null,
  received_timestamp text not null,
  processed_timestamp text not null,
  updated_at text not null,
  unique(provider, external_id)
);

create table if not exists market_prices (
  id integer primary key autoincrement,
  market_id text not null references markets(id) on delete cascade,
  yes_price real,
  no_price real,
  bid real,
  ask real,
  spread real,
  last_traded_price real,
  volume real,
  open_interest real,
  liquidity real,
  source_timestamp text not null,
  received_timestamp text not null,
  processed_timestamp text not null,
  change_hash text not null,
  unique(market_id, change_hash)
);

create table if not exists market_events (
  id integer primary key autoincrement,
  market_id text not null references markets(id) on delete cascade,
  provider text not null,
  event_type text not null,
  change_hash text not null,
  payload_json text not null,
  source_timestamp text not null,
  received_timestamp text not null,
  processed_timestamp text not null,
  unique(market_id, event_type, change_hash)
);

create table if not exists market_orderbooks (
  id integer primary key autoincrement,
  market_id text not null references markets(id) on delete cascade,
  bids_json text,
  asks_json text,
  depth real,
  source_timestamp text not null,
  received_timestamp text not null,
  processed_timestamp text not null
);

create table if not exists provider_health (
  provider text primary key,
  connected integer not null,
  last_message_at text,
  last_error text,
  reconnect_attempts integer not null,
  event_count integer not null,
  latency_ms real,
  updated_at text not null
);

create table if not exists model_predictions (
  id integer primary key autoincrement,
  market_id text not null,
  fair_probability real not null check(fair_probability between 0 and 1),
  model_name text not null,
  confidence_score real not null check(confidence_score between 0 and 100),
  source_timestamp text not null,
  received_timestamp text not null,
  processed_timestamp text not null
);

create table if not exists signals (
  id integer primary key autoincrement,
  market_id text not null,
  signal_type text not null,
  signal_strength real not null,
  payload_json text not null,
  source_timestamp text not null,
  received_timestamp text not null,
  processed_timestamp text not null
);

create table if not exists alerts (
  id integer primary key autoincrement,
  signal_id integer references signals(id),
  classification text not null,
  message text not null,
  destination text not null,
  sent_at text
);

create table if not exists edge_events (
  id integer primary key autoincrement,
  market_id text not null,
  fair_probability real not null,
  market_probability real not null,
  edge real not null,
  confidence_score real not null,
  source_timestamp text not null,
  received_timestamp text not null,
  processed_timestamp text not null
);

create table if not exists market_lag_events (
  id integer primary key autoincrement,
  market_id text not null,
  game_state_change_at text not null,
  model_reprice_at text,
  market_reprice_at text,
  lag_ms integer,
  maximum_edge real,
  edge_duration_ms integer,
  payload_json text not null
);

create table if not exists replay_sessions (
  id integer primary key autoincrement,
  runner_event_id text not null,
  speed text not null,
  started_at text not null,
  completed_at text
);

create table if not exists backtest_results (
  id integer primary key autoincrement,
  signal_type text not null,
  payload_json text not null,
  created_at text not null default (datetime('now'))
);

create index if not exists market_prices_market_time_idx on market_prices(market_id, processed_timestamp desc);
create index if not exists market_events_market_time_idx on market_events(market_id, processed_timestamp desc);
create index if not exists markets_provider_status_idx on markets(provider, status);
