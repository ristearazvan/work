-- Agenda — public booking schema, per-account.

CREATE TABLE IF NOT EXISTS accounts (
  id            TEXT    PRIMARY KEY,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  slug          TEXT    NOT NULL UNIQUE,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT    PRIMARY KEY,
  account_id TEXT    NOT NULL REFERENCES accounts(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS config (
  account_id     TEXT    PRIMARY KEY REFERENCES accounts(id),
  hours_json     TEXT    NOT NULL,
  buffer_min     INTEGER NOT NULL DEFAULT 15,
  advance_min    INTEGER NOT NULL DEFAULT 30,
  max_days       INTEGER NOT NULL DEFAULT 7,
  public_enabled INTEGER NOT NULL DEFAULT 0,
  services_json  TEXT    NOT NULL DEFAULT '["Standard","Extins","Cină","Peste noapte"]',
  updated_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS busy (
  id         TEXT    PRIMARY KEY,
  account_id TEXT    NOT NULL REFERENCES accounts(id),
  date       TEXT    NOT NULL,
  start_min  INTEGER NOT NULL,
  end_min    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_busy_account_date ON busy(account_id, date);

CREATE TABLE IF NOT EXISTS requests (
  id            TEXT    PRIMARY KEY,
  account_id    TEXT    NOT NULL REFERENCES accounts(id),
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
CREATE INDEX IF NOT EXISTS idx_requests_account_status ON requests(account_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_account_date ON requests(account_id, date);

CREATE TABLE IF NOT EXISTS rate_limit (
  key          TEXT    PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
);
