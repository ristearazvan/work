-- Agenda — per-account media (photos + videos) stored in R2, cataloged here.

CREATE TABLE IF NOT EXISTS media (
  id             TEXT    PRIMARY KEY,
  account_id     TEXT    NOT NULL REFERENCES accounts(id),
  r2_key         TEXT    NOT NULL UNIQUE,
  kind           TEXT    NOT NULL CHECK (kind IN ('image','video')),
  mime_type      TEXT    NOT NULL,
  size_bytes     INTEGER NOT NULL,
  original_name  TEXT,
  display_order  INTEGER NOT NULL DEFAULT 0,
  uploaded_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_account_order ON media(account_id, display_order);
