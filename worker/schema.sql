-- Exile SSF Cloudflare D1 (SQLite) Schema
-- Auto initialized by worker/index.ts on first request

CREATE TABLE IF NOT EXISTS wishlists (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wishlists_league ON wishlists(league_id);

CREATE TABLE IF NOT EXISTS roster (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  display_name_lower TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_roster_league ON roster(league_id);

CREATE TABLE IF NOT EXISTS guides (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_guides_league ON guides(league_id);

CREATE TABLE IF NOT EXISTS achievements (
  player_key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alumni (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS league_meta (
  league_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_leagues (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  username_lower TEXT PRIMARY KEY,
  email_lower TEXT,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_services_league ON services(league_id);

CREATE TABLE IF NOT EXISTS vouches (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vouches_league ON vouches(league_id);
CREATE INDEX IF NOT EXISTS idx_vouches_provider ON vouches(provider_key);

CREATE TABLE IF NOT EXISTS migrations (
  key TEXT PRIMARY KEY,
  migrated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  handle_lower TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS stash_drops (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stash_drops_league ON stash_drops(league_id);

CREATE TABLE IF NOT EXISTS boss_rotas (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_boss_rotas_league ON boss_rotas(league_id);

CREATE TABLE IF NOT EXISTS league_firsts (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_league_firsts_league ON league_firsts(league_id);
