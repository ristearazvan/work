-- Agenda — public booking schema

CREATE TABLE IF NOT EXISTS config (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  hours_json     TEXT    NOT NULL,
  buffer_min     INTEGER NOT NULL DEFAULT 15,
  advance_min    INTEGER NOT NULL DEFAULT 30,
  max_days       INTEGER NOT NULL DEFAULT 7,
  public_enabled INTEGER NOT NULL DEFAULT 0,
  services_json  TEXT    NOT NULL DEFAULT '["Standard","Extins","Cină","Peste noapte"]',
  updated_at     INTEGER NOT NULL
);

-- Seed a default disabled config row so GET /api/availability returns
-- something sane before the provider has pushed settings.
INSERT OR IGNORE INTO config (id, hours_json, buffer_min, advance_min, max_days, public_enabled, services_json, updated_at)
VALUES (
  1,
  '{"0":null,"1":{"open":600,"close":1320},"2":{"open":600,"close":1320},"3":{"open":600,"close":1320},"4":{"open":600,"close":1320},"5":{"open":600,"close":1320},"6":{"open":600,"close":1320}}',
  15, 30, 7, 0,
  '["Standard","Extins","Cină","Peste noapte"]',
  0
);

CREATE TABLE IF NOT EXISTS busy (
  id         TEXT    PRIMARY KEY,
  date       TEXT    NOT NULL,
  start_min  INTEGER NOT NULL,
  end_min    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_busy_date ON busy(date);

CREATE TABLE IF NOT EXISTS requests (
  id            TEXT    PRIMARY KEY,
  token         TEXT    NOT NULL UNIQUE,
  created_at    INTEGER NOT NULL,
  name          TEXT    NOT NULL,
  phone         TEXT    NOT NULL,
  service       TEXT    NOT NULL,
  duration_min  INTEGER NOT NULL,
  date          TEXT    NOT NULL,
  start_min     INTEGER NOT NULL,
  notes         TEXT,
  status        TEXT    NOT NULL DEFAULT 'pending',
  decided_at    INTEGER,
  ip_hash       TEXT
);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_date ON requests(date);

CREATE TABLE IF NOT EXISTS rate_limit (
  key          TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
);
